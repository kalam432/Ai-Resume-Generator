"""
Job description endpoints for AI Resume Generator API.
Handles job description generation using Google Gemini AI.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas import JobGenerationRequest, JobGenerationResponse
from app.ai_service import get_ai_service

# Create router for job-related endpoints
router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("/generate", response_model=JobGenerationResponse, status_code=status.HTTP_200_OK)
async def generate_job_description(request: JobGenerationRequest):
    """
    Generate a professional job description using Google Gemini.
    
    This endpoint:
    - Takes job title, company, skills, and level
    - Uses Gemini to generate a professional, detailed job description
    - Includes responsibilities and requirements
    - Formats for clarity and readability
    
    Args:
        request: JobGenerationRequest with job parameters
        
    Returns:
        JobGenerationResponse with AI-generated job description
        
    Raises:
        HTTPException: If input validation fails or AI call fails
    """
    try:
        ai_service = get_ai_service()
        
        if not ai_service.is_configured():
            # Fallback to template generation if API key not set
            job_description = _generate_template_job_description(request)
            message = "Job description generated (Template mode - set GEMINI_API_KEY for AI generation)"
        else:
            # Use Gemini API
            job_description = ai_service.generate_job_description(request)
            message = "Job description generated successfully using Google Gemini"
        
        return JobGenerationResponse(
            job_description=job_description,
            message=message
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid job data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating job description: {str(e)}"
        )


def _generate_template_job_description(request: JobGenerationRequest) -> str:
    """
    Generate a template job description from job parameters.
    Used when Gemini API is not configured.
    
    Args:
        request: Validated request data
        
    Returns:
        Formatted job description text
    """
    
    # Level description mapping
    level_descriptions = {
        "junior": "Entry-level or recent graduate",
        "mid": "Intermediate level with 3-7 years experience",
        "senior": "Advanced level with 7+ years experience"
    }
    level_desc = level_descriptions.get(request.experience_level, request.experience_level)
    
    # Build job description
    title = f"Job Title: {request.job_title}\n"
    company = f"Company: {request.company_name}\n"
    level = f"Experience Level: {level_desc}\n\n"
    
    # Required skills section
    required_skills = "REQUIRED SKILLS:\n"
    for skill in request.required_skills:
        required_skills += f"- {skill}\n"
    
    # Optional skills section
    optional_skills_section = ""
    if request.optional_skills:
        optional_skills_section = "\nOPTIONAL SKILLS:\n"
        for skill in request.optional_skills:
            optional_skills_section += f"- {skill}\n"
    
    # Responsibilities section
    responsibilities_section = ""
    if request.responsibilities:
        responsibilities_section = f"\nRESPONSIBILITIES:\n{request.responsibilities}\n"
    else:
        responsibilities_section = "\nRESPONSIBILITIES:\n- Develop and maintain software applications\n- Collaborate with team members\n- Participate in code reviews\n- Contribute to project planning and design\n"
    
    # Combine all sections
    job_description = title + company + level + required_skills + optional_skills_section + responsibilities_section
    
    return job_description
