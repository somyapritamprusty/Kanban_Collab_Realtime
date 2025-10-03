# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend + bundle frontend
FROM node:18-alpine

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./backend/package.json
RUN cd backend && npm install

# Copy backend source code
COPY backend/ ./backend

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/dist ./backend/public

# Set environment variables
ENV PORT=3000
EXPOSE 3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Start backend (which serves API + frontend)
CMD ["node", "backend/server.js"]
