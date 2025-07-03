import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';

interface WebRTCOptions {
  roomId: string;
  userId: string;
  userType: 'host' | 'participant';
  isConnected: boolean;
  onSignal: (data: any) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onStream?: (stream: MediaStream) => void;
  onLocalAudioStream?: (stream: MediaStream) => void;
  onRemoteAudioStream?: (stream: MediaStream) => void;
}

interface WebRTCState {
  peer: SimplePeer.Instance | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isInitiator: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'failed';
  error: string | null;
}

export function useWebRTC(options: WebRTCOptions) {
  const {
    roomId,
    userId,
    userType,
    isConnected,
    onSignal,
    onError,
    onConnect,
    onDisconnect,
    onStream,
    onLocalAudioStream,
    onRemoteAudioStream
  } = options;

  const [state, setState] = useState<WebRTCState>({
    peer: null,
    localStream: null,
    remoteStream: null,
    isConnected: false,
    isInitiator: userType === 'host',
    connectionState: 'disconnected',
    error: null,
  });

  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Get user media (microphone)
  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false, // Audio only for now
      });

      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream }));

      // Notify about local audio stream for ElevenLabs integration
      onLocalAudioStream?.(stream);

      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to access microphone';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(error instanceof Error ? error : new Error(errorMsg));
      throw error;
    }
  }, [onError]);

  // Initialize peer connection
  const initializePeer = useCallback(async () => {
    if (!isConnected || peerRef.current) {
      return;
    }

    try {
      setState(prev => ({ ...prev, connectionState: 'connecting', error: null }));

      // Get local media stream
      const stream = await getUserMedia();

      // Configure STUN/TURN servers
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ];

      // Add TURN servers if configured
      if (process.env.NEXT_PUBLIC_TURN_SERVER_URL && process.env.NEXT_PUBLIC_TURN_SERVER_USERNAME) {
        iceServers.push({
          urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
          username: process.env.NEXT_PUBLIC_TURN_SERVER_USERNAME,
          credential: process.env.NEXT_PUBLIC_TURN_SERVER_CREDENTIAL || '',
        } as RTCIceServer);
      }

      // Create peer instance
      const peer = new SimplePeer({
        initiator: state.isInitiator,
        trickle: true,
        stream: stream,
        config: {
          iceServers,
        },
      });

      // Handle peer events
      peer.on('signal', (data) => {
        console.log('WebRTC signal:', data);
        onSignal({
          type: 'webrtc-signal',
          roomId,
          userId,
          signal: data,
        });
      });

      peer.on('connect', () => {
        console.log('WebRTC peer connected');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          connectionState: 'connected',
          error: null 
        }));
        onConnect?.();
      });

      peer.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        setState(prev => ({ ...prev, remoteStream }));
        onStream?.(remoteStream);
        onRemoteAudioStream?.(remoteStream);
      });

      peer.on('error', (error) => {
        console.error('WebRTC peer error:', error);
        setState(prev => ({ 
          ...prev, 
          connectionState: 'failed',
          error: error.message 
        }));
        onError?.(error);
      });

      peer.on('close', () => {
        console.log('WebRTC peer connection closed');
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          connectionState: 'disconnected',
          remoteStream: null 
        }));
        onDisconnect?.();
      });

      peerRef.current = peer;
      setState(prev => ({ ...prev, peer }));

    } catch (error) {
      console.error('Failed to initialize peer:', error);
      setState(prev => ({ 
        ...prev, 
        connectionState: 'failed',
        error: error instanceof Error ? error.message : 'Failed to initialize peer connection'
      }));
      onError?.(error instanceof Error ? error : new Error('Failed to initialize peer connection'));
    }
  }, [isConnected, state.isInitiator, roomId, userId, onSignal, onConnect, onDisconnect, onStream, onError, getUserMedia]);

  // Handle incoming WebRTC signals
  const handleSignal = useCallback((signalData: any) => {
    if (peerRef.current && signalData.signal) {
      try {
        console.log('Processing WebRTC signal:', signalData);
        peerRef.current.signal(signalData.signal);
      } catch (error) {
        console.error('Failed to process WebRTC signal:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to process signal'));
      }
    }
  }, [onError]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setState({
      peer: null,
      localStream: null,
      remoteStream: null,
      isConnected: false,
      isInitiator: userType === 'host',
      connectionState: 'disconnected',
      error: null,
    });
  }, [userType]);

  // Initialize peer when connected
  useEffect(() => {
    if (isConnected && !peerRef.current) {
      initializePeer();
    }
  }, [isConnected, initializePeer]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...state,
    initializePeer,
    handleSignal,
    cleanup,
    getUserMedia,
  };
}
