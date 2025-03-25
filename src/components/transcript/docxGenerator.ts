
import { Document, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType, HeadingLevel, BorderStyle } from 'docx';

/**
 * Creates a Word document from the transcript text with improved reliability
 */
export function createWordDocument(transcriptText: string, fileName: string = "Transcript"): Document {
  console.log("Creating Word document:", {
    textLength: transcriptText?.length,
    fileName,
    textSample: transcriptText?.substring(0, 100),
  });
  
  // Ensure we have valid text
  const safeText = transcriptText || "No transcript content available.";
  
  // Create a new document with proper formatting
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 24, // 12pt
            font: "Times New Roman",
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
            },
          },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 32, // 16pt
            bold: true,
            font: "Times New Roman",
          },
          paragraph: {
            spacing: {
              before: 240, // 12pt before
              after: 120, // 6pt after
            },
            alignment: AlignmentType.CENTER,
          },
        },
        {
          id: "Speaker",
          name: "Speaker",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            bold: true,
            font: "Times New Roman",
          },
          paragraph: {
            spacing: {
              before: 400, // 20pt before
              after: 60, // 3pt after
            },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440, // 1 inch
              bottom: 1440, // 1 inch
              left: 1440, // 1 inch
            },
            borders: {
              pageBorderTop: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "F0F0F0",
              },
              pageBorderRight: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "F0F0F0",
              },
              pageBorderBottom: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "F0F0F0",
              },
              pageBorderLeft: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "F0F0F0",
              },
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${fileName}`,
                    size: 18, // 9pt
                    font: "Times New Roman",
                    color: "888888",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Page ",
                    size: 18, // 9pt
                    font: "Times New Roman",
                    color: "888888",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18, // 9pt
                    font: "Times New Roman",
                    color: "888888",
                  }),
                  new TextRun({
                    text: " of ",
                    size: 18, // 9pt
                    font: "Times New Roman",
                    color: "888888",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18, // 9pt
                    font: "Times New Roman",
                    color: "888888",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Document title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: fileName || "Transcript",
                bold: true,
                size: 32, // 16pt
              }),
            ],
            spacing: {
              after: 400, // 20pt after
            },
            alignment: AlignmentType.CENTER,
          }),
          
          // Process all lines in the transcript with proper formatting
          ...safeText.split('\n').map(line => {
            // Apply special styling to speaker labels and Q&A format
            if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
              return new Paragraph({
                style: "Speaker",
                children: [
                  new TextRun({
                    text: line || " ",
                    bold: true,
                  }),
                ],
                spacing: {
                  before: 400,
                },
              });
            } 
            else if (/^(Q|A):/.test(line)) {
              return new Paragraph({
                style: "Speaker",
                children: [
                  new TextRun({
                    text: line || " ",
                    bold: true,
                  }),
                ],
                spacing: {
                  before: 300,
                },
              });
            } 
            // Regular text
            else {
              return new Paragraph({
                style: "Normal",
                children: [
                  new TextRun({
                    text: line || " ", // Ensure at least a space for empty lines
                  }),
                ],
                spacing: {
                  before: 100,
                },
                indent: {
                  left: line.trim() ? 720 : 0, // Indent text paragraphs (not empty lines)
                },
              });
            }
          }),
        ],
      },
    ],
  });
  
  console.log("Word document created successfully");
  return doc;
}

/**
 * Apply basic formatting to transcript text to improve readability in Word document
 */
export function formatTranscriptForWord(text: string): string {
  if (!text) return "No transcript content available.";
  
  // Apply special formatting to speaker labels
  return text
    // Style standard speaker format (Speaker 1:)
    .replace(/^(Speaker \d+:)/gm, match => `\n${match}`)
    
    // Style legal transcript format (THE COURT:, WITNESS:, etc.)
    .replace(/^([A-Z][A-Z\s']+:)/gm, match => `\n${match}`)
    
    // Style Q&A format
    .replace(/^(Q|A):\s/gm, match => `\n${match}`)
    
    // Ensure proper spacing after speaker changes
    .replace(/(Speaker \d+:|[A-Z][A-Z\s']+:)(\s*)/g, '$1\n    ')
    
    // Clean up any excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    
    // Make sure speaker labels are properly formatted with new lines
    .replace(/\n(Speaker \d+:|[A-Z][A-Z\s']+:)/g, '\n\n$1');
}
