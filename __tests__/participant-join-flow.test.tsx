import { render, screen, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import RoomPage from '@/app/room/[id]/page';

// Mock the useSocket hook
const mockSocket = {
  socket: null,
  isConnected: false,
  isJoined: false,
  roomState: null,
  updateSpeakingStatus: jest.fn(),
  updateAgentSpeaking: jest.fn(),
  updateSessionPhase: jest.fn(),
  updateRelationshipType: jest.fn(),
};

jest.mock('@/hooks/use-socket', () => ({
  useSocket: jest.fn(() => mockSocket),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-room-123' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Participant Join Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockClear();
  });

  it('should handle room creator joining flow', async () => {
    // Mock room creator scenario
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'created_room_test-room-123') return 'true';
      return null;
    });

    // Mock successful room check
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          room: { hasHost: false, hasParticipant: false }
        })
      })
      // Mock successful join
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          userId: 'user-123',
          userType: 'host',
          room: { isReady: false, userCount: 1 }
        })
      });

    render(<RoomPage />);

    await waitFor(() => {
      expect(screen.getByText('Creator')).toBeInTheDocument();
    });

    // Verify API calls
    expect(global.fetch).toHaveBeenCalledWith('/api/rooms/test-room-123');
    expect(global.fetch).toHaveBeenCalledWith('/api/rooms/test-room-123/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userType: 'host' })
    });
  });

  it('should handle participant joining via shared link', async () => {
    // Mock participant scenario (not room creator)
    mockSessionStorage.getItem.mockReturnValue(null);

    // Mock successful room check
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          room: { hasHost: true, hasParticipant: false }
        })
      })
      // Mock successful join
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          userId: 'user-456',
          userType: 'participant',
          room: { isReady: true, userCount: 2 }
        })
      });

    render(<RoomPage />);

    await waitFor(() => {
      expect(screen.getByText('2/2 connected')).toBeInTheDocument();
    });

    // Verify participant joined as participant
    expect(global.fetch).toHaveBeenCalledWith('/api/rooms/test-room-123/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userType: 'participant' })
    });
  });

  it('should handle room not found error', async () => {
    // Mock room not found
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<RoomPage />);

    await waitFor(() => {
      expect(screen.getByText(/Room not found/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('should handle room full error', async () => {
    // Mock room full scenario
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        room: { hasHost: true, hasParticipant: true }
      })
    });

    render(<RoomPage />);

    await waitFor(() => {
      expect(screen.getByText(/Room is full/)).toBeInTheDocument();
    });
  });

  it('should handle join API failure', async () => {
    // Mock successful room check but failed join
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          room: { hasHost: false, hasParticipant: false }
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'Server error'
        })
      });

    render(<RoomPage />);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('should show loading state during join process', async () => {
    // Mock delayed responses
    (global.fetch as jest.Mock)
      .mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            room: { hasHost: false, hasParticipant: false }
          })
        }), 100);
      }));

    render(<RoomPage />);

    // Should show connecting state
    expect(screen.getByText(/Connecting/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('should clean up session storage on successful join', async () => {
    // Mock room creator scenario
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'created_room_test-room-123') return 'true';
      return null;
    });

    // Mock successful flow
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          room: { hasHost: false, hasParticipant: false }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          userId: 'user-123',
          userType: 'host',
          room: { isReady: false, userCount: 1 }
        })
      });

    render(<RoomPage />);

    await waitFor(() => {
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('created_room_test-room-123');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('room_test-room-123_userId', 'user-123');
    });
  });
});
