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

interface InteractiveMapProps {
  locationName: string;
  coordinates?: {
    lat: number;
    lon: number;
  } | null;
}

// Component to update map center when coordinates change
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ locationName, coordinates }) => {
  const [position, setPosition] = useState<[number, number]>([-23.5505, -46.6333]); // Default: São Paulo
  
  useEffect(() => {
    if (coordinates) {
      setPosition([coordinates.lat, coordinates.lon]);
    }
  }, [coordinates]);

  if (!locationName) {
    return null;
  }

  return (
    <Card className="glass-effect-strong p-6 rounded-2xl animate-slide-up">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
          📍 Visualizar Localização
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {coordinates 
            ? `${locationName} (${position[0].toFixed(4)}, ${position[1].toFixed(4)})`
            : 'Digite uma localização para visualizar no mapa'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full rounded-lg overflow-hidden border-2 border-border">
          <MapContainer 
            center={position} 
            zoom={12} 
            scrollWheelZoom={false} 
            className="h-full w-full"
            key={`${position[0]}-${position[1]}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {coordinates && (
              <Marker position={position}>
                <Popup>
                  <strong>{locationName}</strong>
                  <br />
                  Lat: {position[0].toFixed(4)}
                  <br />
                  Lon: {position[1].toFixed(4)}
                </Popup>
              </Marker>
            )}
            <MapUpdater center={position} />
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
