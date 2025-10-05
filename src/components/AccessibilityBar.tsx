import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import {
  Settings,
  Type,
  Contrast,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const AccessibilityBar = () => {
  const {
    settings,
    increaseFontSize,
    decreaseFontSize,
    toggleHighContrast,
    toggleDyslexicFont,
    toggleReduceMotion,
    resetSettings,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg bg-background hover-lift"
            aria-label="Abrir configurações de acessibilidade"
          >
            <Settings className="w-6 h-6" aria-hidden="true" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 p-4"
          align="end"
          role="dialog"
          aria-label="Configurações de acessibilidade"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Eye className="w-5 h-5" aria-hidden="true" />
                Acessibilidade
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar configurações"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tamanho do texto</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decreaseFontSize}
                  aria-label="Diminuir tamanho do texto"
                  disabled={settings.fontSize <= 12}
                >
                  <ZoomOut className="w-4 h-4 mr-1" aria-hidden="true" />
                  A-
                </Button>
                <span
                  className="flex-1 text-center text-sm"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {settings.fontSize}px
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={increaseFontSize}
                  aria-label="Aumentar tamanho do texto"
                  disabled={settings.fontSize >= 24}
                >
                  <ZoomIn className="w-4 h-4 mr-1" aria-hidden="true" />
                  A+
                </Button>
              </div>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Contrast className="w-4 h-4" aria-hidden="true" />
                <Label htmlFor="high-contrast" className="text-sm cursor-pointer">
                  Alto contraste
                </Label>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={toggleHighContrast}
                aria-label="Ativar ou desativar modo de alto contraste"
              />
            </div>

            {/* Dyslexic Font */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" aria-hidden="true" />
                <Label htmlFor="dyslexic-font" className="text-sm cursor-pointer">
                  Fonte para dislexia
                </Label>
              </div>
              <Switch
                id="dyslexic-font"
                checked={settings.dyslexicFont}
                onCheckedChange={toggleDyslexicFont}
                aria-label="Ativar ou desativar fonte para dislexia"
              />
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <Label htmlFor="reduce-motion" className="text-sm cursor-pointer">
                  Reduzir movimento
                </Label>
              </div>
              <Switch
                id="reduce-motion"
                checked={settings.reduceMotion}
                onCheckedChange={toggleReduceMotion}
                aria-label="Ativar ou desativar redução de movimento"
              />
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={resetSettings}
              aria-label="Restaurar configurações padrão de acessibilidade"
            >
              <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
              Restaurar padrões
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
