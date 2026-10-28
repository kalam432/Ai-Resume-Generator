/**
 * Centralized API Service for AI Resume Generator Frontend
 * 
 * Handles all HTTP communication with the backend:
 * - Resume generation
 * - Job description generation
 * - Resume-job matching analysis
 * - Health check
 * 
 * All API paths use the Vite proxy configuration (/api/* -> localhost:8000/api/*)
 * Health check uses direct URL (outside proxy)
 * 
 * Error handling is consistent across all methods with user-friendly messages.
 */

const API_BASE_URL = '/api';
const BACKEND_URL = 'http://localhost:8000';
const HEALTH_CHECK_TIMEOUT = 5000;
const API_TIMEOUT = 30000;

/**
 * Make an HTTP request with timeout and error handling
 * 
 * @param {string} url - The URL to request
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<object>} - Parsed response data
 * @throws {Error} - User-friendly error message
 */
async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-2xx status codes
    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      
      try {
        const errorData = await response.json();
        // Backend returns error details in "detail" field
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Parse response JSON
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort (timeout)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - backend may be slow or unreachable');
    }
    
    // Handle network errors
    if (error instanceof TypeError) {
      throw new Error('Network error - unable to reach backend. Is it running on localhost:8000?');
    }
    
    // Re-throw other errors with their messages
    throw error;
  }
}

/**
 * Check if the backend is running and healthy
 * 
 * @returns {Promise<object>} - { status: "ok", message: "..." }
 * @throws {Error} - Network or backend error
 */
export async function checkBackendHealth() {
  try {
    const response = await fetchWithTimeout(
      `${BACKEND_URL}/health`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      HEALTH_CHECK_TIMEOUT
    );
    return response;
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
}

/**
 * Generate a professional resume
 * 
 * @param {object} resumeData - Resume information
 * @param {string} resumeData.full_name - Candidate's full name
 * @param {string} resumeData.email - Email address
 * @param {string} resumeData.phone - Phone number
 * @param {string} [resumeData.professional_summary] - Optional professional summary
 * @param {array} resumeData.skills - Array of skill objects: { name, years }
 * @param {array} resumeData.education - Array of education objects: { degree, field, institution, graduation_year }
 * @param {array} resumeData.experience - Array of experience objects: { position, company, start_year, end_year, description }
 * @param {string} [resumeData.experience_level='mid'] - 'junior', 'mid', or 'senior'
 * 
 * @returns {Promise<object>} - { resume_text: "...", message: "..." }
 * @throws {Error} - Validation or backend error
 */
export async function generateResume(resumeData) {
  try {
    // Validate required fields
    if (!resumeData.full_name || !resumeData.email || !resumeData.phone) {
      throw new Error('Name, email, and phone are required');
    }
    
    if (!Array.isArray(resumeData.skills) || resumeData.skills.length === 0) {
      throw new Error('At least one skill is required');
    }
    
    if (!Array.isArray(resumeData.education) || resumeData.education.length === 0) {
      throw new Error('At least one education entry is required');
    }
    
    if (!Array.isArray(resumeData.experience) || resumeData.experience.length === 0) {
      throw new Error('At least one experience entry is required');
    }

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/resumes/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      },
      API_TIMEOUT
    );

    return response;
  } catch (error) {
    throw new Error(`Resume generation failed: ${error.message}`);
  }
}

/**
 * Generate a professional job description
 * 
 * @param {object} jobData - Job information
 * @param {string} jobData.job_title - Job title
 * @param {string} jobData.company_name - Company name
 * @param {array} jobData.required_skills - Array of required skill strings
 * @param {array} [jobData.optional_skills] - Array of optional skill strings
 * @param {string} [jobData.experience_level='mid'] - 'junior', 'mid', or 'senior'
 * @param {string} [jobData.responsibilities] - Optional job responsibilities
 * 
 * @returns {Promise<object>} - { job_description: "...", message: "..." }
 * @throws {Error} - Validation or backend error
 */
export async function generateJobDescription(jobData) {
  try {
    // Validate required fields
    if (!jobData.job_title || !jobData.company_name) {
      throw new Error('Job title and company name are required');
    }
    
    if (!Array.isArray(jobData.required_skills) || jobData.required_skills.length === 0) {
      throw new Error('At least one required skill is required');
    }

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/jobs/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      },
      API_TIMEOUT
    );

    return response;
  } catch (error) {
    throw new Error(`Job generation failed: ${error.message}`);
  }
}

/**
 * Analyze how well a resume matches a job description
 * 
 * @param {string} resumeText - Resume content (plain text)
 * @param {string} jobDescription - Job description content (plain text)
 * 
 * @returns {Promise<object>} - {
 *   match_percentage: number,
 *   matched_skills: [ { skill, status, explanation }, ... ],
 *   missing_skills: [ { skill, status, explanation }, ... ],
 *   recommendations: [ "...", ... ],
 *   summary: "..."
 * }
 * @throws {Error} - Validation or backend error
 */
export async function analyzeResumeMatch(resumeText, jobDescription) {
  try {
    // Validate required fields
    if (!resumeText || resumeText.trim().length < 10) {
      throw new Error('Resume text must be at least 10 characters long');
    }
    
    if (!jobDescription || jobDescription.trim().length < 10) {
      throw new Error('Job description must be at least 10 characters long');
    }

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/matcher/analyze`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      },
      API_TIMEOUT
    );

    return response;
  } catch (error) {
    throw new Error(`Match analysis failed: ${error.message}`);
  }
}

export default {
  checkBackendHealth,
  generateResume,
  generateJobDescription,
  analyzeResumeMatch,
};
