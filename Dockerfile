# ==============================================================================
# SwissArmy QR - Multi-Stage Dockerfile
# Stage 1: Build static assets
# Stage 2: Deploy to GitHub Pages (gh-pages branch via container)
# Stage 3: Local/Production Nginx server (preview exact GitHub Pages static build)
# Stage 4: Local export (extract built files using BuildKit)
# ==============================================================================

# --- Stage 1: Builder ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json ./

# Install dependencies cleanly
RUN npm ci

# Copy application source code
COPY . .

# Build production bundle (relative base paths for GitHub Pages)
RUN npm run build

# --- Stage 2: GitHub Pages Deployer ---
FROM alpine:3.20 AS deployer

RUN apk add --no-cache git bash openssh-client

WORKDIR /deploy

# Copy built distribution from builder
COPY --from=builder /app/dist /deploy/dist

# Entrypoint script for deploying to GitHub Pages
COPY <<'EOF' /deploy/deploy.sh
#!/bin/bash
set -e

if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_REPOSITORY" ]; then
  echo "Error: GITHUB_TOKEN and GITHUB_REPOSITORY environment variables are required."
  echo "Usage: docker run --rm -e GITHUB_TOKEN=ghp_xxx -e GITHUB_REPOSITORY=username/repo-name <image> deploy"
  exit 1
fi

BRANCH="${GH_BRANCH:-gh-pages}"
REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

echo "Deploying to GitHub Pages branch: $BRANCH on $GITHUB_REPOSITORY..."

cd /deploy/dist
git init
git config user.name "${GIT_USER_NAME:-GitHub Actions Runner}"
git config user.email "${GIT_USER_EMAIL:-actions@github.com}"

# Add .nojekyll to ensure GitHub Pages doesn't ignore files starting with _
touch .nojekyll

git checkout -B "$BRANCH"
git add -A
git commit -m "Deploy SwissArmy QR to GitHub Pages [skip ci]"

git push --force "$REPO_URL" "$BRANCH"

echo "Successfully deployed SwissArmy QR to GitHub Pages!"
EOF

RUN chmod +x /deploy/deploy.sh

ENTRYPOINT ["/deploy/deploy.sh"]

# --- Stage 3: Production Nginx Server (Default) ---
FROM nginx:alpine AS server

# Copy custom nginx configuration with SPA fallback and gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# --- Stage 4: Local Build Artifact Exporter ---
# Usage: docker build --target export --output type=local,dest=./dist .
FROM scratch AS export
COPY --from=builder /app/dist /
