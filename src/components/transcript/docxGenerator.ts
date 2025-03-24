
import { Document, Paragraph, TextRun } from 'docx';

/**
 * Creates a Word document from the formatted transcript text
 */
export function createWordDocument(formattedText: string): Document {
  // Create a new document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: formattedText.split('\n').map(line => {
          // Apply special styling to speaker labels and Q&A format
          if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
            return new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: true,
                }),
              ],
              spacing: {
                before: 400,
              }
            });
          } 
          else if (/^(Q|A):/.test(line)) {
            return new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: true,
                }),
              ],
              spacing: {
                before: 300,
              }
            });
          } 
          // Regular text
          else {
            return new Paragraph({
              children: [
                new TextRun({
                  text: line || " ", // Ensure at least a space for empty lines
                }),
              ],
              spacing: {
                before: 100,
              }
            });
          }
        }),
      },
    ],
  });
  
  return doc;
}
