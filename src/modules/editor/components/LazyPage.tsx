'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Page } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import { useEditorStore } from '@/modules/editor/store'; // Import store

interface LazyPageProps {
  pageNumber: number;
  width: number;
  rotation: number;
  scale: number;
}

export const LazyPage = ({ pageNumber, width, rotation, scale }: LazyPageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isTextSelectMode } = useEditorStore(); // Get toggle state

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative bg-white shadow-sm"
      style={{ 
        width: width, 
        minHeight: isVisible ? 'auto' : width * 1.41 
      }}
    >
      {isVisible ? (
        <Page 
          pageNumber={pageNumber} 
          width={width} 
          rotate={rotation} 
          scale={scale} 
          // FIX: Toggle Layers
          renderTextLayer={isTextSelectMode} 
          renderAnnotationLayer={isTextSelectMode} 
          className="bg-white"
          loading={
            <div className="flex items-center justify-center h-full w-full bg-slate-50 text-slate-400">
               <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          }
        />
      ) : (
        <div className="flex items-center justify-center text-slate-300 text-sm">
           Page {pageNumber}
        </div>
      )}
    </div>
  );
};