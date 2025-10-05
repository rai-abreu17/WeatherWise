# Exemplo: Edge Function para Múltiplas Localizações

Este é um exemplo de como atualizar a Edge Function `climate-analysis` para processar múltiplas localizações.

## Código Exemplo

```typescript
// supabase/functions/climate-analysis/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para realizar análise de uma localização
async function performClimateAnalysis({ 
  latitude, 
  longitude, 
  date, 
  eventType, 
  preferredTemperature 
}: {
  latitude: number;
  longitude: number;
  date: string;
  eventType: string;
  preferredTemperature: number;
}) {
  // AQUI VAI SUA LÓGICA ATUAL DE ANÁLISE CLIMÁTICA
  // Por exemplo, chamadas para APIs da NASA, cálculos, etc.
  
  // Exemplo de retorno (substitua pela sua lógica real)
  return {
    location: {
      name: \`Localização (\${latitude}, \${longitude})\`,
      latitude,
      longitude
    },
    requestedDate: {
      date: date,
      displayDate: new Date(date).toLocaleDateString('pt-BR'),
      icp: Math.floor(Math.random() * 100), // Substituir por cálculo real
      rainProbability: Math.floor(Math.random() * 100),
      temperature: preferredTemperature + (Math.random() * 10 - 5),
      temperatureRange: "20°C - 30°C",
      windSpeed: Math.floor(Math.random() * 30),
      windDescription: "Vento moderado",
      humidity: Math.floor(Math.random() * 40 + 40),
      humidityDescription: "Umidade normal",
      cloudCover: Math.floor(Math.random() * 100),
      cloudDescription: "Parcialmente nublado",
      extremeEvents: Math.floor(Math.random() * 20),
      extremeDescription: "Baixo risco",
      alertMessage: null
    },
    alternativeDates: [
      // ... gerar datas alternativas
    ],
    dataSource: {
      yearsAnalyzed: 20,
      period: "2000-2020",
      provider: "NASA Earth Observations"
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { locations, date, eventType, preferredTemperature } = await req.json();

    // Validação
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma localização fornecida." }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!date || !eventType || preferredTemperature === undefined) {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos." }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Array para armazenar resultados de todas as localizações
    const allAnalysisResults = [];

    // Processar cada localização
    for (const location of locations) {
      try {
        console.log(\`Processando localização: \${location.name}\`);
        
        // Realizar análise climática para esta localização
        const analysisResult = await performClimateAnalysis({
          latitude: location.latitude,
          longitude: location.longitude,
          date,
          eventType,
          preferredTemperature
        });

        // Adicionar o nome da localização ao resultado
        analysisResult.location.name = location.name;

        allAnalysisResults.push(analysisResult);
      } catch (locationError) {
        console.error(\`Erro ao processar \${location.name}:\`, locationError);
        
        // Adicionar resultado com erro para esta localização
        allAnalysisResults.push({
          location: {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude
          },
          error: \`Erro ao processar localização: \${locationError.message}\`
        });
      }
    }

    // Retornar array de resultados
    return new Response(
      JSON.stringify(allAnalysisResults),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

## Exemplo de Request

```json
{
  "locations": [
    {
      "name": "São Paulo, Brasil",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    {
      "name": "Rio de Janeiro, Brasil",
      "latitude": -22.9068,
      "longitude": -43.1729
    },
    {
      "name": "Brasília, Brasil",
      "latitude": -15.7939,
      "longitude": -47.8828
    }
  ],
  "date": "2025-12-25",
  "eventType": "wedding",
  "preferredTemperature": 25
}
```

## Exemplo de Response

```json
[
  {
    "location": {
      "name": "São Paulo, Brasil",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "requestedDate": {
      "date": "2025-12-25",
      "displayDate": "25/12/2025",
      "icp": 75,
      "rainProbability": 35,
      "temperature": 24,
      "temperatureRange": "20°C - 28°C",
      "windSpeed": 15,
      "windDescription": "Vento moderado",
      "humidity": 65,
      "humidityDescription": "Umidade normal",
      "cloudCover": 40,
      "cloudDescription": "Parcialmente nublado",
      "extremeEvents": 10,
      "extremeDescription": "Baixo risco",
      "alertMessage": null
    },
    "alternativeDates": [
      // ... datas alternativas
    ],
    "dataSource": {
      "yearsAnalyzed": 20,
      "period": "2000-2020",
      "provider": "NASA Earth Observations"
    }
  },
  {
    "location": {
      "name": "Rio de Janeiro, Brasil",
      "latitude": -22.9068,
      "longitude": -43.1729
    },
    "requestedDate": {
      "date": "2025-12-25",
      "displayDate": "25/12/2025",
      "icp": 88, // ← Melhor ICP!
      "rainProbability": 20,
      "temperature": 27,
      // ... outras métricas
    },
    // ... resto da análise
  },
  {
    "location": {
      "name": "Brasília, Brasil",
      "latitude": -15.7939,
      "longitude": -47.8828
    },
    "requestedDate": {
      "date": "2025-12-25",
      "displayDate": "25/12/2025",
      "icp": 72,
      // ... outras métricas
    },
    // ... resto da análise
  }
]
```

## Considerações de Performance

### Processamento Sequencial vs Paralelo

**Atual (Sequencial)**:
```typescript
for (const location of locations) {
  const result = await performClimateAnalysis(...);
  allAnalysisResults.push(result);
}
```

**Melhor (Paralelo)**:
```typescript
const analysisPromises = locations.map(location => 
  performClimateAnalysis({
    latitude: location.latitude,
    longitude: location.longitude,
    date,
    eventType,
    preferredTemperature
  }).then(result => ({
    ...result,
    location: { ...location }
  }))
);

const allAnalysisResults = await Promise.all(analysisPromises);
```

### Vantagens do Processamento Paralelo:
- ⚡ **Mais rápido**: Todas as localizações são processadas simultaneamente
- 📊 **Melhor UX**: Reduz tempo de espera do usuário
- 🔄 **Escalável**: Funciona bem com múltiplas localizações

### Limitações a Considerar:
- **Rate Limiting**: APIs externas podem ter limites de requisições
- **Timeout**: Deno Edge Functions têm timeout padrão
- **Memória**: Muitas localizações podem consumir memória

## Recomendações

1. **Limitar número de localizações**: Máximo 5 localizações
2. **Adicionar cache**: Evitar requisições duplicadas
3. **Timeout por localização**: Não deixar uma localização travar todas
4. **Fallback gracioso**: Se uma localização falhar, retornar erro apenas para ela
5. **Logging**: Registrar erros e tempos de processamento

## Deploy

Após atualizar o código, faça o deploy:

\`\`\`bash
supabase functions deploy climate-analysis
\`\`\`

## Teste Local

\`\`\`bash
supabase functions serve climate-analysis
\`\`\`

Depois, teste com:

\`\`\`bash
curl -X POST http://localhost:54321/functions/v1/climate-analysis \\
  -H "Content-Type: application/json" \\
  -d '{
    "locations": [
      {"name": "São Paulo", "latitude": -23.5505, "longitude": -46.6333},
      {"name": "Rio de Janeiro", "latitude": -22.9068, "longitude": -43.1729}
    ],
    "date": "2025-12-25",
    "eventType": "wedding",
    "preferredTemperature": 25
  }'
\`\`\`

---

**Nota**: Este é um exemplo. Adapte conforme sua lógica de análise climática atual!
