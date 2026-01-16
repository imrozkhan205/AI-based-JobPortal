import { promises as fs } from 'fs';
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';

class ResumeParser {
  constructor() {
    this.pdfExtract = new PDFExtract();
  }

  async extractText(filePath, fileType) {
    try {
      if (fileType === 'application/pdf') {
        return await this.parsePDF(filePath);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.parseDOCX(filePath);
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (error) {
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  async parsePDF(filePath) {
    try {
      const data = await this.pdfExtract.extract(filePath, {});
      
      // Extract text from all pages
      let text = '';
      data.pages.forEach(page => {
        page.content.forEach(item => {
          if (item.str) {
            text += item.str + ' ';
          }
        });
      });
      
      return {
        text: text,
        numPages: data.pages.length,
        metadata: data.meta
      };
    } catch (error) {
      console.error('PDF Parse Error:', error);
      throw error;
    }
  }

  async parseDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return {
        text: result.value,
        messages: result.messages
      };
    } catch (error) {
      console.error('DOCX Parse Error:', error);
      throw error;
    }
  }

  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
}

export default new ResumeParser();