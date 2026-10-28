"""
Health check endpoint for AI Resume Generator API.
Provides system status information.
"""

from fastapi import APIRouter
from pydantic import BaseModel

# Create router for health-related endpoints
router = APIRouter(prefix="", tags=["health"])


class HealthResponse(BaseModel):
    """Response schema for health check endpoint."""
    status: str
    message: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    Returns 200 OK if the API is running.
    Used by frontend and deployment systems to verify the backend is alive.
    
    Returns:
        HealthResponse: Contains status and message fields
    """
    return HealthResponse(
        status="ok",
        message="AI Resume Generator API is running"
    )
