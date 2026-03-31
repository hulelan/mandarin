from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers.evaluate import router as evaluate_router
from app.routers.pdf import router as pdf_router

app = FastAPI(title="Mandarin Pronunciation Practice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluate_router, prefix="/api")
app.include_router(pdf_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "transcription_backend": settings.transcription_backend}
