import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Tipos para os dados de análise
interface DateData {
  date: string;
  displayDate: string;
  temperature: number;
  rainProbability: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icp: number;
  alertMessage?: string;
}

interface AnalysisData {
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  requestedDate: DateData;
  alternativeDates: DateData[];
  dataSource: {
    provider: string;
    yearsAnalyzed: number;
    period: string;
  };
}

interface DirectPdfExportProps {
  analysisData: AnalysisData | AnalysisData[];
  fileName?: string;
  buttonText?: string;
}

const DirectPdfExport: React.FC<DirectPdfExportProps> = ({
  analysisData,
  fileName = 'relatorio-climatico.pdf',
  buttonText = 'Exportar para PDF',
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Helper function para limpar nome da localização
  const cleanLocationName = (fullName: string): string => {
    if (!fullName) return "Local não especificado";
    
    // Apenas sanitiza caracteres problemáticos para manter o endereço completo
    const sanitized = fullName
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '') // Remove caracteres fora do intervalo Latin-1
      .replace(/\s{2,}/g, ' ') // Remove espaços duplicados
      .trim();
    
    // Retorna o endereço completo sem alteração na estrutura
    return sanitized;
  };

  const generatePdfForLocation = (doc: jsPDF, data: AnalysisData, startY: number) => {
    let currentY = startY;

    // Adicionar informações da localização
    doc.setFontSize(14);
    doc.setTextColor(29, 78, 216); // Azul
    
    // Usar o nome completo formatado para evitar problemas de codificação e melhor apresentação
    const locationName = cleanLocationName(data.location.name);
    doc.text(locationName, 20, currentY, { 
      maxWidth: 170, // Largura máxima para quebra de texto
      align: 'left'  // Alinhamento à esquerda
    });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    // Determinar quantas linhas ocupa a localização para ajustar o espaçamento
    const locationLines = locationName.split('\n').length;
    const locationOffset = locationLines * 7; // 7 pontos por linha
    
    doc.text(`Coordenadas: ${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}`, 20, currentY + locationOffset);
    doc.text(`Data Solicitada: ${data.requestedDate.displayDate}`, 20, currentY + locationOffset + 7);
    
    currentY += locationOffset + 14; // Ajusta o espaçamento baseado no número de linhas

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(20, currentY, 190, currentY);
    
    currentY += 8;

    // Título da seção
    doc.setFontSize(12);
    doc.setTextColor(29, 78, 216);
    doc.text(`Condições Climáticas para ${locationName}`, 20, currentY);
    
    currentY += 5;

    // Criar tabela com dados da data solicitada
    const requestedDateData = [
      ['Temperatura', `${data.requestedDate.temperature}°C`],
      ['Probabilidade de Chuva', `${data.requestedDate.rainProbability}%`],
      ['Umidade', `${data.requestedDate.humidity}%`],
      ['Velocidade do Vento', `${data.requestedDate.windSpeed} km/h`],
      ['Condição', data.requestedDate.condition],
      ['Índice de Conforto (ICP)', `${data.requestedDate.icp}/100`],
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Métrica', 'Valor']],
      body: requestedDateData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 80 },
      },
      margin: { left: 20, right: 20 },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Adicionar alerta se existir
    if (data.requestedDate.alertMessage) {
      doc.setFillColor(254, 226, 226);
      doc.setDrawColor(220, 38, 38);
      doc.roundedRect(20, currentY, 170, 15, 3, 3, 'FD');
      
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(10);
      doc.text(`⚠️ Alerta: ${data.requestedDate.alertMessage}`, 25, currentY + 10);
      
      currentY += 20;
    }

    // Título da seção de datas alternativas
    doc.setFontSize(12);
    doc.setTextColor(29, 78, 216);
    doc.text('Datas Alternativas Recomendadas', 20, currentY);
    
    currentY += 5;

    // Preparar dados para tabela de datas alternativas
    const alternativeDatesData = data.alternativeDates.slice(0, 5).map(date => [
      date.displayDate,
      `${date.temperature}°C`,
      `${date.rainProbability}%`,
      `${date.humidity}%`,
      `${date.windSpeed} km/h`,
      `${date.icp}/100`,
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Temp.', 'Chuva', 'Umid.', 'Vento', 'ICP']],
      body: alternativeDatesData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      margin: { left: 20, right: 20 },
    });

    return (doc as any).lastAutoTable.finalY + 15;
  };

  const handleExport = async () => {
    setIsExporting(true);
    toast.info('Gerando PDF...');
    
    try {
      // Configurar jsPDF com suporte a caracteres Unicode
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
      });

      // Definir fonte padrão para português
      doc.setFont("helvetica");
      
      const analysisArray = Array.isArray(analysisData) ? analysisData : [analysisData];
      
      // Cabeçalho principal
      doc.setFontSize(22);
      doc.setTextColor(29, 78, 216);
      doc.text('WeatherWise', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text(
        analysisArray.length > 1 ? 'Comparação de Análises Climáticas' : 'Relatório de Análise Climática',
        105,
        30,
        { align: 'center' }
      );
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 37, { align: 'center' });
      
      // Linha separadora principal
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, 42, 190, 42);
      
      let currentY = 50;

      // Gerar PDF para cada localização
      for (let i = 0; i < analysisArray.length; i++) {
        const data = analysisArray[i];
        
        // Adicionar nova página se não for a primeira localização
        if (i > 0) {
          doc.addPage();
          currentY = 20;
        }
        
        currentY = generatePdfForLocation(doc, data, currentY);
        
        // Se houver mais localizações e espaço, adicionar separador
        if (i < analysisArray.length - 1 && currentY < 250) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(20, currentY, 190, currentY);
          currentY += 10;
        }
      }

      // Adicionar informações da fonte de dados na última página
      const lastY = (doc as any).lastAutoTable?.finalY || currentY;
      
      if (lastY > 250) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY = lastY + 10;
      }

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Análise baseada em ${analysisArray[0].dataSource.yearsAnalyzed} anos de dados históricos (${analysisArray[0].dataSource.period})`,
        105,
        currentY,
        { align: 'center' }
      );
      doc.setFontSize(11);
      doc.setTextColor(29, 78, 216);
      doc.text(analysisArray[0].dataSource.provider, 105, currentY + 7, { align: 'center' });

      // Adicionar rodapé em todas as páginas
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          'WeatherWise - Previsões climáticas precisas para seus eventos',
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        doc.text(
          `Página ${i} de ${pageCount}`,
          190,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
      
      // Salvar o PDF
      doc.save(fileName);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting}
      variant="hero"
      size="sm"
      className="rounded-xl shadow-glow-primary"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Gerando...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
};

export default DirectPdfExport;
