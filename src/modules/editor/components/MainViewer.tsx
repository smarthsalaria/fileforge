'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { LazyPage } from './LazyPage';
import { useEditorStore } from '@/modules/editor/store';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface MainViewerProps {
  pdfFile: { data: Uint8Array } | undefined;
}

export const MainViewer = ({ pdfFile }: MainViewerProps) => {
  const { 
    numPages, setNumPages, 
    scale, 
    rotation: globalRotation, // Rename global rotation to avoid conflict
    pdfVersion, 
    viewMode, activePageIndex, setActivePageIndex,
    selectedPages, togglePageSelection,
    isTextSelectMode,
    pageOrder,
    pageRotations // <--- Get Virtual Rotations
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useEffect(() => {
    const onResize = () => containerRef.current && setContainerWidth(containerRef.current.clientWidth);
    const timer = setTimeout(onResize, 100);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(timer); };
  }, [viewMode]);

  const pageWidth = containerWidth ? Math.min(containerWidth - 32, 800) * scale : 600;

  const handlePageClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    togglePageSelection(index, e.ctrlKey || e.metaKey);
    setActivePageIndex(index);
  };

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (activePageIndex >= numPages) setActivePageIndex(Math.max(0, numPages - 1));
  };

  const safeVisualIndex = Math.min(Math.max(0, activePageIndex), Math.max(0, numPages - 1));
  const realPageNumber = (pageOrder[safeVisualIndex] ?? 0) + 1;
  
  // Single View Rotation Calculation
  const singleViewRotation = (globalRotation + (pageRotations[safeVisualIndex] || 0)) % 360;

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-auto p-4 relative bg-slate-100/50"
    >
      <Document
        file={pdfFile}
        onLoadSuccess={handleDocumentLoadSuccess}
        loading={null} 
        className="mx-auto w-fit min-h-full" 
      >
        {/* MODE 1: SCROLL VIEW */}
        {viewMode === 'scroll' && pageOrder.map((originalPageIndex, visualIndex) => {
          
          // FIX: Calculate rotation inside the map function
          const itemRotation = (globalRotation + (pageRotations[visualIndex] || 0)) % 360;

          return (
            <div 
              id={`page_scroll_${visualIndex}`}
              key={`page_scroll_${visualIndex}_${pdfVersion}_${globalRotation}`}
              onClick={(e) => handlePageClick(visualIndex, e)}
              className={`
                mb-6 shadow-lg transition-all duration-200 cursor-pointer relative group mx-auto
                ${selectedPages.has(visualIndex) ? 'ring-4 ring-blue-500 ring-offset-2' : 'hover:ring-2 hover:ring-slate-300'}
              `}
              style={{ width: pageWidth }}
            >
              <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded z-10 pointer-events-none">{visualIndex + 1}</div>
              
              <LazyPage 
                pageNumber={originalPageIndex + 1} 
                width={pageWidth} 
                rotation={itemRotation} // <--- Pass Calculated Rotation
                scale={1.0} 
              />
            </div>
          );
        })}

        {/* MODE 2: SINGLE VIEW */}
        {viewMode === 'single' && numPages > 0 && (
          <div 
            className="shadow-2xl transition-all duration-200 h-fit mx-auto"
            style={{ width: pageWidth }}
          >
            <Page 
              key={`page_single_${safeVisualIndex}_${singleViewRotation}`} 
              pageNumber={realPageNumber} 
              width={pageWidth} 
              rotate={singleViewRotation} // <--- Pass Calculated Rotation
              scale={1.0} 
              renderTextLayer={isTextSelectMode} 
              renderAnnotationLayer={isTextSelectMode} 
              className="bg-white" 
            />
          </div>
        )}
      </Document>
    </div>
  );
};