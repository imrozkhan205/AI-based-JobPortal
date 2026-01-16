class SectionDetector {
    detectSections(text) {
      const textLower = text.toLowerCase();
      
      const sections = {
        contact: this.hasContact(text),
        summary: this.hasSection(textLower, ['summary', 'objective', 'profile', 'about me']),
        experience: this.hasSection(textLower, ['experience', 'work history', 'employment', 'work experience']),
        education: this.hasSection(textLower, ['education', 'academic', 'qualification']),
        skills: this.hasSection(textLower, ['skills', 'technical skills', 'competencies', 'expertise']),
        certifications: this.hasSection(textLower, ['certification', 'certificate', 'license'])
      };
  
      return sections;
    }
  
    hasSection(text, keywords) {
      return keywords.some(keyword => text.includes(keyword));
    }
  
    hasContact(text) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
      
      return emailRegex.test(text) || phoneRegex.test(text);
    }
  
    extractContactInfo(text) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  
      return {
        emails: text.match(emailRegex) || [],
        phones: text.match(phoneRegex) || [],
        linkedin: text.match(linkedinRegex) || []
      };
    }
  }
  
  export default new SectionDetector();