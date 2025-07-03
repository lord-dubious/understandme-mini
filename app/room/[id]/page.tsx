'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { QRCodeComponent } from '@/components/ui/qr-code';
import UdineConversation from '@/components/conversation/udine-conversation';
import {
  Copy,
  QrCode,
  Users,
  LogOut,
  Loader2,
  AlertCircle
} from 'lucide-react';

type ConnectionStatus = 'connecting' | 'waiting' | 'connected' | 'disconnected';
type SessionPhase = 'prepare' | 'express' | 'understand' | 'resolve' | 'heal';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  // State management
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('prepare');
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [otherUserSpeaking, setOtherUserSpeaking] = useState(false);
  const [roomUrl, setRoomUrl] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'host' | 'participant'>('participant');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [showConnectionSuccess, setShowConnectionSuccess] = useState(false);

  useEffect(() => {
    // Set the room URL for sharing
    setRoomUrl(`${window.location.origin}/room/${roomId}`);

    // Join the room when component mounts
    const joinRoom = async () => {
      try {
        setIsJoining(true);
        setJoinError(null);
        setConnectionStatus('connecting');

        // Check if we're the room creator (came from room creation flow)
        const isCreator = sessionStorage.getItem(`created_room_${roomId}`) === 'true';
        setIsRoomCreator(isCreator);

        // First, check if room exists
        const roomCheckResponse = await fetch(`/api/rooms/${roomId}`);

        if (!roomCheckResponse.ok) {
          if (roomCheckResponse.status === 404) {
            throw new Error('Room not found. The room may have expired or the link is invalid.');
          }
          throw new Error('Failed to check room status');
        }

        const roomData = await roomCheckResponse.json();

        if (!roomData.success) {
          throw new Error(roomData.error || 'Room is not available');
        }

        // Determine user type based on room state and creator status
        let requestedUserType: 'host' | 'participant' = 'participant';

        if (isCreator && !roomData.room.hasHost) {
          requestedUserType = 'host';
        } else if (!isCreator && !roomData.room.hasParticipant) {
          requestedUserType = 'participant';
        } else if (roomData.room.hasHost && roomData.room.hasParticipant) {
          throw new Error('Room is full. Only two people can join a conversation.');
        }

        // Join the room
        const joinResponse = await fetch(`/api/rooms/${roomId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userType: requestedUserType
          }),
        });

        if (!joinResponse.ok) {
          const errorData = await joinResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to join room');
        }

        const joinData = await joinResponse.json();

        if (joinData.success) {
          setConnectionStatus(joinData.room.isReady ? 'connected' : 'waiting');
          setConnectedUsers(joinData.room.userCount);
          setUserId(joinData.userId);
          setUserType(joinData.userType);

          // Store user ID for cleanup on unmount
          sessionStorage.setItem(`room_${roomId}_userId`, joinData.userId);

          // Clear the room creator flag since we've successfully joined
          if (isCreator) {
            sessionStorage.removeItem(`created_room_${roomId}`);
          }

          console.log(`Joined room ${roomId} as ${joinData.userType} (${joinData.room.userCount}/2 users)`);
        } else {
          throw new Error(joinData.error || 'Failed to join room');
        }

      } catch (error) {
        console.error('Failed to join room:', error);
        setConnectionStatus('disconnected');
        setJoinError(error instanceof Error ? error.message : 'Failed to join room');
      } finally {
        setIsJoining(false);
      }
    };

    joinRoom();

    // Cleanup: Leave room when component unmounts
    return () => {
      const userId = sessionStorage.getItem(`room_${roomId}_userId`);
      if (userId) {
        fetch(`/api/rooms/${roomId}/join`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }).catch(console.error);

        sessionStorage.removeItem(`room_${roomId}_userId`);
      }
    };
  }, [roomId]);

  // Monitor connection status changes and provide user feedback
  useEffect(() => {
    if (connectionStatus === 'connected' && connectedUsers >= 2) {
      console.log('🎉 Both users are now connected! Ready for conversation.');

      // Show success state briefly
      setShowConnectionSuccess(true);
      setTimeout(() => setShowConnectionSuccess(false), 3000);

    } else if (connectionStatus === 'waiting' && connectedUsers === 1) {
      console.log('⏳ Waiting for the other person to join...');
      setShowConnectionSuccess(false);
    }
  }, [connectionStatus, connectedUsers]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      console.log('Link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for browsers that don't support clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = roomUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
    }
  };

  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
  };

  const handleLeaveRoom = async () => {
    try {
      const userId = sessionStorage.getItem(`room_${roomId}_userId`);
      if (userId) {
        await fetch(`/api/rooms/${roomId}/join`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        sessionStorage.removeItem(`room_${roomId}_userId`);
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
    } finally {
      router.push('/');
    }
  };



  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connecting': return 'bg-yellow-500';
      case 'waiting': return 'bg-blue-500';
      case 'connected': return connectedUsers >= 2 ? 'bg-green-500 animate-pulse' : 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case 'connecting': return 'Connecting...';
      case 'waiting': return connectedUsers === 1 ? 'Waiting for other person to join...' : 'Waiting...';
      case 'connected': return connectedUsers >= 2 ? 'Both users connected - Ready for conversation!' : 'Connected';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Conversation Room
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Room ID: {roomId}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLeaveRoom}
            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Leave Room
          </Button>
        </div>

        {/* Connection Status */}
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)}`} />
              <span className="font-medium text-gray-900 dark:text-white">
                {getStatusText(connectionStatus)}
                {isJoining && ' (Joining room...)'}
              </span>
              {(connectionStatus === 'connecting' || isJoining) && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {connectedUsers}/2 connected
                {isRoomCreator && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Creator</span>}
              </span>
            </div>
          </div>

          {/* Success Display */}
          {showConnectionSuccess && connectedUsers >= 2 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-800 dark:text-green-200 font-medium">
                  🎉 Both users connected! You can now start your conversation with Udine's guidance.
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {joinError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-200">{joinError}</span>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          )}
        </Card>

        {/* Waiting State - Show sharing options */}
        {connectionStatus === 'waiting' && (
          <Card className="mb-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Share this room with the other person
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={roomUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  variant={copySuccess ? "default" : "outline"}
                  className={copySuccess ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copySuccess ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleQRCode}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                </Button>
              </div>

              {/* QR Code Display */}
              {showQRCode && (
                <div className="flex flex-col items-center space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Scan this QR code to join the room
                  </p>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    {/* <QRCodeComponent value={roomUrl} size={200} /> */}
                    <div className="w-[200px] h-[200px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-sm text-gray-500">QR Code Placeholder</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 text-center max-w-xs">
                    The other person can scan this code with their phone camera to join instantly
                  </p>
                </div>
              )}

              {/* Sharing Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  How to share:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Copy the link and send it via text, email, or messaging app</li>
                  <li>• Show the QR code for them to scan with their phone</li>
                  <li>• Both people need to be in the room for Udine to start</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Session Progress - Show when connected */}
        {connectionStatus === 'connected' && (
          <Card className="mb-8 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Session Progress
              </h3>
              <Badge variant="secondary">
                {getPhaseText(sessionPhase)}
              </Badge>
            </div>
            <div className="mt-4 flex space-x-2">
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

        {/* Speaking Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className={`p-6 transition-all ${isSpeaking ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                isSpeaking ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                <Users className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">You</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isSpeaking ? 'Speaking...' : 'Listening'}
              </p>
            </div>
          </Card>

          <Card className={`p-6 transition-all ${otherUserSpeaking ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                otherUserSpeaking ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                <Users className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Other Person</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {connectedUsers < 2 ? 'Not connected' : otherUserSpeaking ? 'Speaking...' : 'Listening'}
              </p>
            </div>
          </Card>
        </div>

        {/* AI Conversation Component */}
        {userId && (
          <UdineConversation
            roomId={roomId}
            userId={userId}
            userType={userType}
            onSessionPhaseChange={(phase) => setSessionPhase(phase)}
            onConnectionStatusChange={(connected) => {
              setConnectionStatus(connected ? 'connected' : 'waiting');
            }}
            onUserCountChange={(count) => {
              setConnectedUsers(count);
              // Update connection status based on user count
              if (count >= 2) {
                setConnectionStatus('connected');
              } else if (count === 1) {
                setConnectionStatus('waiting');
              }
            }}
          />
        )}

        {/* Instructions */}
        {connectionStatus === 'waiting' && (
          <Card className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Share the room link with the other person</li>
              <li>• Once they join, Udine (your AI mediator) will begin the session</li>
              <li>• Follow Udine's guidance for a structured, productive conversation</li>
              <li>• The room will disappear when you both leave</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
