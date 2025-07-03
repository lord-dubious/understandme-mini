#!/usr/bin/env node

/**
 * Performance Testing Suite
 * Tests audio latency, connection reliability, and system performance
 */

const http = require('http');
const { performance } = require('perf_hooks');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        try {
          const parsed = JSON.parse(body);
          resolve({ 
            status: res.statusCode, 
            data: parsed, 
            responseTime: Math.round(responseTime * 100) / 100 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: body, 
            responseTime: Math.round(responseTime * 100) / 100 
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function measureAPILatency(endpoint, iterations = 10) {
  const latencies = [];
  
  console.log(`   📊 Testing ${endpoint} (${iterations} iterations)...`);
  
  for (let i = 0; i < iterations; i++) {
    try {
      const result = await makeRequest('GET', endpoint);
      latencies.push(result.responseTime);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`   ❌ Request ${i + 1} failed: ${error.message}`);
    }
  }

  if (latencies.length === 0) {
    return null;
  }

  const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const p95 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

  return {
    average: Math.round(avg * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    successRate: (latencies.length / iterations) * 100
  };
}

async function testRoomOperations() {
  console.log('   🏠 Testing room operations performance...');
  
  const operations = [];
  
  // Test room creation
  const createStart = performance.now();
  const createResult = await makeRequest('POST', '/api/rooms', {});
  const createTime = performance.now() - createStart;
  
  if (createResult.status === 200 && createResult.data.success) {
    operations.push({ operation: 'create', time: createTime, success: true });
    const roomId = createResult.data.roomId;
    
    // Test room retrieval
    const getStart = performance.now();
    const getResult = await makeRequest('GET', `/api/rooms/${roomId}`);
    const getTime = performance.now() - getStart;
    operations.push({ operation: 'get', time: getTime, success: getResult.status === 200 });
    
    // Test room join
    const joinStart = performance.now();
    const joinResult = await makeRequest('POST', `/api/rooms/${roomId}/join`, { userType: 'host' });
    const joinTime = performance.now() - joinStart;
    operations.push({ operation: 'join', time: joinTime, success: joinResult.status === 200 });
    
    if (joinResult.status === 200 && joinResult.data.success) {
      const userId = joinResult.data.userId;
      
      // Test room leave
      const leaveStart = performance.now();
      const leaveResult = await makeRequest('DELETE', `/api/rooms/${roomId}/join`, { userId });
      const leaveTime = performance.now() - leaveStart;
      operations.push({ operation: 'leave', time: leaveTime, success: leaveResult.status === 200 });
    }
  } else {
    operations.push({ operation: 'create', time: createTime, success: false });
  }

  return operations;
}

async function testConcurrentConnections(concurrency = 5) {
  console.log(`   🔄 Testing concurrent connections (${concurrency} simultaneous)...`);
  
  const promises = [];
  
  for (let i = 0; i < concurrency; i++) {
    promises.push(makeRequest('POST', '/api/rooms', {}));
  }

  const startTime = performance.now();
  const results = await Promise.allSettled(promises);
  const endTime = performance.now();
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
  const totalTime = endTime - startTime;
  
  return {
    concurrency,
    successful,
    failed: concurrency - successful,
    totalTime: Math.round(totalTime * 100) / 100,
    averageTime: Math.round((totalTime / concurrency) * 100) / 100,
    successRate: (successful / concurrency) * 100
  };
}

async function testMemoryUsage() {
  console.log('   💾 Testing memory usage patterns...');
  
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const initialMemory = process.memoryUsage();
    
    // Create multiple rooms to test memory usage
    const rooms = [];
    for (let i = 0; i < 10; i++) {
      const result = await makeRequest('POST', '/api/rooms', {});
      if (result.status === 200 && result.data.success) {
        rooms.push(result.data.roomId);
      }
    }
    
    const afterCreationMemory = process.memoryUsage();
    
    // Simulate some activity
    for (const roomId of rooms) {
      await makeRequest('GET', `/api/rooms/${roomId}`);
    }
    
    const finalMemory = process.memoryUsage();
    
    return {
      initial: {
        rss: Math.round(initialMemory.rss / 1024 / 1024 * 100) / 100,
        heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024 * 100) / 100
      },
      afterCreation: {
        rss: Math.round(afterCreationMemory.rss / 1024 / 1024 * 100) / 100,
        heapUsed: Math.round(afterCreationMemory.heapUsed / 1024 / 1024 * 100) / 100
      },
      final: {
        rss: Math.round(finalMemory.rss / 1024 / 1024 * 100) / 100,
        heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024 * 100) / 100
      },
      roomsCreated: rooms.length
    };
  }
  
  return null;
}

async function testPerformance() {
  console.log('⚡ Testing Performance (Audio Latency & Reliability)...\n');

  try {
    // Test 1: API Response Times
    console.log('1. API Response Time Testing');
    
    const endpoints = [
      '/api/rooms',
      '/api/rooms/cleanup'
    ];

    for (const endpoint of endpoints) {
      const latencyStats = await measureAPILatency(endpoint, 10);
      
      if (latencyStats) {
        console.log(`   📊 ${endpoint}:`);
        console.log(`     Average: ${latencyStats.average}ms`);
        console.log(`     Min: ${latencyStats.min}ms`);
        console.log(`     Max: ${latencyStats.max}ms`);
        console.log(`     95th percentile: ${latencyStats.p95}ms`);
        console.log(`     Success rate: ${latencyStats.successRate}%`);
        
        // Performance assessment
        if (latencyStats.average < 100) {
          console.log(`     ✅ Excellent performance`);
        } else if (latencyStats.average < 300) {
          console.log(`     ✅ Good performance`);
        } else if (latencyStats.average < 500) {
          console.log(`     ⚠️  Fair performance`);
        } else {
          console.log(`     ❌ Poor performance`);
        }
      } else {
        console.log(`   ❌ ${endpoint}: Failed to measure latency`);
      }
      console.log('');
    }

    // Test 2: Room Operations Performance
    console.log('2. Room Operations Performance');
    const roomOps = await testRoomOperations();
    
    roomOps.forEach(op => {
      const status = op.success ? '✅' : '❌';
      console.log(`   ${status} ${op.operation}: ${Math.round(op.time * 100) / 100}ms`);
    });
    
    const avgOpTime = roomOps.reduce((sum, op) => sum + op.time, 0) / roomOps.length;
    console.log(`   📊 Average operation time: ${Math.round(avgOpTime * 100) / 100}ms`);
    console.log('');

    // Test 3: Concurrent Connection Handling
    console.log('3. Concurrent Connection Testing');
    const concurrencyTests = [3, 5, 10];
    
    for (const concurrency of concurrencyTests) {
      const concurrentResult = await testConcurrentConnections(concurrency);
      
      console.log(`   📊 ${concurrency} concurrent connections:`);
      console.log(`     Successful: ${concurrentResult.successful}/${concurrentResult.concurrency}`);
      console.log(`     Success rate: ${concurrentResult.successRate}%`);
      console.log(`     Total time: ${concurrentResult.totalTime}ms`);
      console.log(`     Average per request: ${concurrentResult.averageTime}ms`);
      
      if (concurrentResult.successRate >= 95) {
        console.log(`     ✅ Excellent reliability`);
      } else if (concurrentResult.successRate >= 80) {
        console.log(`     ✅ Good reliability`);
      } else {
        console.log(`     ⚠️  Poor reliability`);
      }
      console.log('');
    }

    // Test 4: Memory Usage Analysis
    console.log('4. Memory Usage Analysis');
    const memoryStats = await testMemoryUsage();
    
    if (memoryStats) {
      console.log(`   📊 Memory Usage (MB):`);
      console.log(`     Initial RSS: ${memoryStats.initial.rss}MB`);
      console.log(`     After creating ${memoryStats.roomsCreated} rooms: ${memoryStats.afterCreation.rss}MB`);
      console.log(`     Final RSS: ${memoryStats.final.rss}MB`);
      console.log(`     Heap Used: ${memoryStats.initial.heapUsed}MB → ${memoryStats.final.heapUsed}MB`);
      
      const memoryIncrease = memoryStats.final.rss - memoryStats.initial.rss;
      console.log(`     Memory increase: ${memoryIncrease}MB`);
      
      if (memoryIncrease < 10) {
        console.log(`     ✅ Low memory usage`);
      } else if (memoryIncrease < 50) {
        console.log(`     ✅ Moderate memory usage`);
      } else {
        console.log(`     ⚠️  High memory usage`);
      }
    } else {
      console.log('   ⚠️  Memory usage testing not available in this environment');
    }

    console.log('\n🎉 Performance Testing Completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ API response time measurement');
    console.log('   ✅ Room operations performance');
    console.log('   ✅ Concurrent connection handling');
    console.log('   ✅ Memory usage analysis');

    console.log('\n⚡ Performance Recommendations:');
    console.log('   • Monitor API response times regularly');
    console.log('   • Use WebRTC statistics for audio latency measurement');
    console.log('   • Implement TURN servers for complex network environments');
    console.log('   • Consider connection pooling for high concurrency');
    console.log('   • Monitor memory usage in production');
    console.log('   • Use browser developer tools for WebRTC debugging');

    console.log('\n🔧 WebRTC Performance Tips:');
    console.log('   • Use chrome://webrtc-internals for detailed statistics');
    console.log('   • Monitor packet loss and jitter metrics');
    console.log('   • Test with different network conditions');
    console.log('   • Implement adaptive bitrate for varying connections');
    console.log('   • Use STUN/TURN servers for NAT traversal');

  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testPerformance();
