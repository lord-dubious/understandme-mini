import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// In-memory storage for room state (ephemeral)
// In production, you might want to use Redis or similar
const rooms = new Map<string, {
  id: string;
  createdAt: Date;
  hostId?: string;
  participantId?: string;
  status: 'waiting' | 'active' | 'ended';
  lastActivity: Date;
}>();

// Make sure the rooms Map is available globally
if (typeof globalThis !== 'undefined') {
  if (!globalThis.rooms) {
    globalThis.rooms = rooms;
  }
}

// Cleanup inactive rooms (older than 2 hours)
const cleanupInactiveRooms = () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  for (const [roomId, room] of rooms.entries()) {
    if (room.lastActivity < twoHoursAgo) {
      rooms.delete(roomId);
      console.log(`Cleaned up inactive room: ${roomId}`);
    }
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupInactiveRooms, 30 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // Generate unique room ID
    const roomId = nanoid(10);
    
    // Create room state
    const room = {
      id: roomId,
      createdAt: new Date(),
      status: 'waiting' as const,
      lastActivity: new Date()
    };
    
    // Store room in memory
    rooms.set(roomId, room);
    
    console.log(`Created room: ${roomId}`);
    
    return NextResponse.json({
      success: true,
      roomId,
      room: {
        id: room.id,
        status: room.status,
        createdAt: room.createdAt.toISOString(),
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/room/${roomId}`
      }
    });
    
  } catch (error) {
    console.error('Failed to create room:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create room' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all active rooms (for debugging/monitoring)
    const activeRooms = Array.from(rooms.values()).map(room => ({
      id: room.id,
      status: room.status,
      createdAt: room.createdAt.toISOString(),
      lastActivity: room.lastActivity.toISOString(),
      hasHost: !!room.hostId,
      hasParticipant: !!room.participantId
    }));
    
    return NextResponse.json({
      success: true,
      rooms: activeRooms,
      totalRooms: rooms.size
    });
    
  } catch (error) {
    console.error('Failed to get rooms:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get rooms' 
      },
      { status: 500 }
    );
  }
}

// Export the rooms Map for use in other API routes
export { rooms };
