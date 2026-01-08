'use client';

import React, { useMemo, useState } from 'react'; 
import { useEditorStore } from '@/modules/editor/store';
import { setupPdfWorker } from '@/lib/setup-pdf-worker';
import { Button } from '@/components/ui/button';
import { 
  Menu, Eye, Layout, LayoutList, X, ZoomIn, ZoomOut 
} from 'lucide-react';

import { PdfUploader } from './PdfUploader';
import { EditorSidebar } from './EditorSidebar';
import { MainViewer } from './MainViewer';
import { ThumbnailStrip } from './ThumbnailStrip';
import { BusyOverlay } from './BusyOverlay';
import { usePdfActions } from '@/modules/editor/hooks/usePdfActions';
import { Save } from 'lucide-react';
setupPdfWorker();

export default function PdfEditorShell() {
  const { 
    pdfBytes, 
    viewMode, setViewMode,
    scale, setScale
  } = useEditorStore();

  const { saveChanges } = usePdfActions();
  const { pageRotations } = useEditorStore();
  
  const hasChanges = Object.keys(pageRotations).length > 0;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);

  const pdfFileMain = useMemo(() => 
    pdfBytes ? { data: pdfBytes.slice(0) } : undefined
  , [pdfBytes, pdfVersion]);

  const handlePreview = () => {
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleZoomIn = () => setScale(Math.min(2.5, scale + 0.25));
  const handleZoomOut = () => setScale(Math.max(0.5, scale - 0.25));

  return (
    // FIX 1: Use h-[100dvh] for mobile browsers
    <div className="flex flex-col h-[100dvh] bg-slate-100 relative overflow-hidden">
      {/* 0. BUSY OVERLAY (Blocks interaction when processing) */}
      <BusyOverlay />

      {/* HEADER */}
      <header className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3 bg-white border-b shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          {hasChanges && (
          <Button size="sm" onClick={saveChanges} className="bg-blue-600 hover:bg-blue-700 text-white animate-pulse">
            <Save className="w-4 h-4 mr-1" /> Save Changes
          </Button>
          )}
          {pdfBytes && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="text-red-600">PDF</span> <span className="hidden sm:inline">Studio</span>
          </h1>
        </div>
        
        {pdfBytes && (
          <div className="flex items-center gap-2">
            
            {/* FIX 2: Visible on Mobile (removed 'hidden md:flex') */}
            <div className="flex bg-slate-100 p-1 rounded-md">
              <Button 
                variant={viewMode === 'scroll' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2"
                onClick={() => setViewMode('scroll')}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'single' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2"
                onClick={() => setViewMode('single')}
              >
                <Layout className="w-4 h-4" />
              </Button>
            </div>

            {/* Desktop Zoom */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-50 border rounded-md px-1">
               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}><ZoomOut className="w-3 h-3" /></Button>
               <span className="text-xs font-medium w-8 text-center">{Math.round(scale * 100)}%</span>
               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}><ZoomIn className="w-3 h-3" /></Button>
            </div>

            <Button variant="outline" size="sm" onClick={handlePreview} className="hidden sm:flex">
              <Eye className="w-4 h-4 mr-1" /> Preview
            </Button>

            <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-slate-500 hover:text-red-600">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT SIDEBAR */}
        {pdfBytes && (
          <EditorSidebar isOpen={isMobileMenuOpen} />
        )}

        {/* CENTER CONTENT */}
        <main 
          className="flex-1 relative flex flex-col bg-slate-100/50 min-w-0"
          onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
        >
          {!pdfBytes ? (
             <PdfUploader />
          ) : (
            <>
              {/* MAIN VIEWER - Takes remaining height */}
              {/* FIX 3: min-h-0 ensures it shrinks when ThumbnailStrip appears */}
              <div className="flex-1 overflow-hidden min-h-0 relative">
                <MainViewer pdfFile={pdfFileMain} />
                
                {/* Mobile Zoom (Floating) */}
                <div className="lg:hidden absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                   <Button size="icon" variant="secondary" className="rounded-full shadow-lg h-8 w-8 opacity-80" onClick={handleZoomIn}>
                     <ZoomIn className="w-4 h-4"/>
                   </Button>
                   <Button size="icon" variant="secondary" className="rounded-full shadow-lg h-8 w-8 opacity-80" onClick={handleZoomOut}>
                     <ZoomOut className="w-4 h-4"/>
                   </Button>
                </div>
              </div>

              {/* BOTTOM THUMBNAILS - Fixed at bottom */}
              {viewMode === 'single' && (
                <ThumbnailStrip />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}