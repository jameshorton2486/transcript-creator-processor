
import { HeadingLevel, AlignmentType, BorderStyle } from 'docx';

/**
 * Document styles for the Word document
 */
export const documentStyles = {
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
};

/**
 * Page margins for the document
 */
export const pageMargins = {
  top: 1440, // 1 inch
  right: 1440, // 1 inch
  bottom: 1440, // 1 inch
  left: 1440, // 1 inch
};
