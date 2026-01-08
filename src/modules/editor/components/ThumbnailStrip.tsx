'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, CheckSquare, XSquare } from 'lucide-react';
import { useEditorStore } from '@/modules/editor/store';
import { usePdfActions } from '@/modules/editor/hooks/usePdfActions';

import { 
  DndContext, closestCenter, 
  KeyboardSensor, MouseSensor, TouchSensor, 
  useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// --- Sub-Component: Sortable Thumbnail ---
interface SortableThumbnailProps {
  id: string;
  index: number;
  selected: boolean;
  active: boolean;
  onSelect: (idx: number, checked: boolean) => void;
  onClick: (idx: number) => void;
  children: React.ReactNode;
}

const SortableThumbnail = ({ 
  id, index, selected, active, onSelect, onClick, children 
}: SortableThumbnailProps) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative min-w-[70px] md:min-w-[80px] h-[90px] md:h-[100px] bg-white cursor-pointer transition-colors duration-200 flex items-center justify-center
        border group select-none
        ${active ? 'border-blue-500 ring-1 ring-blue-500 shadow-md z-10' : 'border-slate-300 hover:border-slate-400'}
        ${selected ? 'bg-blue-50/50' : ''}
      `}
      {...attributes}
      {...listeners}
      onClick={() => onClick(index)} 
    >
      <div 
        className="absolute top-0 right-0 p-1.5 z-20"
        onPointerDown={(e) => e.stopPropagation()} 
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox 
          checked={selected}
          onCheckedChange={(checked) => onSelect(index, checked === true)}
          className="h-5 w-5 bg-white/90 border-slate-400 data-[state=checked]:bg-blue-600 shadow-sm"
        />
      </div>
      {children}
      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm z-10">
        {index + 1}
      </div>
    </div>
  );
};

export const ThumbnailStrip = () => {
  const { 
    pdfBytes, numPages, activePageIndex, setActivePageIndex, 
    selectedPages, togglePageSelection, selectAll, deselectAll, 
    pdfVersion, pageOrder, pageRotations // <--- Get Rotations
  } = useEditorStore();
  
  const { reorderPage } = usePdfActions();
  const [inputValue, setInputValue] = useState(String(activePageIndex + 1));
  const [localNumPages, setLocalNumPages] = useState<number>(numPages);
  
  const activeThumbRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, 
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { setLocalNumPages(numPages); }, [numPages]);
  
  useEffect(() => { setInputValue(String(activePageIndex + 1)); }, [activePageIndex]);

  useEffect(() => {
    if (activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center'
      });
    }
  }, [activePageIndex]);

  const localPdfData = useMemo(() => 
    pdfBytes ? { data: pdfBytes.slice(0) } : null
  , [pdfBytes, pdfVersion]);

  const itemIds = useMemo(() => pageOrder.map((_, i) => `thumb-${i}`), [pageOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = itemIds.indexOf(String(active.id));
      const newIndex = itemIds.indexOf(String(over?.id || ''));
      if (oldIndex !== -1 && newIndex !== -1) reorderPage(oldIndex, newIndex);
    }
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const isSelected = selectedPages.has(index);
    if (checked !== isSelected) togglePageSelection(index, true); 
  };
  
  const commitPageChange = () => {
    const val = parseInt(inputValue);
    if (!isNaN(val) && val >= 1 && val <= numPages) setActivePageIndex(val - 1);
    else setInputValue(String(activePageIndex + 1));
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setLocalNumPages(numPages);

  if (!localPdfData || localNumPages <= 1) return null;

  return (
    <div className="w-full bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 flex flex-col shrink-0">
      
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-2 md:px-4 py-2 bg-slate-50 border-b gap-2">
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs px-2 text-slate-600 hidden md:flex hover:bg-slate-100">
            <CheckSquare className="w-3 h-3 mr-1" /> All
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAll} disabled={selectedPages.size === 0} className="h-7 text-xs px-2 text-slate-600 hidden md:flex hover:bg-slate-100">
            <XSquare className="w-3 h-3 mr-1" /> Clear
          </Button>
          {selectedPages.size > 0 && (
             <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
               {selectedPages.size} <span className="hidden sm:inline">selected</span>
             </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-1 md:gap-2 flex-initial">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))} disabled={activePageIndex <= 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-white px-2 py-1 rounded border shadow-sm shrink-0">
            <Input 
              className="w-10 h-6 text-center p-0 border-0 focus-visible:ring-0 font-bold text-slate-800" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onBlur={commitPageChange} 
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} 
            />
            <span className="text-slate-400 text-xs whitespace-nowrap">/ {numPages}</span>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setActivePageIndex(Math.min(numPages - 1, activePageIndex + 1))} disabled={activePageIndex >= numPages - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 hidden md:block"></div>
      </div>
      
      {/* THUMBNAILS CONTAINER */}
      <div className="h-28 md:h-32 overflow-x-auto flex items-center p-2 md:p-4 bg-slate-100/50 touch-pan-x">
         <Document file={localPdfData} className="flex gap-3 md:gap-4" onLoadSuccess={onDocumentLoadSuccess} loading={null}>
           <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
             <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
               {pageOrder.map((originalPageIndex, visualIndex) => { // FIX: Added curly brace
                 
                 // FIX: Calculated rotation here
                 const itemRotation = (pageRotations[visualIndex] || 0) % 360;
                 
                 return ( // FIX: Explicit return
                   <div 
                      key={`wrapper-${visualIndex}`}
                      ref={visualIndex === activePageIndex ? activeThumbRef : null}
                      className="h-full flex items-center"
                   >
                     <SortableThumbnail
                       id={`thumb-${visualIndex}`}
                       index={visualIndex}
                       selected={selectedPages.has(visualIndex)}
                       active={activePageIndex === visualIndex}
                       onSelect={handleCheckboxChange}
                       onClick={setActivePageIndex}
                     >
                        <div className="pointer-events-none w-full h-full flex items-center justify-center overflow-hidden">
                          <Page 
                            pageNumber={originalPageIndex + 1} 
                            width={80} 
                            rotate={itemRotation} // <--- Applied Rotation
                            renderTextLayer={false} 
                            renderAnnotationLayer={false} 
                          />
                        </div>
                     </SortableThumbnail>
                   </div>
                 );
               })}
             </SortableContext>
           </DndContext>
        </Document>
      </div>
    </div>
  );
};