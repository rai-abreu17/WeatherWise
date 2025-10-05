# 🔧 Troubleshooting: Comparação de Múltiplas Localizações

## Problemas Comuns e Soluções

### 1. Edge Function Retorna Erro 400/500

**Sintoma:**
```
Erro ao analisar dados climáticos. Por favor, tente novamente.
```

**Causas Possíveis:**
- ❌ Edge Function ainda não foi atualizada para aceitar array
- ❌ Edge Function espera `location` (string), mas recebe `locations` (array)

**Solução:**
1. Verifique se a Edge Function foi atualizada conforme `EDGE_FUNCTION_MULTIPLE_LOCATIONS_EXAMPLE.md`
2. Faça o deploy:
   ```bash
   supabase functions deploy climate-analysis
   ```
3. Verifique os logs:
   ```bash
   supabase functions logs climate-analysis
   ```

**Solução Temporária (Desenvolvimento):**
- Selecione apenas 1 localização para usar o formato antigo
- A Edge Function atual processa apenas uma localização

---

### 2. Tags de Localização Não Aparecem

**Sintoma:**
- Você seleciona uma localização, mas nenhuma tag aparece

**Causas Possíveis:**
- ❌ `onSelect` não está sendo chamado
- ❌ `handleLocationSelect` tem um bug
- ❌ `selectedLocations` não está atualizando

**Solução:**
1. Verifique o console do navegador (F12):
   ```javascript
   // Deve aparecer algo assim ao selecionar
   console.log('Location selected:', { name, latitude, longitude });
   ```

2. Adicione debug temporário em `Index.tsx`:
   ```typescript
   const handleLocationSelect = (locationName: string, latitude: number, longitude: number) => {
     console.log('handleLocationSelect called:', { locationName, latitude, longitude });
     const newLocation: SelectedLocation = { name: locationName, latitude, longitude };
     console.log('selectedLocations before:', selectedLocations);
     setSelectedLocations(prev => {
       if (!prev.some(loc => loc.name === newLocation.name)) {
         return [...prev, newLocation];
       }
       toast.info("Localização já adicionada");
       return prev;
     });
   };
   ```

---

### 3. Duplicatas São Permitidas

**Sintoma:**
- A mesma localização aparece múltiplas vezes

**Causas Possíveis:**
- ❌ Validação de duplicatas não está funcionando
- ❌ Nomes de localizações são diferentes (variação de formatação)

**Solução:**
1. Verifique a comparação de nomes:
   ```typescript
   // Adicione .trim() e .toLowerCase() para comparação mais robusta
   if (!prev.some(loc => loc.name.trim().toLowerCase() === newLocation.name.trim().toLowerCase())) {
     return [...prev, newLocation];
   }
   ```

2. Ou compare por coordenadas:
   ```typescript
   if (!prev.some(loc => 
     Math.abs(loc.latitude - newLocation.latitude) < 0.001 &&
     Math.abs(loc.longitude - newLocation.longitude) < 0.001
   )) {
     return [...prev, newLocation];
   }
   ```

---

### 4. Botão X Não Remove Localização

**Sintoma:**
- Clicar no X não remove a tag

**Causas Possíveis:**
- ❌ `handleRemoveLocation` não está sendo chamado
- ❌ Nome não corresponde exatamente

**Solução:**
1. Verifique se o botão está clicável:
   ```typescript
   <Button
     variant="ghost"
     size="icon"
     className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
     onClick={(e) => {
       e.preventDefault(); // Adicione isso
       e.stopPropagation(); // E isso
       handleRemoveLocation(loc.name);
     }}
     disabled={isAnalyzing}
   >
     <X className="h-3 w-3" />
   </Button>
   ```

2. Adicione debug:
   ```typescript
   const handleRemoveLocation = (locationName: string) => {
     console.log('Removing location:', locationName);
     console.log('Current locations:', selectedLocations);
     setSelectedLocations(prev => prev.filter(loc => loc.name !== locationName));
   };
   ```

---

### 5. Mapa Não Atualiza com Nova Localização

**Sintoma:**
- Mapa não mostra a localização selecionada

**Causas Possíveis:**
- ❌ `locationCoordinates` não está atualizando
- ❌ `useEffect` não está sendo disparado

**Solução:**
1. Verifique o `useEffect`:
   ```typescript
   useEffect(() => {
     console.log('selectedLocations changed:', selectedLocations);
     if (selectedLocations.length > 0) {
       const firstLocation = selectedLocations[0];
       console.log('Setting map coordinates:', firstLocation);
       setLocationCoordinates({
         lat: firstLocation.latitude,
         lon: firstLocation.longitude
       });
     } else {
       setLocationCoordinates(null);
     }
   }, [selectedLocations]);
   ```

---

### 6. Tabs Não Aparecem na Página de Resultados

**Sintoma:**
- Página de resultados aparece vazia ou sem tabs

**Causas Possíveis:**
- ❌ `allAnalysisData` é um array vazio
- ❌ Dados não estão sendo passados corretamente
- ❌ Componente Tabs não está instalado

**Solução:**
1. Verifique os dados:
   ```typescript
   useEffect(() => {
     const data = location.state?.analysisData;
     console.log('Analysis data received:', data);
     console.log('Is array?', Array.isArray(data));
     console.log('Length:', data?.length);
     // ...
   }, [location, navigate]);
   ```

2. Verifique se o componente Tabs existe:
   ```bash
   # Verificar se o arquivo existe
   ls src/components/ui/tabs.tsx
   ```

3. Se não existir, instale:
   ```bash
   npx shadcn-ui@latest add tabs
   ```

---

### 7. Troféu Não Aparece na Melhor Localização

**Sintoma:**
- Nenhuma localização tem o ícone de troféu

**Causas Possíveis:**
- ❌ `bestLocationName` não está sendo calculado
- ❌ Comparação de ICP está incorreta

**Solução:**
1. Adicione debug:
   ```typescript
   useEffect(() => {
     // ... código existente
     
     let maxIcp = -1;
     let bestName: string | null = null;
     data.forEach((analysis: any) => {
       console.log(`${analysis.location.name}: ICP = ${analysis.requestedDate.icp}`);
       if (analysis.requestedDate.icp > maxIcp) {
         maxIcp = analysis.requestedDate.icp;
         bestName = analysis.location.name;
       }
     });
     console.log('Best location:', bestName, 'with ICP:', maxIcp);
     setBestLocationName(bestName);
   }, [location, navigate]);
   ```

---

### 8. Análise Única (1 Localização) Não Funciona

**Sintoma:**
- Erro ao selecionar apenas 1 localização

**Causas Possíveis:**
- ❌ Compatibilidade com formato antigo quebrada

**Solução:**
1. Verifique a lógica de compatibilidade em `Results.tsx`:
   ```typescript
   // Se data é um array, temos múltiplas localizações
   if (Array.isArray(data)) {
     setAllAnalysisData(data);
     // ... calcular melhor
   } else {
     // Compatibilidade com análise única (formato antigo)
     setAllAnalysisData([data]);
   }
   ```

2. Certifique-se de que o backend retorna um objeto (não array) para 1 localização

---

### 9. Performance Lenta com Múltiplas Localizações

**Sintoma:**
- App fica lento ao adicionar muitas localizações
- Página de resultados demora para renderizar

**Causas Possíveis:**
- ❌ Re-renders desnecessários
- ❌ Backend processa localizações sequencialmente

**Solução Frontend:**
1. Use `useMemo` para cálculos:
   ```typescript
   const bestLocationName = useMemo(() => {
     let maxIcp = -1;
     let bestName: string | null = null;
     allAnalysisData.forEach(analysis => {
       if (analysis.requestedDate.icp > maxIcp) {
         maxIcp = analysis.requestedDate.icp;
         bestName = analysis.location.name;
       }
     });
     return bestName;
   }, [allAnalysisData]);
   ```

**Solução Backend:**
1. Use processamento paralelo:
   ```typescript
   const analysisPromises = locations.map(location => 
     performClimateAnalysis({...})
   );
   const allAnalysisResults = await Promise.all(analysisPromises);
   ```

---

### 10. Validação Zod Quebrou

**Sintoma:**
```
Erro de validação: location is required
```

**Causas Possíveis:**
- ❌ Schema Zod ainda espera `location` (string)

**Solução Temporária:**
1. Remova a validação Zod em `Index.tsx`:
   ```typescript
   const handleAnalyze = async () => {
     // Remova esta parte temporariamente:
     // const validatedData = climateAnalysisSchema.parse({...});
     
     // Use validação manual:
     if (selectedLocations.length === 0) {
       toast.error("Por favor, selecione pelo menos uma localização.");
       return;
     }
     // ...
   };
   ```

**Solução Permanente:**
1. Atualize o schema conforme `IMPLEMENTATION_SUMMARY.md`:
   ```typescript
   export const climateAnalysisSchema = z.object({
     locations: z.array(z.object({
       name: z.string().min(2).max(200),
       latitude: z.number().min(-90).max(90),
       longitude: z.number().min(-180).max(180)
     })).min(1).max(5),
     date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
     eventType: z.enum(["wedding", "sports", "festival", "agriculture", "corporate", "outdoor"]),
     preferredTemperature: z.number().min(15).max(40)
   });
   ```

---

## Debug Geral

### Console do Navegador (F12)

Mensagens úteis para debug:

```javascript
// Index.tsx - Ao selecionar localização
"Location selected: { name, latitude, longitude }"
"selectedLocations: [...]"

// Index.tsx - Ao analisar
"Calling climate-analysis function with data: {...}"
"Response: { data, error }"

// Results.tsx - Ao carregar
"Analysis data received: [...]"
"Best location: Rio de Janeiro with ICP: 88"
```

### Supabase Edge Function Logs

```bash
# Visualizar logs em tempo real
supabase functions logs climate-analysis --tail

# Verificar erros recentes
supabase functions logs climate-analysis --limit 50
```

### Network Tab (F12 → Network)

1. Procure por `climate-analysis`
2. Verifique Request Payload:
   ```json
   {
     "locations": [...],
     "date": "...",
     "eventType": "...",
     "preferredTemperature": ...
   }
   ```
3. Verifique Response:
   - Status 200: Sucesso
   - Status 400: Erro de validação
   - Status 500: Erro no servidor

---

## Checklist de Verificação

Antes de reportar um bug, verifique:

- [ ] Edge Function foi atualizada para aceitar array?
- [ ] Edge Function foi deployada? (`supabase functions deploy climate-analysis`)
- [ ] Componente Tabs está instalado? (`src/components/ui/tabs.tsx`)
- [ ] Badge component está instalado? (`src/components/ui/badge.tsx`)
- [ ] Console do navegador mostra erros? (F12)
- [ ] Network tab mostra erro na requisição? (F12 → Network)
- [ ] Supabase logs mostram erro? (`supabase functions logs`)

---

## Contato / Suporte

Se o problema persistir:

1. **Verifique os logs**: Console + Network + Supabase
2. **Reproduza o erro**: Anote os passos exatos
3. **Capture screenshots**: Especialmente de erros
4. **Verifique os guias**:
   - `MULTIPLE_LOCATIONS_COMPARISON_GUIDE.md`
   - `EDGE_FUNCTION_MULTIPLE_LOCATIONS_EXAMPLE.md`
   - `IMPLEMENTATION_SUMMARY.md`

---

**Última Atualização**: Outubro 2025
