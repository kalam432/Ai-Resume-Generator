"""
Tests for AI Service - Mocked to avoid requiring API key.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from app.ai_service import GeminiAIService
from app.schemas import (
    SkillInput, EducationInput, ExperienceInput,
    ResumeGenerationRequest, JobGenerationRequest, MatchAnalysisRequest
)


class TestGeminiAIService:
    """Tests for Gemini AI Service."""
    
    def test_ai_service_not_configured_without_api_key(self):
        """Test that AI service is not configured when GEMINI_API_KEY is missing."""
        with patch.dict("os.environ", {}, clear=True):
            service = GeminiAIService()
            assert not service.is_configured()
            assert service.api_key is None
            assert service.model is None
    
    def test_ai_service_configured_with_api_key(self):
        """Test that AI service is configured when GEMINI_API_KEY is set."""
        with patch.dict("os.environ", {"GEMINI_API_KEY": "test_key", "GEMINI_MODEL": "gemini-pro"}):
            with patch("google.generativeai.configure"):
                with patch("google.generativeai.GenerativeModel"):
                    service = GeminiAIService()
                    assert service.is_configured()
                    assert service.api_key == "test_key"
                    assert service.model_name == "gemini-pro"
    
    def test_generate_resume_without_api_key_raises_error(self):
        """Test that resume generation fails without API key."""
        with patch.dict("os.environ", {}, clear=True):
            service = GeminiAIService()
            
            request = ResumeGenerationRequest(
                full_name="John Doe",
                email="john@example.com",
                phone="555-1234",
                skills=[SkillInput(name="Python", years=5)],
                education=[EducationInput(
                    degree="BS",
                    field="CS",
                    institution="MIT",
                    graduation_year=2020
                )],
                experience=[ExperienceInput(
                    position="Engineer",
                    company="Google",
                    start_year=2020,
                    end_year=None,
                    description="Built systems"
                )]
            )
            
            with pytest.raises(ValueError, match="Gemini API not configured"):
                service.generate_resume(request)
    
    def test_generate_resume_with_mocked_api(self):
        """Test resume generation with mocked Gemini API."""
        with patch.dict("os.environ", {"GEMINI_API_KEY": "test_key"}):
            with patch("google.generativeai.configure"):
                with patch("google.generativeai.GenerativeModel") as mock_model:
                    # Mock the model response
                    mock_instance = MagicMock()
                    mock_model.return_value = mock_instance
                    
                    mock_response = MagicMock()
                    mock_response.text = "Generated Resume Content"
                    mock_instance.generate_content.return_value = mock_response
                    
                    service = GeminiAIService()
                    service.model = mock_instance
                    service.configured = True
                    
                    request = ResumeGenerationRequest(
                        full_name="John Doe",
                        email="john@example.com",
                        phone="555-1234",
                        professional_summary="Experienced engineer",
                        skills=[SkillInput(name="Python", years=5)],
                        education=[EducationInput(
                            degree="BS",
                            field="CS",
                            institution="MIT",
                            graduation_year=2020
                        )],
                        experience=[ExperienceInput(
                            position="Engineer",
                            company="Google",
                            start_year=2020,
                            end_year=None,
                            description="Built systems"
                        )]
                    )
                    
                    result = service.generate_resume(request)
                    assert result == "Generated Resume Content"
                    mock_instance.generate_content.assert_called_once()
    
    def test_generate_job_description_with_mocked_api(self):
        """Test job description generation with mocked Gemini API."""
        with patch.dict("os.environ", {"GEMINI_API_KEY": "test_key"}):
            with patch("google.generativeai.configure"):
                with patch("google.generativeai.GenerativeModel") as mock_model:
                    mock_instance = MagicMock()
                    mock_model.return_value = mock_instance
                    
                    mock_response = MagicMock()
                    mock_response.text = "Generated Job Description"
                    mock_instance.generate_content.return_value = mock_response
                    
                    service = GeminiAIService()
                    service.model = mock_instance
                    service.configured = True
                    
                    request = JobGenerationRequest(
                        job_title="Senior Engineer",
                        company_name="TechCorp",
                        required_skills=["Python", "FastAPI"],
                        optional_skills=["Docker"],
                        experience_level="senior"
                    )
                    
                    result = service.generate_job_description(request)
                    assert result == "Generated Job Description"
                    mock_instance.generate_content.assert_called_once()
    
    def test_analyze_resume_job_match_without_api_key_raises_error(self):
        """Test that match analysis fails without API key."""
        with patch.dict("os.environ", {}, clear=True):
            service = GeminiAIService()
            
            request = MatchAnalysisRequest(
                resume_text="Python developer with 5 years experience",
                job_description="Senior Python Developer needed"
            )
            
            with pytest.raises(ValueError, match="Gemini API not configured"):
                service.analyze_resume_job_match(request)
    
    def test_analyze_resume_job_match_with_mocked_api(self):
        """Test match analysis with mocked Gemini API."""
        import json
        
        with patch.dict("os.environ", {"GEMINI_API_KEY": "test_key"}):
            with patch("google.generativeai.configure"):
                with patch("google.generativeai.GenerativeModel") as mock_model:
                    mock_instance = MagicMock()
                    mock_model.return_value = mock_instance
                    
                    # Mock JSON response
                    response_data = {
                        "match_percentage": 85.5,
                        "matched_skills": [
                            {"skill": "Python", "evidence": "Found in resume"}
                        ],
                        "missing_skills": [
                            {"skill": "Docker", "why_important": "Required for deployment"}
                        ],
                        "recommendations": [
                            "Add Docker experience",
                            "Update resume"
                        ],
                        "summary": "Good match overall"
                    }
                    
                    mock_response = MagicMock()
                    mock_response.text = json.dumps(response_data)
                    mock_instance.generate_content.return_value = mock_response
                    
                    service = GeminiAIService()
                    service.model = mock_instance
                    service.configured = True
                    
                    request = MatchAnalysisRequest(
                        resume_text="Python developer with 5 years experience",
                        job_description="Senior Python Developer needed. Must know Docker."
                    )
                    
                    result = service.analyze_resume_job_match(request)
                    assert result["match_percentage"] == 85.5
                    assert len(result["matched_skills"]) == 1
                    assert len(result["missing_skills"]) == 1
                    assert "Docker" in str(result["missing_skills"][0].skill)
    
    def test_convert_analysis_to_schema(self):
        """Test converting analysis output to response schema."""
        service = GeminiAIService()
        
        analysis = {
            "match_percentage": 75,
            "matched_skills": [
                {"skill": "Python", "evidence": "3 years in resume"}
            ],
            "missing_skills": [
                {"skill": "Kubernetes", "why_important": "Required for DevOps"}
            ],
            "recommendations": ["Learn Kubernetes"],
            "summary": "Match found"
        }
        
        result = service._convert_analysis_to_schema(analysis)
        
        assert result["match_percentage"] == 75
        assert len(result["matched_skills"]) == 1
        assert result["matched_skills"][0].skill == "Python"
        assert result["matched_skills"][0].status == "matched"
        assert len(result["missing_skills"]) == 1
        assert result["missing_skills"][0].skill == "Kubernetes"
        assert result["missing_skills"][0].status == "missing"
        assert "Kubernetes" in result["recommendations"][0]


class TestGeminiAIServiceIntegration:
    """Integration tests for actual Gemini API (optional, requires API key)."""
    
    @pytest.mark.skip(reason="Requires GEMINI_API_KEY environment variable")
    def test_real_gemini_api_resume_generation(self):
        """
        Optional: Test resume generation with real Gemini API.
        
        To run this test:
        1. Set GEMINI_API_KEY environment variable
        2. Run: pytest tests/test_ai_service.py::TestGeminiAIServiceIntegration::test_real_gemini_api_resume_generation -v
        
        WARNING: This will incur API usage charges.
        """
        import os
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            pytest.skip("GEMINI_API_KEY not set")
        
        service = GeminiAIService()
        assert service.is_configured()
        
        request = ResumeGenerationRequest(
            full_name="Jane Smith",
            email="jane@example.com",
            phone="555-5678",
            professional_summary="Fullstack web developer",
            skills=[
                SkillInput(name="Python", years=4),
                SkillInput(name="JavaScript", years=3),
                SkillInput(name="React", years=2)
            ],
            education=[
                EducationInput(
                    degree="BS",
                    field="Computer Science",
                    institution="State University",
                    graduation_year=2020
                )
            ],
            experience=[
                ExperienceInput(
                    position="Junior Developer",
                    company="StartUp Inc",
                    start_year=2020,
                    end_year=None,
                    description="Developed React components and Python APIs"
                )
            ],
            experience_level="mid"
        )
        
        resume = service.generate_resume(request)
        assert isinstance(resume, str)
        assert len(resume) > 50
        assert "Jane Smith" in resume or "jane" in resume.lower()
    
    @pytest.mark.skip(reason="Requires GEMINI_API_KEY environment variable")
    def test_real_gemini_api_job_generation(self):
        """
        Optional: Test job description generation with real Gemini API.
        
        To run this test:
        1. Set GEMINI_API_KEY environment variable
        2. Run: pytest tests/test_ai_service.py::TestGeminiAIServiceIntegration::test_real_gemini_api_job_generation -v
        
        WARNING: This will incur API usage charges.
        """
        import os
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            pytest.skip("GEMINI_API_KEY not set")
        
        service = GeminiAIService()
        assert service.is_configured()
        
        request = JobGenerationRequest(
            job_title="Senior Backend Engineer",
            company_name="TechVision Inc",
            required_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
            optional_skills=["Kubernetes", "AWS"],
            experience_level="senior",
            responsibilities="Lead backend architecture decisions. Mentor junior developers."
        )
        
        job_desc = service.generate_job_description(request)
        assert isinstance(job_desc, str)
        assert len(job_desc) > 50
        assert "Backend" in job_desc or "backend" in job_desc.lower()
    
    @pytest.mark.skip(reason="Requires GEMINI_API_KEY environment variable")
    def test_real_gemini_api_match_analysis(self):
        """
        Optional: Test match analysis with real Gemini API.
        
        To run this test:
        1. Set GEMINI_API_KEY environment variable
        2. Run: pytest tests/test_ai_service.py::TestGeminiAIServiceIntegration::test_real_gemini_api_match_analysis -v
        
        WARNING: This will incur API usage charges.
        """
        import os
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            pytest.skip("GEMINI_API_KEY not set")
        
        service = GeminiAIService()
        assert service.is_configured()
        
        request = MatchAnalysisRequest(
            resume_text="Python expert with 8 years experience. Skilled in FastAPI, PostgreSQL, and Docker. Led teams of 5+.",
            job_description="Senior Backend Engineer at TechVision. Required: Python, FastAPI, PostgreSQL. Optional: Docker, Kubernetes. 5+ years experience."
        )
        
        result = service.analyze_resume_job_match(request)
        assert result["match_percentage"] >= 0
        assert result["match_percentage"] <= 100
        assert isinstance(result["matched_skills"], list)
        assert isinstance(result["missing_skills"], list)
        assert isinstance(result["recommendations"], list)
        assert isinstance(result["summary"], str)
