import { useEditorStore } from '@/modules/editor/store';
import { PdfProcessor } from '@/lib/pdf-processor/core';
import { PDFDocument, degrees } from 'pdf-lib';

export const usePdfActions = () => {
  const { 
    pdfBytes, updatePdfBytes, selectedPages, activePageIndex, 
    deselectAll, pageOrder, setPageOrder, setIsProcessing,
    pageRotations, setPageRotation // <--- Get new rotation helpers
  } = useEditorStore();

  const commitPageOrderAndRotations = async (bytes: Uint8Array, order: number[], rotations: Record<number, number>) => {
    const pdfDoc = await PDFDocument.load(bytes);
    
    // 1. Create new doc
    const newPdfDoc = await PDFDocument.create();
    
    // 2. Copy pages in the Virtual Order
    const pages = await newPdfDoc.copyPages(pdfDoc, order);
    
    // 3. Add them to new doc AND apply rotations
    pages.forEach((page, visualIndex) => {
      const rotation = rotations[visualIndex] || 0;
      if (rotation !== 0) {
        page.setRotation(degrees(page.getRotation().angle + rotation));
      }
      newPdfDoc.addPage(page);
    });
    
    return await newPdfDoc.save();
  };

  // VIRTUAL ROTATE (Instant)
  const rotateSelectedPages = (angle: number = 90) => {
    if (selectedPages.size === 0) return;
    
    selectedPages.forEach(visualIndex => {
      const currentRotation = pageRotations[visualIndex] || 0;
      const newRotation = (currentRotation + angle) % 360;
      setPageRotation(visualIndex, newRotation);
    });
  };

  // VIRTUAL REORDER (Instant)
  const reorderPage = (fromIndex: number, toIndex: number) => {
    // 1. Move the Page Order
    const newOrder = [...pageOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setPageOrder(newOrder);

    // 2. Move the Rotation State to match the new position
    // (We must swap the rotation values because the page at index X is now at index Y)
    // For simplicity in this step, we can just save before reordering if rotations exist, 
    // OR we can implement complex rotation swapping. 
    // SIMPLE FIX: If rotations exist, commit them first, THEN reorder.
    if (Object.keys(pageRotations).length > 0) {
       saveChanges().then(() => {
          // Re-fetch order after save reset
          const freshOrder = [...useEditorStore.getState().pageOrder]; 
          const [m] = freshOrder.splice(fromIndex, 1);
          freshOrder.splice(toIndex, 0, m);
          setPageOrder(freshOrder);
       });
       return;
    }
  };

  // SAVE CHANGES (Commit everything to PDF)
  const saveChanges = async () => {
    if (!pdfBytes) return;
    try {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 50));

      const newBytes = await commitPageOrderAndRotations(pdfBytes, pageOrder, pageRotations);
      updatePdfBytes(newBytes, true);
      
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save changes.");
    } finally {
      setIsProcessing(false);
    }
  };

  // For Delete/Insert, we can still do them "Directly" via Save+Action 
  // to keep logic simple, or fully virtualize them. 
  // Let's keep them as "Auto-Save" actions for now to prevent bugs.
  const deleteSelectedPages = async () => {
    if (!pdfBytes || selectedPages.size === 0) return;
    if (confirm(`Delete ${selectedPages.size} selected page(s)?`)) {
       // Save current virtual state first
       await saveChanges();
       // Then delete (using fresh bytes from store)
       // ... (Implementation relies on updated store, might need a tick)
       // To be safe: Combine logic.
       const currentBytes = useEditorStore.getState().pdfBytes!;
       const indices = Array.from(selectedPages);
       const finalBytes = await PdfProcessor.deletePages(currentBytes, indices);
       updatePdfBytes(finalBytes, true);
       deselectAll();
    }
  };

  // ... addBlankPage similar logic ...
  const addBlankPage = async () => {
    await saveChanges();
    const currentBytes = useEditorStore.getState().pdfBytes!;
    const index = activePageIndex + 1;
    const finalBytes = await PdfProcessor.addBlankPage(currentBytes, index);
    updatePdfBytes(finalBytes, true);
  }

  return { 
    rotateSelectedPages, 
    reorderPage, 
    deleteSelectedPages, 
    addBlankPage, 
    saveChanges // Export this for the UI button
  };
};