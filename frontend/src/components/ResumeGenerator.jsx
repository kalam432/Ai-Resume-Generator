/**
 * Resume Generator Component
 * 
 * Implements:
 * - Form to collect resume information (name, email, phone, skills, education, experience, summary)
 * - Form validation with field-specific error messages
 * - Integration with backend API via apiService
 * - Loading states and error handling
 * - Preview of generated resume
 * - Copy to clipboard functionality
 * 
 * Step 3 Implementation
 */

import { useState } from 'react';
import api from '../services/apiService';
import './ResumeGenerator.css';

function ResumeGenerator() {
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    professional_summary: '',
    skills: [{ name: '', years: '' }],
    education: [{ degree: '', field: '', institution: '', graduation_year: new Date().getFullYear() }],
    experience: [{ position: '', company: '', start_year: new Date().getFullYear(), end_year: '', description: '' }],
    experience_level: 'mid',
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [generationMessage, setGenerationMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // ============================================================================
  // Validation Functions
  // ============================================================================

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic fields
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    // Skills validation
    if (formData.skills.length === 0 || formData.skills.every((s) => !s.name.trim())) {
      newErrors.skills = 'At least one skill is required';
    }

    // Education validation
    if (formData.education.length === 0 || formData.education.every((e) => !e.degree.trim())) {
      newErrors.education = 'At least one education entry is required';
    }

    // Experience validation
    if (formData.experience.length === 0 || formData.experience.every((ex) => !ex.position.trim())) {
      newErrors.experience = 'At least one experience entry is required';
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

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...formData.skills];
    newSkills[index] = {
      ...newSkills[index],
      [field]: field === 'years' ? (value === '' ? '' : parseFloat(value) || '') : value,
    };
    setFormData((prev) => ({
      ...prev,
      skills: newSkills,
    }));
    if (errors.skills) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.skills;
        return newErrors;
      });
    }
  };

  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: '', years: '' }],
    }));
  };

  const removeSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleEducationChange = (index, field, value) => {
    const newEducation = [...formData.education];
    newEducation[index] = {
      ...newEducation[index],
      [field]: field === 'graduation_year' ? parseInt(value) : value,
    };
    setFormData((prev) => ({
      ...prev,
      education: newEducation,
    }));
    if (errors.education) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.education;
        return newErrors;
      });
    }
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', field: '', institution: '', graduation_year: new Date().getFullYear() },
      ],
    }));
  };

  const removeEducation = (index) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...formData.experience];
    newExperience[index] = {
      ...newExperience[index],
      [field]: ['start_year', 'end_year'].includes(field) ? (value === '' ? '' : parseInt(value)) : value,
    };
    setFormData((prev) => ({
      ...prev,
      experience: newExperience,
    }));
    if (errors.experience) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.experience;
        return newErrors;
      });
    }
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { position: '', company: '', start_year: new Date().getFullYear(), end_year: '', description: '' },
      ],
    }));
  };

  const removeExperience = (index) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  // ============================================================================
  // Submit Handler
  // ============================================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setGeneratedResume(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Build payload matching backend schema
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        professional_summary: formData.professional_summary || undefined,
        skills: formData.skills
          .filter((s) => s.name.trim())
          .map((s) => ({
            name: s.name,
            years: s.years === '' ? undefined : s.years,
          })),
        education: formData.education
          .filter((e) => e.degree.trim())
          .map((e) => ({
            degree: e.degree,
            field: e.field,
            institution: e.institution,
            graduation_year: e.graduation_year,
          })),
        experience: formData.experience
          .filter((ex) => ex.position.trim())
          .map((ex) => ({
            position: ex.position,
            company: ex.company,
            start_year: ex.start_year,
            end_year: ex.end_year === '' ? null : ex.end_year,
            description: ex.description,
          })),
        experience_level: formData.experience_level,
      };

      const response = await api.generateResume(payload);
      setGeneratedResume(response.resume_text);
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
      await navigator.clipboard.writeText(generatedResume);
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
      <div className="resume-container">
        {/* Form Section */}
        <div className="form-section">
          <h2>📄 Resume Generator</h2>
          <p>Enter your information below to generate a professional resume.</p>

          <form onSubmit={handleSubmit} className="resume-form">
            {/* Basic Info */}
            <fieldset className="form-fieldset">
              <legend>Personal Information</legend>

              <div className="form-group">
                <label htmlFor="full_name">Full Name *</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleBasicFieldChange}
                  placeholder="John Doe"
                  maxLength="200"
                />
                {errors.full_name && <span className="error-message">{errors.full_name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleBasicFieldChange}
                    placeholder="john@example.com"
                    maxLength="200"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleBasicFieldChange}
                    placeholder="555-1234"
                    maxLength="20"
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="professional_summary">Professional Summary</label>
                <textarea
                  id="professional_summary"
                  name="professional_summary"
                  value={formData.professional_summary}
                  onChange={handleBasicFieldChange}
                  placeholder="Brief overview of your professional background and career goals (optional)"
                  maxLength="500"
                  rows="3"
                />
                <span className="char-count">{formData.professional_summary.length}/500</span>
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

            {/* Skills */}
            <fieldset className="form-fieldset">
              <legend>Skills *</legend>
              {errors.skills && <span className="error-message">{errors.skills}</span>}

              {formData.skills.map((skill, index) => (
                <div key={index} className="form-array-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`skill_name_${index}`}>Skill Name</label>
                      <input
                        type="text"
                        id={`skill_name_${index}`}
                        value={skill.name}
                        onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                        placeholder="e.g., Python"
                        maxLength="100"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`skill_years_${index}`}>Years (optional)</label>
                      <input
                        type="number"
                        id={`skill_years_${index}`}
                        value={skill.years}
                        onChange={(e) => handleSkillChange(index, 'years', e.target.value)}
                        placeholder="5"
                        min="0"
                        max="60"
                      />
                    </div>
                    {formData.skills.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeSkill(index)}
                        title="Remove skill"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" className="btn-add" onClick={addSkill}>
                + Add Skill
              </button>
            </fieldset>

            {/* Education */}
            <fieldset className="form-fieldset">
              <legend>Education *</legend>
              {errors.education && <span className="error-message">{errors.education}</span>}

              {formData.education.map((edu, index) => (
                <div key={index} className="form-array-item">
                  <div className="form-group">
                    <label htmlFor={`degree_${index}`}>Degree</label>
                    <input
                      type="text"
                      id={`degree_${index}`}
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                      placeholder="e.g., Bachelor of Science"
                      maxLength="200"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`field_${index}`}>Field of Study</label>
                      <input
                        type="text"
                        id={`field_${index}`}
                        value={edu.field}
                        onChange={(e) => handleEducationChange(index, 'field', e.target.value)}
                        placeholder="e.g., Computer Science"
                        maxLength="200"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`institution_${index}`}>Institution</label>
                      <input
                        type="text"
                        id={`institution_${index}`}
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                        placeholder="e.g., MIT"
                        maxLength="200"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`graduation_year_${index}`}>Graduation Year</label>
                      <input
                        type="number"
                        id={`graduation_year_${index}`}
                        value={edu.graduation_year}
                        onChange={(e) => handleEducationChange(index, 'graduation_year', e.target.value)}
                        min="1900"
                        max="2100"
                      />
                    </div>

                    {formData.education.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeEducation(index)}
                        title="Remove education"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" className="btn-add" onClick={addEducation}>
                + Add Education
              </button>
            </fieldset>

            {/* Experience */}
            <fieldset className="form-fieldset">
              <legend>Work Experience *</legend>
              {errors.experience && <span className="error-message">{errors.experience}</span>}

              {formData.experience.map((exp, index) => (
                <div key={index} className="form-array-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`position_${index}`}>Position</label>
                      <input
                        type="text"
                        id={`position_${index}`}
                        value={exp.position}
                        onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                        placeholder="e.g., Senior Developer"
                        maxLength="200"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`company_${index}`}>Company</label>
                      <input
                        type="text"
                        id={`company_${index}`}
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                        placeholder="e.g., Google"
                        maxLength="200"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`start_year_${index}`}>Start Year</label>
                      <input
                        type="number"
                        id={`start_year_${index}`}
                        value={exp.start_year}
                        onChange={(e) => handleExperienceChange(index, 'start_year', e.target.value)}
                        min="1900"
                        max="2100"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`end_year_${index}`}>End Year (leave empty if current)</label>
                      <input
                        type="number"
                        id={`end_year_${index}`}
                        value={exp.end_year}
                        onChange={(e) => handleExperienceChange(index, 'end_year', e.target.value)}
                        placeholder="Leave blank if current job"
                        min="1900"
                        max="2100"
                      />
                    </div>

                    {formData.experience.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeExperience(index)}
                        title="Remove experience"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor={`description_${index}`}>Role Description & Achievements</label>
                    <textarea
                      id={`description_${index}`}
                      value={exp.description}
                      onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                      placeholder="Describe your responsibilities and key achievements"
                      maxLength="1000"
                      rows="3"
                    />
                  </div>
                </div>
              ))}

              <button type="button" className="btn-add" onClick={addExperience}>
                + Add Experience
              </button>
            </fieldset>

            {/* Error Message */}
            {apiError && <div className="api-error">{apiError}</div>}

            {/* Submit Button */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Generating Resume...' : '✨ Generate Resume'}
            </button>
          </form>
        </div>

        {/* Preview Section */}
        {generatedResume && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>✓ Resume Generated</h3>
              <p className="generation-message">{generationMessage}</p>
            </div>

            <div className="preview-content">
              <pre className="resume-text">{generatedResume}</pre>
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

export default ResumeGenerator;
