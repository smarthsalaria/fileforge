import { PDFDocument, PageSizes, degrees } from 'pdf-lib';

export const PdfProcessor = {
  // ... existing deletePages, addBlankPage, rotatePages ...
  async deletePages(pdfBytes: Uint8Array, pageIndices: number[]): Promise<Uint8Array> {
    const cleanBytes = new Uint8Array(pdfBytes);
    const pdfDoc = await PDFDocument.load(cleanBytes);
    const sortedIndices = pageIndices.sort((a, b) => b - a);
    sortedIndices.forEach(idx => {
        if (idx >= 0 && idx < pdfDoc.getPageCount()) pdfDoc.removePage(idx);
    });
    return pdfDoc.save();
  },

  async addBlankPage(pdfBytes: Uint8Array, atIndex: number = -1): Promise<Uint8Array> {
    const cleanBytes = new Uint8Array(pdfBytes);
    const pdfDoc = await PDFDocument.load(cleanBytes);
    pdfDoc.insertPage(atIndex === -1 ? pdfDoc.getPageCount() : atIndex, PageSizes.A4);
    return pdfDoc.save();
  },

  async rotatePages(pdfBytes: Uint8Array, pageIndices: number[], angle: number): Promise<Uint8Array> {
    const cleanBytes = new Uint8Array(pdfBytes);
    const pdfDoc = await PDFDocument.load(cleanBytes);
    pageIndices.forEach(idx => {
      if (idx >= 0 && idx < pdfDoc.getPageCount()) {
        const page = pdfDoc.getPage(idx);
        page.setRotation(degrees(page.getRotation().angle + angle));
      }
    });
    return pdfDoc.save();
  },

  // NEW: Reorder Page Function
  async reorderPage(pdfBytes: Uint8Array, fromIndex: number, toIndex: number): Promise<Uint8Array> {
    const cleanBytes = new Uint8Array(pdfBytes);
    const pdfDoc = await PDFDocument.load(cleanBytes);
    const pageCount = pdfDoc.getPageCount();

    if (fromIndex < 0 || fromIndex >= pageCount || toIndex < 0 || toIndex >= pageCount) {
      return pdfBytes;
    }

    const [page] = await pdfDoc.copyPages(pdfDoc, [fromIndex]);
    pdfDoc.removePage(fromIndex);
    pdfDoc.insertPage(toIndex, page);
    
    return pdfDoc.save();
  }
};