import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = 'test-agent-id'

// Mock Socket.IO client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  })),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    id: 'test-room-id',
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock QR code library
jest.mock('qrcode', () => ({
  toCanvas: jest.fn(),
}))

// Suppress console warnings in tests
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) {
    return
  }
  originalConsoleWarn(...args)
}
