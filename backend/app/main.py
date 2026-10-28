"""
FastAPI application entry point for AI Resume Generator.
Configured for localhost:8000 during development.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, resumes, jobs, matcher
from app.errors import APIError, api_error_handler

# Initialize FastAPI app
app = FastAPI(
    title="AI Resume Generator API",
    description="Backend API for resume and job description generation",
    version="0.1.0"
)

# Configure CORS for local development
# Frontend runs on localhost:5173, backend on localhost:8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handler for custom API errors
app.add_exception_handler(APIError, api_error_handler)

# Include route modules
app.include_router(health.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(matcher.router)


@app.get("/")
async def root():
    """
    Root endpoint. Returns API information.
    """
    return {
        "app": "AI Resume Generator API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "resume": "/api/resumes/generate",
            "job": "/api/jobs/generate",
            "matcher": "/api/matcher/analyze"
        }
    }


if __name__ == "__main__":
    import uvicorn
    # Run on localhost:8000
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000
    )
