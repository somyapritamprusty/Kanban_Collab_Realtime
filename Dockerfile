# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Install root dependencies
RUN npm install

# Install backend dependencies
RUN cd backend && npm install && cd ..

# Install frontend dependencies
RUN cd frontend && npm install && cd ..

# Copy ALL source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"]