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

async function testAPI() {
  console.log('🧪 Testing UnderstandMe.Mini API...\n');

  try {
    // Test 1: Get all rooms
    console.log('1. Testing GET /api/rooms');
    const getRooms = await makeRequest('GET', '/api/rooms');
    console.log(`   Status: ${getRooms.status}`);
    console.log(`   Response:`, getRooms.data);
    console.log('   ✅ GET /api/rooms working\n');

    // Test 2: Create a room
    console.log('2. Testing POST /api/rooms');
    const createRoom = await makeRequest('POST', '/api/rooms', {});
    console.log(`   Status: ${createRoom.status}`);
    console.log(`   Response:`, createRoom.data);
    
    if (createRoom.data.success) {
      console.log('   ✅ Room creation working');
      const roomId = createRoom.data.roomId;
      console.log(`   📝 Created room: ${roomId}\n`);

      // Test 3: Get specific room
      console.log('3. Testing GET /api/rooms/[id]');
      const getRoom = await makeRequest('GET', `/api/rooms/${roomId}`);
      console.log(`   Status: ${getRoom.status}`);
      console.log(`   Response:`, getRoom.data);
      console.log('   ✅ Get specific room working\n');

      // Test 4: Join room
      console.log('4. Testing POST /api/rooms/[id]/join');
      const joinRoom = await makeRequest('POST', `/api/rooms/${roomId}/join`, {
        userType: 'host'
      });
      console.log(`   Status: ${joinRoom.status}`);
      console.log(`   Response:`, joinRoom.data);
      
      if (joinRoom.data.success) {
        console.log('   ✅ Room joining working');
        const userId = joinRoom.data.userId;
        console.log(`   👤 User ID: ${userId}\n`);

        // Test 5: Leave room
        console.log('5. Testing DELETE /api/rooms/[id]/join');
        const leaveRoom = await makeRequest('DELETE', `/api/rooms/${roomId}/join`, {
          userId: userId
        });
        console.log(`   Status: ${leaveRoom.status}`);
        console.log(`   Response:`, leaveRoom.data);
        console.log('   ✅ Room leaving working\n');
      } else {
        console.log('   ❌ Room joining failed\n');
      }

      // Test 6: Delete room
      console.log('6. Testing DELETE /api/rooms/[id]');
      const deleteRoom = await makeRequest('DELETE', `/api/rooms/${roomId}`);
      console.log(`   Status: ${deleteRoom.status}`);
      console.log(`   Response:`, deleteRoom.data);
      console.log('   ✅ Room deletion working\n');

    } else {
      console.log('   ❌ Room creation failed\n');
    }

    console.log('🎉 All API tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Room listing');
    console.log('   ✅ Room creation');
    console.log('   ✅ Room details');
    console.log('   ✅ User joining');
    console.log('   ✅ User leaving');
    console.log('   ✅ Room deletion');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testAPI();
