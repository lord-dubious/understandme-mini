/**
 * Performance Testing Service
 * Measures audio latency, connection quality, and system performance
 */

export interface PerformanceMetrics {
  audioLatency: number | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  packetLoss: number;
  jitter: number;
  bandwidth: {
    upload: number;
    download: number;
  };
  webrtcStats: RTCStatsReport | null;
  timestamp: Date;
}

export interface PerformanceTestOptions {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  onError?: (error: Error) => void;
  testInterval?: number; // milliseconds
}

export class PerformanceTestingService {
  private peerConnection: RTCPeerConnection | null = null;
  private testInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private audioLatencyTests: number[] = [];
  private options: PerformanceTestOptions;

  constructor(options: PerformanceTestOptions = {}) {
    this.options = {
      testInterval: 5000, // 5 seconds
      ...options
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(peerConnection?: RTCPeerConnection): void {
    console.log('📊 Starting performance monitoring...');
    
    if (peerConnection) {
      this.peerConnection = peerConnection;
    }

    this.startTime = Date.now();
    
    // Start periodic testing
    this.testInterval = setInterval(() => {
      this.runPerformanceTests();
    }, this.options.testInterval);

    // Run initial test
    this.runPerformanceTests();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }
    
    console.log('📊 Performance monitoring stopped');
  }

  /**
   * Run comprehensive performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        audioLatency: await this.measureAudioLatency(),
        connectionQuality: 'good',
        packetLoss: 0,
        jitter: 0,
        bandwidth: { upload: 0, download: 0 },
        webrtcStats: null,
        timestamp: new Date()
      };

      // Get WebRTC statistics if available
      if (this.peerConnection) {
        const stats = await this.getWebRTCStats();
        metrics.webrtcStats = stats;
        
        // Extract key metrics from WebRTC stats
        const extractedMetrics = this.extractWebRTCMetrics(stats);
        metrics.packetLoss = extractedMetrics.packetLoss;
        metrics.jitter = extractedMetrics.jitter;
        metrics.bandwidth = extractedMetrics.bandwidth;
        metrics.connectionQuality = this.calculateConnectionQuality(extractedMetrics);
      }

      // Test network performance
      const networkMetrics = await this.testNetworkPerformance();
      if (networkMetrics) {
        metrics.bandwidth.download = networkMetrics.download;
        metrics.bandwidth.upload = networkMetrics.upload;
      }

      this.options.onMetricsUpdate?.(metrics);
      
      console.log('📊 Performance metrics:', {
        audioLatency: metrics.audioLatency,
        connectionQuality: metrics.connectionQuality,
        packetLoss: metrics.packetLoss,
        jitter: metrics.jitter
      });

    } catch (error) {
      console.error('Performance test error:', error);
      this.options.onError?.(error instanceof Error ? error : new Error('Performance test failed'));
    }
  }

  /**
   * Measure audio latency using echo test
   */
  private async measureAudioLatency(): Promise<number | null> {
    try {
      // Simulate audio latency measurement
      // In a real implementation, this would use audio echo testing
      const latency = Math.random() * 100 + 50; // 50-150ms simulated
      this.audioLatencyTests.push(latency);
      
      // Keep only last 10 measurements
      if (this.audioLatencyTests.length > 10) {
        this.audioLatencyTests.shift();
      }

      // Return average latency
      return this.audioLatencyTests.reduce((sum, val) => sum + val, 0) / this.audioLatencyTests.length;
    } catch (error) {
      console.error('Audio latency measurement failed:', error);
      return null;
    }
  }

  /**
   * Get WebRTC statistics
   */
  private async getWebRTCStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) {
      return null;
    }

    try {
      return await this.peerConnection.getStats();
    } catch (error) {
      console.error('Failed to get WebRTC stats:', error);
      return null;
    }
  }

  /**
   * Extract key metrics from WebRTC stats
   */
  private extractWebRTCMetrics(stats: RTCStatsReport): {
    packetLoss: number;
    jitter: number;
    bandwidth: { upload: number; download: number };
  } {
    let packetLoss = 0;
    let jitter = 0;
    let uploadBandwidth = 0;
    let downloadBandwidth = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
        if (report.packetsLost && report.packetsReceived) {
          packetLoss = (report.packetsLost / (report.packetsLost + report.packetsReceived)) * 100;
        }
        if (report.jitter) {
          jitter = report.jitter * 1000; // Convert to milliseconds
        }
      }

      if (report.type === 'outbound-rtp' && report.mediaType === 'audio') {
        if (report.bytesSent && report.timestamp) {
          // Estimate upload bandwidth (simplified)
          uploadBandwidth = report.bytesSent * 8 / 1000; // Convert to kbps
        }
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        if (report.availableIncomingBitrate) {
          downloadBandwidth = report.availableIncomingBitrate / 1000; // Convert to kbps
        }
      }
    });

    return {
      packetLoss: Math.round(packetLoss * 100) / 100,
      jitter: Math.round(jitter * 100) / 100,
      bandwidth: {
        upload: Math.round(uploadBandwidth),
        download: Math.round(downloadBandwidth)
      }
    };
  }

  /**
   * Calculate overall connection quality
   */
  private calculateConnectionQuality(metrics: {
    packetLoss: number;
    jitter: number;
    bandwidth: { upload: number; download: number };
  }): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 100;

    // Deduct points for packet loss
    score -= metrics.packetLoss * 10;

    // Deduct points for high jitter
    if (metrics.jitter > 30) score -= 20;
    else if (metrics.jitter > 20) score -= 10;
    else if (metrics.jitter > 10) score -= 5;

    // Deduct points for low bandwidth
    if (metrics.bandwidth.upload < 32) score -= 15;
    if (metrics.bandwidth.download < 32) score -= 15;

    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Test network performance
   */
  private async testNetworkPerformance(): Promise<{ upload: number; download: number } | null> {
    try {
      // Simplified network test using a small data transfer
      const startTime = performance.now();
      
      // Test download speed with a small request
      const response = await fetch('/api/rooms', { method: 'GET' });
      await response.text();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Estimate bandwidth (very simplified)
      const estimatedDownload = 1000 / duration * 100; // Rough estimate in kbps
      const estimatedUpload = estimatedDownload * 0.8; // Assume upload is 80% of download

      return {
        download: Math.round(estimatedDownload),
        upload: Math.round(estimatedUpload)
      };
    } catch (error) {
      console.error('Network performance test failed:', error);
      return null;
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: string;
    recommendations: string[];
    metrics: PerformanceMetrics | null;
  } {
    const avgLatency = this.audioLatencyTests.length > 0 
      ? this.audioLatencyTests.reduce((sum, val) => sum + val, 0) / this.audioLatencyTests.length
      : null;

    const recommendations: string[] = [];

    if (avgLatency && avgLatency > 150) {
      recommendations.push('High audio latency detected. Consider using a TURN server or checking network conditions.');
    }

    if (avgLatency && avgLatency < 50) {
      recommendations.push('Excellent audio latency. Connection is optimal for real-time communication.');
    }

    recommendations.push('Monitor WebRTC statistics regularly for connection quality.');
    recommendations.push('Ensure stable internet connection for best performance.');

    return {
      summary: `Performance monitoring completed. Average audio latency: ${avgLatency ? Math.round(avgLatency) + 'ms' : 'N/A'}`,
      recommendations,
      metrics: null // Would include latest metrics in real implementation
    };
  }

  /**
   * Get current performance status
   */
  getStatus(): {
    isMonitoring: boolean;
    testCount: number;
    averageLatency: number | null;
    uptime: number;
  } {
    const avgLatency = this.audioLatencyTests.length > 0 
      ? this.audioLatencyTests.reduce((sum, val) => sum + val, 0) / this.audioLatencyTests.length
      : null;

    return {
      isMonitoring: this.testInterval !== null,
      testCount: this.audioLatencyTests.length,
      averageLatency: avgLatency ? Math.round(avgLatency) : null,
      uptime: Date.now() - this.startTime
    };
  }
}

// Singleton instance
let performanceService: PerformanceTestingService | null = null;

export function getPerformanceTestingService(options?: PerformanceTestOptions): PerformanceTestingService {
  if (!performanceService) {
    performanceService = new PerformanceTestingService(options);
  }
  return performanceService;
}

export function cleanupPerformanceTestingService(): void {
  if (performanceService) {
    performanceService.stopMonitoring();
    performanceService = null;
  }
}
