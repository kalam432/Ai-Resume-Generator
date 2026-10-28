"""
AI Service for Google Gemini integration.
Handles all interactions with Google's Gemini API.
Never exposes API key to frontend.
"""

import os
from typing import Optional
import google.generativeai as genai
from app.schemas import (
    ResumeGenerationRequest,
    JobGenerationRequest,
    MatchAnalysisRequest,
    SkillMatch
)


class GeminiAIService:
    """Service for interacting with Google Gemini API."""
    
    def __init__(self):
        """Initialize Gemini AI service with configuration from environment."""
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-pro")
        
        if not self.api_key:
            self.configured = False
            self.model = None
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            self.configured = True
    
    def is_configured(self) -> bool:
        """Check if Gemini API is properly configured."""
        return self.configured
    
    def generate_resume(self, request: ResumeGenerationRequest) -> str:
        """
        Generate a professional, ATS-friendly resume using Gemini.
        
        Args:
            request: ResumeGenerationRequest with user data
            
        Returns:
            Professional resume text
            
        Raises:
            ValueError: If API key not configured or API call fails
        """
        if not self.configured:
            raise ValueError("Gemini API not configured. Set GEMINI_API_KEY environment variable.")
        
        # Build prompt for Gemini
        skills_text = ", ".join([f"{s.name}" + (f" ({s.years}y)" if s.years else "") for s in request.skills])
        education_text = "\n".join([f"- {e.degree} in {e.field} from {e.institution} ({e.graduation_year})" for e in request.education])
        experience_text = "\n".join([
            f"- {exp.position} at {exp.company} ({exp.start_year}-{exp.end_year if exp.end_year else 'Present'}): {exp.description}"
            for exp in request.experience
        ])
        
        prompt = f"""Generate a professional, ATS-friendly resume based on the following information. 
IMPORTANT: Use ONLY the information provided. Do NOT invent any qualifications, certifications, employment history, or achievements.
Format it properly with clear sections. Make it suitable for Applicant Tracking Systems.

Name: {request.full_name}
Email: {request.email}
Phone: {request.phone}
Experience Level: {request.experience_level}

Professional Summary:
{request.professional_summary if request.professional_summary else 'N/A'}

Skills: {skills_text}

Education:
{education_text}

Work Experience:
{experience_text}

Generate a professional resume now:"""
        
        try:
            response = self.model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.95,
                max_output_tokens=2000
            ))
            return response.text
        except Exception as e:
            raise ValueError(f"Gemini API error: {str(e)}")
    
    def generate_job_description(self, request: JobGenerationRequest) -> str:
        """
        Generate a professional job description using Gemini.
        
        Args:
            request: JobGenerationRequest with job parameters
            
        Returns:
            Professional job description text
            
        Raises:
            ValueError: If API key not configured or API call fails
        """
        if not self.configured:
            raise ValueError("Gemini API not configured. Set GEMINI_API_KEY environment variable.")
        
        optional_skills_text = ""
        if request.optional_skills:
            optional_skills_text = f"\nOptional Skills: {', '.join(request.optional_skills)}"
        
        prompt = f"""Generate a professional job description for a job posting.
Format it clearly with sections for overview, responsibilities, requirements, and qualifications.
Do NOT invent any specific company details, projects, or requirements beyond what's provided.

Job Title: {request.job_title}
Company: {request.company_name}
Experience Level: {request.experience_level}
Required Skills: {', '.join(request.required_skills)}{optional_skills_text}

Additional Context:
{request.responsibilities if request.responsibilities else 'Standard job responsibilities for this role'}

Generate a professional job description now:"""
        
        try:
            response = self.model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.95,
                max_output_tokens=2000
            ))
            return response.text
        except Exception as e:
            raise ValueError(f"Gemini API error: {str(e)}")
    
    def analyze_resume_job_match(self, request: MatchAnalysisRequest) -> dict:
        """
        Analyze how well a resume matches a job description using Gemini.
        Uses semantic understanding to identify skills, gaps, and recommendations.
        
        Args:
            request: MatchAnalysisRequest with resume and job description
            
        Returns:
            Dictionary with match analysis including percentage, skills, and recommendations
            
        Raises:
            ValueError: If API key not configured or API call fails
        """
        if not self.configured:
            raise ValueError("Gemini API not configured. Set GEMINI_API_KEY environment variable.")
        
        prompt = f"""Analyze how well this resume matches the job description.
Provide a structured analysis with:
1. Overall match percentage (0-100)
2. Skills from the resume that match the job requirements
3. Required skills that are missing from the resume
4. Brief supporting evidence for each match/miss
5. Actionable recommendations for the candidate

Resume:
{request.resume_text}

Job Description:
{request.job_description}

Provide your analysis in the following JSON format:
{{
    "match_percentage": <number 0-100>,
    "matched_skills": [
        {{"skill": "skill_name", "evidence": "where it appears in resume"}}
    ],
    "missing_skills": [
        {{"skill": "skill_name", "why_important": "brief reason"}}
    ],
    "recommendations": [
        "recommendation 1",
        "recommendation 2"
    ],
    "summary": "brief overall summary"
}}

Respond with ONLY valid JSON, no additional text."""
        
        try:
            response = self.model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
                temperature=0.3,  # Lower temperature for more deterministic JSON
                top_p=0.95,
                max_output_tokens=1500
            ))
            
            # Parse JSON response
            import json
            response_text = response.text.strip()
            
            # Try to extract JSON from response (in case of extra text)
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            analysis = json.loads(response_text)
            
            # Convert to our schema format
            return self._convert_analysis_to_schema(analysis)
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse Gemini response as JSON: {str(e)}")
        except Exception as e:
            raise ValueError(f"Gemini API error: {str(e)}")
    
    def _convert_analysis_to_schema(self, analysis: dict) -> dict:
        """
        Convert Gemini analysis output to our MatchAnalysisResponse schema.
        
        Args:
            analysis: Dictionary from Gemini with match analysis
            
        Returns:
            Dictionary matching our MatchAnalysisResponse schema
        """
        matched_skills = []
        for skill_info in analysis.get("matched_skills", []):
            matched_skills.append(SkillMatch(
                skill=skill_info.get("skill", "Unknown"),
                status="matched",
                explanation=skill_info.get("evidence", "Found in resume")
            ))
        
        missing_skills = []
        for skill_info in analysis.get("missing_skills", []):
            missing_skills.append(SkillMatch(
                skill=skill_info.get("skill", "Unknown"),
                status="missing",
                explanation=skill_info.get("why_important", "Required for this role")
            ))
        
        return {
            "match_percentage": float(analysis.get("match_percentage", 0)),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "recommendations": analysis.get("recommendations", ["No recommendations available"]),
            "summary": analysis.get("summary", "Analysis complete")
        }


# Global instance
_ai_service = None


def get_ai_service() -> GeminiAIService:
    """Get or create global AI service instance."""
    global _ai_service
    if _ai_service is None:
        _ai_service = GeminiAIService()
    return _ai_service
