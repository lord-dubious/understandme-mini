#!/usr/bin/env node

const http = require('http');

function checkHeaders(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testSecurityHeaders() {
  console.log('🔒 Testing Security Headers Implementation...\n');

  try {
    // Test main page
    console.log('1. Testing Landing Page Headers');
    const landingPage = await checkHeaders('http://localhost:3000/');
    console.log(`   Status: ${landingPage.status}`);
    
    // Check for required security headers
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'x-dns-prefetch-control',
      'strict-transport-security',
      'permissions-policy',
      'content-security-policy'
    ];

    console.log('\n   📋 Security Headers Check:');
    let allHeadersPresent = true;

    requiredHeaders.forEach(header => {
      const value = landingPage.headers[header];
      if (value) {
        console.log(`   ✅ ${header}: ${value}`);
      } else {
        console.log(`   ❌ ${header}: MISSING`);
        allHeadersPresent = false;
      }
    });

    // Test CSP specifically
    const csp = landingPage.headers['content-security-policy'];
    if (csp) {
      console.log('\n   🛡️  Content Security Policy Analysis:');
      
      const cspDirectives = csp.split(';').map(d => d.trim());
      const expectedDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'img-src',
        'font-src',
        'connect-src',
        'media-src',
        'object-src',
        'base-uri',
        'form-action',
        'frame-ancestors'
      ];

      expectedDirectives.forEach(directive => {
        const found = cspDirectives.find(d => d.startsWith(directive));
        if (found) {
          console.log(`   ✅ ${found}`);
        } else {
          console.log(`   ❌ ${directive}: MISSING`);
        }
      });

      // Check for specific security requirements
      console.log('\n   🔍 CSP Security Analysis:');
      
      if (csp.includes("object-src 'none'")) {
        console.log('   ✅ Object sources disabled (prevents Flash/plugin attacks)');
      } else {
        console.log('   ⚠️  Object sources not properly restricted');
      }

      if (csp.includes("frame-ancestors 'none'")) {
        console.log('   ✅ Frame ancestors disabled (prevents clickjacking)');
      } else {
        console.log('   ⚠️  Frame ancestors not properly restricted');
      }

      if (csp.includes('elevenlabs.io')) {
        console.log('   ✅ ElevenLabs domains allowed for API connections');
      } else {
        console.log('   ⚠️  ElevenLabs domains not found in CSP');
      }

      if (csp.includes('ws:') || csp.includes('wss:')) {
        console.log('   ✅ WebSocket connections allowed');
      } else {
        console.log('   ⚠️  WebSocket connections not allowed in CSP');
      }
    }

    // Test API endpoint headers
    console.log('\n2. Testing API Endpoint Headers');
    const apiResponse = await checkHeaders('http://localhost:3000/api/rooms');
    console.log(`   Status: ${apiResponse.status}`);
    
    const apiHasCSP = apiResponse.headers['content-security-policy'];
    if (apiHasCSP) {
      console.log('   ✅ API endpoints have CSP headers');
    } else {
      console.log('   ⚠️  API endpoints missing CSP headers');
    }

    // Test room page headers
    console.log('\n3. Testing Room Page Headers');
    try {
      const roomResponse = await checkHeaders('http://localhost:3000/room/test-room');
      console.log(`   Status: ${roomResponse.status}`);
      
      const roomHasCSP = roomResponse.headers['content-security-policy'];
      if (roomHasCSP) {
        console.log('   ✅ Room pages have CSP headers');
      } else {
        console.log('   ⚠️  Room pages missing CSP headers');
      }
    } catch (error) {
      console.log('   ⚠️  Could not test room page (expected if room doesn\'t exist)');
    }

    // Summary
    console.log('\n🎉 Security Headers Test Completed!');
    console.log('\n📋 Test Summary:');
    
    if (allHeadersPresent) {
      console.log('   ✅ All required security headers present');
    } else {
      console.log('   ❌ Some security headers missing');
    }

    if (csp) {
      console.log('   ✅ Content Security Policy configured');
    } else {
      console.log('   ❌ Content Security Policy missing');
    }

    console.log('\n🔒 Security Recommendations:');
    console.log('   • Test CSP in browser console for violations');
    console.log('   • Use online CSP validators for additional verification');
    console.log('   • Monitor for CSP violations in production');
    console.log('   • Regularly update CSP as new features are added');

  } catch (error) {
    console.error('❌ Security headers test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testSecurityHeaders();
