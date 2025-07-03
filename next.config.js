/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow development origins for cross-origin requests
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '0.0.0.0:3000',
    // Add any other development origins you need
  ],
  
  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              // Default source - only allow same origin
              "default-src 'self'",

              // Scripts - allow self, Next.js, and inline scripts with nonce
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",

              // Styles - allow self, inline styles, and external CSS
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              // Images - allow self, data URLs, and external images
              "img-src 'self' data: blob: https:",

              // Fonts - allow self and Google Fonts
              "font-src 'self' https://fonts.gstatic.com",

              // Connect - allow self, WebSocket, ElevenLabs, and STUN/TURN servers
              "connect-src 'self' ws: wss: https://api.elevenlabs.io https://*.elevenlabs.io https://stun.l.google.com:19302 https://global.stun.twilio.com:3478",

              // Media - allow self and blob URLs for WebRTC
              "media-src 'self' blob: data:",

              // Objects - disallow
              "object-src 'none'",

              // Base URI - restrict to self
              "base-uri 'self'",

              // Form actions - allow self
              "form-action 'self'",

              // Frame ancestors - deny (same as X-Frame-Options)
              "frame-ancestors 'none'",

              // Upgrade insecure requests in production
              process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : "",
            ].filter(Boolean).join('; '),
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    // Enable any experimental features you need
  },

  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_ELEVENLABS_AGENT_ID: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
  },
};

module.exports = nextConfig;
