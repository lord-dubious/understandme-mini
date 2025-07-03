'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Shield, Clock } from 'lucide-react';

export default function LandingPage() {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      // Call API to create room
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();

      if (data.success) {
        // Mark this user as the room creator
        sessionStorage.setItem(`created_room_${data.roomId}`, 'true');

        // Navigate to the created room
        router.push(`/room/${data.roomId}`);
      } else {
        throw new Error(data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      setIsCreating(false);
      // TODO: Show error toast/notification
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Understand Me
              <span className="text-blue-600 dark:text-blue-400">Mini</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-4">
              A simple space for difficult conversations
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Get help from Udine, an AI mediator, to navigate disagreements and find mutual understanding.
              No accounts required, completely private, and disappears after use.
            </p>
          </div>

          {/* Main CTA */}
          <div className="mb-16">
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating}
              size="lg"
              className="text-lg px-8 py-6 h-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <MessageSquare className="mr-3 h-6 w-6" />
              {isCreating ? 'Creating Room...' : 'Create a Private Conversation Room'}
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <Shield className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Accounts Required</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start immediately without any sign-up process
              </p>
            </Card>

            <Card className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Completely Private</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No data storage, tracking, or conversation history
              </p>
            </Card>

            <Card className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Disappears After Use</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Temporary rooms that vanish when you close the tab
              </p>
            </Card>
          </div>

          {/* How It Works */}
          <div className="text-left max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              How It Works
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Create & Share</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click the button above to create a private room and share the link with the other person
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Meet Udine</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Once both people join, Udine (your AI mediator) will guide the conversation using proven mediation techniques
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Find Understanding</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Through structured dialogue and active listening, work toward mutual understanding and resolution
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
