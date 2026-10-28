/**
 * Job Description Generator Component
 * 
 * Implements:
 * - Form to collect job information (title, company, skills, level, responsibilities)
 * - Form validation with field-specific error messages
 * - Integration with backend API via apiService
 * - Loading states and error handling
 * - Preview of generated job description
 * - Copy to clipboard functionality
 * 
 * Step 4 Implementation
 */

import { useState } from 'react';
import api from '../services/apiService';
import './JobGenerator.css';

function JobGenerator() {
  // Form state
  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    required_skills: [{ name: '' }],
    optional_skills: [{ name: '' }],
    experience_level: 'mid',
    responsibilities: '',
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatedJob, setGeneratedJob] = useState(null);
  const [generationMessage, setGenerationMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // ============================================================================
  // Validation Functions
  // ============================================================================

  const validateForm = () => {
    const newErrors = {};

    // Basic fields
    if (!formData.job_title.trim()) newErrors.job_title = 'Job title is required';
    if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';

    // Required skills validation
    if (formData.required_skills.length === 0 || formData.required_skills.every((s) => !s.name.trim())) {
      newErrors.required_skills = 'At least one required skill is needed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // Form Change Handlers
  // ============================================================================

  const handleBasicFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRequiredSkillChange = (index, value) => {
    const newSkills = [...formData.required_skills];
    newSkills[index] = { name: value };
    setFormData((prev) => ({
      ...prev,
      required_skills: newSkills,
    }));
    if (errors.required_skills) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.required_skills;
        return newErrors;
      });
    }
  };

  const addRequiredSkill = () => {
    setFormData((prev) => ({
      ...prev,
      required_skills: [...prev.required_skills, { name: '' }],
    }));
  };

  const removeRequiredSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index),
    }));
  };

  const handleOptionalSkillChange = (index, value) => {
    const newSkills = [...formData.optional_skills];
    newSkills[index] = { name: value };
    setFormData((prev) => ({
      ...prev,
      optional_skills: newSkills,
    }));
  };

  const addOptionalSkill = () => {
    setFormData((prev) => ({
      ...prev,
      optional_skills: [...prev.optional_skills, { name: '' }],
    }));
  };

  const removeOptionalSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      optional_skills: prev.optional_skills.filter((_, i) => i !== index),
    }));
  };

  // ============================================================================
  // Submit Handler
  // ============================================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setGeneratedJob(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Build payload matching backend schema
      const payload = {
        job_title: formData.job_title,
        company_name: formData.company_name,
        required_skills: formData.required_skills
          .filter((s) => s.name.trim())
          .map((s) => s.name),
        optional_skills: formData.optional_skills
          .filter((s) => s.name.trim())
          .map((s) => s.name),
        experience_level: formData.experience_level,
        responsibilities: formData.responsibilities || undefined,
      };

      const response = await api.generateJobDescription(payload);
      setGeneratedJob(response.job_description);
      setGenerationMessage(response.message);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Copy to Clipboard
  // ============================================================================

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedJob);
      setCopySuccess('✓ Copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch {
      setCopySuccess('✗ Failed to copy');
      setTimeout(() => setCopySuccess(''), 3000);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="content-page">
      <div className="job-container">
        {/* Form Section */}
        <div className="form-section">
          <h2>🎯 Job Description Generator</h2>
          <p>Enter job details below to generate a professional job description.</p>

          <form onSubmit={handleSubmit} className="job-form">
            {/* Basic Job Info */}
            <fieldset className="form-fieldset">
              <legend>Job Information</legend>

              <div className="form-group">
                <label htmlFor="job_title">Job Title *</label>
                <input
                  type="text"
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleBasicFieldChange}
                  placeholder="e.g., Senior Software Engineer"
                  maxLength="200"
                />
                {errors.job_title && <span className="error-message">{errors.job_title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="company_name">Company Name *</label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleBasicFieldChange}
                  placeholder="e.g., Tech Corp"
                  maxLength="200"
                />
                {errors.company_name && <span className="error-message">{errors.company_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="experience_level">Experience Level</label>
                <select
                  id="experience_level"
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleBasicFieldChange}
                >
                  <option value="junior">Junior (0-2 years)</option>
                  <option value="mid">Mid-level (3-7 years)</option>
                  <option value="senior">Senior (7+ years)</option>
                </select>
              </div>
            </fieldset>

            {/* Required Skills */}
            <fieldset className="form-fieldset">
              <legend>Required Skills *</legend>
              {errors.required_skills && <span className="error-message">{errors.required_skills}</span>}

              {formData.required_skills.map((skill, index) => (
                <div key={index} className="form-array-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`required_skill_${index}`}>Skill</label>
                      <input
                        type="text"
                        id={`required_skill_${index}`}
                        value={skill.name}
                        onChange={(e) => handleRequiredSkillChange(index, e.target.value)}
                        placeholder="e.g., Python"
                        maxLength="100"
                      />
                    </div>
                    {formData.required_skills.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeRequiredSkill(index)}
                        title="Remove skill"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" className="btn-add" onClick={addRequiredSkill}>
                + Add Required Skill
              </button>
            </fieldset>

            {/* Optional Skills */}
            <fieldset className="form-fieldset">
              <legend>Optional Skills</legend>

              {formData.optional_skills.map((skill, index) => (
                <div key={index} className="form-array-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`optional_skill_${index}`}>Skill</label>
                      <input
                        type="text"
                        id={`optional_skill_${index}`}
                        value={skill.name}
                        onChange={(e) => handleOptionalSkillChange(index, e.target.value)}
                        placeholder="e.g., Kubernetes"
                        maxLength="100"
                      />
                    </div>
                    {formData.optional_skills.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeOptionalSkill(index)}
                        title="Remove skill"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" className="btn-add" onClick={addOptionalSkill}>
                + Add Optional Skill
              </button>
            </fieldset>

            {/* Responsibilities */}
            <fieldset className="form-fieldset">
              <legend>Responsibilities (Optional)</legend>

              <div className="form-group">
                <label htmlFor="responsibilities">Job Responsibilities</label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleBasicFieldChange}
                  placeholder="Describe key responsibilities, e.g., lead development, mentor junior developers, etc. (optional)"
                  maxLength="1000"
                  rows="4"
                />
                <span className="char-count">{formData.responsibilities.length}/1000</span>
              </div>
            </fieldset>

            {/* Error Message */}
            {apiError && <div className="api-error">{apiError}</div>}

            {/* Submit Button */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Generating Job Description...' : '✨ Generate Job Description'}
            </button>
          </form>
        </div>

        {/* Preview Section */}
        {generatedJob && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>✓ Job Description Generated</h3>
              <p className="generation-message">{generationMessage}</p>
            </div>

            <div className="preview-content">
              <pre className="job-text">{generatedJob}</pre>
            </div>

            <div className="preview-actions">
              <button onClick={copyToClipboard} className="btn-copy">
                📋 Copy to Clipboard
              </button>
              {copySuccess && <span className="copy-feedback">{copySuccess}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobGenerator;
