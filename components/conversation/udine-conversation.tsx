'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/hooks/use-socket';
import { useWebRTC } from '@/hooks/use-webrtc';
import { getAudioStreamingService, cleanupAudioStreamingService } from '@/lib/audio-streaming';
import { getMediationService, resetMediationService, type MediationPhase } from '@/lib/mediation-flow';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  Radio
} from 'lucide-react';

// Types for the conversation state
type SessionPhase = 'prepare' | 'express' | 'understand' | 'resolve' | 'heal';
type RelationshipType = 'personal' | 'professional' | 'formal';

interface UdineConversationProps {
  roomId: string;
  userId?: string;
  userType?: 'host' | 'participant';
  onSessionPhaseChange?: (phase: SessionPhase) => void;
  onRelationshipTypeDetected?: (type: RelationshipType) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
  onUserCountChange?: (count: number) => void;
}

export default function UdineConversation({
  roomId,
  userId,
  userType,
  onSessionPhaseChange,
  onRelationshipTypeDetected,
  onConnectionStatusChange,
  onUserCountChange
}: UdineConversationProps) {
  // State management
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('prepare');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('personal');
  const [error, setError] = useState<string | null>(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [otherUserSpeaking, setOtherUserSpeaking] = useState(false);
  const [audioStreamingInitialized, setAudioStreamingInitialized] = useState(false);
  const [audioActivity, setAudioActivity] = useState(false);
  const [mediationPhase, setMediationPhase] = useState<MediationPhase>('greeting');
  const [mediationStarted, setMediationStarted] = useState(false);

  // WebSocket integration
  const {
    socket,
    isConnected,
    isJoined,
    roomState,
    updateSpeakingStatus,
    updateAgentSpeaking,
    updateSessionPhase,
    updateRelationshipType,
    sendWebRTCSignal
  } = useSocket({
    roomId,
    userId,
    userType,
    onRoomUpdated: (state) => {
      console.log('Room updated:', state);
      onUserCountChange?.(state.userCount);
      onConnectionStatusChange?.(state.isReady);
    },
    onUserSpeaking: (data) => {
      console.log('User speaking:', data);
      if (data.userId !== userId) {
        setOtherUserSpeaking(data.speaking);
      }
    },
    onAgentStatus: (data) => {
      console.log('Agent status:', data);
      setIsAgentSpeaking(data.speaking);
    },
    onSessionPhaseChanged: (data) => {
      console.log('Session phase changed:', data);
      setSessionPhase(data.phase as SessionPhase);
      onSessionPhaseChange?.(data.phase as SessionPhase);
    },
    onRelationshipTypeDetected: (data) => {
      console.log('Relationship type detected:', data);
      setRelationshipType(data.relationshipType as RelationshipType);
      onRelationshipTypeDetected?.(data.relationshipType as RelationshipType);
    },
    onWebRTCSignal: (data) => {
      console.log('WebRTC signal received:', data);
      webrtc.handleSignal(data);
    },
    onError: (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    }
  });

  // WebRTC integration
  const webrtc = useWebRTC({
    roomId,
    userId: userId || '',
    userType,
    isConnected: isConnected && isJoined,
    onSignal: (data) => {
      console.log('Sending WebRTC signal:', data);
      sendWebRTCSignal(data);
    },
    onError: (error) => {
      console.error('WebRTC error:', error);
      setError(`WebRTC: ${error.message}`);
    },
    onConnect: () => {
      console.log('WebRTC peer connected');
      setError(null);
    },
    onDisconnect: () => {
      console.log('WebRTC peer disconnected');
    },
    onStream: (stream) => {
      console.log('Received remote audio stream');
      // Handle remote audio stream
    },
    onLocalAudioStream: async (stream) => {
      console.log('Local audio stream available for ElevenLabs');
      try {
        const audioService = getAudioStreamingService({
          onError: (error) => setError(`Audio: ${error.message}`),
          onAudioActivity: (isActive) => {
            setAudioActivity(isActive);
            setIsUserSpeaking(isActive);
            updateSpeakingStatus(isActive);
          },
          onElevenLabsResponse: (audioData) => {
            console.log('Received ElevenLabs audio response');
            // Audio will be played automatically by the service
          }
        });

        if (!audioStreamingInitialized) {
          await audioService.initialize();
          setAudioStreamingInitialized(true);
        }

        audioService.connectLocalStream(stream);
      } catch (error) {
        console.error('Failed to setup audio streaming:', error);
        setError(`Audio setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    onRemoteAudioStream: (stream) => {
      console.log('Remote audio stream available');
      try {
        const audioService = getAudioStreamingService();
        audioService.connectRemoteStream(stream);
      } catch (error) {
        console.error('Failed to connect remote audio stream:', error);
        setError(`Remote audio failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  });

  // Process user speech for mediation
  const processUserSpeech = useCallback((text: string) => {
    if (mediationStarted && text.trim()) {
      console.log(`👤 Processing speech: "${text}"`);

      try {
        const mediationService = getMediationService();
        mediationService.processUserSpeech(text, userType);
      } catch (error) {
        console.error('Failed to process user speech:', error);
        setError(`Speech processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [mediationStarted, userType]);

  // Simulate speech recognition (in real implementation, use ElevenLabs transcription)
  const simulateUserSpeech = useCallback((text: string) => {
    console.log(`🎤 Simulating user speech: "${text}"`);
    processUserSpeech(text);
  }, [processUserSpeech]);

  // Client tools handlers for ElevenLabs integration
  const clientTools = {
    updateSessionPhase: useCallback((parameters: { phase: SessionPhase }) => {
      console.log('Session phase updated to:', parameters.phase);
      setSessionPhase(parameters.phase);
      onSessionPhaseChange?.(parameters.phase);
      // Broadcast to other users via WebSocket
      updateSessionPhase(parameters.phase);
      return { success: true, phase: parameters.phase };
    }, [onSessionPhaseChange, updateSessionPhase]),

    detectRelationshipType: useCallback((parameters: { relationshipType: RelationshipType }) => {
      console.log('Relationship type detected:', parameters.relationshipType);
      setRelationshipType(parameters.relationshipType);
      onRelationshipTypeDetected?.(parameters.relationshipType);
      // Broadcast to other users via WebSocket
      updateRelationshipType(parameters.relationshipType);
      return { success: true, relationshipType: parameters.relationshipType };
    }, [onRelationshipTypeDetected, updateRelationshipType])
  };

  // Initialize conversation
  const startConversation = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID) {
      setError('ElevenLabs Agent ID not configured');
      return;
    }

    if (!isConnected || !isJoined) {
      setError('Not connected to room');
      return;
    }

    setError(null);

    try {
      console.log('Starting conversation with agent:', process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID);
      console.log('Room ID:', roomId);
      console.log('Client tools configured:', Object.keys(clientTools));

      // Initialize mediation service
      const mediationService = getMediationService({
        onPhaseChange: (phase) => {
          setMediationPhase(phase);
          setSessionPhase(phase as SessionPhase);
          onSessionPhaseChange?.(phase as SessionPhase);
          updateSessionPhase(phase);
        },
        onUdineSpeak: (message, phase) => {
          console.log(`🤖 Udine (${phase}): ${message}`);
          updateAgentSpeaking(true, message);
          setIsAgentSpeaking(true);

          // Stop speaking after message duration (estimate)
          const duration = Math.max(3000, message.length * 50); // ~50ms per character
          setTimeout(() => {
            updateAgentSpeaking(false);
            setIsAgentSpeaking(false);
          }, duration);
        },
        onError: (error) => {
          console.error('Mediation error:', error);
          setError(`Mediation: ${error.message}`);
        }
      });

      // Start the mediation session
      mediationService.startSession();
      setMediationStarted(true);

    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to AI agent');
    }
  }, [roomId, clientTools, isConnected, isJoined, updateAgentSpeaking]);

  // Stop conversation
  const stopConversation = useCallback(() => {
    updateAgentSpeaking(false);
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
    setAudioActivity(false);

    // Cleanup audio streaming
    cleanupAudioStreamingService();
    setAudioStreamingInitialized(false);

    // Reset mediation service
    resetMediationService();
    setMediationStarted(false);
    setMediationPhase('greeting');

    console.log('Conversation ended');
  }, [updateAgentSpeaking]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // Update audio streaming service
    if (audioStreamingInitialized) {
      const audioService = getAudioStreamingService();
      audioService.setMuted(newMutedState);
    }

    // Update speaking status when muting/unmuting
    if (newMutedState) {
      updateSpeakingStatus(false);
      setIsUserSpeaking(false);
      setAudioActivity(false);
    }
    console.log('Microphone', newMutedState ? 'muted' : 'unmuted');
  }, [isMuted, updateSpeakingStatus, audioStreamingInitialized]);

  // Toggle volume
  const toggleVolume = useCallback(() => {
    const newVolumeState = !isVolumeOn;
    setIsVolumeOn(newVolumeState);

    // Update audio streaming service
    if (audioStreamingInitialized) {
      const audioService = getAudioStreamingService();
      audioService.setVolume(newVolumeState ? 1.0 : 0.0);
    }

    console.log('Volume', newVolumeState ? 'enabled' : 'disabled');
  }, [isVolumeOn, audioStreamingInitialized]);

  // Get phase display text
  const getPhaseText = (phase: SessionPhase) => {
    switch (phase) {
      case 'prepare': return 'Preparing';
      case 'express': return 'Expressing';
      case 'understand': return 'Understanding';
      case 'resolve': return 'Resolving';
      case 'heal': return 'Healing';
      default: return 'In Progress';
    }
  };

  // Get relationship type display text
  const getRelationshipText = (type: RelationshipType) => {
    switch (type) {
      case 'personal': return 'Personal';
      case 'professional': return 'Professional';
      case 'formal': return 'Formal';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Mediator (Udine)
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected && isJoined ? 'bg-green-500' : isConnected ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected && isJoined ? 'Connected to Room' : isConnected ? 'Connecting to Room...' : 'Disconnected'}
            </span>
            {isConnected && !isJoined && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {(!isConnected || !isJoined) && (
          <Button
            onClick={startConversation}
            className="w-full"
            disabled={!isConnected}
          >
            {!isConnected ? 'Connecting to Room...' : 'Start AI-Guided Conversation'}
          </Button>
        )}

        {isConnected && isJoined && (
          <Button onClick={stopConversation} variant="destructive" className="w-full">
            End Conversation
          </Button>
        )}
      </Card>

      {/* Session Progress */}
      {isConnected && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Session Progress
            </h3>
            <div className="flex space-x-2">
              <Badge variant="secondary">
                {getPhaseText(sessionPhase)}
              </Badge>
              <Badge variant="outline">
                {getRelationshipText(relationshipType)}
              </Badge>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {(['prepare', 'express', 'understand', 'resolve', 'heal'] as SessionPhase[]).map((phase, index) => (
              <div
                key={phase}
                className={`flex-1 h-2 rounded-full ${
                  index <= (['prepare', 'express', 'understand', 'resolve', 'heal'] as SessionPhase[]).indexOf(sessionPhase)
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Speaking Status */}
      {isConnected && isJoined && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Speaking Status
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 transition-all ${
              isAgentSpeaking
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Udine (AI)</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {isAgentSpeaking ? 'Speaking...' : 'Listening'}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 transition-all ${
              isUserSpeaking || audioActivity
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">You</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {isUserSpeaking || audioActivity ? 'Speaking...' : isMuted ? 'Muted' : 'Listening'}
                  {audioActivity && (
                    <div className="mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 transition-all ${
              otherUserSpeaking
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Other Person</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {otherUserSpeaking ? 'Speaking...' : roomState?.userCount === 2 ? 'Listening' : 'Not connected'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* WebRTC Connection Status */}
      {isConnected && isJoined && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Audio Connection
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Radio className={`h-5 w-5 ${
                webrtc.connectionState === 'connected' ? 'text-green-500' :
                webrtc.connectionState === 'connecting' ? 'text-yellow-500' :
                webrtc.connectionState === 'failed' ? 'text-red-500' : 'text-gray-400'
              }`} />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  WebRTC Status
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {webrtc.connectionState === 'connected' ? 'Direct audio connection established' :
                   webrtc.connectionState === 'connecting' ? 'Establishing audio connection...' :
                   webrtc.connectionState === 'failed' ? 'Audio connection failed' : 'No audio connection'}
                </div>
              </div>
            </div>
            {webrtc.connectionState === 'connecting' && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            )}
          </div>
          {webrtc.error && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
              {webrtc.error}
            </div>
          )}
        </Card>
      )}

      {/* Mediation Status */}
      {isConnected && isJoined && mediationStarted && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mediation Progress
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Current Phase:
              </span>
              <Badge variant="outline" className="capitalize">
                {mediationPhase}
              </Badge>
            </div>

            {/* Test Speech Input (Development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Speech Input (Development)
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => simulateUserSpeech("My name is Alex")}
                  >
                    Test Name
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => simulateUserSpeech("I feel frustrated about this situation")}
                  >
                    Test Express
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => simulateUserSpeech("What I heard you say was that you're feeling overwhelmed")}
                  >
                    Test Reflect
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Audio Controls */}
      {isConnected && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Audio Controls
          </h3>

          {/* Primary Controls */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "outline"}
              className={`relative transition-all duration-200 ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isMuted ? 'Unmute' : 'Mute'}
              {audioActivity && !isMuted && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </Button>

            <Button
              onClick={toggleVolume}
              variant={!isVolumeOn ? "destructive" : "outline"}
              className={`transition-all duration-200 ${
                !isVolumeOn ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label={isVolumeOn ? 'Turn volume off' : 'Turn volume on'}
            >
              {isVolumeOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
              {isVolumeOn ? 'Volume On' : 'Volume Off'}
            </Button>
          </div>

          {/* Audio Status Indicators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Microphone Status:</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isMuted ? 'bg-red-500' : audioActivity ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className={`font-medium ${
                  isMuted ? 'text-red-600 dark:text-red-400' :
                  audioActivity ? 'text-green-600 dark:text-green-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {isMuted ? 'Muted' : audioActivity ? 'Active' : 'Ready'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Audio Output:</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isVolumeOn ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                <span className={`font-medium ${
                  isVolumeOn ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {isVolumeOn ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {audioStreamingInitialized && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Audio Processing:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Active
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Audio Level Visualization */}
          {audioActivity && !isMuted && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center space-x-2">
                <Mic className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Audio detected - You're speaking
                </span>
                <div className="flex space-x-1 ml-auto">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-4 rounded-full ${
                        i < 3 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      } animate-pulse`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Development Info
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>Room ID: {roomId}</div>
            <div>Agent ID: {process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'Not configured'}</div>
            <div>Session Phase: {sessionPhase}</div>
            <div>Relationship Type: {relationshipType}</div>
            <div>Client Tools: {Object.keys(clientTools).join(', ')}</div>
          </div>
        </Card>
      )}
    </div>
  );
}
