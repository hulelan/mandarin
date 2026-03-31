.PHONY: backend frontend dev test

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

dev:
	@echo "Run 'make backend' and 'make frontend' in separate terminals"

test:
	cd backend && python -m pytest tests/ -v

install-backend:
	cd backend && pip install -e ".[dev]"

install-frontend:
	cd frontend && npm install
