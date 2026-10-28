# Backend - AI Resume Generator API

FastAPI-based REST API for the AI Resume Generator application.

## Setup

### Prerequisites
- Python 3.12+
- Virtual environment activated

### Installation

1. **Create and activate virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Create .env file:**
   ```powershell
   cp .env.example .env
   ```
   Fill in your API keys and configuration.

## Running the Backend

**Start the FastAPI server on localhost:8000:**
```powershell
# Method 1: Direct Python execution
python -m app.main

# Method 2: Using uvicorn directly
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The `--reload` flag enables auto-restart when code changes.

## Accessing the API

- **API Documentation (Swagger UI):** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health
- **Root:** http://localhost:8000/

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app and routes
│   ├── config.py         # Configuration (Phase 3)
│   ├── schemas.py        # Pydantic models (Phase 3)
│   ├── ai_service.py     # LLM integration (Phase 4)
│   ├── document_service.py # PDF/DOCX export (Phase 6)
│   ├── models.py         # Database models (Phase 7)
│   ├── crud.py           # Database operations (Phase 7)
│   ├── errors.py         # Custom exceptions
│   ├── routes/           # API route blueprints
│   └── utils.py          # Helper functions
├── migrations/           # Alembic migrations (Phase 7)
├── tests/                # Test suite (Phase 9)
├── venv/                 # Python virtual environment (local only)
├── requirements.txt      # Python dependencies
├── .env.example          # Environment template
└── README.md             # This file
```

## Development Workflow

1. Activate virtual environment: `.\venv\Scripts\Activate.ps1`
2. Start the server: `uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`
3. Access Swagger UI at http://localhost:8000/docs
4. Write code; server auto-reloads
5. Test endpoints via Swagger UI or frontend

## Next Steps (Phases)

- **Phase 3:** Add schemas, validation, and error handling
- **Phase 4:** Integrate OpenAI API for AI features
- **Phase 6:** Add document export (PDF/DOCX)
- **Phase 7:** Add database integration
- **Phase 8:** Add authentication and security
- **Phase 9:** Add comprehensive tests
