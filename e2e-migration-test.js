#!/usr/bin/env node

/**
 * 🔬 End-to-End Migration Test
 * Tests the Firebase to Express.js migration
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_TIMEOUT = 30000; // 30 seconds

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class E2ETestRunner {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            tests: []
        };
        this.api = axios.create({
            baseURL: API_BASE_URL,
            timeout: TEST_TIMEOUT,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async runTest(testName, testFunction) {
        this.results.total++;
        this.log(`\n🧪 Running: ${testName}`, 'cyan');
        
        try {
            await testFunction();
            this.results.passed++;
            this.log(`✅ PASSED: ${testName}`, 'green');
            this.results.tests.push({ name: testName, status: 'PASSED', error: null });
        } catch (error) {
            this.results.failed++;
            this.log(`❌ FAILED: ${testName}`, 'red');
            this.log(`   Error: ${error.message}`, 'red');
            this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
        }
    }

    async testBackendConnection() {
        try {
            const response = await this.api.get('/health');
            if (response.status !== 200) {
                throw new Error(`Backend not responding. Status: ${response.status}`);
            }
            this.log(`   Backend is running on ${API_BASE_URL}`, 'green');
        } catch (error) {
            throw new Error(`Cannot connect to backend: ${error.message}`);
        }
    }

    async testAuthEndpoints() {
        // Test registration endpoint
        const testUser = {
            phoneNumber: '+1234567890',
            name: 'Test User',
            role: 'USER'
        };

        try {
            const registerResponse = await this.api.post('/auth/register', testUser);
            if (!registerResponse.data.success) {
                throw new Error('Registration failed');
            }
            this.log(`   Registration endpoint working`, 'green');
        } catch (error) {
            if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
                this.log(`   Registration endpoint working (user already exists)`, 'green');
            } else {
                throw error;
            }
        }

        // Test login endpoint
        try {
            const loginResponse = await this.api.post('/auth/login', {
                phoneNumber: testUser.phoneNumber
            });
            if (!loginResponse.data.success) {
                throw new Error('Login failed');
            }
            this.log(`   Login endpoint working`, 'green');
        } catch (error) {
            throw error;
        }
    }

    async testUserEndpoints() {
        // Test get users endpoint
        try {
            const usersResponse = await this.api.get('/users', {
                params: {
                    role: 'USER',
                    limit: 5,
                    page: 1
                }
            });
            if (!usersResponse.data.users) {
                throw new Error('Get users endpoint failed');
            }
            this.log(`   Get users endpoint working`, 'green');
        } catch (error) {
            throw error;
        }

        // Test search users endpoint
        try {
            const searchResponse = await this.api.get('/users/search', {
                params: {
                    q: 'test',
                    limit: 5,
                    page: 1
                }
            });
            if (!searchResponse.data.users) {
                throw new Error('Search users endpoint failed');
            }
            this.log(`   Search users endpoint working`, 'green');
        } catch (error) {
            throw error;
        }
    }

    async testChatEndpoints() {
        // Test create chat endpoint
        try {
            const chatResponse = await this.api.post('/chats', {
                userId: 'test-user-id',
                streamerId: 'test-streamer-id'
            });
            if (!chatResponse.data.chatId && !chatResponse.data._id) {
                throw new Error('Create chat endpoint failed');
            }
            this.log(`   Create chat endpoint working`, 'green');
        } catch (error) {
            throw error;
        }

        // Test get chat list endpoint
        try {
            const chatListResponse = await this.api.get('/chats', {
                params: {
                    streamerId: 'test-streamer-id',
                    limit: 5,
                    page: 1
                }
            });
            if (!chatListResponse.data.chats) {
                throw new Error('Get chat list endpoint failed');
            }
            this.log(`   Get chat list endpoint working`, 'green');
        } catch (error) {
            throw error;
        }
    }

    async testFrontendServices() {
        // Test if new services exist and can be imported
        const serviceFiles = [
            'streamer-app/services/NewAuthService.js',
            'streamer-app/services/NewUserService.js',
            'streamer-app/services/NewChatService.js',
            'streamer-app/services/NewBaseService.js',
            'user-app/services/NewAuthService.js',
            'user-app/services/NewUserService.js',
            'user-app/services/NewChatService.js',
            'user-app/services/NewBaseService.js'
        ];

        for (const file of serviceFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Service file missing: ${file}`);
            }
            this.log(`   Service file exists: ${file}`, 'green');
        }
    }

    async testFirebaseRemoval() {
        // Check if Firebase packages are removed from package.json
        const packageFiles = [
            'streamer-app/package.json',
            'user-app/package.json'
        ];

        for (const packageFile of packageFiles) {
            if (!fs.existsSync(packageFile)) {
                throw new Error(`Package file missing: ${packageFile}`);
            }

            const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
            const dependencies = { ...packageContent.dependencies, ...packageContent.devDependencies };
            
            const firebasePackages = Object.keys(dependencies).filter(dep => 
                dep.includes('firebase') || dep.includes('@react-native-firebase')
            );

            if (firebasePackages.length > 0) {
                throw new Error(`Firebase packages still present in ${packageFile}: ${firebasePackages.join(', ')}`);
            }
            this.log(`   Firebase packages removed from ${packageFile}`, 'green');
        }

        // Check if Firebase config files are removed
        const firebaseFiles = [
            'streamer-app/firebaseConfig.js',
            'streamer-app/firebaseConfig.web.js',
            'streamer-app/google-services.json',
            'streamer-app/firebase.json',
            'user-app/firebaseConfig.js',
            'user-app/firebaseConfig.web.js',
            'user-app/google-services.json',
            'user-app/firebase.json'
        ];

        for (const file of firebaseFiles) {
            if (fs.existsSync(file)) {
                throw new Error(`Firebase config file still exists: ${file}`);
            }
        }
        this.log(`   Firebase config files removed`, 'green');
    }

    async testEnvironmentConfiguration() {
        // Check if environment files exist
        const envFiles = [
            'streamer-app/.env',
            'user-app/.env'
        ];

        for (const envFile of envFiles) {
            if (!fs.existsSync(envFile)) {
                this.log(`   ⚠️  Environment file missing: ${envFile}`, 'yellow');
                this.log(`   Please create ${envFile} with EXPO_PUBLIC_API_URL=http://localhost:5000/api`, 'yellow');
            } else {
                this.log(`   Environment file exists: ${envFile}`, 'green');
            }
        }
    }

    async runAllTests() {
        this.log('🚀 Starting End-to-End Migration Test', 'bright');
        this.log('=' .repeat(50), 'blue');

        // Backend Tests
        await this.runTest('Backend Connection', () => this.testBackendConnection());
        await this.runTest('Authentication Endpoints', () => this.testAuthEndpoints());
        await this.runTest('User Management Endpoints', () => this.testUserEndpoints());
        await this.runTest('Chat Endpoints', () => this.testChatEndpoints());

        // Frontend Tests
        await this.runTest('Frontend Services', () => this.testFrontendServices());
        await this.runTest('Firebase Removal', () => this.testFirebaseRemoval());
        await this.runTest('Environment Configuration', () => this.testEnvironmentConfiguration());

        // Generate Report
        this.generateReport();
    }

    generateReport() {
        this.log('\n' + '=' .repeat(50), 'blue');
        this.log('📊 TEST RESULTS SUMMARY', 'bright');
        this.log('=' .repeat(50), 'blue');

        this.log(`\n✅ Passed: ${this.results.passed}`, 'green');
        this.log(`❌ Failed: ${this.results.failed}`, 'red');
        this.log(`📊 Total: ${this.results.total}`, 'blue');

        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        this.log(`🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

        if (this.results.failed > 0) {
            this.log('\n❌ FAILED TESTS:', 'red');
            this.results.tests
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    this.log(`   • ${test.name}: ${test.error}`, 'red');
                });
        }

        this.log('\n📋 NEXT STEPS:', 'cyan');
        if (this.results.failed === 0) {
            this.log('🎉 All tests passed! Your migration is successful.', 'green');
            this.log('   • Update service imports in your screens', 'blue');
            this.log('   • Test your apps with the new services', 'blue');
            this.log('   • Deploy to production when ready', 'blue');
        } else {
            this.log('⚠️  Some tests failed. Please fix the issues:', 'yellow');
            this.log('   • Check your Express.js backend is running', 'blue');
            this.log('   • Verify API endpoints are implemented', 'blue');
            this.log('   • Check environment configuration', 'blue');
        }

        // Save detailed report
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                passed: this.results.passed,
                failed: this.results.failed,
                total: this.results.total,
                successRate: parseFloat(successRate)
            },
            tests: this.results.tests
        };

        fs.writeFileSync('migration-test-report.json', JSON.stringify(reportData, null, 2));
        this.log('\n📄 Detailed report saved to: migration-test-report.json', 'blue');
    }
}

// Run the tests
async function main() {
    const tester = new E2ETestRunner();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

module.exports = E2ETestRunner;
