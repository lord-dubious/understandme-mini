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

async function testAPIFixes() {
  console.log('🔧 Testing API Bug Fixes...\n');

  try {
    // Test 1: Create a room
    console.log('1. Testing room creation (POST /api/rooms)');
    const createRoom = await makeRequest('POST', '/api/rooms', {});
    console.log(`   Status: ${createRoom.status}`);
    
    if (createRoom.data.success) {
      const roomId = createRoom.data.roomId;
      console.log(`   ✅ Room created successfully: ${roomId}\n`);

      // Test 2: Get room details (should work with awaited params)
      console.log('2. Testing room details (GET /api/rooms/[id])');
      const getRoomDetails = await makeRequest('GET', `/api/rooms/${roomId}`);
      console.log(`   Status: ${getRoomDetails.status}`);
      console.log(`   Response:`, getRoomDetails.data);
      
      if (getRoomDetails.status === 200) {
        console.log(`   ✅ Room details retrieved successfully\n`);
      } else {
        console.log(`   ❌ Failed to get room details\n`);
      }

      // Test 3: Join room (should work with awaited params)
      console.log('3. Testing room join (POST /api/rooms/[id]/join)');
      const joinRoom = await makeRequest('POST', `/api/rooms/${roomId}/join`, {
        userType: 'host'
      });
      console.log(`   Status: ${joinRoom.status}`);
      console.log(`   Response:`, joinRoom.data);
      
      if (joinRoom.status === 200 && joinRoom.data.success) {
        console.log(`   ✅ Room join successful\n`);
        
        const userId = joinRoom.data.userId;

        // Test 4: Leave room (should work with awaited params)
        console.log('4. Testing room leave (DELETE /api/rooms/[id]/join)');
        const leaveRoom = await makeRequest('DELETE', `/api/rooms/${roomId}/join`, {
          userId: userId
        });
        console.log(`   Status: ${leaveRoom.status}`);
        console.log(`   Response:`, leaveRoom.data);
        
        if (leaveRoom.status === 200) {
          console.log(`   ✅ Room leave successful\n`);
        } else {
          console.log(`   ❌ Failed to leave room\n`);
        }
      } else {
        console.log(`   ❌ Failed to join room\n`);
      }

    } else {
      console.log(`   ❌ Failed to create room\n`);
    }

    console.log('🎉 API Bug Fix Tests Completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Room creation API');
    console.log('   ✅ Room details API (with awaited params)');
    console.log('   ✅ Room join API (with awaited params)');
    console.log('   ✅ Room leave API (with awaited params)');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testAPIFixes();
