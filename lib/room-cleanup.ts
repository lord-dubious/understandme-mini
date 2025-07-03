/**
 * Room Cleanup Service
 * Handles automatic cleanup of inactive rooms and expired sessions
 */

export interface Room {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  hostId: string | null;
  participantId: string | null;
  status: 'waiting' | 'active' | 'ended';
}

export class RoomCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly ROOM_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly INACTIVE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private rooms: Map<string, Room>,
    private roomSockets: Map<string, Map<string, any>>,
    private io?: any
  ) {}

  /**
   * Start the automatic cleanup process
   */
  start() {
    if (this.cleanupInterval) {
      return; // Already running
    }

    console.log('🧹 Starting room cleanup service...');
    
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL_MS);

    // Perform initial cleanup
    this.performCleanup();
  }

  /**
   * Stop the automatic cleanup process
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Room cleanup service stopped');
    }
  }

  /**
   * Perform cleanup of expired and inactive rooms
   */
  performCleanup() {
    const now = new Date();
    const roomsToDelete: string[] = [];

    console.log(`🧹 Performing room cleanup... (${this.rooms.size} rooms)`);

    for (const [roomId, room] of this.rooms.entries()) {
      const roomAge = now.getTime() - room.createdAt.getTime();
      const timeSinceActivity = now.getTime() - room.lastActivity.getTime();
      const roomUsers = this.roomSockets.get(roomId);
      const userCount = roomUsers?.size || 0;

      // Cleanup criteria
      const isExpired = roomAge > this.ROOM_TIMEOUT_MS;
      const isInactive = timeSinceActivity > this.INACTIVE_TIMEOUT_MS;
      const isEmpty = userCount === 0;
      const isOldAndEmpty = isEmpty && timeSinceActivity > 60000; // 1 minute

      if (isExpired || isInactive || isOldAndEmpty) {
        console.log(`🗑️  Cleaning up room ${roomId}: expired=${isExpired}, inactive=${isInactive}, empty=${isEmpty}`);
        roomsToDelete.push(roomId);
      }
    }

    // Clean up identified rooms
    for (const roomId of roomsToDelete) {
      this.cleanupRoom(roomId);
    }

    if (roomsToDelete.length > 0) {
      console.log(`✅ Cleaned up ${roomsToDelete.length} rooms`);
    }
  }

  /**
   * Clean up a specific room
   */
  cleanupRoom(roomId: string) {
    try {
      // Notify any remaining users
      const roomUsers = this.roomSockets.get(roomId);
      if (roomUsers && roomUsers.size > 0 && this.io) {
        this.io.to(roomId).emit('room-closed', {
          reason: 'Room has been closed due to inactivity'
        });

        // Disconnect all users from the room
        for (const [userId, socket] of roomUsers) {
          socket.leave(roomId);
          socket.emit('room-cleanup', {
            roomId,
            reason: 'Room expired'
          });
        }
      }

      // Remove from tracking
      this.roomSockets.delete(roomId);
      this.rooms.delete(roomId);

      console.log(`🗑️  Room ${roomId} cleaned up successfully`);
    } catch (error) {
      console.error(`❌ Error cleaning up room ${roomId}:`, error);
    }
  }

  /**
   * Update room activity timestamp
   */
  updateRoomActivity(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivity = new Date();
    }
  }

  /**
   * Mark room as ended
   */
  endRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = 'ended';
      room.lastActivity = new Date();
      
      // Schedule immediate cleanup for ended rooms
      setTimeout(() => {
        this.cleanupRoom(roomId);
      }, 5000); // 5 seconds delay
    }
  }

  /**
   * Get room statistics
   */
  getStats() {
    const now = new Date();
    let activeRooms = 0;
    let waitingRooms = 0;
    let endedRooms = 0;
    let emptyRooms = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      const roomUsers = this.roomSockets.get(roomId);
      const userCount = roomUsers?.size || 0;

      if (userCount === 0) {
        emptyRooms++;
      }

      switch (room.status) {
        case 'active':
          activeRooms++;
          break;
        case 'waiting':
          waitingRooms++;
          break;
        case 'ended':
          endedRooms++;
          break;
      }
    }

    return {
      totalRooms: this.rooms.size,
      activeRooms,
      waitingRooms,
      endedRooms,
      emptyRooms,
      lastCleanup: now
    };
  }

  /**
   * Force cleanup of all rooms (for shutdown)
   */
  cleanupAll() {
    console.log('🧹 Performing complete room cleanup...');
    
    const roomIds = Array.from(this.rooms.keys());
    for (const roomId of roomIds) {
      this.cleanupRoom(roomId);
    }

    console.log(`✅ All ${roomIds.length} rooms cleaned up`);
  }
}

// Singleton instance
let cleanupService: RoomCleanupService | null = null;

export function initializeRoomCleanup(
  rooms: Map<string, Room>,
  roomSockets: Map<string, Map<string, any>>,
  io?: any
): RoomCleanupService {
  if (!cleanupService) {
    cleanupService = new RoomCleanupService(rooms, roomSockets, io);
    cleanupService.start();

    // Cleanup on process exit
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down room cleanup service...');
      cleanupService?.cleanupAll();
      cleanupService?.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('🛑 Shutting down room cleanup service...');
      cleanupService?.cleanupAll();
      cleanupService?.stop();
      process.exit(0);
    });
  }

  return cleanupService;
}

export function getRoomCleanupService(): RoomCleanupService | null {
  return cleanupService;
}
