/**
 * Audio Streaming Service
 * Handles audio streaming between WebRTC and ElevenLabs
 */

export interface AudioStreamingOptions {
  onError?: (error: Error) => void;
  onAudioActivity?: (isActive: boolean) => void;
  onElevenLabsResponse?: (audioData: ArrayBuffer) => void;
}

export class AudioStreamingService {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isListening = false;
  private activityThreshold = 30; // Audio activity threshold
  private activityCheckInterval: NodeJS.Timeout | null = null;

  constructor(private options: AudioStreamingOptions = {}) {}

  /**
   * Initialize audio context and processing
   */
  async initialize(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('🎵 Audio streaming service initialized');
    } catch (error) {
      console.error('Failed to initialize audio streaming:', error);
      this.options.onError?.(error instanceof Error ? error : new Error('Audio initialization failed'));
      throw error;
    }
  }

  /**
   * Connect local audio stream from WebRTC
   */
  connectLocalStream(stream: MediaStream): void {
    try {
      this.localStream = stream;

      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // Create audio source from microphone
      this.microphone = this.audioContext.createMediaStreamSource(stream);

      // Create analyser for audio activity detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect microphone to analyser
      this.microphone.connect(this.analyser);

      // Start monitoring audio activity
      this.startActivityMonitoring();

      console.log('🎤 Local audio stream connected');
    } catch (error) {
      console.error('Failed to connect local stream:', error);
      this.options.onError?.(error instanceof Error ? error : new Error('Local stream connection failed'));
    }
  }

  /**
   * Connect remote audio stream from WebRTC
   */
  connectRemoteStream(stream: MediaStream): void {
    try {
      this.remoteStream = stream;

      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // Create audio destination for remote stream
      const audioElement = new Audio();
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
      audioElement.muted = false;

      console.log('🔊 Remote audio stream connected');
    } catch (error) {
      console.error('Failed to connect remote stream:', error);
      this.options.onError?.(error instanceof Error ? error : new Error('Remote stream connection failed'));
    }
  }

  /**
   * Start monitoring audio activity
   */
  private startActivityMonitoring(): void {
    if (!this.analyser || this.activityCheckInterval) {
      return;
    }

    this.activityCheckInterval = setInterval(() => {
      if (!this.analyser) return;

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const isActive = average > this.activityThreshold;

      if (isActive !== this.isListening) {
        this.isListening = isActive;
        this.options.onAudioActivity?.(isActive);
        console.log(`🎵 Audio activity: ${isActive ? 'detected' : 'stopped'}`);
      }
    }, 100); // Check every 100ms
  }

  /**
   * Stop monitoring audio activity
   */
  private stopActivityMonitoring(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
  }

  /**
   * Get audio data for ElevenLabs processing
   */
  getAudioData(): Float32Array | null {
    if (!this.analyser) {
      return null;
    }

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(dataArray);

    return dataArray;
  }

  /**
   * Process audio data from ElevenLabs
   */
  processElevenLabsAudio(audioData: ArrayBuffer): void {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // Decode audio data
      this.audioContext.decodeAudioData(audioData.slice(0), (audioBuffer) => {
        // Create audio source
        const source = this.audioContext!.createBufferSource();
        source.buffer = audioBuffer;

        // Connect to destination (speakers)
        source.connect(this.audioContext!.destination);

        // Play the audio
        source.start();

        console.log('🤖 Playing ElevenLabs audio response');
      }, (error) => {
        console.error('Failed to decode ElevenLabs audio:', error);
        this.options.onError?.(new Error('Audio decoding failed'));
      });

    } catch (error) {
      console.error('Failed to process ElevenLabs audio:', error);
      this.options.onError?.(error instanceof Error ? error : new Error('Audio processing failed'));
    }
  }

  /**
   * Set audio activity threshold
   */
  setActivityThreshold(threshold: number): void {
    this.activityThreshold = Math.max(0, Math.min(100, threshold));
    console.log(`🎵 Audio activity threshold set to: ${this.activityThreshold}`);
  }

  /**
   * Get current audio activity status
   */
  isAudioActive(): boolean {
    return this.isListening;
  }

  /**
   * Mute/unmute local audio
   */
  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      console.log(`🎤 Microphone ${muted ? 'muted' : 'unmuted'}`);
    }
  }

  /**
   * Set volume for remote audio
   */
  setVolume(volume: number): void {
    // Volume control would be implemented here
    // For now, we'll just log it
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Volume set to: ${Math.round(normalizedVolume * 100)}%`);
  }

  /**
   * Get audio stream statistics
   */
  getStats(): {
    hasLocalStream: boolean;
    hasRemoteStream: boolean;
    isAudioActive: boolean;
    audioContextState: string;
  } {
    return {
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream,
      isAudioActive: this.isListening,
      audioContextState: this.audioContext?.state || 'not-initialized',
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      // Stop activity monitoring
      this.stopActivityMonitoring();

      // Disconnect audio nodes
      if (this.microphone) {
        this.microphone.disconnect();
        this.microphone = null;
      }

      if (this.analyser) {
        this.analyser.disconnect();
        this.analyser = null;
      }

      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }

      // Clear streams
      this.localStream = null;
      this.remoteStream = null;
      this.isListening = false;

      console.log('🧹 Audio streaming service cleaned up');
    } catch (error) {
      console.error('Error during audio streaming cleanup:', error);
    }
  }
}

// Singleton instance
let audioStreamingService: AudioStreamingService | null = null;

export function getAudioStreamingService(options?: AudioStreamingOptions): AudioStreamingService {
  if (!audioStreamingService) {
    audioStreamingService = new AudioStreamingService(options);
  }
  return audioStreamingService;
}

export function cleanupAudioStreamingService(): void {
  if (audioStreamingService) {
    audioStreamingService.cleanup();
    audioStreamingService = null;
  }
}
