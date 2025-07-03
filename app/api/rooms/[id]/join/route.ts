import { NextRequest, NextResponse } from 'next/server';
import { rooms } from '../../route';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();
    const { userType } = body; // 'host' or 'participant'
    
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID is required' },
        { status: 400 }
      );
    }
    
    const room = rooms.get(roomId);
    
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }
    
    // Generate user ID
    const userId = nanoid(8);
    
    // Check if room is full
    if (room.hostId && room.participantId) {
      return NextResponse.json(
        { success: false, error: 'Room is full' },
        { status: 409 }
      );
    }
    
    // Assign user to room
    if (userType === 'host' && !room.hostId) {
      room.hostId = userId;
    } else if (userType === 'participant' && !room.participantId) {
      room.participantId = userId;
    } else if (!room.hostId) {
      // Auto-assign as host if no host exists
      room.hostId = userId;
      userType = 'host';
    } else if (!room.participantId) {
      // Auto-assign as participant if host exists
      room.participantId = userId;
      userType = 'participant';
    } else {
      return NextResponse.json(
        { success: false, error: 'Room is full' },
        { status: 409 }
      );
    }
    
    // Update room status
    if (room.hostId && room.participantId) {
      room.status = 'active';
    }
    
    room.lastActivity = new Date();
    
    console.log(`User ${userId} joined room ${roomId} as ${userType}`);
    
    return NextResponse.json({
      success: true,
      userId,
      userType,
      room: {
        id: room.id,
        status: room.status,
        userCount: (room.hostId ? 1 : 0) + (room.participantId ? 1 : 0),
        isReady: !!(room.hostId && room.participantId)
      }
    });
    
  } catch (error) {
    console.error('Failed to join room:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to join room' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();
    const { userId } = body;
    
    if (!roomId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Room ID and User ID are required' },
        { status: 400 }
      );
    }
    
    const room = rooms.get(roomId);
    
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }
    
    // Remove user from room
    if (room.hostId === userId) {
      room.hostId = undefined;
    } else if (room.participantId === userId) {
      room.participantId = undefined;
    } else {
      return NextResponse.json(
        { success: false, error: 'User not found in room' },
        { status: 404 }
      );
    }
    
    // Update room status
    if (!room.hostId && !room.participantId) {
      room.status = 'ended';
      // Delete empty room after 5 minutes
      setTimeout(() => {
        rooms.delete(roomId);
        console.log(`Deleted empty room: ${roomId}`);
      }, 5 * 60 * 1000);
    } else {
      room.status = 'waiting';
    }
    
    room.lastActivity = new Date();
    
    console.log(`User ${userId} left room ${roomId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Left room successfully',
      room: {
        id: room.id,
        status: room.status,
        userCount: (room.hostId ? 1 : 0) + (room.participantId ? 1 : 0)
      }
    });
    
  } catch (error) {
    console.error('Failed to leave room:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to leave room' },
      { status: 500 }
    );
  }
}
