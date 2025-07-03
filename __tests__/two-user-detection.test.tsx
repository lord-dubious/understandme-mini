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

describe('Two User Detection & Connection Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    (global.fetch as jest.Mock).mockClear();
  });

  it('should show waiting state when only one user is connected', async () => {
    // Mock successful join with 1 user
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
      expect(screen.getByText(/Waiting for other person to join/)).toBeInTheDocument();
      expect(screen.getByText('1/2 connected')).toBeInTheDocument();
    });
  });

  it('should transition to connected state when second user joins', async () => {
    // Mock successful join with 1 user initially
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

    const { useSocket } = require('@/hooks/use-socket');
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
    };
    useSocket.mockReturnValue(connectedMockSocket);

    render(<RoomPage />);

    // Wait for initial state
    await waitFor(() => {
      expect(screen.getByText('1/2 connected')).toBeInTheDocument();
    });

    // Simulate second user joining via WebSocket
    const mockOptions = useSocket.mock.calls[0][0];
    act(() => {
      mockOptions.onUserCountChange(2);
    });

    await waitFor(() => {
      expect(screen.getByText('2/2 connected')).toBeInTheDocument();
      expect(screen.getByText(/Both users connected - Ready for conversation!/)).toBeInTheDocument();
    });
  });

  it('should show success notification when both users connect', async () => {
    // Mock successful join
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

    const { useSocket } = require('@/hooks/use-socket');
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
    };
    useSocket.mockReturnValue(connectedMockSocket);

    render(<RoomPage />);

    // Simulate both users connecting
    const mockOptions = useSocket.mock.calls[0][0];
    act(() => {
      mockOptions.onUserCountChange(2);
    });

    await waitFor(() => {
      expect(screen.getByText(/🎉 Both users connected!/)).toBeInTheDocument();
    });
  });

  it('should handle user disconnection gracefully', async () => {
    // Mock successful join with 2 users initially
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          room: { hasHost: true, hasParticipant: false }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          userId: 'user-456',
          userType: 'participant',
          room: { isReady: true, userCount: 2 }
        })
      });

    const { useSocket } = require('@/hooks/use-socket');
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
    };
    useSocket.mockReturnValue(connectedMockSocket);

    render(<RoomPage />);

    // Wait for initial connected state
    await waitFor(() => {
      expect(screen.getByText('2/2 connected')).toBeInTheDocument();
    });

    // Simulate user disconnection
    const mockOptions = useSocket.mock.calls[0][0];
    act(() => {
      mockOptions.onUserCountChange(1);
    });

    await waitFor(() => {
      expect(screen.getByText('1/2 connected')).toBeInTheDocument();
      expect(screen.getByText(/Waiting for other person to join/)).toBeInTheDocument();
    });
  });

  it('should show different status colors based on connection state', async () => {
    // Mock successful join
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

    const { useSocket } = require('@/hooks/use-socket');
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
    };
    useSocket.mockReturnValue(connectedMockSocket);

    const { container } = render(<RoomPage />);

    // Check waiting state color (blue)
    await waitFor(() => {
      const statusIndicator = container.querySelector('.bg-blue-500');
      expect(statusIndicator).toBeInTheDocument();
    });

    // Simulate both users connecting
    const mockOptions = useSocket.mock.calls[0][0];
    act(() => {
      mockOptions.onUserCountChange(2);
    });

    // Check connected state color (green with pulse)
    await waitFor(() => {
      const statusIndicator = container.querySelector('.bg-green-500.animate-pulse');
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  it('should hide success notification after timeout', async () => {
    jest.useFakeTimers();

    // Mock successful join
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

    const { useSocket } = require('@/hooks/use-socket');
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
    };
    useSocket.mockReturnValue(connectedMockSocket);

    render(<RoomPage />);

    // Simulate both users connecting
    const mockOptions = useSocket.mock.calls[0][0];
    act(() => {
      mockOptions.onUserCountChange(2);
    });

    // Success notification should be visible
    await waitFor(() => {
      expect(screen.getByText(/🎉 Both users connected!/)).toBeInTheDocument();
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Success notification should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/🎉 Both users connected!/)).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
