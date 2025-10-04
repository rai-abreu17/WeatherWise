import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PdfExportButtonProps {
  rootElementId: string;
  fileName?: string;
  buttonText?: string;
}

const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  rootElementId,
  fileName = 'relatorio.pdf',
  buttonText = 'Exportar para PDF',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    const input = document.getElementById(rootElementId);
    if (!input) {
      console.error(`Element with ID '${rootElementId}' not found.`);
      toast.error('Erro ao gerar PDF: elemento não encontrado');
      return;
    }

    setIsGenerating(true);
    toast.info('Gerando PDF... Aguarde alguns segundos');

    try {
      // Aguarda um pequeno delay para garantir que todos os elementos estejam renderizados
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(input, {
        scale: 2, // Aumenta a escala para melhor qualidade
        useCORS: true, // Habilita o uso de CORS para imagens externas
        allowTaint: true, // Permite elementos externos
        backgroundColor: '#ffffff', // Define fundo branco
        logging: false, // Desabilita logs no console
        imageTimeout: 0, // Remove timeout para carregamento de imagens
        windowWidth: input.scrollWidth, // Captura toda a largura
        windowHeight: input.scrollHeight, // Captura toda a altura
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // Largura A4 em mm
      const pageHeight = 297; // Altura A4 em mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isGenerating}>
      {isGenerating ? (
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

export default PdfExportButton;
