
import { Document, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType, HeadingLevel } from 'docx';
import { documentStyles, pageMargins } from './styles';
import { isSpeakerLabel, isQAFormat } from './formatters';

/**
 * Creates a paragraph with the appropriate styling based on the line content
 */
function createParagraphFromLine(line: string): Paragraph {
  // Apply special styling to speaker labels and Q&A format
  if (isSpeakerLabel(line)) {
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
  else if (isQAFormat(line)) {
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
}

/**
 * Creates a Header for the document
 */
function createHeader(fileName: string): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: fileName,
            size: 18, // 9pt
            font: "Times New Roman",
            color: "888888",
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates a Footer with page numbers
 */
function createFooter(): Footer {
  return new Footer({
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
  });
}

/**
 * Creates a Word document from the transcript text with improved reliability
 */
export function createWordDocument(transcriptText: string, fileName: string = "Transcript"): Document {
  console.log("[DOCX] Creating Word document:", {
    textLength: transcriptText?.length || 0,
    fileName,
    textSample: transcriptText ? transcriptText.substring(0, 100) + "..." : "none",
  });
  
  // Ensure we have valid text
  const safeText = transcriptText && transcriptText.trim().length > 0 
    ? transcriptText 
    : "No transcript content available.";
  
  // Process all lines in the transcript
  const paragraphs = safeText.split('\n').map(line => createParagraphFromLine(line));
  
  // Create a title paragraph
  const titleParagraph = new Paragraph({
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
  });
  
  // Create a new document with proper formatting
  const doc = new Document({
    styles: documentStyles,
    sections: [
      {
        properties: {
          page: {
            margin: pageMargins,
          },
        },
        headers: {
          default: createHeader(fileName),
        },
        footers: {
          default: createFooter(),
        },
        children: [
          titleParagraph,
          ...paragraphs
        ],
      },
    ],
  });
  
  console.log("[DOCX] Word document created successfully");
  return doc;
}
