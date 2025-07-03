'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RoomUser {
  id: string;
  userType: 'host' | 'participant';
  joinedAt: Date;
}

export interface RoomState {
  roomId: string;
  userCount: number;
  isReady: boolean;
  users: RoomUser[];
}

export interface UseSocketOptions {
  roomId?: string;
  userId?: string;
  userType?: 'host' | 'participant';
  onRoomUpdated?: (state: RoomState) => void;
  onUserSpeaking?: (data: { userId: string; userType: string; speaking: boolean }) => void;
  onAgentStatus?: (data: { speaking: boolean; message?: string }) => void;
  onSessionPhaseChanged?: (data: { phase: string }) => void;
  onRelationshipTypeDetected?: (data: { relationshipType: string }) => void;
  onWebRTCSignal?: (data: { userId: string; signal: any }) => void;
  onError?: (error: { message: string }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    roomId,
    userId,
    userType,
    onRoomUpdated,
    onUserSpeaking,
    onAgentStatus,
    onSessionPhaseChanged,
    onRelationshipTypeDetected,
    onWebRTCSignal,
    onError
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  // Use refs to avoid stale closures in event handlers
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      setIsJoined(false);
      setRoomState(null);
    });

    // Room event handlers
    socketInstance.on('joined-room', (data: {
      roomId: string;
      userId: string;
      userType: string;
      userCount: number;
      isReady: boolean;
    }) => {
      console.log('Joined room:', data);
      setIsJoined(true);
      setRoomState({
        roomId: data.roomId,
        userCount: data.userCount,
        isReady: data.isReady,
        users: []
      });
    });

    socketInstance.on('room-updated', (data: RoomState) => {
      console.log('Room updated:', data);
      setRoomState(data);
      optionsRef.current.onRoomUpdated?.(data);
    });

    socketInstance.on('user-speaking', (data: { userId: string; userType: string; speaking: boolean }) => {
      console.log('User speaking:', data);
      optionsRef.current.onUserSpeaking?.(data);
    });

    socketInstance.on('agent-status', (data: { speaking: boolean; message?: string }) => {
      console.log('Agent status:', data);
      optionsRef.current.onAgentStatus?.(data);
    });

    socketInstance.on('session-phase-changed', (data: { phase: string }) => {
      console.log('Session phase changed:', data);
      optionsRef.current.onSessionPhaseChanged?.(data);
    });

    socketInstance.on('relationship-type-detected', (data: { relationshipType: string }) => {
      console.log('Relationship type detected:', data);
      optionsRef.current.onRelationshipTypeDetected?.(data);
    });

    socketInstance.on('webrtc-signal', (data: { userId: string; signal: any }) => {
      console.log('WebRTC signal received:', data);
      optionsRef.current.onWebRTCSignal?.(data);
    });

    socketInstance.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      optionsRef.current.onError?.(error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Join room when socket is connected and room details are available
  useEffect(() => {
    if (socket && isConnected && roomId && userId && userType && !isJoined) {
      console.log(`Joining room ${roomId} as ${userType}`);
      socket.emit('join-room', { roomId, userId, userType });
    }
  }, [socket, isConnected, roomId, userId, userType, isJoined]);

  // Socket action functions
  const joinRoom = (roomId: string, userId: string, userType: 'host' | 'participant') => {
    if (socket && isConnected) {
      socket.emit('join-room', { roomId, userId, userType });
    }
  };

  const leaveRoom = () => {
    if (socket && isConnected) {
      socket.emit('leave-room');
      setIsJoined(false);
      setRoomState(null);
    }
  };

  const updateSpeakingStatus = (speaking: boolean) => {
    if (socket && isConnected && isJoined) {
      socket.emit('speaking-status', { speaking });
    }
  };

  const updateAgentSpeaking = (speaking: boolean, message?: string) => {
    if (socket && isConnected && isJoined) {
      socket.emit('agent-speaking', { speaking, message });
    }
  };

  const updateSessionPhase = (phase: string) => {
    if (socket && isConnected && isJoined) {
      socket.emit('session-phase-update', { phase });
    }
  };

  const updateRelationshipType = (relationshipType: string) => {
    if (socket && isConnected && isJoined) {
      socket.emit('relationship-type-update', { relationshipType });
    }
  };

  const sendWebRTCSignal = (signal: any, targetUserId?: string) => {
    if (socket && isConnected && isJoined) {
      socket.emit('webrtc-signal', { signal, targetUserId });
    }
  };

  return {
    socket,
    isConnected,
    isJoined,
    roomState,
    joinRoom,
    leaveRoom,
    updateSpeakingStatus,
    updateAgentSpeaking,
    updateSessionPhase,
    updateRelationshipType,
    sendWebRTCSignal
  };
}
