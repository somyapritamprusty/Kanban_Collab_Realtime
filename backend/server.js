// server.js — refactored, DRY version
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize, DataTypes } from 'sequelize';
import redis from 'redis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(process.cwd(), '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) console.log('⚠️  No .env file found');

// Express & HTTP server
const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });

// Middleware
app.use(cors({
  origin: [
    "https://kanban-collab-realtime.vercel.app"  // replace this with your actual Vercel frontend URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// DB setup
let sequelize;
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not defined');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,  // required for Supabase
    }
  }
});

} catch (error) {
  console.log('🔄 Falling back to SQLite...');
  sequelize = new Sequelize({ dialect: 'sqlite', storage: path.resolve(__dirname, '../database.sqlite'), logging: console.log });
}

// Redis setup with fallback
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({ url: process.env.REDIS_URL, socket: { tls: true, rejectUnauthorized: false } });
  redisClient.on('error', (err) => console.log('Redis Client Error:', err));
  redisClient.connect().catch(() => { redisClient = createMemoryStore(); });
} else {
  redisClient = createMemoryStore();
}

function createMemoryStore() {
  const store = {};
  return {
    connect: async () => console.log('✅ Using in-memory store'),
    hSet: async (key, field, value) => { store[key] = store[key] || {}; store[key][field] = value; },
    hGetAll: async (key) => store[key] || {},
    hDel: async (key, field) => { if(store[key]) delete store[key][field]; },
    on: () => {}
  };
}

// Sequelize models
const Board = sequelize.define('Board', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  columns: { type: DataTypes.JSON, defaultValue: ['Todo','In Progress','Done'] }
});

const Card = sequelize.define('Card', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  assignee: { type: DataTypes.STRING },
  labels: { type: DataTypes.JSON, defaultValue: [] },
  dueDate: { type: DataTypes.DATE },
  position: { type: DataTypes.INTEGER, defaultValue: 0 },
  column: { type: DataTypes.STRING, defaultValue: 'Todo' }
});

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  event: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.STRING, allowNull: false },
  cardId: { type: DataTypes.UUID },
  details: { type: DataTypes.JSON }
});

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  type: { type: DataTypes.STRING, defaultValue: 'info' }
});

// Relationships
Board.hasMany(Card, { onDelete: 'CASCADE' });
Card.belongsTo(Board);
Board.hasMany(AuditLog, { onDelete: 'CASCADE' });
AuditLog.belongsTo(Board);

// Online users: socket.id => { userId, userName, boardId }
const onlineUsers = new Map();

// === Helper functions ===
async function broadcastPresence(boardId) {
  try {
    const users = await redisClient.hGetAll(`presence:${boardId}`);
    io.to(boardId).emit('presence-update', users);
  } catch {
    const users = {};
    for (const [_, info] of onlineUsers.entries()) if (info.boardId === boardId) users[info.userId] = info.userName;
    io.to(boardId).emit('presence-update', users);
  }
}

async function logAudit(event, { userId, cardId, boardId, details }) {
  try { await AuditLog.create({ event, userId, cardId, boardId, details }); } 
  catch { console.log(`AuditLog create (${event}) failed`); }
}

function normalizeCard(card, boardId) {
  return {
    id: card.id, title: card.title, description: card.description, assignee: card.assignee,
    labels: card.labels, position: card.position, column: card.column || 'Todo',
    BoardId: card.BoardId || boardId, boardId, createdAt: card.createdAt, updatedAt: card.updatedAt
  };
}

// === Socket.IO handlers ===
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-board', async (data) => {
    const { boardId, userId } = data;
    const userName = data.userName || data.username || data.name || `User${Math.floor(Math.random()*1000)}`;
    if (!boardId || !userId) return;

    socket.join(boardId);
    onlineUsers.set(socket.id, { userId, userName, boardId });
    await redisClient.hSet(`presence:${boardId}`, userId, userName);
    await broadcastPresence(boardId);
    await logAudit('UserJoined', { userId, boardId, details: { userName } });
  });

  socket.on('leave-board', async (data) => {
    const { boardId, userId } = data;
    socket.leave(boardId);
    onlineUsers.delete(socket.id);
    await redisClient.hDel(`presence:${boardId}`, userId);
    await broadcastPresence(boardId);
    await logAudit('UserLeft', { userId, boardId, details: {} });
  });

  socket.on('create-card', async (data) => {
    try {
      const newCard = await Card.create({
        title: data.title, description: data.description, assignee: data.assignee||'',
        labels: data.labels||[], position: data.position||0, column: data.column||'Todo', BoardId: data.boardId
      });
      await logAudit('CardCreated', { userId: data.userId, cardId: newCard.id, boardId: data.boardId, details: `Card "${newCard.title}" created in column "${newCard.column}"` });
      io.to(data.boardId).emit('card-created', normalizeCard(newCard, data.boardId));
    } catch (err) { console.error('Error creating card:', err); }
  });

  socket.on('update-card', async (data) => {
    if (!data?.id) return;
    const [updated] = await Card.update(data, { where: { id: data.id } });
    if (!updated) return;
    const card = await Card.findByPk(data.id);
    await logAudit('CardUpdated', { userId: data.userId, cardId: data.id, boardId: data.boardId, details: data });
    io.to(data.boardId).emit('card-updated', normalizeCard(card, data.boardId));
  });

  socket.on('move-card', async (data) => {
    const card = await Card.findByPk(data.cardId);
    if (!card) return;
    card.column = data.newColumn; card.position = data.position||0; await card.save();
    await logAudit('CardMoved', { userId: data.userId, cardId: card.id, boardId: data.boardId, details: `Card "${card.title}" moved to column "${card.column}"` });
    io.to(data.boardId).emit('card-moved', normalizeCard(card, data.boardId));
  });

  socket.on('delete-card', async (data) => {
    if (!data?.cardId) return;
    await Card.destroy({ where: { id: data.cardId } });
    await logAudit('CardDeleted', { userId: data.userId, cardId: data.cardId, boardId: data.boardId, details: {} });
    io.to(data.boardId).emit('card-deleted', { id: data.cardId, boardId: data.boardId });
  });

  socket.on('typing-start', (data) => { if(data?.boardId) socket.to(data.boardId).emit('user-typing', { userId: data.userId, userName: data.userName, cardId: data.cardId }); });
  socket.on('typing-stop', (data) => { if(data?.boardId) socket.to(data.boardId).emit('user-stopped-typing', { userId: data.userId, cardId: data.cardId }); });

  socket.on('disconnect', async () => {
    const userData = onlineUsers.get(socket.id);
    if (!userData) return;
    const { userId, boardId } = userData;
    onlineUsers.delete(socket.id);
    await redisClient.hDel(`presence:${boardId}`, userId);
    await broadcastPresence(boardId);
    console.log('User disconnected:', socket.id);
  });
});

// === REST API Routes ===
// Boards
app.get('/api/boards', async (req, res) => { 
  const boards = await Board.findAll({ include:[Card], order:[[Card,'position','ASC']] }); 
  res.json(boards); 
});

app.post('/api/boards', async (req, res) => { 
  if (!req.body.name) return res.status(400).json({ error: 'Board name is required' });
  const board = await Board.create(req.body); 
  res.json(board); 
});

app.get('/api/boards/:id', async (req,res) => { 
  const board = await Board.findByPk(req.params.id, { include:[Card], order:[[Card,'position','ASC']] }); 
  res.json(board); 
});

// Audit logs
app.get('/api/audit-logs/:boardId', async (req,res) => { 
  const logs = await AuditLog.findAll({ where:{boardId:req.params.boardId}, order:[['createdAt','DESC']], limit:50 }); 
  res.json(logs); 
});

// Notifications
app.get('/api/notifications/:userId', async (req,res) => { 
  const notifications = await Notification.findAll({ where:{userId:req.params.userId}, order:[['createdAt','DESC']] }); 
  res.json(notifications); 
});

app.put('/api/notifications/:id/read', async (req,res) => { 
  await Notification.update({read:true},{where:{id:req.params.id}}); 
  res.json({ success:true }); 
});

// Health check
app.get('/api/health', (req,res) => res.json({ status:'OK', database:sequelize.getDialect(), timestamp:new Date().toISOString() }));

// Initialize DB & start server
async function initializeDatabase() { 
  try { await sequelize.authenticate(); await sequelize.sync({ force:false }); console.log('✅ Database ready'); } 
  catch(err) { console.error('❌ Database init failed:', err.message); }
}

const PORT = process.env.PORT||3001;
server.listen(PORT, () => { 
  console.log(`🚀 Server running on port ${PORT}`); 
  initializeDatabase(); 
});
