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
  disabled?: boolean;
}

export const LocationAutocomplete = ({ value, onChange, disabled }: LocationAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    onChange(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        toast.success("Localização obtida com sucesso!");
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
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
          <Input
            id="location"
            placeholder="Digite uma cidade ou estado..."
            className="pl-10 h-12 text-base"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            disabled={disabled}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 px-4"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation || disabled}
          title="Usar minha localização atual"
        >
          <Navigation className={`w-5 h-5 ${isGettingLocation ? 'animate-pulse' : ''}`} />
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3 border-b border-border/50 last:border-b-0"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <span className="text-sm text-foreground">{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        Digite pelo menos 3 caracteres para buscar ou use sua localização atual
      </p>
    </div>
  );
};
