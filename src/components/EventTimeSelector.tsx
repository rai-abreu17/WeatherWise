import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface EventTimeSelectorProps {
  startTime: string;
  endTime: string | null;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string | null) => void;
  isAllDay: boolean;
  onAllDayChange: (isAllDay: boolean) => void;
}

const EventTimeSelector: React.FC<EventTimeSelectorProps> = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  isAllDay,
  onAllDayChange
}) => {
  // Gerar opções de horário (intervalos de 30 minutos)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const time = `${formattedHour}:${formattedMinute}`;
        const displayTime = `${hour.toString().padStart(2, '0')}:${formattedMinute}`;
        options.push({ value: time, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="all-day"
          checked={isAllDay}
          onCheckedChange={(checked) => onAllDayChange(checked as boolean)}
        />
        <Label htmlFor="all-day" className="cursor-pointer font-medium">
          Evento de dia inteiro
        </Label>
      </div>

      {!isAllDay && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Horário de início</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
              <Select
                value={startTime}
                onValueChange={onStartTimeChange}
              >
                <SelectTrigger id="start-time" className="pl-10">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-time">Horário de término (opcional)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
              <Select
                value={endTime || 'none'}
                onValueChange={(value) => onEndTimeChange(value === 'none' ? null : value)}
              >
                <SelectTrigger id="end-time" className="pl-10">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não especificado</SelectItem>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
      
      {!isAllDay && (
        <p className="text-sm text-muted-foreground">
          💡 A análise horária ajudará a encontrar o melhor momento para seu evento
        </p>
      )}
    </div>
  );
};

export default EventTimeSelector;
