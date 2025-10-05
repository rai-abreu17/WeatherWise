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
    toast.info('Gerando PDF...');

    try {
      // Criar um clone do elemento para não afetar a tela visível
      const clone = input.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.classList.add('print-friendly-mode');
      document.body.appendChild(clone);

      // Aguardar apenas um frame de renderização (muito mais rápido)
      await new Promise(resolve => requestAnimationFrame(resolve));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Remover o clone
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      
      if (imgData === 'data:,' || imgData.length < 100) {
        throw new Error('Canvas vazio - nenhum conteúdo foi capturado');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // Largura A4 em mm
      const pageHeight = 297; // Altura A4 em mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Adicionar imagem ao PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Se o conteúdo for maior que uma página, adicionar páginas adicionais
      let heightLeft = imgHeight - pageHeight;
      let position = -pageHeight;
      
      while (heightLeft > 0) {
        position = position - pageHeight;
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
    <Button 
      onClick={handleExport} 
      disabled={isGenerating}
      className="print-export-button"
    >
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
