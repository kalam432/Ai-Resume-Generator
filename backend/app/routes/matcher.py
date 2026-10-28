"""
Resume-job matching endpoints for AI Resume Generator API.
Analyzes how well a resume matches a job description using Google Gemini.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas import MatchAnalysisRequest, MatchAnalysisResponse, SkillMatch
from app.ai_service import get_ai_service

# Create router for matching-related endpoints
router = APIRouter(prefix="/api/matcher", tags=["matcher"])


@router.post("/analyze", response_model=MatchAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_resume_job_match(request: MatchAnalysisRequest):
    """
    Analyze how well a resume matches a job description using Google Gemini.
    
    This endpoint:
    - Uses Gemini for semantic analysis of resume vs. job description
    - Identifies matched, partial, and missing skills
    - Calculates overall match percentage with supporting evidence
    - Provides actionable recommendations for improvement
    
    Args:
        request: MatchAnalysisRequest with resume and job description
        
    Returns:
        MatchAnalysisResponse with detailed matching analysis
        
    Raises:
        HTTPException: If input validation fails or AI call fails
    """
    try:
        ai_service = get_ai_service()
        
        if not ai_service.is_configured():
            # Fallback to keyword matching if API key not set
            analysis = _analyze_resume_job_match_keywords(request.resume_text, request.job_description)
            summary_prefix = "(Keyword matching mode) "
        else:
            # Use Gemini API for semantic analysis
            analysis = ai_service.analyze_resume_job_match(request)
            summary_prefix = "(AI-powered analysis) "
        
        # Add prefix to summary to indicate which method was used
        if analysis["summary"] and not analysis["summary"].startswith("("):
            analysis["summary"] = summary_prefix + analysis["summary"]
        
        return MatchAnalysisResponse(
            match_percentage=analysis["match_percentage"],
            matched_skills=analysis["matched_skills"],
            missing_skills=analysis["missing_skills"],
            recommendations=analysis["recommendations"],
            summary=analysis["summary"]
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing match: {str(e)}"
        )


def _analyze_resume_job_match_keywords(resume_text: str, job_description: str) -> dict:
    """
    Analyze resume-job match using basic keyword matching.
    Fallback method when Gemini API is not configured.
    
    Args:
        resume_text: Resume content
        job_description: Job description content
        
    Returns:
        Dictionary with match analysis
    """
    
    # Convert to lowercase for case-insensitive matching
    resume_lower = resume_text.lower()
    job_lower = job_description.lower()
    
    # Extract keywords (simplified)
    job_keywords = _extract_keywords(job_lower)
    resume_keywords = _extract_keywords(resume_lower)
    
    # Analyze matches
    matched_skills = []
    missing_skills = []
    
    for keyword in job_keywords:
        if keyword in resume_keywords:
            matched_skills.append(
                SkillMatch(
                    skill=keyword.title(),
                    status="matched",
                    explanation=f"Found '{keyword}' in resume"
                )
            )
        else:
            missing_skills.append(
                SkillMatch(
                    skill=keyword.title(),
                    status="missing",
                    explanation=f"Required skill '{keyword}' not found in resume"
                )
            )
    
    # Calculate match percentage
    total_required = len(job_keywords) if job_keywords else 1
    matched_count = len(matched_skills)
    match_percentage = (matched_count / total_required * 100) if total_required > 0 else 0
    match_percentage = round(match_percentage, 1)
    
    # Generate recommendations
    recommendations = _generate_recommendations(matched_count, total_required, missing_skills)
    
    # Generate summary
    summary = f"Your resume matches {match_percentage}% of the job requirements. You have {matched_count} of {total_required} required skills."
    
    return {
        "match_percentage": match_percentage,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "recommendations": recommendations,
        "summary": summary
    }


def _extract_keywords(text: str) -> set:
    """
    Extract technical keywords from text.
    
    Simple keyword extraction based on common technical terms.
    
    Args:
        text: Text to extract keywords from
        
    Returns:
        Set of lowercase keywords
    """
    
    # Common technical skills/keywords
    common_keywords = {
        "python", "javascript", "java", "c++", "c#", "typescript", "rust", "go",
        "react", "vue", "angular", "nodejs", "fastapi", "django", "flask",
        "postgresql", "mongodb", "mysql", "redis", "elasticsearch",
        "docker", "kubernetes", "aws", "gcp", "azure",
        "git", "sql", "html", "css", "rest", "graphql", "api",
        "agile", "scrum", "testing", "ci/cd", "devops",
        "machine learning", "ai", "data science", "statistics",
        "communication", "leadership", "problem solving", "teamwork"
    }
    
    # Find keywords present in text
    found_keywords = set()
    for keyword in common_keywords:
        if keyword in text:
            found_keywords.add(keyword)
    
    return found_keywords


def _generate_recommendations(matched_count: int, total_required: int, missing_skills: list) -> list:
    """
    Generate recommendations based on match analysis.
    
    Args:
        matched_count: Number of matched skills
        total_required: Total required skills
        missing_skills: List of missing skills
        
    Returns:
        List of recommendations
    """
    
    recommendations = []
    
    if matched_count >= total_required:
        recommendations.append("Excellent match! Your resume meets all requirements.")
    elif matched_count >= total_required * 0.8:
        recommendations.append("Strong match! You meet most requirements.")
    elif matched_count >= total_required * 0.6:
        recommendations.append("Moderate match. Consider adding missing skills.")
    else:
        recommendations.append("Low match. You're missing several key skills.")
    
    # Add specific recommendations for missing skills
    if missing_skills:
        missing_list = ", ".join([s.skill for s in missing_skills[:3]])
        recommendations.append(f"Consider developing or highlighting experience with: {missing_list}")
    
    # General recommendations
    recommendations.append("Keep your resume updated with your latest projects and achievements.")
    recommendations.append("Tailor your resume to emphasize skills relevant to this position.")
    
    return recommendations
