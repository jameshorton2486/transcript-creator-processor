
import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

export function createWordDocument(transcriptText: string, title: string): Document {
  // Create basic document properties
  const documentProps = {
    title: title || 'Transcript',
    description: 'Automatically generated transcript document',
    creator: 'Legal Transcript Processor',
  };

  // Simple formatting for the transcript
  const formattedParagraphs = transcriptText
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      // Check if this line starts with a speaker label
      const speakerMatch = line.match(/^(Speaker \d+|[A-Z][a-z]+ [A-Z][a-z]+):/);
      
      if (speakerMatch) {
        // This is a speaker line
        const [fullMatch, speaker] = speakerMatch;
        const content = line.substring(fullMatch.length).trim();
        
        return new Paragraph({
          children: [
            new TextRun({
              text: `${speaker}: `,
              bold: true,
            }),
            new TextRun({
              text: content,
            }),
          ],
          spacing: {
            after: 200,
          },
        });
      } else {
        // Regular paragraph
        return new Paragraph({
          text: line,
          spacing: {
            after: 200,
          },
        });
      }
    });

  // Create the title for the document
  const titleParagraph = new Paragraph({
    text: title || 'Transcript',
    heading: HeadingLevel.TITLE,
    spacing: {
      after: 400,
    },
  });

  // Create timestamp information
  const timestampParagraph = new Paragraph({
    children: [
      new TextRun({
        text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        italics: true,
      }),
    ],
    spacing: {
      after: 800,
    },
  });

  // Create a document with the paragraphs
  const doc = new Document({
    features: {
      updateFields: true,
    },
    title: documentProps.title,
    description: documentProps.description,
    creator: documentProps.creator,
    sections: [
      {
        properties: {},
        children: [
          titleParagraph,
          timestampParagraph,
          ...formattedParagraphs,
        ],
      },
    ],
  });

  return doc;
}
