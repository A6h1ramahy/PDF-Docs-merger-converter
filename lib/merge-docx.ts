// DOCX merger using PizZip + manual XML manipulation
// docx-merger merges multiple DOCX files by combining their body XML elements

import PizZip from 'pizzip';

export interface FileWithOrder {
  buffer: Buffer;
  order: number;
  name: string;
}

function extractBodyContent(xml: string): string {
  // Extract content inside <w:body> ... </w:body>, excluding sectPr
  const bodyMatch = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
  if (!bodyMatch) return '';
  let body = bodyMatch[1];
  // Remove the final section properties to avoid conflicts
  body = body.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
  return body;
}

function getLastSectPr(xml: string): string {
  const matches = xml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/g);
  if (!matches || matches.length === 0) return '';
  return matches[matches.length - 1];
}

export async function mergeDOCXFiles(files: FileWithOrder[]): Promise<Buffer> {
  const sorted = files.sort((a, b) => a.order - b.order);

  if (sorted.length === 0) throw new Error('No files to merge');
  if (sorted.length === 1) return sorted[0].buffer;

  // Use first file as base
  const baseZip = new PizZip(sorted[0].buffer);
  let baseDocXml = baseZip.files['word/document.xml'].asText();
  let combinedBody = extractBodyContent(baseDocXml);

  // Append subsequent files' body content
  for (let i = 1; i < sorted.length; i++) {
    const zip = new PizZip(sorted[i].buffer);
    const docXml = zip.files['word/document.xml'].asText();
    // Add a page break between documents
    const pageBreak = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    combinedBody += pageBreak + extractBodyContent(docXml);
  }

  // Get section properties from last file for final document
  const lastZip = new PizZip(sorted[sorted.length - 1].buffer);
  const lastDocXml = lastZip.files['word/document.xml'].asText();
  const finalSectPr = getLastSectPr(lastDocXml);

  // Rebuild document XML
  const newBodyXml = `<w:body>${combinedBody}${finalSectPr}</w:body>`;
  baseDocXml = baseDocXml.replace(/<w:body>[\s\S]*?<\/w:body>/, newBodyXml);

  // Write back
  baseZip.file('word/document.xml', baseDocXml);

  const result = baseZip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  return result;
}
