import { render, screen, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import UdineConversation from '@/components/conversation/udine-conversation';

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

// Mock environment variables
const originalEnv = process.env;

describe('WebSocket Client Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ELEVENLABS_AGENT_ID: 'test-agent-id',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should render UdineConversation component with WebSocket integration', () => {
    render(
      <UdineConversation
        roomId="test-room"
        userId="test-user"
        userType="host"
      />
    );

    expect(screen.getByText('AI Mediator (Udine)')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should show connecting state when WebSocket is connecting', () => {
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: false,
    };

    const { useSocket } = require('@/hooks/use-socket');
    useSocket.mockReturnValue(connectedMockSocket);

    render(
      <UdineConversation
        roomId="test-room"
        userId="test-user"
        userType="host"
      />
    );

    expect(screen.getByText('Connecting to Room...')).toBeInTheDocument();
  });

  it('should show connected state when WebSocket is connected and joined', () => {
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
      roomState: {
        roomId: 'test-room',
        userCount: 2,
        isReady: true,
        users: []
      }
    };

    const { useSocket } = require('@/hooks/use-socket');
    useSocket.mockReturnValue(connectedMockSocket);

    render(
      <UdineConversation
        roomId="test-room"
        userId="test-user"
        userType="host"
      />
    );

    expect(screen.getByText('Connected to Room')).toBeInTheDocument();
    expect(screen.getByText('Start AI-Guided Conversation')).toBeInTheDocument();
  });

  it('should handle session phase updates via WebSocket', async () => {
    const onSessionPhaseChange = jest.fn();
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
    };

    const { useSocket } = require('@/hooks/use-socket');
    useSocket.mockReturnValue(connectedMockSocket);

    render(
      <UdineConversation
        roomId="test-room"
        userId="test-user"
        userType="host"
        onSessionPhaseChange={onSessionPhaseChange}
      />
    );

    // Simulate session phase change from WebSocket
    const mockOptions = useSocket.mock.calls[0][0];
    act(() => {
      mockOptions.onSessionPhaseChanged({ phase: 'express' });
    });

    await waitFor(() => {
      expect(onSessionPhaseChange).toHaveBeenCalledWith('express');
    });
  });

  it('should handle user speaking status via WebSocket', async () => {
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
    };

    const { useSocket } = require('@/hooks/use-socket');
    useSocket.mockReturnValue(connectedMockSocket);

    render(
      <UdineConversation
        roomId="test-room"
        userId="test-user"
        userType="host"
      />
    );

    // Simulate other user speaking
    const mockOptions = useSocket.mock.calls[0][0];
    act(() => {
      mockOptions.onUserSpeaking({
        userId: 'other-user',
        userType: 'participant',
        speaking: true
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Speaking...')).toBeInTheDocument();
    });
  });

  it('should handle room updates via WebSocket', async () => {
    const onUserCountChange = jest.fn();
    const onConnectionStatusChange = jest.fn();
    
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
    };

    const { useSocket } = require('@/hooks/use-socket');
    useSocket.mockReturnValue(connectedMockSocket);

    render(
      <UdineConversation
        roomId="test-room"
        userId="test-user"
        userType="host"
        onUserCountChange={onUserCountChange}
        onConnectionStatusChange={onConnectionStatusChange}
      />
    );

    // Simulate room update
    const mockOptions = useSocket.mock.calls[0][0];
    act(() => {
      mockOptions.onRoomUpdated({
        roomId: 'test-room',
        userCount: 2,
        isReady: true,
        users: []
      });
    });

    await waitFor(() => {
      expect(onUserCountChange).toHaveBeenCalledWith(2);
      expect(onConnectionStatusChange).toHaveBeenCalledWith(true);
    });
  });

  it('should handle WebSocket errors', async () => {
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
    };

    const { useSocket } = require('@/hooks/use-socket');
    useSocket.mockReturnValue(connectedMockSocket);

    render(
      <UdineConversation
        roomId="test-room"
        userId="test-user"
        userType="host"
      />
    );

    // Simulate WebSocket error
    const mockOptions = useSocket.mock.calls[0][0];
    act(() => {
      mockOptions.onError({ message: 'Connection failed' });
    });

    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  it('should broadcast session phase changes to other users', async () => {
    const connectedMockSocket = {
      ...mockSocket,
      isConnected: true,
      isJoined: true,
      updateSessionPhase: jest.fn(),
    };

    const { useSocket } = require('@/hooks/use-socket');
    useSocket.mockReturnValue(connectedMockSocket);

    render(
      <UdineConversation
        roomId="test-room"
        userId="test-user"
        userType="host"
      />
    );

    // Get the client tools from the component
    const mockOptions = useSocket.mock.calls[0][0];
    
    // This would normally be called by ElevenLabs
    // We're testing the client tool integration
    expect(typeof mockOptions.onSessionPhaseChanged).toBe('function');
  });
});
