// EXEMPLO DE USO DOS COMPONENTES MOBILE-FIRST
// Este arquivo demonstra como integrar todos os componentes mobile criados

import { useState } from 'react';
import { MobileHeader } from '@/components/MobileHeader';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Filter, Plus, Cloud, MapPin } from 'lucide-react';

export const MobileExamplePage = () => {
  const [isLoggedIn] = useState(true);
  const [userEmail] = useState('usuario@exemplo.com');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* 1. MOBILE HEADER - Substitui header tradicional */}
      <MobileHeader 
        userEmail={userEmail} 
        isLoggedIn={isLoggedIn} 
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Hero Section - Responsivo */}
        <section className="text-center py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            WeatherWise Planner
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Planeje seus eventos com dados climáticos da NASA
          </p>
        </section>

        {/* Formulário Mobile-First */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Input de localização */}
            <div className="flex-1">
              <Label htmlFor="location" className="text-base">
                Localização
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="Digite a cidade..."
                className="w-full p-4 text-base" // min 16px previne zoom iOS
              />
            </div>

            {/* Input de data */}
            <div className="flex-1">
              <Label htmlFor="date" className="text-base">
                Data
              </Label>
              <Input
                id="date"
                type="date"
                className="w-full p-4 text-base"
              />
            </div>
          </div>

          {/* Botão de análise - Full width no mobile */}
          <Button 
            className="w-full md:w-auto p-6 text-lg font-semibold"
            size="lg"
          >
            <Cloud className="mr-2 h-5 w-5" />
            Analisar Clima
          </Button>
        </section>

        {/* 2. COLLAPSIBLE SECTION - Detalhes climáticos */}
        <CollapsibleSection
          title="Detalhes Climáticos"
          icon={<Cloud className="h-5 w-5" />}
          defaultOpen={true}
          className="shadow-lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Cards de informação */}
              {['Temperatura', 'Umidade', 'Vento', 'Chuva'].map((item) => (
                <div key={item} className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">{item}</p>
                  <p className="text-2xl font-bold mt-2">--</p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* 3. COLLAPSIBLE SECTION - Eventos próximos */}
        <CollapsibleSection
          title="Eventos e Feriados"
          icon={<Calendar className="h-5 w-5" />}
          badge={9}
          defaultOpen={false}
          className="shadow-lg"
        >
          <div className="space-y-3">
            {/* Lista de eventos */}
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Evento {i}</h4>
                    <p className="text-sm text-muted-foreground">
                      Data exemplo
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="min-h-[44px]">
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Grid responsivo de cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i}
              className="p-6 bg-card border rounded-lg shadow-sm hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold text-lg mb-2">Card {i}</h3>
              <p className="text-sm text-muted-foreground">
                Exemplo de conteúdo responsivo
              </p>
            </div>
          ))}
        </section>

        {/* Scroll horizontal mobile */}
        <section>
          <h2 className="text-xl font-bold mb-4 px-4 md:px-0">
            Datas Alternativas
          </h2>
          <div className="
            flex lg:grid lg:grid-cols-4
            gap-4
            overflow-x-auto lg:overflow-x-visible
            snap-x snap-mandatory lg:snap-none
            pb-4 px-4 md:px-0
            -mx-4 md:mx-0
          ">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                className="
                  min-w-[280px] lg:min-w-0
                  snap-center lg:snap-align-none
                  flex-shrink-0 lg:flex-shrink
                  p-6 bg-card border rounded-lg shadow-sm
                "
              >
                <p className="text-sm text-muted-foreground mb-2">
                  Data {i}
                </p>
                <div className="text-4xl font-bold text-primary mb-2">
                  {75 + i * 5}
                </div>
                <p className="text-sm">Bom para eventos</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 4. FLOATING ACTION BUTTON - Ação principal */}
      <FloatingActionButton
        onClick={() => setShowNewAnalysis(true)}
        icon={<Plus className="h-6 w-6" />}
        label="Nova Análise"
        variant="primary"
      />

      {/* Botão secundário (exemplo de filtros) */}
      <button
        onClick={() => setShowFilters(true)}
        className="
          fixed bottom-6 left-6 z-40
          w-14 h-14 bg-secondary text-secondary-foreground
          rounded-full shadow-lg
          flex items-center justify-center
          hover:scale-105 active:scale-95
          transition-transform
        "
      >
        <Filter className="h-5 w-5" />
      </button>

      {/* 5. BOTTOM SHEET - Filtros */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros de Busca"
        height="half"
      >
        <div className="space-y-6">
          <div>
            <Label htmlFor="categoria" className="text-base mb-2 block">
              Categoria
            </Label>
            <select 
              id="categoria"
              className="w-full p-4 text-base border rounded-lg"
            >
              <option>Todos</option>
              <option>Feriados</option>
              <option>Festivais</option>
              <option>Esportes</option>
            </select>
          </div>

          <div>
            <Label htmlFor="distancia" className="text-base mb-2 block">
              Distância máxima
            </Label>
            <Input
              id="distancia"
              type="number"
              placeholder="100 km"
              className="w-full p-4 text-base"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1 min-h-[44px]"
              onClick={() => setShowFilters(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 min-h-[44px]"
              onClick={() => {
                // Aplicar filtros
                setShowFilters(false);
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* 6. BOTTOM SHEET - Nova análise */}
      <BottomSheet
        isOpen={showNewAnalysis}
        onClose={() => setShowNewAnalysis(false)}
        title="Nova Análise Climática"
        height="auto"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-location" className="text-base mb-2 block">
              Localização
            </Label>
            <Input
              id="new-location"
              type="text"
              placeholder="Digite a cidade..."
              className="w-full p-4 text-base"
            />
          </div>

          <div>
            <Label htmlFor="new-date" className="text-base mb-2 block">
              Data do Evento
            </Label>
            <Input
              id="new-date"
              type="date"
              className="w-full p-4 text-base"
            />
          </div>

          <div>
            <Label htmlFor="event-type" className="text-base mb-2 block">
              Tipo de Evento
            </Label>
            <select 
              id="event-type"
              className="w-full p-4 text-base border rounded-lg"
            >
              <option>Ao ar livre</option>
              <option>Indoor</option>
              <option>Misto</option>
            </select>
          </div>

          <Button 
            className="w-full p-6 text-lg font-semibold mt-4"
            onClick={() => {
              // Executar análise
              setShowNewAnalysis(false);
            }}
          >
            <Cloud className="mr-2 h-5 w-5" />
            Analisar
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};

/**
 * NOTAS DE IMPLEMENTAÇÃO:
 * 
 * 1. MOBILE HEADER
 *    - Substitui qualquer header existente
 *    - Já inclui menu responsivo e theme toggle
 *    - Fixed no topo, adiciona spacer automático
 * 
 * 2. COLLAPSIBLE SECTION
 *    - Use para seções longas ou secundárias
 *    - Badge mostra contador (ex: número de eventos)
 *    - defaultOpen controla estado inicial
 * 
 * 3. FLOATING ACTION BUTTON
 *    - Ação principal da página
 *    - Use variant="primary" para destaque
 *    - Pode ter label ou ser só ícone
 * 
 * 4. BOTTOM SHEET
 *    - Para formulários e filtros
 *    - Melhor UX que modal tradicional no mobile
 *    - height="auto" | "half" | "full"
 * 
 * 5. CLASSES RESPONSIVAS IMPORTANTES
 *    - text-base (16px) em inputs previne zoom no iOS
 *    - min-h-[44px] garante área de toque adequada
 *    - grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 (mobile-first)
 *    - p-4 md:p-6 lg:p-8 (padding crescente)
 * 
 * 6. SCROLL HORIZONTAL
 *    - overflow-x-auto no mobile
 *    - snap-x snap-mandatory para UX suave
 *    - -mx-4 md:mx-0 para full-width no mobile
 * 
 * 7. PERFORMANCE
 *    - Lazy loading de componentes pesados
 *    - Imagens com loading="lazy"
 *    - Minimizar re-renders
 */
