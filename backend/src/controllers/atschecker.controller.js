import resumeParser from '../services/resumeParser.js';
import sectionDetector from '../services/sectionDetector.js';
import keywordExtractor from '../services/keywordExtractor.js';
import atsScorer from '../services/atsScorer.js';
import recommendationEngine from '../services/recommendationEngine.js';
import { promises as fs } from 'fs';

class ATSCheckerController {
  async checkResume(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { jobDescription } = req.body;
      const filePath = req.file.path;
      const fileType = req.file.mimetype;

      const parseResult = await resumeParser.extractText(filePath, fileType);
      const cleanText = resumeParser.cleanText(parseResult.text);

      const sections = sectionDetector.detectSections(cleanText);
      const contactInfo = sectionDetector.extractContactInfo(cleanText);
      const keywords = keywordExtractor.extractKeywords(cleanText);

      let jobComparison = null;
      if (jobDescription) {
        jobComparison = keywordExtractor.compareWithJobDescription(cleanText, jobDescription);
      }

      const formatCheck = {
        parseable: cleanText.length > 50,
        wordCount: cleanText.split(/\s+/).length
      };

      const analysisData = {
        sections,
        keywords,
        contactInfo,
        formatCheck,
        jobComparison
      };

      const scoreResult = atsScorer.calculateScore(analysisData);
      const recommendations = recommendationEngine.generateRecommendations(
        analysisData,
        scoreResult.breakdown
      );

      await fs.unlink(filePath);

      return res.json({
        success: true,
        results: {
          score: scoreResult.overallScore,
          grade: scoreResult.grade,
          breakdown: scoreResult.breakdown,
          sections,
          contactInfo,
          keywords,
          keywordCount: keywords.length,
          jobComparison,
          recommendations,
          fileName: req.file.originalname,
          analyzedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('ATS Check Error:', error);
      console.error('Error stack:', error.stack);
      
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to analyze resume',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

export default new ATSCheckerController();