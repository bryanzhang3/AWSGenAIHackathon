#!/usr/bin/env node
/**
 * Quick test script for improved Fusion 360 code generation
 * Tests the API without needing Fusion 360 running
 *
 * Usage: node test-generation.js
 */

import 'dotenv/config';

const API_URL = 'http://localhost:3001';

// Test cases to verify generation quality
const testCases = [
    {
        name: "Simple Cube",
        prompt: "Create a 50mm cube",
        expectedKeywords: ["adsk.core.Application.get", "addTwoPointRectangle", "5"]
    },
    {
        name: "Cylinder",
        prompt: "Create a cylinder, 30mm diameter, 50mm height",
        expectedKeywords: ["addByCenterRadius", "1.5", "5"]
    },
    {
        name: "Mounting Bracket",
        prompt: "Create a mounting bracket, 80x50x10mm, with 4 M6 holes in corners",
        expectedKeywords: ["addTwoPointRectangle", "M6", "0.325"]
    }
];

async function testGeneration(testCase) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${testCase.name}`);
    console.log(`Prompt: "${testCase.prompt}"`);
    console.log('='.repeat(60));

    try {
        const response = await fetch(`${API_URL}/api/fusion/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: testCase.prompt
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Check if code was generated
        if (!data.code) {
            console.log('❌ FAILED: No code generated');
            return false;
        }

        console.log(`✅ Generated ${data.code.length} characters of code`);
        console.log(`Model: ${data.model}`);
        console.log(`Tokens: ${data.usage.input_tokens} in, ${data.usage.output_tokens} out`);

        // Check for expected keywords
        console.log('\nChecking for expected patterns:');
        let allFound = true;
        for (const keyword of testCase.expectedKeywords) {
            const found = data.code.includes(keyword);
            console.log(`  ${found ? '✅' : '❌'} "${keyword}"`);
            if (!found) allFound = false;
        }

        // Check for common mistakes
        console.log('\nChecking for common mistakes:');
        const mistakes = [
            { pattern: '```python', error: 'Contains markdown code fence' },
            { pattern: '```', error: 'Contains markdown backticks' },
            { pattern: 'require', error: 'Uses require (not Python)' },
            { pattern: 'mm', error: 'Contains "mm" (should be converted to cm)' }
        ];

        let hasMistakes = false;
        for (const mistake of mistakes) {
            if (data.code.includes(mistake.pattern)) {
                console.log(`  ❌ ${mistake.error}`);
                hasMistakes = true;
            }
        }
        if (!hasMistakes) {
            console.log('  ✅ No common mistakes detected');
        }

        // Show first 500 chars of code
        console.log('\nGenerated code preview:');
        console.log('-'.repeat(60));
        console.log(data.code.substring(0, 500));
        if (data.code.length > 500) {
            console.log(`\n... (${data.code.length - 500} more characters)`);
        }
        console.log('-'.repeat(60));

        return allFound && !hasMistakes;

    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('\n🧪 Testing Improved Fusion 360 Code Generation\n');

    // Check if server is running
    console.log('Checking server connection...');
    try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) {
            throw new Error('Server not healthy');
        }
        const health = await response.json();
        console.log('✅ Server is running');
        console.log(`   API Key: ${health.checks.anthropicApiKey ? '✅ Configured' : '❌ Missing'}`);
        console.log(`   System Prompt: ${health.checks.systemPrompt ? '✅ Loaded' : '❌ Missing'}`);

        if (!health.checks.anthropicApiKey) {
            console.log('\n❌ ERROR: Anthropic API key not configured');
            console.log('   Add ANTHROPIC_API_KEY to backend/.env file');
            process.exit(1);
        }
    } catch (error) {
        console.log('❌ Server not running or not responding');
        console.log('   Start it with: cd backend && node backend-fusion.js');
        process.exit(1);
    }

    // Run test cases
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
        const result = await testGeneration(testCase);
        if (result) {
            passed++;
        } else {
            failed++;
        }

        // Wait a bit between tests to avoid rate limits
        if (testCase !== testCases[testCases.length - 1]) {
            console.log('\nWaiting 2 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total: ${testCases.length} tests`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60));

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Code generation looks good.');
        console.log('   Try it in Fusion 360 now!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the output above.');
        console.log('   The system prompt may need further refinement.');
    }
}

// Run tests
runTests().catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
