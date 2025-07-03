const { Server: SocketIOServer } = require('socket.io');

let io = null;

// Store socket connections per room
const roomSockets = new Map();

function initializeSocketServer(httpServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle joining a room
    socket.on('join-room', async (data) => {
      const { roomId, userId, userType } = data;
      
      try {
        // Leave any previous room
        if (socket.data && socket.data.roomId) {
          await leaveRoom(socket, socket.data.roomId);
        }

        // Join the new room
        socket.join(roomId);
        
        // Initialize socket data if not exists
        if (!socket.data) {
          socket.data = {};
        }
        
        socket.data.roomId = roomId;
        socket.data.userId = userId;
        socket.data.userType = userType;

        // Track user in room
        if (!roomSockets.has(roomId)) {
          roomSockets.set(roomId, new Map());
        }
        
        const roomUsers = roomSockets.get(roomId);
        roomUsers.set(userId, {
          id: userId,
          socketId: socket.id,
          userType,
          joinedAt: new Date()
        });

        // Notify all users in room about the new connection
        const userCount = roomUsers.size;
        const isReady = userCount >= 2;
        
        io.to(roomId).emit('room-updated', {
          roomId,
          userCount,
          isReady,
          users: Array.from(roomUsers.values()).map(user => ({
            id: user.id,
            userType: user.userType,
            joinedAt: user.joinedAt
          }))
        });

        // Send confirmation to the joining user
        socket.emit('joined-room', {
          roomId,
          userId,
          userType,
          userCount,
          isReady
        });

        console.log(`User ${userId} joined room ${roomId} as ${userType}`);

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('leave-room', async () => {
      if (socket.data && socket.data.roomId) {
        await leaveRoom(socket, socket.data.roomId);
      }
    });

    // Handle user speaking status
    socket.on('speaking-status', (data) => {
      if (socket.data && socket.data.roomId && socket.data.userId) {
        socket.to(socket.data.roomId).emit('user-speaking', {
          userId: socket.data.userId,
          userType: socket.data.userType,
          speaking: data.speaking
        });
      }
    });

    // Handle AI agent events
    socket.on('agent-speaking', (data) => {
      if (socket.data && socket.data.roomId) {
        socket.to(socket.data.roomId).emit('agent-status', {
          speaking: data.speaking,
          message: data.message
        });
      }
    });

    // Handle session phase updates
    socket.on('session-phase-update', (data) => {
      if (socket.data && socket.data.roomId) {
        socket.to(socket.data.roomId).emit('session-phase-changed', {
          phase: data.phase
        });
      }
    });

    // Handle relationship type detection
    socket.on('relationship-type-update', (data) => {
      if (socket.data && socket.data.roomId) {
        socket.to(socket.data.roomId).emit('relationship-type-detected', {
          relationshipType: data.relationshipType
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      if (socket.data && socket.data.roomId) {
        await leaveRoom(socket, socket.data.roomId);
      }
    });
  });

  return io;
}

async function leaveRoom(socket, roomId) {
  const userId = socket.data ? socket.data.userId : null;
  
  if (!userId) return;

  try {
    // Remove from socket room
    socket.leave(roomId);

    // Remove from room tracking
    const roomUsers = roomSockets.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId);
      
      // If room is empty, clean it up
      if (roomUsers.size === 0) {
        roomSockets.delete(roomId);
      } else {
        // Notify remaining users
        const userCount = roomUsers.size;
        const isReady = userCount >= 2;
        
        if (io && userCount > 0) {
          io.to(roomId).emit('room-updated', {
            roomId,
            userCount,
            isReady,
            users: Array.from(roomUsers.values()).map(user => ({
              id: user.id,
              userType: user.userType,
              joinedAt: user.joinedAt
            }))
          });
        }
      }
    }

    // Clear socket data
    if (socket.data) {
      socket.data.roomId = undefined;
      socket.data.userId = undefined;
      socket.data.userType = undefined;
    }

    console.log(`User ${userId} left room ${roomId}`);

  } catch (error) {
    console.error('Error leaving room:', error);
  }
}

function getSocketServer() {
  return io;
}

function getRoomUsers(roomId) {
  const roomUsers = roomSockets.get(roomId);
  return roomUsers ? Array.from(roomUsers.values()) : [];
}

function getRoomUserCount(roomId) {
  const roomUsers = roomSockets.get(roomId);
  return roomUsers ? roomUsers.size : 0;
}

module.exports = {
  initializeSocketServer,
  getSocketServer,
  getRoomUsers,
  getRoomUserCount
};
