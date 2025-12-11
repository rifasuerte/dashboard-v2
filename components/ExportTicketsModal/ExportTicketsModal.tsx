'use client';

import { useState } from 'react';
import { useAlert } from '@/contexts/AlertContext';
import { useLoading } from '@/contexts/LoadingContext';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';

interface ExportTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumbers: number[];
  purchasedTickets: Array<{
    number: number;
    user: {
      name: string;
      email: string;
      phone: string;
    };
    isPaid: boolean;
  }>;
  raffleName: string;
}

export default function ExportTicketsModal({
  isOpen,
  onClose,
  ticketNumbers,
  purchasedTickets,
  raffleName,
}: ExportTicketsModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const { showAlert } = useAlert();
  const [exporting, setExporting] = useState<string | null>(null);

  const getTicketStatus = (ticketNumber: number): 'available' | 'paid' | 'pending' => {
    const ticket = purchasedTickets.find((t) => t.number === ticketNumber);
    if (!ticket) return 'available';
    return ticket.isPaid ? 'paid' : 'pending';
  };

  const formatTicketNumber = (num: number): string => {
    return num.toString().padStart(5, '0');
  };

  const exportToExcel = async () => {
    setExporting('excel');
    showLoading('Exportando a Excel...');
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tickets');
      
      const columnsPerRow = 30;
      
      // Configurar ancho de columnas
      for (let i = 1; i <= columnsPerRow; i++) {
        worksheet.getColumn(i).width = 15;
      }
      
      // Crear filas con datos
      for (let i = 0; i < ticketNumbers.length; i += columnsPerRow) {
        const row = worksheet.addRow([]);
        
        for (let j = 0; j < columnsPerRow && i + j < ticketNumbers.length; j++) {
          const number = ticketNumbers[i + j];
          const status = getTicketStatus(number);
          const formattedNumber = formatTicketNumber(number);
          
          const cell = row.getCell(j + 1);
          cell.value = formattedNumber;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { color: { argb: 'FF000000' }, bold: true, size: 12 }; // Texto negro
          
          if (status === 'available') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF90EE90' } // Verde claro
            };
          } else {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFB6C1' } // Rojo claro
            };
          }
          
          // Borde de celda
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        }
      }
      
      // Generar buffer y descargar
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${raffleName}_tickets_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      hideLoading();
      setExporting(null);
      onClose();
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      showAlert('Error al exportar a Excel', 'error');
      hideLoading();
      setExporting(null);
    }
  };

  const exportToPDF = async () => {
    setExporting('pdf');
    showLoading('Exportando a PDF...');
    
    try {
      const pdf = new jsPDF('landscape', 'px', [1200, 800]);
      const columnsPerRow = 30;
      const cellWidth = 1200 / columnsPerRow;
      const cellHeight = 30;
      let yPos = 20;
      let xPos = 0;
      let row = 0;

      for (let i = 0; i < ticketNumbers.length; i++) {
        const number = ticketNumbers[i];
        const status = getTicketStatus(number);
        const formattedNumber = formatTicketNumber(number);
        
        // Color de fondo
        if (status === 'available') {
          pdf.setFillColor(144, 238, 144); // Verde claro
        } else {
          pdf.setFillColor(255, 182, 193); // Rojo claro
        }
        pdf.rect(xPos, yPos, cellWidth, cellHeight, 'F');
        
        // Borde de celda
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(xPos, yPos, cellWidth, cellHeight);
        
        // Texto negro
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(formattedNumber, xPos + cellWidth / 2, yPos + cellHeight / 2 + 4, {
          align: 'center',
          baseline: 'middle',
        });
        
        xPos += cellWidth;
        
        // Nueva fila cada 30 columnas
        if ((i + 1) % columnsPerRow === 0) {
          xPos = 0;
          yPos += cellHeight;
          row++;
          
          // Nueva página si es necesario
          if (yPos + cellHeight > 800) {
            pdf.addPage();
            yPos = 20;
          }
        }
      }

      const fileName = `${raffleName}_tickets_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      hideLoading();
      setExporting(null);
      onClose();
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      showAlert('Error al exportar a PDF', 'error');
      hideLoading();
      setExporting(null);
    }
  };

  const exportToImages = async () => {
    setExporting('images');
    showLoading('Exportando imágenes...');
    
    try {
      const imageSize = 500; // Tamaño fijo de la imagen cuadrada
      const cellWidth = 50;
      const cellHeight = 50;
      const columnsPerRow = Math.floor(imageSize / cellWidth); // 10 columnas
      const rowsPerImage = Math.floor(imageSize / cellHeight); // 10 filas
      const ticketsPerImage = columnsPerRow * rowsPerImage; // 100 tickets por imagen
      
      const totalImages = Math.ceil(ticketNumbers.length / ticketsPerImage);
      
      for (let imageIndex = 0; imageIndex < totalImages; imageIndex++) {
        const startIndex = imageIndex * ticketsPerImage;
        const endIndex = Math.min(startIndex + ticketsPerImage, ticketNumbers.length);
        
        // Crear canvas siempre de 500x500
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        
        canvas.width = imageSize;
        canvas.height = imageSize;
        
        // Fondo blanco para toda la imagen
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, imageSize, imageSize);
        
        // Dibujar tickets
        for (let i = startIndex; i < endIndex; i++) {
          const number = ticketNumbers[i];
          const status = getTicketStatus(number);
          const formattedNumber = formatTicketNumber(number);
          
          const row = Math.floor((i - startIndex) / columnsPerRow);
          const col = (i - startIndex) % columnsPerRow;
          
          const x = col * cellWidth;
          const y = row * cellHeight;
          
          // Fondo
          if (status === 'available') {
            ctx.fillStyle = '#90EE90'; // Verde claro
          } else {
            ctx.fillStyle = '#FFB6C1'; // Rojo claro
          }
          ctx.fillRect(x, y, cellWidth, cellHeight);
          
          // Borde
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellWidth, cellHeight);
          
          // Texto negro
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(formattedNumber, x + cellWidth / 2, y + cellHeight / 2);
        }
        
        // Dibujar celdas vacías si no hay suficientes tickets
        const totalCells = columnsPerRow * rowsPerImage;
        const filledCells = endIndex - startIndex;
        
        if (filledCells < totalCells) {
          for (let i = filledCells; i < totalCells; i++) {
            const row = Math.floor(i / columnsPerRow);
            const col = i % columnsPerRow;
            
            const x = col * cellWidth;
            const y = row * cellHeight;
            
            // Celda vacía con fondo blanco
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x, y, cellWidth, cellHeight);
            
            // Borde
            ctx.strokeStyle = '#CCCCCC';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellWidth, cellHeight);
          }
        }
        
        // Descargar imagen con delay para evitar problemas
        await new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${raffleName}_tickets_${imageIndex + 1}_${new Date().toISOString().split('T')[0]}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
            setTimeout(resolve, 100);
          });
        });
      }
      
      hideLoading();
      setExporting(null);
      onClose();
    } catch (error) {
      console.error('Error al exportar imágenes:', error);
      showAlert('Error al exportar imágenes', 'error');
      hideLoading();
      setExporting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[600px] p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Exportar Tickets
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Cerrar"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <button
            onClick={exportToExcel}
            disabled={!!exporting}
            className="w-full flex items-center gap-6 p-6 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-green-500 dark:border-green-600 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">Excel</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Exportar a archivo Excel con colores</div>
            </div>
            {exporting === 'excel' && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            )}
          </button>

          <button
            onClick={exportToPDF}
            disabled={!!exporting}
            className="w-full flex items-center gap-6 p-6 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-500 dark:border-red-600 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">PDF</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Exportar a archivo PDF con colores</div>
            </div>
            {exporting === 'pdf' && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            )}
          </button>

          <button
            onClick={exportToImages}
            disabled={!!exporting}
            className="w-full flex items-center gap-6 p-6 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-600 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">Imágenes</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Exportar como imágenes PNG divididas</div>
            </div>
            {exporting === 'images' && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

