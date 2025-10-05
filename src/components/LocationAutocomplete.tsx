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
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
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

  // Tentar obter localização do usuário em background (silenciosamente)
  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          console.log('Localização do usuário obtida para ordenação:', {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          // Silenciosamente falhar - não é crítico
          console.log('Não foi possível obter localização para ordenação:', error.message);
        },
        {
          enableHighAccuracy: false, // Não precisa de alta precisão para ordenação
          timeout: 10000,
          maximumAge: 300000 // Aceitar cache de até 5 minutos
        }
      );
    }
  }, [userLocation]);

  // Função para calcular distância entre dois pontos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);

    try {
      // Construir URL com viewbox se tivermos localização do usuário
      let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&accept-language=pt-BR,pt,en&countrycodes=br`;
      
      // Se temos a localização do usuário, adicionar viewbox para priorizar resultados próximos
      if (userLocation) {
        // Criar um viewbox de ~100km ao redor do usuário
        const latRange = 1; // ~111km por grau de latitude
        const lonRange = 1; // varia com latitude, mas ~111km no equador
        
        const viewbox = `${userLocation.lon - lonRange},${userLocation.lat + latRange},${userLocation.lon + lonRange},${userLocation.lat - latRange}`;
        url += `&viewbox=${viewbox}&bounded=1`;
        
        console.log('Buscando com priorização de proximidade:', viewbox);
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WeatherWise-Planner/1.0'
        }
      });

      if (response.ok) {
        let data = await response.json();
        
        // Se temos localização do usuário, ordenar por distância
        if (userLocation && data.length > 0) {
          data = data.map((item: LocationSuggestion) => ({
            ...item,
            distance: calculateDistance(
              userLocation.lat,
              userLocation.lon,
              parseFloat(item.lat),
              parseFloat(item.lon)
            )
          })).sort((a: any, b: any) => a.distance - b.distance);
          
          console.log('Resultados ordenados por distância:', data.map((d: any) => ({
            name: cleanLocationName(d.display_name),
            distance: `${d.distance.toFixed(1)}km`
          })));
        }
        
        // Limitar a 5 resultados
        setSuggestions(data.slice(0, 5));
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
        
        console.log('Coordenadas obtidas:', { latitude, longitude });
        
        try {
          // Reverse geocoding to get location name
          // zoom=16 é ideal para nível de bairro/rua sem ser muito específico
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR,pt,en&zoom=16&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'WeatherWise-Planner/1.0'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log('Dados do geocoding:', data);
            
            // Construir um endereço mais preciso usando os detalhes
            let preciseName = "";
            
            if (data.address) {
              const address = data.address;
              const parts = [];
              
              // Priorizar componentes mais relevantes para o clima
              // Bairro ou Subdistrito
              if (address.suburb || address.neighbourhood || address.quarter) {
                parts.push(address.suburb || address.neighbourhood || address.quarter);
              }
              
              // Cidade, Vila ou Município
              if (address.city || address.town || address.village || address.municipality) {
                parts.push(address.city || address.town || address.village || address.municipality);
              }
              
              // Estado
              if (address.state) parts.push(address.state);
              // Estado
              if (address.state) parts.push(address.state);
              
              // País (opcional, apenas se for diferente do Brasil)
              if (address.country && address.country !== 'Brasil' && address.country !== 'Brazil') {
                parts.push(address.country);
              }
              
              preciseName = parts.join(", ");
            }
            
            // Usar o nome preciso se disponível, senão usar o display_name limpo
            const locationName = preciseName || cleanLocationName(data.display_name);
            
            console.log('Nome da localização obtido:', locationName);
            
            // Se onSelect foi fornecido, use-o (para múltiplas localizações)
            if (onSelect) {
              onSelect(locationName, latitude, longitude);
            } else {
              // Fallback para comportamento antigo (single location)
              onChange(locationName);
            }
            
            toast.success(`Localização obtida: ${locationName}`, {
              duration: 4000
            });
          } else {
            // Fallback to coordinates if reverse geocoding fails
            const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            if (onSelect) {
              onSelect(coordsString, latitude, longitude);
            } else {
              onChange(coordsString);
            }
            
            toast.error("Não foi possível obter seu endereço completo");
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          
          // Tentativa alternativa: obter cidade/estado com zoom mais baixo
          try {
            const backupResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR,pt,en&zoom=12&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'WeatherWise-Planner/1.0'
                }
              }
            );
            
            if (backupResponse.ok) {
              const data = await backupResponse.json();
              console.log('Dados do geocoding backup:', data);
              
              let locationName = "";
              
              // Construir endereço baseado apenas em cidade e estado
              if (data.address) {
                const address = data.address;
                const parts = [];
                
                if (address.city || address.town || address.village || address.municipality) {
                  parts.push(address.city || address.town || address.village || address.municipality);
                }
                if (address.state) parts.push(address.state);
                
                locationName = parts.join(", ");
              }
              
              if (locationName) {
                console.log('Nome da localização obtido (backup):', locationName);
                
                if (onSelect) {
                  onSelect(locationName, latitude, longitude);
                } else {
                  onChange(locationName);
                }
                toast.success(`Localização obtida: ${locationName}`, {
                  duration: 4000
                });
                setIsGettingLocation(false);
                return;
              }
            }
          } catch (backupError) {
            console.error('Backup geocoding error:', backupError);
          }
          
          // Fallback final para coordenadas
          const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          if (onSelect) {
            onSelect(coordsString, latitude, longitude);
          } else {
            onChange(coordsString);
          }
          
          toast.error("Não foi possível determinar seu endereço. Usando coordenadas.");
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = "Erro ao obter localização. ";
        
        // Mensagens mais específicas baseadas no código de erro
        switch(error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage += "Verifique se você permitiu acesso à sua localização nas configurações do navegador.";
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage += "Sua localização atual não está disponível. Tente novamente.";
            break;
          case 3: // TIMEOUT
            errorMessage += "Tempo esgotado ao tentar obter localização. Tente novamente.";
            break;
          default:
            errorMessage += "Verifique as permissões de localização do navegador.";
        }
        
        toast.error(errorMessage, {
          duration: 5000
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true, // Usar GPS para maior precisão
        timeout: 20000, // 20 segundos de timeout
        maximumAge: 0 // Não usar cache, sempre obter posição atual
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
            placeholder="Digite uma rua, bairro ou cidade..."
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
          className="h-12 px-4 flex items-center gap-2"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation || disabled}
          aria-label="Usar minha localização atual"
          title="Localiza sua posição atual com alta precisão"
        >
          {isGettingLocation ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <Navigation className="w-5 h-5" aria-hidden="true" />
          )}
          <span className="hidden md:inline">Me localizar</span>
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
          {suggestions.map((suggestion: any, index) => {
            const hasDistance = suggestion.distance !== undefined;
            const distanceText = hasDistance 
              ? suggestion.distance < 1 
                ? `${(suggestion.distance * 1000).toFixed(0)}m`
                : `${suggestion.distance.toFixed(1)}km`
              : null;
            
            return (
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
                <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${index === 0 && hasDistance ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground block">
                    {cleanLocationName(suggestion.display_name)}
                  </span>
                  {hasDistance && distanceText && (
                    <span className={`text-xs mt-1 block ${index === 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {index === 0 ? '📍 ' : ''}
                      {distanceText} de você
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2" id="location-hint">
        {userLocation 
          ? "Resultados ordenados por proximidade • Digite pelo menos 3 caracteres" 
          : "Digite pelo menos 3 caracteres para buscar ou clique em 'Me localizar'"
        }
      </p>
    </div>
  );
};
