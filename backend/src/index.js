require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const { pool } = require('./db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001', 'exp://localhost:19000'],
    methods: ['GET', 'POST']
  }
});

// Socket.IO real-time messaging
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });

  socket.on('send_message', (data) => {
    io.to(`conversation_${data.conversationId}`).emit('receive_message', {
      id: data.id,
      senderId: data.senderId,
      text: data.text,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing', (data) => {
    io.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, async () => {
  console.log(`CollabHub API listening on port ${PORT}`);
  
  // Test DB connection
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
});

module.exports = { server, io };