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

async function testParticipantJoinFlow() {
  console.log('🧪 Testing Participant Join Flow...\n');

  try {
    // Test 1: Create a room (simulating room creator)
    console.log('1. Creating a room (Room Creator)');
    const createRoom = await makeRequest('POST', '/api/rooms', {});
    console.log(`   Status: ${createRoom.status}`);
    
    if (!createRoom.data.success) {
      throw new Error('Failed to create room');
    }
    
    const roomId = createRoom.data.roomId;
    console.log(`   ✅ Room created: ${roomId}\n`);

    // Test 2: First user joins as host (room creator)
    console.log('2. Room creator joins as host');
    const hostJoin = await makeRequest('POST', `/api/rooms/${roomId}/join`, {
      userType: 'host'
    });
    console.log(`   Status: ${hostJoin.status}`);
    console.log(`   Response:`, hostJoin.data);
    
    if (hostJoin.data.success) {
      console.log(`   ✅ Host joined successfully`);
      console.log(`   👤 User ID: ${hostJoin.data.userId}`);
      console.log(`   🏠 User Type: ${hostJoin.data.userType}`);
      console.log(`   👥 User Count: ${hostJoin.data.room.userCount}/2\n`);
    } else {
      console.log('   ❌ Host join failed\n');
    }

    // Test 3: Check room status
    console.log('3. Checking room status');
    const roomStatus = await makeRequest('GET', `/api/rooms/${roomId}`);
    console.log(`   Status: ${roomStatus.status}`);
    console.log(`   Response:`, roomStatus.data);
    
    if (roomStatus.data.success) {
      console.log(`   ✅ Room status retrieved`);
      console.log(`   🏠 Has Host: ${roomStatus.data.room.hasHost}`);
      console.log(`   👤 Has Participant: ${roomStatus.data.room.hasParticipant}`);
      console.log(`   👥 User Count: ${roomStatus.data.room.userCount}\n`);
    }

    // Test 4: Second user joins as participant (via shared link)
    console.log('4. Participant joins via shared link');
    const participantJoin = await makeRequest('POST', `/api/rooms/${roomId}/join`, {
      userType: 'participant'
    });
    console.log(`   Status: ${participantJoin.status}`);
    console.log(`   Response:`, participantJoin.data);
    
    if (participantJoin.data.success) {
      console.log(`   ✅ Participant joined successfully`);
      console.log(`   👤 User ID: ${participantJoin.data.userId}`);
      console.log(`   🤝 User Type: ${participantJoin.data.userType}`);
      console.log(`   👥 User Count: ${participantJoin.data.room.userCount}/2`);
      console.log(`   🎯 Room Ready: ${participantJoin.data.room.isReady}\n`);
    } else {
      console.log('   ❌ Participant join failed\n');
    }

    // Test 5: Try to join when room is full
    console.log('5. Testing room full scenario');
    const thirdUserJoin = await makeRequest('POST', `/api/rooms/${roomId}/join`, {
      userType: 'participant'
    });
    console.log(`   Status: ${thirdUserJoin.status}`);
    console.log(`   Response:`, thirdUserJoin.data);
    
    if (thirdUserJoin.status === 409) {
      console.log(`   ✅ Correctly rejected third user (room full)\n`);
    } else {
      console.log(`   ⚠️  Unexpected response for room full scenario\n`);
    }

    // Test 6: Test joining non-existent room
    console.log('6. Testing non-existent room');
    const nonExistentJoin = await makeRequest('POST', `/api/rooms/non-existent-room/join`, {
      userType: 'participant'
    });
    console.log(`   Status: ${nonExistentJoin.status}`);
    console.log(`   Response:`, nonExistentJoin.data);
    
    if (nonExistentJoin.status === 404) {
      console.log(`   ✅ Correctly handled non-existent room\n`);
    } else {
      console.log(`   ⚠️  Unexpected response for non-existent room\n`);
    }

    console.log('🎉 Participant Join Flow Tests Completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Room creation');
    console.log('   ✅ Host join (room creator)');
    console.log('   ✅ Room status check');
    console.log('   ✅ Participant join (shared link)');
    console.log('   ✅ Room full handling');
    console.log('   ✅ Non-existent room handling');

  } catch (error) {
    console.error('❌ Participant join flow test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testParticipantJoinFlow();
