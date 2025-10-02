Collaborative Kanban Board 🚀

A real-time collaborative Kanban board application built with React, Node.js, Socket.IO, and PostgreSQL. Multiple users can work together on boards with live updates, presence indicators, and real-time notifications.

✨ Features
🎯 Core Features
Real-time Collaboration - Multiple users can edit boards simultaneously with live updates

Board Management - Create, view, and manage multiple Kanban boards
Card CRUD Operations - Create, read, update, delete, and assign cards
Drag & Drop - Intuitive drag-and-drop interface for moving cards between columns
User Presence - See who's online and actively working on a board
Real-time Notifications - In-app notifications for card assignments and updates

🔧 Technical Features
WebSocket Integration - Real-time bidirectional communication
PostgreSQL Database - Robust data persistence with Sequelize ORM
Redis Integration - Presence tracking and ephemeral data storage
Responsive Design - Works seamlessly on desktop and mobile devices
Docker Support - Easy deployment with containerization

🛡️ Advanced Features

Optimistic UI Updates - Instant feedback with server reconciliation
Conflict Handling - Prevents conflicting writes with version control
Audit Logging - Complete history of all board activities

🏗️ Architecture

Frontend (React) ↔ WebSocket ↔ Backend (Node.js/Express) ↔ PostgreSQL + Redis

🚀 Quick Start
Prerequisites:
Node.js (v18 or higher)
PostgreSQL database
Redis server (optional, uses in-memory fallback)

Installation:

//Clone the repository
git clone https://github.com/yourusername/kanban-collab-project.git
cd kanban-collab-project

//Install dependencies
npm run install-all
Set up environment variables

cp .env.example .env
Edit .env with your configuration:


# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# SendGrid (Optional)
SENDGRID_API_KEY=your_sendgrid_key

# Server
PORT=3001

# Frontend
VITE_WS_URL=http://localhost:3001
Start the development servers

npm run dev
This starts:

Backend on http://localhost:3001
Frontend on http://localhost:5173

//Production Build
npm run build
npm start

🐳 Docker Deployment
//Build and run with Docker

docker build -t kanban-app .
docker run -p 3001:3001 --env-file .env kanban-app
Docker Compose (Alternative)
yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/kanban
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=kanban
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:alpine

📁 Project Structure

kanban-collab-project/
├── backend/
│   ├── server.js          # Express server with Socket.IO
│   ├── package.json       # Backend dependencies
│   └── models/            # Sequelize database models
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Board.jsx
│   │   │   ├── BoardList.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Column.jsx
│   │   │   └── NotificationCenter.jsx
│   │   ├── App.jsx        # Main React component
│   │   └── main.jsx       # React entry point
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── dockerfile             # Docker configuration
├── package.json           # Root package.json
└── README.md

🔧 API Endpoints
//Boards
GET /api/boards - Get all boards
POST /api/boards - Create a new board
GET /api/boards/:id - Get specific board with cards

//System
GET /api/health - Health check endpoint
GET /api/audit-logs/:boardId - Get board audit logs
GET /api/notifications/:userId - Get user notifications

WebSocket Events

join-board - Join a board room
leave-board - Leave a board room
create-card - Create a new card
update-card - Update card details
move-card - Move card between columns
delete-card - Delete a card

🎮 Usage Guide
//Creating Your First Board
Open the application in your browser
Click "Create New Board"
Enter a board name and submit
You'll be automatically redirected to the new board

//Working with Cards
Add Cards: Click "+ Add Card" in any column
Edit Cards: Click the pencil icon on any card
Move Cards: Drag and drop between columns

Real-time Collaboration
Open multiple browser tabs/windows to the same board
Create, edit, or move cards in one tab
Watch changes appear instantly in other tabs
See online users in the board header

🛠️ Technology Stack
//Frontend
React - UI framework
Vite - Build tool and dev server
Socket.IO Client - Real-time communication
CSS3 - Styling and responsive design

//Backend
Node.js - Runtime environment
Express.js - Web framework
Socket.IO - Real-time WebSocket communication
Sequelize - PostgreSQL ORM
Redis - Presence tracking and caching

Database & Infrastructure
PostgreSQL - Primary database (via Supabase)
Redis - Real-time data and presence (via Upstash)
Docker - Containerization
Render.com - Deployment platform

🚀 Deployment
Render.com (Recommended)
Connect your GitHub repository to Render
Create a new Web Service
Select "Build and deploy from a Dockerfile"
Add environment variables in Render dashboard

Deploy!
