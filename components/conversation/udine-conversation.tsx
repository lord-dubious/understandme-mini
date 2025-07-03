'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/hooks/use-socket';
import { useWebRTC } from '@/hooks/use-webrtc';
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

  // WebSocket integration
  const {
    socket,
    isConnected,
    isJoined,
    roomState,
    updateSpeakingStatus,
    updateAgentSpeaking,
    updateSessionPhase,
    updateRelationshipType
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
    onError: (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    }
  });

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
      // For now, we'll simulate the connection since we need the actual ElevenLabs React SDK
      // In a real implementation, this would use the @elevenlabs/react Conversation component

      console.log('Starting conversation with agent:', process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID);
      console.log('Room ID:', roomId);
      console.log('Client tools configured:', Object.keys(clientTools));

      // Simulate Udine starting the conversation
      updateAgentSpeaking(true, 'Welcome to the room. I am Udine, your impartial guide for this conversation...');

      setTimeout(() => {
        updateAgentSpeaking(false);
      }, 5000);

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
    console.log('Conversation ended');
  }, [updateAgentSpeaking]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    // Update speaking status when muting/unmuting
    if (newMutedState) {
      updateSpeakingStatus(false);
      setIsUserSpeaking(false);
    }
    console.log('Microphone', newMutedState ? 'muted' : 'unmuted');
  }, [isMuted, updateSpeakingStatus]);

  // Toggle volume
  const toggleVolume = useCallback(() => {
    setIsVolumeOn(!isVolumeOn);
    console.log('Volume', !isVolumeOn ? 'enabled' : 'disabled');
  }, [isVolumeOn]);

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
              isUserSpeaking
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">You</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {isUserSpeaking ? 'Speaking...' : 'Listening'}
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

      {/* Audio Controls */}
      {isConnected && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Audio Controls
          </h3>
          <div className="flex space-x-4">
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "outline"}
              className="flex-1"
            >
              {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            
            <Button
              onClick={toggleVolume}
              variant={!isVolumeOn ? "destructive" : "outline"}
              className="flex-1"
            >
              {isVolumeOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
              {isVolumeOn ? 'Volume On' : 'Volume Off'}
            </Button>
          </div>
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
