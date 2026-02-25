import { PDFDocument } from 'pdf-lib';

export interface FileWithOrder {
  buffer: Buffer;
  order: number;
  name: string;
}

export async function mergePDFs(files: FileWithOrder[]): Promise<Buffer> {
  // Sort by serial order
  const sorted = files.sort((a, b) => a.order - b.order);

  const mergedPdf = await PDFDocument.create();

  for (const file of sorted) {
    const pdfDoc = await PDFDocument.load(file.buffer);
    const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  return Buffer.from(mergedBytes);
}
