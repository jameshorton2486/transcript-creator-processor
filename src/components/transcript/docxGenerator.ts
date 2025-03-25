
import { Document, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType, HeadingLevel, BorderStyle } from 'docx';

/**
 * Creates a Word document from the formatted transcript text
 */
export function createWordDocument(formattedText: string, fileName: string = "Transcript"): Document {
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
          ...formattedText.split('\n').map(line => {
            // Apply special styling to speaker labels and Q&A format
            if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
              return new Paragraph({
                style: "Speaker",
                children: [
                  new TextRun({
                    text: line,
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
                    text: line,
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
  
  return doc;
}
