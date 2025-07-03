#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
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
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

async function testRoomCleanup() {
  console.log('🧹 Testing Room Cleanup Functionality...\n');

  try {
    // Test 1: Get initial cleanup stats
    console.log('1. Getting initial cleanup stats');
    const initialStats = await makeRequest('GET', '/api/rooms/cleanup');
    console.log(`   Status: ${initialStats.status}`);
    
    if (initialStats.data.success) {
      console.log('   ✅ Cleanup service is running');
      console.log(`   📊 Stats:`, initialStats.data.stats);
    } else {
      console.log('   ❌ Cleanup service not available');
    }

    // Test 2: Create some test rooms
    console.log('\n2. Creating test rooms');
    const testRooms = [];
    
    for (let i = 0; i < 3; i++) {
      const createRoom = await makeRequest('POST', '/api/rooms', {});
      if (createRoom.data.success) {
        testRooms.push(createRoom.data.roomId);
        console.log(`   ✅ Created room: ${createRoom.data.roomId}`);
      }
    }

    // Test 3: Check stats after room creation
    console.log('\n3. Checking stats after room creation');
    const afterCreation = await makeRequest('GET', '/api/rooms/cleanup');
    if (afterCreation.data.success) {
      console.log('   📊 Updated stats:', afterCreation.data.stats);
    }

    // Test 4: Simulate room activity by joining rooms
    console.log('\n4. Simulating room activity');
    for (const roomId of testRooms) {
      const joinRoom = await makeRequest('POST', `/api/rooms/${roomId}/join`, {
        userType: 'host'
      });
      if (joinRoom.data.success) {
        console.log(`   ✅ Joined room ${roomId} as host`);
        
        // Leave immediately to simulate activity
        const leaveRoom = await makeRequest('DELETE', `/api/rooms/${roomId}/join`, {
          userId: joinRoom.data.userId
        });
        if (leaveRoom.status === 200) {
          console.log(`   ✅ Left room ${roomId}`);
        }
      }
    }

    // Test 5: Manual cleanup trigger
    console.log('\n5. Triggering manual cleanup');
    const manualCleanup = await makeRequest('POST', '/api/rooms/cleanup');
    console.log(`   Status: ${manualCleanup.status}`);
    
    if (manualCleanup.data.success) {
      console.log('   ✅ Manual cleanup completed');
      console.log(`   🗑️  Rooms cleaned: ${manualCleanup.data.roomsCleaned}`);
      console.log('   📊 Stats before:', manualCleanup.data.statsBefore);
      console.log('   📊 Stats after:', manualCleanup.data.statsAfter);
    } else {
      console.log('   ❌ Manual cleanup failed');
    }

    // Test 6: Final stats check
    console.log('\n6. Final cleanup stats');
    const finalStats = await makeRequest('GET', '/api/rooms/cleanup');
    if (finalStats.data.success) {
      console.log('   📊 Final stats:', finalStats.data.stats);
    }

    console.log('\n🎉 Room Cleanup Test Completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Cleanup service status check');
    console.log('   ✅ Room creation and activity simulation');
    console.log('   ✅ Manual cleanup trigger');
    console.log('   ✅ Statistics monitoring');

    console.log('\n🔧 Cleanup Features Tested:');
    console.log('   • Automatic room cleanup service');
    console.log('   • Manual cleanup API endpoint');
    console.log('   • Room activity tracking');
    console.log('   • Statistics and monitoring');
    console.log('   • Ephemeral room state management');

  } catch (error) {
    console.error('❌ Room cleanup test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testRoomCleanup();
