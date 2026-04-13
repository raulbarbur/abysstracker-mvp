"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Download } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

// Import required CSS for react-pdf to render text layers properly
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure the PDF.js worker from a reliable CDN to avoid webpack bundle issues
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

export function PdfViewerModal({ isOpen, onClose, pdfUrl, title }: PdfViewerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setPageNumber(1);
    }
  }, [isOpen, pdfUrl]);

  // Responsive width listener for mobile devices
  useEffect(() => {
    if (!mounted || !isOpen) return;
    
    const updateWidth = () => {
      const w = window.innerWidth;
      if (w < 640) { 
        setContainerWidth(w - 48); // Small padding for very small screens
      } else if (w < 768) { 
        setContainerWidth(w - 96); 
      } else {
        setContainerWidth(Math.min(w * 0.8, 800)); // Cap at 800px on Desktops
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [mounted, isOpen]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[95vw] md:max-w-3xl lg:max-w-4xl h-[95vh] sm:h-[90vh] bg-base flex flex-col rounded-2xl shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-border animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-base border-b border-border z-30 shrink-0">
          <h3 className="font-black text-text-primary uppercase tracking-widest text-sm">{title}</h3>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download
              className="p-2 border border-border bg-surface rounded-lg hover:bg-hover transition-colors text-text-primary"
              title="Descargar PDF"
            >
              <Download size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 bg-surface flex flex-col items-center overflow-y-auto overflow-x-hidden p-4 sm:p-8">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary z-10 bg-base/80 backdrop-blur-sm">
              <Loader2 className="animate-spin w-10 h-10 mb-3" />
              <p className="font-semibold text-sm animate-pulse">Renderizando documento...</p>
            </div>
          )}
          
          <div className="flex-1 w-full flex justify-center transition-opacity duration-300">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading=""
              error={
                <div className="flex flex-col items-center text-center p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 mx-auto mt-10 max-w-md">
                  <p className="text-red-600 dark:text-red-400 font-bold mb-2">Error al cargar el PDF.</p>
                  <p className="text-sm text-red-500/80 dark:text-red-400/80 mb-4">Es posible que su navegador esté bloqueando la previsualización.</p>
                  <a href={pdfUrl} download className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors">
                    Descargar Directamente
                  </a>
                </div>
              }
              className="flex justify-center"
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="bg-white rounded overflow-hidden shadow-xl" 
                renderMode="canvas"
                width={containerWidth || undefined}
                devicePixelRatio={window.devicePixelRatio > 1 ? 2 : 1} // Ensure crisp resolution on Retina displays
              />
            </Document>
          </div>
          
          {/* Controls for Multi-Page PDFs */}
          {numPages && numPages > 1 && (
            <div className="shrink-0 mt-6 flex gap-4 items-center bg-base py-2 px-4 rounded-full border border-border shadow-sm">
              <button 
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
                className="px-4 py-1.5 bg-surface hover:bg-hover disabled:opacity-40 disabled:hover:bg-surface rounded-full font-bold text-sm transition-colors text-text-primary active:scale-95"
              >
                Anterior
              </button>
              <span className="text-sm font-semibold text-text-primary tracking-wide">
                Pág {pageNumber} / {numPages}
              </span>
              <button 
                onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                disabled={pageNumber >= numPages}
                className="px-4 py-1.5 bg-surface hover:bg-hover disabled:opacity-40 disabled:hover:bg-surface rounded-full font-bold text-sm transition-colors text-text-primary active:scale-95"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
