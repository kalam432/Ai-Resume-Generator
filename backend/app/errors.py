"""
Custom exceptions and error handlers for AI Resume Generator API.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from typing import Dict, Any


class APIError(Exception):
    """Base exception for API errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ValidationError(APIError):
    """Raised when request validation fails."""
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


class NotFoundError(APIError):
    """Raised when a resource is not found."""
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class InternalServerError(APIError):
    """Raised for internal server errors."""
    def __init__(self, message: str = "Internal server error"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


async def api_error_handler(request: Request, exc: APIError):
    """
    Handle API errors and return consistent error response.
    
    Args:
        request: The request that caused the error
        exc: The exception that was raised
        
    Returns:
        JSON response with error details
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "status_code": exc.status_code
        }
    )
