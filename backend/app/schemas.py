"""
Pydantic schemas for request/response validation.
Defines data models for all API endpoints.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


# ============================================================================
# Resume Generation Schemas
# ============================================================================

class SkillInput(BaseModel):
    """Individual skill with optional years of experience."""
    name: str = Field(..., min_length=1, max_length=100, description="Skill name")
    years: Optional[float] = Field(None, ge=0, le=60, description="Years of experience")


class EducationInput(BaseModel):
    """Education entry."""
    degree: str = Field(..., min_length=1, max_length=200, description="Degree name (e.g., Bachelor of Science)")
    field: str = Field(..., min_length=1, max_length=200, description="Field of study")
    institution: str = Field(..., min_length=1, max_length=200, description="University/Institution name")
    graduation_year: int = Field(..., ge=1900, le=2100, description="Graduation year")


class ExperienceInput(BaseModel):
    """Work experience entry."""
    position: str = Field(..., min_length=1, max_length=200, description="Job title/position")
    company: str = Field(..., min_length=1, max_length=200, description="Company name")
    start_year: int = Field(..., ge=1900, le=2100, description="Start year")
    end_year: Optional[int] = Field(None, ge=1900, le=2100, description="End year (null if current)")
    description: str = Field(..., min_length=1, max_length=1000, description="Role description and achievements")

    @field_validator("end_year")
    @classmethod
    def validate_end_year(cls, v, info):
        """Ensure end_year is after start_year."""
        if v is not None and "start_year" in info.data and v < info.data["start_year"]:
            raise ValueError("End year must be after start year")
        return v


class ResumeGenerationRequest(BaseModel):
    """Request schema for resume generation endpoint."""
    full_name: str = Field(..., min_length=1, max_length=200, description="Full name")
    email: str = Field(..., min_length=5, max_length=200, description="Email address")
    phone: str = Field(..., min_length=5, max_length=20, description="Phone number")
    professional_summary: Optional[str] = Field(None, max_length=500, description="Professional summary (optional)")
    
    skills: List[SkillInput] = Field(..., min_length=1, max_length=100, description="List of skills")
    education: List[EducationInput] = Field(..., min_length=1, max_length=10, description="List of education entries")
    experience: List[ExperienceInput] = Field(..., min_length=1, max_length=20, description="List of work experiences")
    
    experience_level: str = Field(
        default="mid",
        description="Experience level: 'junior', 'mid', or 'senior'"
    )

    @field_validator("experience_level")
    @classmethod
    def validate_experience_level(cls, v):
        """Ensure experience level is one of allowed values."""
        allowed = ["junior", "mid", "senior"]
        if v not in allowed:
            raise ValueError(f"Experience level must be one of {allowed}")
        return v


class ResumeGenerationResponse(BaseModel):
    """Response schema for resume generation endpoint."""
    resume_text: str = Field(..., description="Generated resume content")
    message: str = Field(..., description="Status message")


# ============================================================================
# Job Description Generation Schemas
# ============================================================================

class JobGenerationRequest(BaseModel):
    """Request schema for job description generation endpoint."""
    job_title: str = Field(..., min_length=1, max_length=200, description="Job title")
    company_name: str = Field(..., min_length=1, max_length=200, description="Company name")
    required_skills: List[str] = Field(..., min_length=1, max_length=50, description="Required skills")
    optional_skills: Optional[List[str]] = Field(None, max_length=50, description="Optional skills")
    experience_level: str = Field(
        default="mid",
        description="Experience level: 'junior', 'mid', or 'senior'"
    )
    responsibilities: Optional[str] = Field(None, max_length=1000, description="Job responsibilities (optional)")

    @field_validator("experience_level")
    @classmethod
    def validate_experience_level(cls, v):
        """Ensure experience level is one of allowed values."""
        allowed = ["junior", "mid", "senior"]
        if v not in allowed:
            raise ValueError(f"Experience level must be one of {allowed}")
        return v


class JobGenerationResponse(BaseModel):
    """Response schema for job description generation endpoint."""
    job_description: str = Field(..., description="Generated job description")
    message: str = Field(..., description="Status message")


# ============================================================================
# Resume-Job Matching Schemas
# ============================================================================

class MatchAnalysisRequest(BaseModel):
    """Request schema for resume-job matching endpoint."""
    resume_text: str = Field(..., min_length=10, max_length=10000, description="Resume content")
    job_description: str = Field(..., min_length=10, max_length=10000, description="Job description content")


class SkillMatch(BaseModel):
    """Individual skill match result."""
    skill: str = Field(..., description="Skill name")
    status: str = Field(..., description="'matched', 'partial', or 'missing'")
    explanation: str = Field(..., description="Brief explanation of the match")


class MatchAnalysisResponse(BaseModel):
    """Response schema for resume-job matching endpoint."""
    match_percentage: float = Field(..., ge=0, le=100, description="Overall match percentage")
    matched_skills: List[SkillMatch] = Field(..., description="List of matched skills")
    missing_skills: List[SkillMatch] = Field(..., description="List of missing skills")
    recommendations: List[str] = Field(..., description="Recommendations for improvement")
    summary: str = Field(..., description="Overall match summary")


# ============================================================================
# Error Response Schema
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response format."""
    error: str = Field(..., description="Error type/code")
    message: str = Field(..., description="Detailed error message")
    status_code: int = Field(..., description="HTTP status code")
