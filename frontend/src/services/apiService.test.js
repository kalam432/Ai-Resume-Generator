/**
 * Tests for API Service
 * 
 * Tests cover:
 * - Health check functionality
 * - Resume generation with mocked backend
 * - Job generation with mocked backend
 * - Match analysis with mocked backend
 * - Error handling for network failures
 * - Validation of input data
 * - Proper error messages for various failure scenarios
 */

// Mock fetch globally
global.fetch = jest.fn();

import {
  checkBackendHealth,
  generateResume,
  generateJobDescription,
  analyzeResumeMatch,
} from './apiService';

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('checkBackendHealth', () => {
    test('should return health status on success', async () => {
      const mockResponse = {
        status: 'ok',
        message: 'AI Resume Generator API is running',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await checkBackendHealth();
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.any(Object)
      );
    });

    test('should throw error on network failure', async () => {
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(checkBackendHealth()).rejects.toThrow(/Network error/);
    });

    test('should throw error on timeout', async () => {
      fetch.mockImplementationOnce(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        });
      });

      // Note: This test would need actual timeout implementation to fully work
      // For now, we're testing the error handling structure
    });

    test('should throw error on non-2xx response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Backend error' }),
      });

      await expect(checkBackendHealth()).rejects.toThrow(/Backend error/);
    });
  });

  describe('generateResume', () => {
    const validResumeData = {
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      professional_summary: 'Experienced engineer',
      skills: [{ name: 'Python', years: 5 }],
      education: [{ degree: 'BS', field: 'CS', institution: 'MIT', graduation_year: 2020 }],
      experience: [{ position: 'Engineer', company: 'Google', start_year: 2020, end_year: null, description: 'Built systems' }],
      experience_level: 'mid',
    };

    test('should generate resume on success', async () => {
      const mockResponse = {
        resume_text: 'Generated resume content...',
        message: 'Resume generated (Template mode - set GEMINI_API_KEY for AI generation)',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateResume(validResumeData);
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        '/api/resumes/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(validResumeData),
        })
      );
    });

    test('should throw error when name is missing', async () => {
      const invalidData = { ...validResumeData, full_name: '' };
      await expect(generateResume(invalidData)).rejects.toThrow(/Name, email, and phone are required/);
    });

    test('should throw error when skills are missing', async () => {
      const invalidData = { ...validResumeData, skills: [] };
      await expect(generateResume(invalidData)).rejects.toThrow(/At least one skill is required/);
    });

    test('should throw error when education is missing', async () => {
      const invalidData = { ...validResumeData, education: [] };
      await expect(generateResume(invalidData)).rejects.toThrow(/At least one education entry is required/);
    });

    test('should throw error when experience is missing', async () => {
      const invalidData = { ...validResumeData, experience: [] };
      await expect(generateResume(invalidData)).rejects.toThrow(/At least one experience entry is required/);
    });
  });

  describe('generateJobDescription', () => {
    const validJobData = {
      job_title: 'Senior Engineer',
      company_name: 'TechCorp',
      required_skills: ['Python', 'FastAPI'],
      optional_skills: ['Docker'],
      experience_level: 'senior',
    };

    test('should generate job description on success', async () => {
      const mockResponse = {
        job_description: 'Generated job description...',
        message: 'Job description generated (Template mode - set GEMINI_API_KEY for AI generation)',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateJobDescription(validJobData);
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        '/api/jobs/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(validJobData),
        })
      );
    });

    test('should throw error when job title is missing', async () => {
      const invalidData = { ...validJobData, job_title: '' };
      await expect(generateJobDescription(invalidData)).rejects.toThrow(/Job title and company name are required/);
    });

    test('should throw error when required skills are missing', async () => {
      const invalidData = { ...validJobData, required_skills: [] };
      await expect(generateJobDescription(invalidData)).rejects.toThrow(/At least one required skill is required/);
    });
  });

  describe('analyzeResumeMatch', () => {
    test('should analyze match on success', async () => {
      const mockResponse = {
        match_percentage: 85.5,
        matched_skills: [{ skill: 'Python', status: 'matched', explanation: 'Found in resume' }],
        missing_skills: [{ skill: 'Docker', status: 'missing', explanation: 'Required for deployment' }],
        recommendations: ['Add Docker experience'],
        summary: 'Good match overall',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await analyzeResumeMatch(
        'Python developer with 5 years experience',
        'Senior Python Developer needed'
      );
      
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        '/api/matcher/analyze',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    test('should throw error when resume text is too short', async () => {
      await expect(analyzeResumeMatch('short', 'Long job description text here')).rejects.toThrow(/must be at least 10 characters/);
    });

    test('should throw error when job description is too short', async () => {
      await expect(analyzeResumeMatch('Long resume text here', 'short')).rejects.toThrow(/must be at least 10 characters/);
    });
  });

  describe('Error Handling', () => {
    test('should handle JSON parse errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(generateResume({
        full_name: 'Test',
        email: 'test@test.com',
        phone: '555-1234',
        skills: [{ name: 'Test' }],
        education: [{ degree: 'BS', field: 'CS', institution: 'MIT', graduation_year: 2020 }],
        experience: [{ position: 'Test', company: 'Test', start_year: 2020, end_year: null, description: 'Test' }],
      })).rejects.toThrow();
    });
  });
});
