
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, SectionType } from 'docx';

/**
 * Formats raw transcript text for Word document to improve readability
 */
export const formatTranscriptForWord = (text: string): string => {
  // Replace multiple consecutive newlines with just two
  let formatted = text.replace(/\n{3,}/g, '\n\n');
  
  // Add proper spacing around speaker labels for better document formatting
  formatted = formatted.replace(/^(Speaker \d+:|[A-Z][A-Z\s']+:)(.+)/gm, '$1\n$2');
  
  // Ensure proper spacing between paragraphs
  formatted = formatted.replace(/\n{2,}/g, '\n\n');
  
  return formatted;
};

/**
 * Creates a Word document from transcript text
 */
export const createWordDocument = (transcriptText: string, documentTitle: string): Document => {
  // Format the transcript for better readability in Word
  const formattedText = formatTranscriptForWord(transcriptText);
  
  // Create document with proper metadata
  const doc = new Document({
    title: documentTitle || 'Transcript',
    description: 'Automatically generated transcript document',
    sections: [{
      properties: {
        type: SectionType.CONTINUOUS
      },
      children: [
        // Document title
        new Paragraph({
          text: documentTitle || 'Audio Transcript',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400
          }
        }),
        
        // Timestamp header
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on: ${new Date().toLocaleString()}`,
              italics: true,
              size: 20
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 800
          }
        }),
        
        // Process each line of the transcript
        ...formattedText.split('\n').map(line => {
          // Check if this is a speaker label or header
          if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
            return new Paragraph({
              text: line,
              spacing: { before: 400, after: 200 },
              bold: true
            });
          } 
          // Check if it's a Q&A format
          else if (/^(Q|A):/.test(line)) {
            return new Paragraph({
              text: line,
              spacing: { before: 240, after: 120 },
              bold: true
            });
          }
          // Regular paragraph
          else if (line.trim()) {
            return new Paragraph({
              text: line,
              spacing: { before: 120, after: 120 },
              indent: { left: 720 } // Indent regular paragraphs
            });
          } 
          // Empty lines
          else {
            return new Paragraph({ text: '' });
          }
        })
      ]
    }]
  });
  
  return doc;
};
