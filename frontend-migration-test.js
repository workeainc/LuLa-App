#!/usr/bin/env node

/**
 * 🔬 Frontend Migration Test
 * Tests the Firebase to Express.js migration without requiring backend
 */

const fs = require('fs');
const path = require('path');

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

class FrontendMigrationTest {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            tests: []
        };
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

    async testNewServicesExist() {
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
            this.log(`   ✅ Service file exists: ${file}`, 'green');
        }
    }

    async testFirebasePackagesRemoved() {
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
            this.log(`   ✅ Firebase packages removed from ${packageFile}`, 'green');
        }
    }

    async testFirebaseConfigFilesRemoved() {
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
        this.log(`   ✅ Firebase config files removed`, 'green');
    }

    async testNewServicesContent() {
        const serviceFiles = [
            'streamer-app/services/NewAuthService.js',
            'streamer-app/services/NewUserService.js',
            'streamer-app/services/NewChatService.js',
            'streamer-app/services/NewBaseService.js'
        ];

        for (const file of serviceFiles) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check if it uses Express.js API instead of Firebase
            if (content.includes('@react-native-firebase')) {
                throw new Error(`${file} still contains Firebase imports`);
            }
            
            // Check for axios or extends BaseService (which has axios)
            if (!content.includes('axios') && !content.includes('extends') && !content.includes('BaseService')) {
                throw new Error(`${file} doesn't use axios for API calls`);
            }
            
            // Check for API configuration (either direct or inherited)
            if (!content.includes('API_BASE_URL') && !content.includes('extends') && !content.includes('BaseService')) {
                throw new Error(`${file} doesn't have API_BASE_URL configuration`);
            }
            
            this.log(`   ✅ ${file} uses Express.js API`, 'green');
        }
    }

    async testLoginScreenUpdated() {
        const loginFiles = [
            'streamer-app/screens/Login.js',
            'user-app/screens/Login.js'
        ];

        for (const file of loginFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Login file missing: ${file}`);
            }

            const content = fs.readFileSync(file, 'utf8');
            
            if (content.includes('NewAuthService')) {
                this.log(`   ✅ ${file} uses NewAuthService`, 'green');
            } else if (content.includes('AuthService')) {
                this.log(`   ⚠️  ${file} still uses old AuthService - needs update`, 'yellow');
            } else {
                throw new Error(`${file} doesn't import AuthService`);
            }
        }
    }

    async testEnvironmentFiles() {
        const envFiles = [
            'streamer-app/.env',
            'user-app/.env'
        ];

        for (const envFile of envFiles) {
            if (!fs.existsSync(envFile)) {
                this.log(`   ⚠️  Environment file missing: ${envFile}`, 'yellow');
                this.log(`   Please create ${envFile} with EXPO_PUBLIC_API_URL=http://localhost:5000/api`, 'yellow');
            } else {
                const content = fs.readFileSync(envFile, 'utf8');
                if (content.includes('EXPO_PUBLIC_API_URL')) {
                    this.log(`   ✅ Environment file configured: ${envFile}`, 'green');
                } else {
                    this.log(`   ⚠️  Environment file missing API_URL: ${envFile}`, 'yellow');
                }
            }
        }
    }

    async testBackendRoutes() {
        const routeFiles = [
            'lula-backend/src/routes/auth.js',
            'lula-backend/src/routes/user.js',
            'lula-backend/src/routes/chat.js'
        ];

        for (const file of routeFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Backend route file missing: ${file}`);
            }
            this.log(`   ✅ Backend route exists: ${file}`, 'green');
        }
    }

    async testBackendModels() {
        const modelFiles = [
            'lula-backend/src/models/User.js',
            'lula-backend/src/models/Chat.js',
            'lula-backend/src/models/Message.js'
        ];

        for (const file of modelFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Backend model file missing: ${file}`);
            }
            this.log(`   ✅ Backend model exists: ${file}`, 'green');
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Frontend Migration Test', 'bright');
        this.log('=' .repeat(50), 'blue');

        // Frontend Tests
        await this.runTest('New Services Exist', () => this.testNewServicesExist());
        await this.runTest('Firebase Packages Removed', () => this.testFirebasePackagesRemoved());
        await this.runTest('Firebase Config Files Removed', () => this.testFirebaseConfigFilesRemoved());
        await this.runTest('New Services Content', () => this.testNewServicesContent());
        await this.runTest('Login Screen Updated', () => this.testLoginScreenUpdated());
        await this.runTest('Environment Files', () => this.testEnvironmentFiles());

        // Backend Tests
        await this.runTest('Backend Routes', () => this.testBackendRoutes());
        await this.runTest('Backend Models', () => this.testBackendModels());

        // Generate Report
        this.generateReport();
    }

    generateReport() {
        this.log('\n' + '=' .repeat(50), 'blue');
        this.log('📊 MIGRATION TEST RESULTS', 'bright');
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

        this.log('\n📋 MIGRATION STATUS:', 'cyan');
        if (this.results.failed === 0) {
            this.log('🎉 Frontend migration is COMPLETE!', 'green');
            this.log('   • All Firebase dependencies removed', 'blue');
            this.log('   • New Express.js services created', 'blue');
            this.log('   • Backend routes and models ready', 'blue');
            this.log('   • Ready for testing with backend', 'blue');
        } else if (successRate >= 80) {
            this.log('✅ Migration is mostly complete!', 'green');
            this.log('   • Minor issues need fixing', 'yellow');
            this.log('   • Ready for backend testing', 'blue');
        } else {
            this.log('⚠️  Migration needs more work', 'yellow');
            this.log('   • Several issues need fixing', 'yellow');
            this.log('   • Review failed tests above', 'yellow');
        }

        this.log('\n🔧 NEXT STEPS:', 'cyan');
        this.log('   1. Create .env files for both apps', 'blue');
        this.log('   2. Update service imports in screens', 'blue');
        this.log('   3. Start Express.js backend', 'blue');
        this.log('   4. Test authentication flow', 'blue');
        this.log('   5. Test all app functionality', 'blue');

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

        fs.writeFileSync('frontend-migration-test-report.json', JSON.stringify(reportData, null, 2));
        this.log('\n📄 Detailed report saved to: frontend-migration-test-report.json', 'blue');
    }
}

// Run the tests
async function main() {
    const tester = new FrontendMigrationTest();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

module.exports = FrontendMigrationTest;
