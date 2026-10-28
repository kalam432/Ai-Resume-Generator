"""
Tests for Pydantic schemas validation.
"""

import pytest
from pydantic import ValidationError
from app.schemas import (
    SkillInput, EducationInput, ExperienceInput,
    ResumeGenerationRequest, JobGenerationRequest,
    MatchAnalysisRequest
)


class TestSkillInput:
    """Tests for SkillInput schema."""
    
    def test_valid_skill(self):
        """Test creating a valid skill."""
        skill = SkillInput(name="Python", years=5.5)
        assert skill.name == "Python"
        assert skill.years == 5.5
    
    def test_skill_without_years(self):
        """Test creating skill without years (optional)."""
        skill = SkillInput(name="JavaScript")
        assert skill.name == "JavaScript"
        assert skill.years is None
    
    def test_skill_empty_name_fails(self):
        """Test that empty skill name fails validation."""
        with pytest.raises(ValidationError):
            SkillInput(name="", years=2)
    
    def test_skill_negative_years_fails(self):
        """Test that negative years fails validation."""
        with pytest.raises(ValidationError):
            SkillInput(name="Python", years=-1)
    
    def test_skill_excessive_years_fails(self):
        """Test that years > 60 fails validation."""
        with pytest.raises(ValidationError):
            SkillInput(name="Python", years=100)


class TestEducationInput:
    """Tests for EducationInput schema."""
    
    def test_valid_education(self):
        """Test creating valid education entry."""
        edu = EducationInput(
            degree="Bachelor of Science",
            field="Computer Science",
            institution="MIT",
            graduation_year=2020
        )
        assert edu.degree == "Bachelor of Science"
        assert edu.graduation_year == 2020
    
    def test_missing_required_field_fails(self):
        """Test that missing required field fails."""
        with pytest.raises(ValidationError):
            EducationInput(
                degree="Bachelor",
                field="CS",
                # institution is missing
                graduation_year=2020
            )
    
    def test_invalid_graduation_year_fails(self):
        """Test that invalid year fails."""
        with pytest.raises(ValidationError):
            EducationInput(
                degree="Bachelor",
                field="CS",
                institution="MIT",
                graduation_year=3000  # Too far in future
            )


class TestExperienceInput:
    """Tests for ExperienceInput schema."""
    
    def test_valid_experience(self):
        """Test creating valid experience entry."""
        exp = ExperienceInput(
            position="Software Engineer",
            company="Google",
            start_year=2020,
            end_year=2023,
            description="Built backend systems"
        )
        assert exp.position == "Software Engineer"
        assert exp.company == "Google"
    
    def test_experience_without_end_year(self):
        """Test experience without end year (current position)."""
        exp = ExperienceInput(
            position="Senior Engineer",
            company="Microsoft",
            start_year=2023,
            end_year=None,
            description="Leading projects"
        )
        assert exp.end_year is None
    
    def test_end_year_before_start_year_fails(self):
        """Test that end_year before start_year fails."""
        with pytest.raises(ValidationError):
            ExperienceInput(
                position="Engineer",
                company="Company",
                start_year=2023,
                end_year=2020,  # Before start year
                description="Test"
            )


class TestResumeGenerationRequest:
    """Tests for ResumeGenerationRequest schema."""
    
    def test_valid_resume_request(self):
        """Test creating valid resume generation request."""
        request = ResumeGenerationRequest(
            full_name="John Doe",
            email="john@example.com",
            phone="555-1234",
            professional_summary="Experienced developer",
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
            )],
            experience_level="mid"
        )
        assert request.full_name == "John Doe"
        assert len(request.skills) == 1
    
    def test_resume_request_without_summary(self):
        """Test resume request without professional summary."""
        request = ResumeGenerationRequest(
            full_name="Jane Doe",
            email="jane@example.com",
            phone="555-5678",
            professional_summary=None,
            skills=[SkillInput(name="JavaScript")],
            education=[EducationInput(
                degree="BS",
                field="CS",
                institution="Stanford",
                graduation_year=2021
            )],
            experience=[ExperienceInput(
                position="Dev",
                company="Apple",
                start_year=2021,
                end_year=None,
                description="Coding"
            )],
            experience_level="junior"
        )
        assert request.professional_summary is None
    
    def test_invalid_experience_level_fails(self):
        """Test that invalid experience level fails."""
        with pytest.raises(ValidationError):
            ResumeGenerationRequest(
                full_name="John",
                email="john@example.com",
                phone="555-1234",
                skills=[SkillInput(name="Python")],
                education=[EducationInput(
                    degree="BS",
                    field="CS",
                    institution="MIT",
                    graduation_year=2020
                )],
                experience=[ExperienceInput(
                    position="Eng",
                    company="Co",
                    start_year=2020,
                    end_year=None,
                    description="Work"
                )],
                experience_level="expert"  # Invalid
            )
    
    def test_missing_skills_fails(self):
        """Test that missing skills list fails."""
        with pytest.raises(ValidationError):
            ResumeGenerationRequest(
                full_name="John",
                email="john@example.com",
                phone="555-1234",
                skills=[],  # Empty list
                education=[EducationInput(
                    degree="BS",
                    field="CS",
                    institution="MIT",
                    graduation_year=2020
                )],
                experience=[ExperienceInput(
                    position="Eng",
                    company="Co",
                    start_year=2020,
                    end_year=None,
                    description="Work"
                )]
            )


class TestJobGenerationRequest:
    """Tests for JobGenerationRequest schema."""
    
    def test_valid_job_request(self):
        """Test creating valid job generation request."""
        request = JobGenerationRequest(
            job_title="Senior Developer",
            company_name="Tech Corp",
            required_skills=["Python", "FastAPI", "PostgreSQL"],
            optional_skills=["Docker", "Kubernetes"],
            experience_level="senior",
            responsibilities="Lead team and develop systems"
        )
        assert request.job_title == "Senior Developer"
        assert len(request.required_skills) == 3
    
    def test_job_request_without_optional_skills(self):
        """Test job request without optional skills."""
        request = JobGenerationRequest(
            job_title="Junior Dev",
            company_name="StartUp",
            required_skills=["JavaScript"],
            optional_skills=None,
            experience_level="junior"
        )
        assert request.optional_skills is None
    
    def test_invalid_job_experience_level_fails(self):
        """Test that invalid job experience level fails."""
        with pytest.raises(ValidationError):
            JobGenerationRequest(
                job_title="Dev",
                company_name="Co",
                required_skills=["Python"],
                experience_level="lead"  # Invalid
            )


class TestMatchAnalysisRequest:
    """Tests for MatchAnalysisRequest schema."""
    
    def test_valid_match_request(self):
        """Test creating valid match analysis request."""
        request = MatchAnalysisRequest(
            resume_text="Experienced Python developer with 5 years of experience. Skills: Python, FastAPI, PostgreSQL.",
            job_description="Looking for Senior Python Developer. Required: Python, FastAPI, PostgreSQL, Docker."
        )
        assert len(request.resume_text) > 0
        assert len(request.job_description) > 0
    
    def test_short_resume_fails(self):
        """Test that very short resume fails."""
        with pytest.raises(ValidationError):
            MatchAnalysisRequest(
                resume_text="Hi",  # Too short
                job_description="Senior Developer job description with requirements."
            )
    
    def test_short_job_description_fails(self):
        """Test that very short job description fails."""
        with pytest.raises(ValidationError):
            MatchAnalysisRequest(
                resume_text="Experienced developer with many years of experience in software development.",
                job_description="Job"  # Too short
            )
