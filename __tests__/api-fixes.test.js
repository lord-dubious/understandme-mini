/**
 * Unit tests for API bug fixes
 * Tests Next.js 15 dynamic route parameter handling
 */

const { GET: getRoomDetails, DELETE: deleteRoom } = require('../app/api/rooms/[id]/route.ts');
const { POST: joinRoom, DELETE: leaveRoom } = require('../app/api/rooms/[id]/join/route.ts');

// Mock NextRequest and NextResponse
const mockRequest = {
  json: jest.fn(),
};

const mockResponse = {
  json: jest.fn(),
};

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      data,
    })),
  },
}));

// Mock rooms storage
jest.mock('../app/api/rooms/route', () => ({
  rooms: new Map([
    ['test-room-123', {
      id: 'test-room-123',
      createdAt: new Date(),
      hostId: 'host-user-123',
      participantId: null,
      status: 'waiting',
      lastActivity: new Date(),
    }]
  ]),
}));

describe('API Bug Fixes - Next.js 15 Dynamic Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Room Details API (/api/rooms/[id])', () => {
    it('should handle awaited params correctly', async () => {
      const mockParams = Promise.resolve({ id: 'test-room-123' });
      
      const result = await getRoomDetails(mockRequest, { params: mockParams });
      
      expect(result).toBeDefined();
      expect(result.status).toBe(200);
    });

    it('should handle invalid room ID', async () => {
      const mockParams = Promise.resolve({ id: 'non-existent-room' });
      
      const result = await getRoomDetails(mockRequest, { params: mockParams });
      
      expect(result).toBeDefined();
      expect(result.status).toBe(404);
    });
  });

  describe('Room Join API (/api/rooms/[id]/join)', () => {
    it('should handle awaited params correctly for join', async () => {
      const mockParams = Promise.resolve({ id: 'test-room-123' });
      mockRequest.json.mockResolvedValue({ userType: 'participant' });
      
      const result = await joinRoom(mockRequest, { params: mockParams });
      
      expect(result).toBeDefined();
      // Should process the request without throwing params.id error
    });

    it('should handle awaited params correctly for leave', async () => {
      const mockParams = Promise.resolve({ id: 'test-room-123' });
      mockRequest.json.mockResolvedValue({ userId: 'test-user-456' });
      
      const result = await leaveRoom(mockRequest, { params: mockParams });
      
      expect(result).toBeDefined();
      // Should process the request without throwing params.id error
    });
  });

  describe('Room Deletion API (/api/rooms/[id])', () => {
    it('should handle awaited params correctly for deletion', async () => {
      const mockParams = Promise.resolve({ id: 'test-room-123' });
      
      const result = await deleteRoom(mockRequest, { params: mockParams });
      
      expect(result).toBeDefined();
      // Should process the request without throwing params.id error
    });
  });

  describe('Parameter Validation', () => {
    it('should properly await params before accessing properties', async () => {
      // This test ensures we don't get the "params should be awaited" error
      const mockParams = Promise.resolve({ id: 'test-room-123' });
      
      // All these should complete without throwing the sync dynamic API error
      await expect(getRoomDetails(mockRequest, { params: mockParams })).resolves.toBeDefined();
      await expect(deleteRoom(mockRequest, { params: mockParams })).resolves.toBeDefined();
      
      mockRequest.json.mockResolvedValue({ userType: 'host' });
      await expect(joinRoom(mockRequest, { params: mockParams })).resolves.toBeDefined();
      
      mockRequest.json.mockResolvedValue({ userId: 'test-user' });
      await expect(leaveRoom(mockRequest, { params: mockParams })).resolves.toBeDefined();
    });

    it('should handle missing room ID parameter', async () => {
      const mockParams = Promise.resolve({ id: '' });
      
      const result = await getRoomDetails(mockRequest, { params: mockParams });
      
      expect(result).toBeDefined();
      expect(result.status).toBe(400);
    });
  });
});

// Integration test for the complete flow
describe('API Integration Flow', () => {
  it('should handle complete room lifecycle with awaited params', async () => {
    const roomId = 'integration-test-room';
    const mockParams = Promise.resolve({ id: roomId });
    
    // Mock room creation (this would be done via POST /api/rooms)
    const { rooms } = require('../app/api/rooms/route');
    rooms.set(roomId, {
      id: roomId,
      createdAt: new Date(),
      hostId: null,
      participantId: null,
      status: 'waiting',
      lastActivity: new Date(),
    });

    // 1. Get room details
    const roomDetails = await getRoomDetails(mockRequest, { params: mockParams });
    expect(roomDetails.status).toBe(200);

    // 2. Join room as host
    mockRequest.json.mockResolvedValue({ userType: 'host' });
    const joinResult = await joinRoom(mockRequest, { params: mockParams });
    expect(joinResult).toBeDefined();

    // 3. Leave room
    mockRequest.json.mockResolvedValue({ userId: 'test-user-123' });
    const leaveResult = await leaveRoom(mockRequest, { params: mockParams });
    expect(leaveResult).toBeDefined();

    // 4. Delete room
    const deleteResult = await deleteRoom(mockRequest, { params: mockParams });
    expect(deleteResult).toBeDefined();
  });
});
