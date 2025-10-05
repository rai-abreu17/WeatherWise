import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (locationName: string, latitude: number, longitude: number) => void;
  disabled?: boolean;
}

// Helper function to clean location names
const cleanLocationName = (displayName: string): string => {
  // Remove common unnecessary geographical terms
  const termsToRemove = [
    /Região Geográfica Imediata de [^,]+,?\s*/gi,
    /Região Geográfica Intermediária de [^,]+,?\s*/gi,
    /Região Metropolitana de [^,]+,?\s*/gi,
    /Microrregião de [^,]+,?\s*/gi,
    /Mesorregião de [^,]+,?\s*/gi,
    /Região (Norte|Nordeste|Centro-Oeste|Sudeste|Sul),?\s*/gi, // Remove regiões do Brasil
  ];
  
  let cleaned = displayName;
  termsToRemove.forEach(term => {
    cleaned = cleaned.replace(term, '');
  });
  
  // Clean up multiple commas and spaces
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/,\s*$/g, '').trim();
  
  return cleaned;
};

export const LocationAutocomplete = ({ value, onChange, onSelect, disabled }: LocationAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=pt-BR,pt,en&countrycodes=br`,
        {
          headers: {
            'User-Agent': 'WeatherWise-Planner/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search (debounce)
    const timeout = setTimeout(() => {
      searchLocations(newValue);
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const cleanedName = cleanLocationName(suggestion.display_name);
    const latitude = parseFloat(suggestion.lat);
    const longitude = parseFloat(suggestion.lon);
    
    // Se onSelect foi fornecido, use-o (para múltiplas localizações)
    if (onSelect) {
      onSelect(cleanedName, latitude, longitude);
    } else {
      // Fallback para comportamento antigo (single location)
      onChange(cleanedName);
    }
    
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSelectSuggestion(suggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR,pt,en`,
            {
              headers: {
                'User-Agent': 'WeatherWise-Planner/1.0'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            const cleanedName = cleanLocationName(data.display_name);
            
            // Se onSelect foi fornecido, use-o (para múltiplas localizações)
            if (onSelect) {
              onSelect(cleanedName, latitude, longitude);
            } else {
              // Fallback para comportamento antigo (single location)
              onChange(cleanedName);
            }
            
            toast.success("Localização obtida com sucesso!");
          } else {
            // Fallback to coordinates if reverse geocoding fails
            const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            if (onSelect) {
              onSelect(coordsString, latitude, longitude);
            } else {
              onChange(coordsString);
            }
            
            toast.success("Localização obtida (coordenadas)");
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Fallback to coordinates
          const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          if (onSelect) {
            onSelect(coordsString, latitude, longitude);
          } else {
            onChange(coordsString);
          }
          
          toast.success("Localização obtida (coordenadas)");
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error("Erro ao obter localização. Verifique as permissões do navegador.");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1" role="combobox" aria-expanded={showSuggestions} aria-haspopup="listbox" aria-owns="location-suggestions">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" aria-hidden="true" />
          <Input
            ref={inputRef}
            id="location"
            placeholder="Digite uma cidade ou estado..."
            className="pl-10 h-12 text-base"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            disabled={disabled}
            role="searchbox"
            aria-autocomplete="list"
            aria-controls="location-suggestions"
            aria-activedescendant={activeSuggestionIndex >= 0 ? `suggestion-${activeSuggestionIndex}` : undefined}
            aria-label="Digite o nome da cidade ou estado"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" aria-label="Buscando localizações" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 px-4"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation || disabled}
          aria-label="Usar minha localização atual"
        >
          <Navigation className={`w-5 h-5 ${isGettingLocation ? 'animate-pulse' : ''}`} aria-hidden="true" />
          <span className="sr-only">Obter localização atual</span>
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          id="location-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
          aria-label="Sugestões de localização"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              id={`suggestion-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeSuggestionIndex}
              className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3 border-b border-border/50 last:border-b-0 ${
                index === activeSuggestionIndex ? 'bg-accent' : ''
              }`}
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm text-foreground">{cleanLocationName(suggestion.display_name)}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2" id="location-hint">
        Digite pelo menos 3 caracteres para buscar ou use sua localização atual
      </p>
    </div>
  );
};
