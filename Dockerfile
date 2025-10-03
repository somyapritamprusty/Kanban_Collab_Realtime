# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend + bundle frontend
FROM node:18-alpine

WORKDIR /app

# Copy backend files and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source code
COPY backend/ ./backend

# Copy frontend build into backend/public
COPY --from=frontend-build /app/frontend/dist ./backend/public

# Expose backend port
ENV PORT=3001
EXPOSE 3001

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Start backend (serves API + frontend)
CMD ["node", "backend/server.js"]
