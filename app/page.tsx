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
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div className="container mx-auto px-4 py-8 sm:py-16 lg:py-24" id="main-content">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <header className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Understand Me
              <span className="text-blue-600 dark:text-blue-400">Mini</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
              A simple space for difficult conversations
            </p>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Get help from Udine, an AI mediator, to navigate disagreements and find mutual understanding.
              No accounts required, completely private, and disappears after use.
            </p>
          </header>

          {/* Main CTA */}
          <div className="mb-12 sm:mb-16">
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating}
              size="lg"
              className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200"
              aria-label={isCreating ? 'Creating conversation room, please wait' : 'Create a new private conversation room'}
            >
              <MessageSquare className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              <span className="hidden sm:inline">{isCreating ? 'Creating Room...' : 'Create a Private Conversation Room'}</span>
              <span className="sm:hidden">{isCreating ? 'Creating...' : 'Create Room'}</span>
            </Button>
          </div>

          {/* Trust Indicators */}
          <section className="mb-12 sm:mb-16" aria-labelledby="trust-indicators">
            <h2 id="trust-indicators" className="sr-only">Privacy and Security Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 mx-auto mb-2 sm:mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">No Accounts Required</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Start immediately without any sign-up process
                </p>
              </Card>

              <Card className="p-4 sm:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2 sm:mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">Completely Private</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  No data storage, tracking, or conversation history
                </p>
              </Card>

              <Card className="p-4 sm:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 sm:col-span-2 lg:col-span-1">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2 sm:mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">Disappears After Use</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Temporary rooms that vanish when you close the tab
                </p>
              </Card>
            </div>
          </section>

          {/* How It Works */}
          <section className="text-left max-w-3xl mx-auto px-4" aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
              How It Works
            </h2>
            <ol className="space-y-4 sm:space-y-6" role="list">
              <li className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base" aria-hidden="true">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Create & Share</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    Click the button above to create a private room and share the link with the other person
                  </p>
                </div>
              </li>

              <li className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base" aria-hidden="true">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Meet Udine</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    Once both people join, Udine (your AI mediator) will guide the conversation using proven mediation techniques
                  </p>
                </div>
              </li>

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
