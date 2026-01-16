import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const natural = require('natural');

class KeywordExtractor {
  constructor() {
    this.tfidf = new natural.TfIdf();
    this.commonSkills = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js',
      'express', 'mongodb', 'sql', 'postgresql', 'mysql', 'aws', 'azure',
      'docker', 'kubernetes', 'git', 'agile', 'scrum', 'rest api', 'graphql',
      'typescript', 'html', 'css', 'sass', 'webpack', 'ci/cd', 'devops',
      'machine learning', 'data analysis', 'pandas', 'tensorflow', 'pytorch',
      'leadership', 'management', 'communication', 'teamwork', 'problem solving',
      'spring boot', 'django', 'flask', 'redis', 'elasticsearch', 'jenkins',
      'terraform', 'ansible', 'microservices', 'api design', 'rest', 'oauth'
    ];
  }

  extractKeywords(text) {
    const textLower = text.toLowerCase();
    const foundKeywords = [];

    this.commonSkills.forEach(skill => {
      if (textLower.includes(skill.toLowerCase())) {
        foundKeywords.push(skill);
      }
    });

    return [...new Set(foundKeywords)];
  }

  compareWithJobDescription(resumeText, jobDescription) {
    if (!jobDescription) {
      return { matchedKeywords: [], missingKeywords: [], matchPercentage: 0 };
    }

    const resumeKeywords = this.extractKeywords(resumeText);
    const jobKeywords = this.extractKeywords(jobDescription);

    const matchedKeywords = resumeKeywords.filter(keyword => 
      jobKeywords.includes(keyword)
    );

    const missingKeywords = jobKeywords.filter(keyword => 
      !resumeKeywords.includes(keyword)
    );

    const matchPercentage = jobKeywords.length > 0 
      ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
      : 0;

    return {
      matchedKeywords,
      missingKeywords,
      matchPercentage,
      totalJobKeywords: jobKeywords.length,
      totalResumeKeywords: resumeKeywords.length
    };
  }
}

export default new KeywordExtractor();