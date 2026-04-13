"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Download } from "lucide-react";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

export function PdfViewerModal({ isOpen, onClose, pdfUrl, title }: PdfViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) setLoading(true);
  }, [isOpen, pdfUrl]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[95vw] md:max-w-3xl lg:max-w-4xl h-[95vh] sm:h-[90vh] bg-base flex flex-col rounded-2xl shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-border animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-base border-b border-border z-30">
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
        <div className="relative flex-1 bg-white flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary z-10">
              <Loader2 className="animate-spin w-10 h-10 mb-3" />
              <p className="font-semibold text-sm animate-pulse">Cargando documento...</p>
            </div>
          )}
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
            className={`w-full h-full border-none z-20 transition-opacity duration-500 bg-white ${loading ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setLoading(false)}
            title={title}
          />
        </div>

      </div>
    </div>,
    document.body
  );
}
