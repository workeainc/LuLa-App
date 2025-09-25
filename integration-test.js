#!/usr/bin/env node

/**
 * 🔗 Lula Integration Test
 * Tests all components integration and connectivity
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_API_URL = 'http://localhost:5000/api';
const TEST_TIMEOUT = 10000;

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

class IntegrationTester {
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

    async testBackendHealth() {
        try {
            const response = await this.api.get('/health');
            if (response.status !== 200) {
                throw new Error(`Backend not responding. Status: ${response.status}`);
            }
            this.log(`   Backend is healthy on ${API_BASE_URL}`, 'green');
        } catch (error) {
            throw new Error(`Cannot connect to backend: ${error.message}`);
        }
    }

    async testDatabaseConnection() {
        try {
            const response = await this.api.get('/health');
            if (!response.data.database) {
                throw new Error('Database connection not reported');
            }
            this.log(`   Database connection: ${response.data.database}`, 'green');
        } catch (error) {
            throw new Error(`Database connection issue: ${error.message}`);
        }
    }

    async testAuthEndpoints() {
        // Test registration endpoint
        const testUser = {
            phoneNumber: '+1234567890',
            role: 'USER'
        };

        try {
            const registerResponse = await this.api.post('/auth/register', testUser);
            if (!registerResponse.data.success) {
                throw new Error('Registration endpoint failed');
            }
            this.log(`   Registration endpoint working`, 'green');
        } catch (error) {
            if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
                this.log(`   Registration endpoint working (user already exists)`, 'green');
            } else {
                throw error;
            }
        }
    }

    async testUserEndpoints() {
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
    }

    async testChatEndpoints() {
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
    }

    async testAdminEndpoints() {
        try {
            const dashboardResponse = await this.api.get('/admin/dashboard');
            if (!dashboardResponse.data) {
                throw new Error('Admin dashboard endpoint failed');
            }
            this.log(`   Admin dashboard endpoint working`, 'green');
        } catch (error) {
            throw error;
        }
    }

    async testStreamEndpoints() {
        try {
            const tokenResponse = await this.api.post('/stream/token', {
                userData: { id: 'test-user', name: 'Test User' }
            });
            if (!tokenResponse.data.token) {
                throw new Error('Stream token endpoint failed');
            }
            this.log(`   Stream token endpoint working`, 'green');
        } catch (error) {
            throw error;
        }
    }

    async testEnvironmentConfiguration() {
        const envFiles = [
            'streamer-app/.env',
            'user-app/.env',
            'lula-admin/lula-admin/.env'
        ];

        for (const envFile of envFiles) {
            if (!fs.existsSync(envFile)) {
                throw new Error(`Environment file missing: ${envFile}`);
            }
            
            const content = fs.readFileSync(envFile, 'utf8');
            if (!content.includes('API_URL') && !content.includes('BACKEND_URL')) {
                throw new Error(`Environment file missing API URL: ${envFile}`);
            }
            
            this.log(`   Environment file configured: ${envFile}`, 'green');
        }
    }

    async testServiceIntegrations() {
        const serviceFiles = [
            'streamer-app/services/NewAuthService.js',
            'streamer-app/services/NewUserService.js',
            'streamer-app/services/NewChatService.js',
            'user-app/services/NewAuthService.js',
            'user-app/services/NewUserService.js',
            'user-app/services/NewChatService.js'
        ];

        for (const file of serviceFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Service file missing: ${file}`);
            }
            
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('@react-native-firebase')) {
                throw new Error(`${file} still contains Firebase imports`);
            }
            
            this.log(`   Service integration OK: ${file}`, 'green');
        }
    }

    async testDatabaseModels() {
        const modelFiles = [
            'lula-backend/src/models/User.js',
            'lula-backend/src/models/Chat.js',
            'lula-backend/src/models/Message.js',
            'lula-backend/src/models/Call.js',
            'lula-backend/src/models/Transaction.js'
        ];

        for (const file of modelFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Model file missing: ${file}`);
            }
            this.log(`   Database model exists: ${file}`, 'green');
        }
    }

    async testWebSocketIntegration() {
        const wsFiles = [
            'streamer-app/services/WebSocketService.js',
            'user-app/services/WebSocketService.js'
        ];

        for (const file of wsFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`WebSocket service missing: ${file}`);
            }
            
            const content = fs.readFileSync(file, 'utf8');
            if (!content.includes('socket.io-client')) {
                throw new Error(`${file} doesn't use socket.io-client`);
            }
            
            this.log(`   WebSocket service OK: ${file}`, 'green');
        }
    }

    async runAllTests() {
        this.log('🔗 Starting Lula Integration Test', 'bright');
        this.log('=' .repeat(60), 'blue');

        // Backend Tests
        await this.runTest('Backend Health Check', () => this.testBackendHealth());
        await this.runTest('Database Connection', () => this.testDatabaseConnection());
        await this.runTest('Authentication Endpoints', () => this.testAuthEndpoints());
        await this.runTest('User Management Endpoints', () => this.testUserEndpoints());
        await this.runTest('Chat Endpoints', () => this.testChatEndpoints());
        await this.runTest('Admin Endpoints', () => this.testAdminEndpoints());
        await this.runTest('Stream Endpoints', () => this.testStreamEndpoints());

        // Integration Tests
        await this.runTest('Environment Configuration', () => this.testEnvironmentConfiguration());
        await this.runTest('Service Integrations', () => this.testServiceIntegrations());
        await this.runTest('Database Models', () => this.testDatabaseModels());
        await this.runTest('WebSocket Integration', () => this.testWebSocketIntegration());

        // Generate Report
        this.generateReport();
    }

    generateReport() {
        this.log('\n' + '=' .repeat(60), 'blue');
        this.log('📊 INTEGRATION TEST RESULTS', 'bright');
        this.log('=' .repeat(60), 'blue');

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

        this.log('\n📋 INTEGRATION STATUS:', 'cyan');
        if (this.results.failed === 0) {
            this.log('🎉 All integrations are working perfectly!', 'green');
            this.log('   • Backend API is healthy', 'blue');
            this.log('   • Database connections are working', 'blue');
            this.log('   • All services are properly integrated', 'blue');
            this.log('   • Environment configuration is correct', 'blue');
        } else if (successRate >= 80) {
            this.log('✅ Most integrations are working!', 'green');
            this.log('   • Minor issues need fixing', 'yellow');
            this.log('   • Core functionality is operational', 'blue');
        } else {
            this.log('⚠️  Integration needs attention', 'yellow');
            this.log('   • Several components need fixing', 'yellow');
            this.log('   • Review failed tests above', 'yellow');
        }

        this.log('\n🔧 NEXT STEPS:', 'cyan');
        if (this.results.failed === 0) {
            this.log('   • Start your backend server', 'blue');
            this.log('   • Test your mobile apps', 'blue');
            this.log('   • Test your admin panel', 'blue');
            this.log('   • Deploy to production when ready', 'blue');
        } else {
            this.log('   • Fix the failed integration tests', 'yellow');
            this.log('   • Check your backend server is running', 'blue');
            this.log('   • Verify environment variables', 'blue');
            this.log('   • Check database connections', 'blue');
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

        fs.writeFileSync('integration-test-report.json', JSON.stringify(reportData, null, 2));
        this.log('\n📄 Detailed report saved to: integration-test-report.json', 'blue');
    }
}

// Run the tests
async function main() {
    const tester = new IntegrationTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Integration test runner error:', error);
        process.exit(1);
    });
}

module.exports = IntegrationTester;
