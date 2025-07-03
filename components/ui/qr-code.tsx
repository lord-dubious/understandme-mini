'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeComponent({ value, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !value) return;

      try {
        setError(null);
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        setError('Failed to generate QR code');
      }
    };

    generateQR();
  }, [value, size]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} 
           style={{ width: size, height: size }}>
        <span className="text-sm text-gray-500 dark:text-gray-400">QR Code Error</span>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className={`rounded-lg ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
