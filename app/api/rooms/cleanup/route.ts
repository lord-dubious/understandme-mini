import { NextRequest, NextResponse } from 'next/server';
import { getRoomCleanupService } from '@/lib/room-cleanup';

export async function POST(request: NextRequest) {
  try {
    const cleanupService = getRoomCleanupService();
    
    if (!cleanupService) {
      return NextResponse.json(
        { success: false, error: 'Cleanup service not initialized' },
        { status: 500 }
      );
    }

    // Get stats before cleanup
    const statsBefore = cleanupService.getStats();
    
    // Perform manual cleanup
    cleanupService.performCleanup();
    
    // Get stats after cleanup
    const statsAfter = cleanupService.getStats();
    
    const roomsCleaned = statsBefore.totalRooms - statsAfter.totalRooms;

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. ${roomsCleaned} rooms cleaned up.`,
      statsBefore,
      statsAfter,
      roomsCleaned
    });

  } catch (error) {
    console.error('Manual cleanup failed:', error);
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cleanupService = getRoomCleanupService();
    
    if (!cleanupService) {
      return NextResponse.json(
        { success: false, error: 'Cleanup service not initialized' },
        { status: 500 }
      );
    }

    const stats = cleanupService.getStats();

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Failed to get cleanup stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
