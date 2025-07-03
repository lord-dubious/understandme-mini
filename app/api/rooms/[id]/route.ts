import { NextRequest, NextResponse } from 'next/server';
import { rooms } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    
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
    
    // Update last activity
    room.lastActivity = new Date();
    
    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        status: room.status,
        createdAt: room.createdAt.toISOString(),
        lastActivity: room.lastActivity.toISOString(),
        hasHost: !!room.hostId,
        hasParticipant: !!room.participantId,
        userCount: (room.hostId ? 1 : 0) + (room.participantId ? 1 : 0)
      }
    });
    
  } catch (error) {
    console.error('Failed to get room:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get room' },
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
    
    // Delete the room
    rooms.delete(roomId);
    
    console.log(`Deleted room: ${roomId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully'
    });
    
  } catch (error) {
    console.error('Failed to delete room:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}
