# ─── Multi-Stage Dockerfile for Test Automation Framework ──────────────────────────
# Provides a reproducible, containerized test execution environment.
#
# Usage:
#   docker build -t bank-tests .
#   docker run --rm bank-tests
#   docker run --rm -e TEST_ENV=staging bank-tests

FROM mcr.microsoft.com/playwright:v1.52.0-noble

# ─── Metadata ─────────────────────────────────────────────────────────────────────
LABEL maintainer="QA Automation Team"
LABEL description="Bank Project E2E Test Automation Framework"
LABEL version="1.0.0"

# ─── Working Directory ────────────────────────────────────────────────────────────
WORKDIR /app

# ─── Install Dependencies ─────────────────────────────────────────────────────────
COPY package.json package-lock.json ./
RUN npm ci --production=false

# ─── Copy Source Code ─────────────────────────────────────────────────────────────
COPY . .

# ─── Environment Variables ────────────────────────────────────────────────────────
ENV CI=true
ENV HEADLESS=true
ENV TEST_ENV=qa
ENV NODE_ENV=test

# ─── Default Command ──────────────────────────────────────────────────────────────
CMD ["npx", "playwright", "test", "--project=chromium"]