import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Fix default icon issue with Leaflet and Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Criar ícones coloridos personalizados para cada localização
const createColoredIcon = (color: string, number: number) => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="45">
      <path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 13 8 13s8-7.5 8-13c0-4.42-3.58-8-8-8z"/>
      <circle cx="12" cy="8" r="4" fill="#fff"/>
      <text x="12" y="11" text-anchor="middle" font-size="8" font-weight="bold" fill="${color}">${number}</text>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45]
  });
};

// Cores vibrantes para até 10 localizações
const MARKER_COLORS = [
  '#3b82f6', // Azul
  '#ef4444', // Vermelho
  '#10b981', // Verde
  '#f59e0b', // Laranja
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#84cc16', // Lima
  '#f97316', // Laranja escuro
  '#6366f1', // Índigo
];

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface InteractiveMapProps {
  locations?: Location[];
  // Props antigas para compatibilidade
  locationName?: string;
  coordinates?: {
    lat: number;
    lon: number;
  } | null;
}

// Component to update map bounds when locations change
function MapBoundsUpdater({ locations }: { locations: Location[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length === 1) {
      // Se apenas uma localização, centralizar nela
      map.setView([locations[0].latitude, locations[0].longitude], 12);
    } else if (locations.length > 1) {
      // Se múltiplas localizações, ajustar para mostrar todas
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.latitude, loc.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  locations, 
  locationName, 
  coordinates 
}) => {
  // Converter props antigas para novo formato se necessário
  const displayLocations: Location[] = locations || (
    locationName && coordinates 
      ? [{ name: locationName, latitude: coordinates.lat, longitude: coordinates.lon }]
      : []
  );

  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.5505, -46.6333]); // Default: São Paulo
  
  useEffect(() => {
    if (displayLocations.length > 0) {
      setMapCenter([displayLocations[0].latitude, displayLocations[0].longitude]);
    }
  }, [displayLocations]);

  if (displayLocations.length === 0) {
    return null;
  }

  const locationCount = displayLocations.length;
  const title = locationCount === 1 
    ? '📍 Visualizar Localização'
    : `📍 Visualizar ${locationCount} Localizações`;

  return (
    <Card className="glass-effect-strong p-6 rounded-2xl animate-slide-up">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {locationCount === 1 
            ? `${displayLocations[0].name} (${displayLocations[0].latitude.toFixed(4)}, ${displayLocations[0].longitude.toFixed(4)})`
            : `${locationCount} localizações selecionadas para comparação`
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full rounded-lg overflow-hidden border-2 border-border">
          <MapContainer 
            center={mapCenter} 
            zoom={12} 
            scrollWheelZoom={true}
            className="h-full w-full"
            key={displayLocations.map(l => `${l.latitude}-${l.longitude}`).join('_')}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Renderizar um marcador para cada localização */}
            {displayLocations.map((location, index) => {
              const color = MARKER_COLORS[index % MARKER_COLORS.length];
              const icon = createColoredIcon(color, index + 1);
              const position: [number, number] = [location.latitude, location.longitude];
              
              return (
                <Marker 
                  key={`${location.name}-${index}`}
                  position={position}
                  icon={icon}
                >
                  <Popup>
                    <div className="p-2">
                      <strong className="text-base block mb-2" style={{ color }}>
                        #{index + 1} {location.name}
                      </strong>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Lat: {location.latitude.toFixed(4)}</div>
                        <div>Lon: {location.longitude.toFixed(4)}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            
            <MapBoundsUpdater locations={displayLocations} />
          </MapContainer>
        </div>
        
        {/* Legenda para múltiplas localizações */}
        {locationCount > 1 && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Legenda:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayLocations.map((location, index) => {
                const color = MARKER_COLORS[index % MARKER_COLORS.length];
                return (
                  <div key={`legend-${index}`} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md"
                      style={{ backgroundColor: color }}
                    >
                      {index + 1}
                    </div>
                    <span className="text-foreground truncate" title={location.name}>
                      {location.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
