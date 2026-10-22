# ==========================================
# Stage 1: Build Frontend (React + Vite)
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
ARG VITE_DATA_MODE=api
ARG VITE_API_URL=/api/v1
ENV VITE_DATA_MODE=${VITE_DATA_MODE} VITE_API_URL=${VITE_API_URL}
RUN npm run format:check && npm test && npm run build

# ==========================================
# Stage 2: Production Backend (FastAPI) + Static UI
# ==========================================
FROM python:3.12-slim AS runner

WORKDIR /app

COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=frontend-builder /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
COPY tools/presentation-designer/package*.json /app/tools/presentation-designer/
COPY tools/presentation-designer/render.mjs /app/tools/presentation-designer/
COPY examples/mcp/*.png /app/examples/mcp/

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

RUN node /usr/local/lib/node_modules/npm/bin/npm-cli.js --prefix /app/tools/presentation-designer ci --omit=dev --ignore-scripts --no-audit --no-fund

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source
COPY backend/ ./backend/
RUN python -m compileall -q backend/app
COPY AGENTS.md README.md ./

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port (Cloud Run sets $PORT dynamically, default 8080)
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
