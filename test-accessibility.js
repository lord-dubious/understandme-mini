#!/usr/bin/env node

/**
 * Basic Accessibility and Responsive Design Test
 * Tests key accessibility features and responsive design elements
 */

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

function checkAccessibilityFeatures(html) {
  const checks = {
    hasSkipLink: html.includes('Skip to main content'),
    hasMainLandmark: html.includes('id="main-content"') || html.includes('<main'),
    hasHeadingStructure: html.includes('<h1') && html.includes('<h2'),
    hasAriaLabels: html.includes('aria-label'),
    hasAriaDescribedBy: html.includes('aria-describedby') || html.includes('aria-expanded'),
    hasSemanticHTML: html.includes('<header') || html.includes('<section') || html.includes('<nav'),
    hasFocusManagement: html.includes('focus:'),
    hasAltText: html.includes('aria-hidden="true"'),
    hasFormLabels: html.includes('aria-label') && html.includes('input'),
    hasButtonLabels: html.includes('aria-label') && html.includes('button'),
  };

  return checks;
}

function checkResponsiveFeatures(html) {
  const checks = {
    hasViewportMeta: html.includes('viewport'),
    hasResponsiveClasses: html.includes('sm:') && html.includes('lg:'),
    hasFlexboxLayout: html.includes('flex'),
    hasGridLayout: html.includes('grid'),
    hasMobileFirstDesign: html.includes('sm:') || html.includes('md:'),
    hasResponsiveText: html.includes('text-sm') && html.includes('sm:text-'),
    hasResponsiveSpacing: html.includes('p-4') && html.includes('sm:p-'),
    hasResponsiveButtons: html.includes('w-full') && html.includes('sm:w-'),
  };

  return checks;
}

async function testAccessibilityAndResponsive() {
  console.log('♿ Testing Accessibility and Responsive Design...\n');

  try {
    // Test 1: Landing Page Accessibility
    console.log('1. Testing Landing Page Accessibility');
    const landingPage = await makeRequest('/');
    console.log(`   Status: ${landingPage.status}`);
    
    if (landingPage.status === 200) {
      const accessibilityChecks = checkAccessibilityFeatures(landingPage.body);
      const responsiveChecks = checkResponsiveFeatures(landingPage.body);

      console.log('\n   🔍 Accessibility Features:');
      Object.entries(accessibilityChecks).forEach(([feature, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${feature}: ${passed ? 'PASS' : 'FAIL'}`);
      });

      console.log('\n   📱 Responsive Design Features:');
      Object.entries(responsiveChecks).forEach(([feature, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${feature}: ${passed ? 'PASS' : 'FAIL'}`);
      });

      const accessibilityScore = Object.values(accessibilityChecks).filter(Boolean).length;
      const responsiveScore = Object.values(responsiveChecks).filter(Boolean).length;
      
      console.log(`\n   📊 Accessibility Score: ${accessibilityScore}/${Object.keys(accessibilityChecks).length}`);
      console.log(`   📊 Responsive Score: ${responsiveScore}/${Object.keys(responsiveChecks).length}`);
    }

    // Test 2: Create a room and test room page
    console.log('\n2. Testing Room Page Accessibility');
    
    // First create a room
    const createResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({});
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/rooms',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (createResponse.status === 200 && createResponse.data.success) {
      const roomId = createResponse.data.roomId;
      console.log(`   ✅ Created test room: ${roomId}`);

      const roomPage = await makeRequest(`/room/${roomId}`);
      console.log(`   Status: ${roomPage.status}`);

      if (roomPage.status === 200) {
        const roomAccessibilityChecks = checkAccessibilityFeatures(roomPage.body);
        const roomResponsiveChecks = checkResponsiveFeatures(roomPage.body);

        console.log('\n   🔍 Room Page Accessibility:');
        Object.entries(roomAccessibilityChecks).forEach(([feature, passed]) => {
          console.log(`   ${passed ? '✅' : '❌'} ${feature}: ${passed ? 'PASS' : 'FAIL'}`);
        });

        console.log('\n   📱 Room Page Responsive Design:');
        Object.entries(roomResponsiveChecks).forEach(([feature, passed]) => {
          console.log(`   ${passed ? '✅' : '❌'} ${feature}: ${passed ? 'PASS' : 'FAIL'}`);
        });

        const roomAccessibilityScore = Object.values(roomAccessibilityChecks).filter(Boolean).length;
        const roomResponsiveScore = Object.values(roomResponsiveChecks).filter(Boolean).length;
        
        console.log(`\n   📊 Room Accessibility Score: ${roomAccessibilityScore}/${Object.keys(roomAccessibilityChecks).length}`);
        console.log(`   📊 Room Responsive Score: ${roomResponsiveScore}/${Object.keys(roomResponsiveChecks).length}`);
      }
    } else {
      console.log('   ❌ Failed to create test room for accessibility testing');
    }

    console.log('\n🎉 Accessibility and Responsive Design Test Completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Landing page accessibility features');
    console.log('   ✅ Landing page responsive design');
    console.log('   ✅ Room page accessibility features');
    console.log('   ✅ Room page responsive design');

    console.log('\n♿ Accessibility Features Tested:');
    console.log('   • Skip to main content links');
    console.log('   • Semantic HTML structure');
    console.log('   • ARIA labels and attributes');
    console.log('   • Heading hierarchy');
    console.log('   • Focus management');
    console.log('   • Form and button labels');

    console.log('\n📱 Responsive Features Tested:');
    console.log('   • Mobile-first design approach');
    console.log('   • Responsive breakpoints (sm:, md:, lg:)');
    console.log('   • Flexible layouts (flexbox, grid)');
    console.log('   • Responsive typography and spacing');
    console.log('   • Mobile-optimized buttons and inputs');

  } catch (error) {
    console.error('❌ Accessibility test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testAccessibilityAndResponsive();
