"""
Resume endpoints for AI Resume Generator API.
Handles resume generation using Google Gemini AI.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas import ResumeGenerationRequest, ResumeGenerationResponse
from app.ai_service import get_ai_service

# Create router for resume-related endpoints
router = APIRouter(prefix="/api/resumes", tags=["resumes"])


@router.post("/generate", response_model=ResumeGenerationResponse, status_code=status.HTTP_200_OK)
async def generate_resume(request: ResumeGenerationRequest):
    """
    Generate a customized, ATS-friendly resume using Google Gemini.
    
    This endpoint:
    - Validates all user input (no invented qualifications)
    - Uses Gemini to organize skills, education, and experience
    - Formats content for ATS (Applicant Tracking System) compatibility
    - Returns professional resume text
    
    Args:
        request: ResumeGenerationRequest with user data
        
    Returns:
        ResumeGenerationResponse with AI-generated resume text
        
    Raises:
        HTTPException: If input validation fails or AI call fails
    """
    try:
        ai_service = get_ai_service()
        
        if not ai_service.is_configured():
            # Fallback to template generation if API key not set
            resume_text = _generate_template_resume(request)
            message = "Resume generated (Template mode - set GEMINI_API_KEY for AI generation)"
        else:
            # Use Gemini API
            resume_text = ai_service.generate_resume(request)
            message = "Resume generated successfully using Google Gemini"
        
        return ResumeGenerationResponse(
            resume_text=resume_text,
            message=message
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid resume data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating resume: {str(e)}"
        )


def _generate_template_resume(request: ResumeGenerationRequest) -> str:
    """
    Generate a template resume from user input.
    Used when Gemini API is not configured.
    
    Args:
        request: Validated request data
        
    Returns:
        Formatted resume text
    """
    
    # Build professional summary
    summary_section = ""
    if request.professional_summary:
        summary_section = f"""PROFESSIONAL SUMMARY
{request.professional_summary}

"""
    
    # Build contact information
    contact = f"""{request.full_name}
{request.email} | {request.phone}

"""
    
    # Build experience section
    experience_section = "PROFESSIONAL EXPERIENCE\n"
    for exp in request.experience:
        year_range = f"{exp.start_year}-{exp.end_year}" if exp.end_year else f"{exp.start_year}-Present"
        experience_section += f"""
{exp.position} at {exp.company} ({year_range})
{exp.description}
"""
    
    # Build education section
    education_section = "\nEDUCATION\n"
    for edu in request.education:
        education_section += f"""
{edu.degree} in {edu.field}
{edu.institution}, Graduated {edu.graduation_year}
"""
    
    # Build skills section
    skills_section = "\nSKILLS\n"
    skills_list = [f"{skill.name}" for skill in request.skills]
    skills_section += ", ".join(skills_list)
    
    # Combine all sections
    resume = contact + summary_section + experience_section + education_section + skills_section
    
    return resume
