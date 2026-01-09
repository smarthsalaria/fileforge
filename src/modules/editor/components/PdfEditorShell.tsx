'use client';

import React, { useMemo, useState } from 'react'; 
import { useEditorStore } from '@/modules/editor/store';
import { setupPdfWorker } from '@/lib/setup-pdf-worker';
import { Button } from '@/components/ui/button';
import { 
  Menu, Eye, Layout, LayoutList, X, ZoomIn, ZoomOut, Save 
} from 'lucide-react';

// --- SUB-COMPONENTS ---
import { PdfUploader } from './PdfUploader';
import { EditorSidebar } from './EditorSidebar';
import { MainViewer } from './MainViewer';
import { ThumbnailStrip } from './ThumbnailStrip';
import { BusyOverlay } from './BusyOverlay';

// --- HOOKS ---
import { usePdfActions } from '@/modules/editor/hooks/usePdfActions';

// --- ADS & THEME ---
import { DesktopAdSidebar } from './ads/DesktopAdSidebar';
import { MobileFloatingAd } from './ads/MobileFloatingAd';
import { ThemeToggle } from '@/components/ThemeToggle'; 

// Initialize Worker
setupPdfWorker();

export default function PdfEditorShell() {
  const { 
    pdfBytes, 
    viewMode, setViewMode,
    scale, setScale,
    pageRotations
  } = useEditorStore();

  const { saveChanges } = usePdfActions();
  
  // Check if there are virtual changes (rotations) pending save
  const hasChanges = Object.keys(pageRotations).length > 0;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);

  // Memoize the file data for the Main Viewer to prevent unnecessary re-renders
  const pdfFileMain = useMemo(() => 
    pdfBytes ? { data: pdfBytes.slice(0) } : undefined
  , [pdfBytes, pdfVersion]);

  const handlePreview = () => {
    if (!pdfBytes) return;
    
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleZoomIn = () => setScale(Math.min(2.5, scale + 0.25));
  const handleZoomOut = () => setScale(Math.max(0.5, scale - 0.25));

  return (
    // ROOT CONTAINER: Handles Full Height & Dark Mode Background
    <div className="flex flex-col h-dvh bg-slate-100 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      
      {/* 0. GLOBAL OVERLAYS */}
      <BusyOverlay />
      <MobileFloatingAd />

      {/* 1. HEADER */}
      <header className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-30 shrink-0 transition-colors duration-300">
        
        {/* LEFT: Logo & Mobile Menu */}
        <div className="flex items-center gap-2 md:gap-3">
          

          {/* Mobile Menu Toggle */}
          {pdfBytes && (
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-700 dark:text-slate-200" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Logo */}
          <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="text-red-600">PDF</span> <span className="hidden sm:inline">Studio</span>
          </h1>
        </div>

        {/* RIGHT: Tools & Toggles */}
        <div className="flex items-center gap-2">
          {/* Save Button (Only appears when changes exist) */}
          {hasChanges && (
            <Button size="sm" onClick={saveChanges} className="bg-blue-600 hover:bg-blue-700 text-white animate-pulse">
              <Save className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Save Changes</span>
            </Button>
          )}
          <ThemeToggle />

          {pdfBytes && (
            <>
              {/* View Mode Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-md transition-colors">
                <Button 
                  variant={viewMode === 'scroll' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`h-7 px-2 ${viewMode === 'scroll' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  onClick={() => setViewMode('scroll')}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'single' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`h-7 px-2 ${viewMode === 'single' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  onClick={() => setViewMode('single')}
                >
                  <Layout className="w-4 h-4" />
                </Button>
              </div>

              {/* Zoom Controls (Desktop) */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-1 text-slate-700 dark:text-slate-200 transition-colors">
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}><ZoomOut className="w-3 h-3" /></Button>
                 <span className="text-xs font-medium w-8 text-center">{Math.round(scale * 100)}%</span>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}><ZoomIn className="w-3 h-3" /></Button>
              </div>

              {/* Preview Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePreview} 
                // CHANGED: Removed 'hidden'. Added 'px-2' for better icon sizing on mobile.
                className="flex items-center dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 px-2 sm:px-3"
              >
                <Eye className="w-4 h-4 sm:mr-1" /> {/* Icon is always visible */}
                
                {/* Text is hidden on mobile (default), visible on sm+ screens */}
                <span className="hidden sm:inline">Preview</span>
              </Button>

              {/* Close / Reload */}
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500">
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT: Tools Sidebar */}
        {pdfBytes && (
          <EditorSidebar isOpen={isMobileMenuOpen} />
        )}

        {/* CENTER: Work Area */}
        <main 
          className="flex-1 relative flex flex-col bg-slate-100/50 dark:bg-slate-950 min-w-0 transition-colors duration-300"
          onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
        >
          {!pdfBytes ? (
             <PdfUploader />
          ) : (
            <>
              {/* MAIN VIEWER */}
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

              {/* BOTTOM THUMBNAILS - Always visible for Reordering */}
              <ThumbnailStrip />
            </>
          )}
        </main>
        
        {/* DESKTOP ADS */}
        <DesktopAdSidebar />
      </div>
    </div>
  );
}