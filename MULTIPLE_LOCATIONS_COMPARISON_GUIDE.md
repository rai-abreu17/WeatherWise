# Guia: Comparação de Múltiplas Localizações

## Visão Geral

Esta funcionalidade permite aos usuários comparar dados climáticos de múltiplas localizações simultaneamente e identificar automaticamente qual tem o melhor Índice de Conforto Climático (ICP).

## Funcionalidades Implementadas

### 1. Seleção de Múltiplas Localizações

#### Frontend (Index.tsx)
- ✅ Sistema de tags/badges para exibir localizações selecionadas
- ✅ Botão de remoção (X) para cada localização
- ✅ Validação para evitar duplicatas
- ✅ Suporte para adicionar localizações via autocompletar ou geolocalização

#### Estrutura de Dados
```typescript
interface SelectedLocation {
  name: string;
  latitude: number;
  longitude: number;
}
```

### 2. Autocompletar Aprimorado (LocationAutocomplete.tsx)

#### Nova Prop: `onSelect`
```typescript
onSelect?: (locationName: string, latitude: number, longitude: number) => void;
```

#### Comportamento
- **Com `onSelect`**: Passa nome e coordenadas (múltiplas localizações)
- **Sem `onSelect`**: Comportamento antigo (localização única) - compatibilidade

### 3. Análise de Múltiplas Localizações

#### Backend (Edge Function)
A Edge Function `climate-analysis` agora aceita:

```typescript
{
  locations: [
    { name: string, latitude: number, longitude: number },
    // ... mais localizações
  ],
  date: string,
  eventType: string,
  preferredTemperature: number
}
```

**Nota**: A Edge Function ainda precisa ser atualizada para processar múltiplas localizações. Atualmente, ela processa apenas uma localização.

### 4. Comparação Visual (Results.tsx)

#### Componentes de UI
- ✅ **Tabs**: Para navegação entre localizações
- ✅ **Trophy Icon**: Indica a localização com melhor ICP
- ✅ **Badge "Melhor ICP"**: Destaque visual

#### Funcionalidades
- ✅ Cálculo automático do melhor ICP
- ✅ Navegação por abas (tabs) entre localizações
- ✅ Destaque visual da melhor localização
- ✅ Compatibilidade com análise única (formato antigo)

## Como Usar

### 1. Na Página Inicial

1. Digite uma localização no campo de busca
2. Selecione a localização nas sugestões
3. A localização aparecerá como uma tag/badge abaixo do campo
4. Repita para adicionar mais localizações
5. Clique no X para remover uma localização

### 2. Análise

1. Selecione a data do evento
2. Escolha o tipo de evento
3. Ajuste a temperatura preferida
4. Clique em "Analisar Clima"

### 3. Comparação de Resultados

Se múltiplas localizações foram selecionadas:
- **Abas**: Uma aba para cada localização
- **Ícone de Troféu**: Na aba da localização com melhor ICP
- **Badge "Melhor ICP"**: Na seção de informações da melhor localização
- **Navegação**: Clique nas abas para comparar as análises

## Exemplo de Uso

```typescript
// Selecionar múltiplas localizações
[
  { name: "São Paulo, Brasil", latitude: -23.5505, longitude: -46.6333 },
  { name: "Rio de Janeiro, Brasil", latitude: -22.9068, longitude: -43.1729 },
  { name: "Brasília, Brasil", latitude: -15.7939, longitude: -47.8828 }
]

// Resultado da análise
[
  {
    location: { name: "São Paulo, Brasil", ... },
    requestedDate: { icp: 75, ... },
    alternativeDates: [...],
    ...
  },
  {
    location: { name: "Rio de Janeiro, Brasil", ... },
    requestedDate: { icp: 88, ... }, // ← Melhor ICP
    alternativeDates: [...],
    ...
  },
  {
    location: { name: "Brasília, Brasil", ... },
    requestedDate: { icp: 72, ... },
    alternativeDates: [...],
    ...
  }
]

// Rio de Janeiro será destacado com o troféu
```

## Próximos Passos

### Backend (Edge Function)

A Edge Function `supabase/functions/climate-analysis/index.ts` precisa ser atualizada para:

1. **Aceitar array de localizações**:
```typescript
const { locations, date, eventType, preferredTemperature } = await req.json();

if (!locations || !Array.isArray(locations) || locations.length === 0) {
  return new Response(JSON.stringify({ error: "Nenhuma localização fornecida." }), { status: 400 });
}
```

2. **Processar cada localização**:
```typescript
const allAnalysisResults = [];

for (const location of locations) {
  const analysisResultForLocation = await performClimateAnalysis({
    latitude: location.latitude,
    longitude: location.longitude,
    date,
    eventType,
    preferredTemperature
  });

  allAnalysisResults.push({
    ...analysisResultForLocation,
    location: { name: location.name, latitude: location.latitude, longitude: location.longitude }
  });
}
```

3. **Retornar array de resultados**:
```typescript
return new Response(JSON.stringify(allAnalysisResults), {
  headers: { "Content-Type": "application/json" },
  status: 200,
});
```

### Validação (lib/validations.ts)

Atualizar o schema Zod para aceitar múltiplas localizações (opcional):

```typescript
export const climateAnalysisSchema = z.object({
  locations: z.array(z.object({
    name: z.string().min(2).max(200),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  })).min(1).max(5), // Máximo 5 localizações
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventType: z.enum(["wedding", "sports", "festival", "agriculture", "corporate", "outdoor"]),
  preferredTemperature: z.number().min(15).max(40)
});
```

## Arquivos Modificados

### Frontend
- ✅ `src/pages/Index.tsx` - Interface de seleção múltipla
- ✅ `src/components/LocationAutocomplete.tsx` - Prop `onSelect`
- ✅ `src/pages/Results.tsx` - Comparação com Tabs

### Backend
- ⏳ `supabase/functions/climate-analysis/index.ts` - Processar múltiplas localizações

### Validações
- ⏳ `src/lib/validations.ts` - Schema para múltiplas localizações

## Tecnologias Utilizadas

- **React 18.3.1** - Framework frontend
- **TypeScript** - Tipagem estática
- **shadcn/ui Tabs** - Componente de abas
- **Lucide React Icons** - Ícones (Trophy, X)
- **Tailwind CSS** - Estilização

## Benefícios

1. **Comparação Direta**: Veja métricas lado a lado
2. **Identificação Automática**: O sistema destaca automaticamente a melhor opção
3. **UX Intuitiva**: Tags removíveis e navegação por abas
4. **Compatibilidade**: Funciona com análise única ou múltipla
5. **Escalável**: Fácil adicionar mais localizações

## Limitações Atuais

- **Backend não implementado**: A Edge Function ainda processa apenas uma localização
- **Sem limite de localizações**: Recomenda-se adicionar limite (ex: 5 máximo)
- **Performance**: Muitas localizações podem aumentar o tempo de análise

## Melhorias Futuras

1. **Gráfico Comparativo**: Exibir todas as localizações em um único gráfico
2. **Mapa Comparativo**: Mostrar todos os marcadores no mapa simultaneamente
3. **Exportação de Comparação**: PDF com todas as análises
4. **Ranking**: Lista ordenada por ICP
5. **Filtros**: Filtrar por métricas específicas (chuva, temperatura, etc.)

---

**Data de Implementação**: Outubro 2025  
**Desenvolvido para**: NASA Space Apps Challenge 2025
