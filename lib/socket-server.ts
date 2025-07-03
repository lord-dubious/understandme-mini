import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { rooms } from '@/app/api/rooms/route';
import { initializeRoomCleanup, getRoomCleanupService } from './room-cleanup';

export interface RoomUser {
  id: string;
  socketId: string;
  userType: 'host' | 'participant';
  joinedAt: Date;
}

export interface SocketData {
  userId?: string;
  roomId?: string;
  userType?: 'host' | 'participant';
}

let io: SocketIOServer | null = null;

// Store socket connections per room
const roomSockets = new Map<string, Map<string, RoomUser>>();

export function initializeSocketServer(httpServer: HTTPServer) {
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

  // Initialize room cleanup service
  initializeRoomCleanup(rooms, roomSockets, io);

  io.on('connection', (socket: Socket<any, any, any, SocketData>) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle joining a room
    socket.on('join-room', async (data: { roomId: string; userId: string; userType: 'host' | 'participant' }) => {
      const { roomId, userId, userType } = data;
      
      try {
        // Verify room exists
        const room = rooms.get(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Leave any previous room
        if (socket.data.roomId) {
          await leaveRoom(socket, socket.data.roomId);
        }

        // Join the new room
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.userId = userId;
        socket.data.userType = userType;

        // Track user in room
        if (!roomSockets.has(roomId)) {
          roomSockets.set(roomId, new Map());
        }
        
        const roomUsers = roomSockets.get(roomId)!;
        roomUsers.set(userId, {
          id: userId,
          socketId: socket.id,
          userType,
          joinedAt: new Date()
        });

        // Update room state and activity
        room.lastActivity = new Date();
        if (userCount >= 2) {
          room.status = 'active';
        }

        // Update cleanup service
        const cleanupService = getRoomCleanupService();
        cleanupService?.updateRoomActivity(roomId);
        
        // Notify all users in room about the new connection
        const userCount = roomUsers.size;
        const isReady = userCount >= 2;
        
        io!.to(roomId).emit('room-updated', {
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
      if (socket.data.roomId) {
        await leaveRoom(socket, socket.data.roomId);
      }
    });

    // Handle user speaking status
    socket.on('speaking-status', (data: { speaking: boolean }) => {
      if (socket.data.roomId && socket.data.userId) {
        // Update room activity
        const cleanupService = getRoomCleanupService();
        cleanupService?.updateRoomActivity(socket.data.roomId);

        socket.to(socket.data.roomId).emit('user-speaking', {
          userId: socket.data.userId,
          userType: socket.data.userType,
          speaking: data.speaking
        });
      }
    });

    // Handle AI agent events
    socket.on('agent-speaking', (data: { speaking: boolean; message?: string }) => {
      if (socket.data.roomId) {
        socket.to(socket.data.roomId).emit('agent-status', {
          speaking: data.speaking,
          message: data.message
        });
      }
    });

    // Handle session phase updates
    socket.on('session-phase-update', (data: { phase: string }) => {
      if (socket.data.roomId) {
        socket.to(socket.data.roomId).emit('session-phase-changed', {
          phase: data.phase
        });
      }
    });

    // Handle relationship type detection
    socket.on('relationship-type-update', (data: { relationshipType: string }) => {
      if (socket.data.roomId) {
        socket.to(socket.data.roomId).emit('relationship-type-detected', {
          relationshipType: data.relationshipType
        });
      }
    });

    // Handle WebRTC signaling
    socket.on('webrtc-signal', (data: { signal: any; targetUserId?: string }) => {
      if (socket.data.roomId && socket.data.userId) {
        console.log(`WebRTC signal from ${socket.data.userId} in room ${socket.data.roomId}`);

        // Update room activity
        const cleanupService = getRoomCleanupService();
        cleanupService?.updateRoomActivity(socket.data.roomId);

        // Forward the signal to other users in the room
        // If targetUserId is specified, send only to that user
        if (data.targetUserId) {
          // Find the target user's socket
          const roomUsers = roomSockets.get(socket.data.roomId);
          if (roomUsers) {
            for (const [userId, userSocket] of roomUsers) {
              if (userId === data.targetUserId) {
                userSocket.emit('webrtc-signal', {
                  userId: socket.data.userId,
                  signal: data.signal
                });
                break;
              }
            }
          }
        } else {
          // Broadcast to all other users in the room
          socket.to(socket.data.roomId).emit('webrtc-signal', {
            userId: socket.data.userId,
            signal: data.signal
          });
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);

      if (socket.data.roomId) {
        await leaveRoom(socket, socket.data.roomId);
      }
    });
  });

  return io;
}

async function leaveRoom(socket: Socket<any, any, any, SocketData>, roomId: string) {
  const userId = socket.data.userId;
  
  if (!userId) return;

  try {
    // Remove from socket room
    socket.leave(roomId);

    // Remove from room tracking
    const roomUsers = roomSockets.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId);
      
      // Update room state
      const room = rooms.get(roomId);
      if (room) {
        room.lastActivity = new Date();
        
        // If room is empty, clean it up
        if (roomUsers.size === 0) {
          roomSockets.delete(roomId);
          // Don't delete the room immediately, let the API cleanup handle it
        }
      }

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

    // Clear socket data
    socket.data.roomId = undefined;
    socket.data.userId = undefined;
    socket.data.userType = undefined;

    console.log(`User ${userId} left room ${roomId}`);

  } catch (error) {
    console.error('Error leaving room:', error);
  }
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function getRoomUsers(roomId: string): RoomUser[] {
  const roomUsers = roomSockets.get(roomId);
  return roomUsers ? Array.from(roomUsers.values()) : [];
}

export function getRoomUserCount(roomId: string): number {
  const roomUsers = roomSockets.get(roomId);
  return roomUsers ? roomUsers.size : 0;
}
