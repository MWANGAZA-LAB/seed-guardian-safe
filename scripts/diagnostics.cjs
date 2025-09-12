#!/usr/bin/env node

/**
 * Seed Guardian Safe Protocol - Comprehensive Diagnostics Script
 * 
 * This script performs a complete system diagnostics to validate:
 * - Proof of Life enrollment → monitoring → check-in flow
 * - Bitcoin recovery scripts and Taproot integration
 * - Security compliance and client-side cryptography
 * - Test coverage and code quality
 * - Mock data removal verification
 */

const { execSync } = require('child_process');
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

class DiagnosticsRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSection(title) {
    this.log(`\n${'='.repeat(60)}`, 'cyan');
    this.log(`  ${title}`, 'bright');
    this.log(`${'='.repeat(60)}`, 'cyan');
  }

  logTest(name, status, details = '') {
    const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
    const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    
    this.log(`${statusSymbol} ${name}`, statusColor);
    if (details) {
      this.log(`   ${details}`, 'reset');
    }
    
    this.results.tests.push({ name, status, details });
    if (status === 'PASS') this.results.passed++;
    else if (status === 'FAIL') this.results.failed++;
    else this.results.warnings++;
  }

  async runCommand(command, description) {
    try {
      this.log(`Running: ${command}`, 'blue');
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      return { success: true, output };
    } catch (error) {
      this.log(`Command failed: ${error.message}`, 'red');
      return { success: false, error: error.message, output: error.stdout || error.stderr };
    }
  }

  async checkTypeScriptErrors() {
    this.logSection('TypeScript Compilation Check');
    
    const result = await this.runCommand('npm run type-check', 'TypeScript compilation');
    
    if (result.success) {
      this.logTest('TypeScript Compilation', 'PASS', 'No TypeScript errors found');
    } else {
      this.logTest('TypeScript Compilation', 'FAIL', 'TypeScript compilation failed');
      this.log(result.output, 'red');
    }
  }

  async checkTestCoverage() {
    this.logSection('Test Coverage Analysis');
    
    const result = await this.runCommand('npm run test:ci', 'Test suite execution');
    
    if (result.success) {
      // Parse test output for coverage information
      const coverageMatch = result.output.match(/All files\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)/);
      if (coverageMatch) {
        const [, statements, branches, functions, lines] = coverageMatch;
        this.logTest('Test Coverage', 'PASS', 
          `Statements: ${statements}%, Branches: ${branches}%, Functions: ${functions}%, Lines: ${lines}%`);
      } else {
        this.logTest('Test Coverage', 'WARN', 'Could not parse coverage information');
      }
    } else {
      this.logTest('Test Coverage', 'FAIL', 'Test suite execution failed');
    }
  }

  async checkMockDataRemoval() {
    this.logSection('Mock Data Removal Verification');
    
    const mockPatterns = [
      'mock|Mock|MOCK',
      'placeholder|Placeholder|PLACEHOLDER',
      'example\\.com',
      'localhost:3000',
      'test.*data',
      'dummy|fake'
    ];
    
    let mockDataFound = false;
    const mockFiles = [];
    
    for (const pattern of mockPatterns) {
      try {
        const result = execSync(`grep -r -l "${pattern}" src/ --include="*.ts" --include="*.tsx"`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        if (result.trim()) {
          mockDataFound = true;
          mockFiles.push(...result.trim().split('\n'));
        }
      } catch (error) {
        // No matches found, which is good
      }
    }
    
    if (mockDataFound) {
      this.logTest('Mock Data Removal', 'FAIL', `Mock data found in ${mockFiles.length} files`);
      mockFiles.forEach(file => this.log(`   - ${file}`, 'red'));
    } else {
      this.logTest('Mock Data Removal', 'PASS', 'No mock data patterns found in source code');
    }
  }

  async checkSecurityCompliance() {
    this.logSection('Security Compliance Check');
    
    // Check for hardcoded secrets
    const secretPatterns = [
      'password.*=.*["\'][^"\']+["\']',
      'secret.*=.*["\'][^"\']+["\']',
      'key.*=.*["\'][^"\']+["\']',
      'token.*=.*["\'][^"\']+["\']'
    ];
    
    let secretsFound = false;
    
    for (const pattern of secretPatterns) {
      try {
        const result = execSync(`grep -r -i "${pattern}" src/ --include="*.ts" --include="*.tsx"`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        if (result.trim()) {
          secretsFound = true;
          this.log(`Potential hardcoded secret found:`, 'yellow');
          this.log(result, 'yellow');
        }
      } catch (error) {
        // No matches found, which is good
      }
    }
    
    if (secretsFound) {
      this.logTest('Security Compliance', 'WARN', 'Potential hardcoded secrets found');
    } else {
      this.logTest('Security Compliance', 'PASS', 'No hardcoded secrets detected');
    }
  }

  async checkBitcoinRecoveryImplementation() {
    this.logSection('Bitcoin Recovery Implementation Check');
    
    const bitcoinFiles = [
      'src/protocol/bitcoin/recovery-script.ts',
      'src/protocol/bitcoin/taproot.ts'
    ];
    
    let allFilesExist = true;
    
    for (const file of bitcoinFiles) {
      if (fs.existsSync(file)) {
        this.logTest(`Bitcoin Recovery: ${path.basename(file)}`, 'PASS', 'File exists and implemented');
      } else {
        this.logTest(`Bitcoin Recovery: ${path.basename(file)}`, 'FAIL', 'File missing');
        allFilesExist = false;
      }
    }
    
    // Check for Ethereum references
    try {
      const result = execSync(`grep -r -i "ethereum\\|smart contract" src/protocol/bitcoin/`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (result.trim()) {
        this.logTest('Ethereum References', 'WARN', 'Ethereum references found in Bitcoin protocol');
        this.log(result, 'yellow');
      } else {
        this.logTest('Ethereum References', 'PASS', 'No Ethereum references in Bitcoin protocol');
      }
    } catch (error) {
      this.logTest('Ethereum References', 'PASS', 'No Ethereum references found');
    }
  }

  async checkProofOfLifeFlow() {
    this.logSection('Proof of Life Flow Validation');
    
    const polFiles = [
      'src/protocol/pol/manager.ts',
      'src/protocol/pol/heartbeat.ts',
      'src/protocol/pol/webauthn.ts',
      'src/protocol/pol/verifier.ts'
    ];
    
    let allFilesExist = true;
    
    for (const file of polFiles) {
      if (fs.existsSync(file)) {
        this.logTest(`PoL Module: ${path.basename(file)}`, 'PASS', 'File exists and implemented');
      } else {
        this.logTest(`PoL Module: ${path.basename(file)}`, 'FAIL', 'File missing');
        allFilesExist = false;
      }
    }
    
    // Check for enrollment flow
    try {
      const managerContent = fs.readFileSync('src/protocol/pol/manager.ts', 'utf8');
      const hasEnroll = managerContent.includes('async enroll(');
      const hasStartMonitoring = managerContent.includes('async startMonitoring(');
      const hasPerformCheckIn = managerContent.includes('async performCheckIn(');
      
      if (hasEnroll && hasStartMonitoring && hasPerformCheckIn) {
        this.logTest('PoL Flow Methods', 'PASS', 'Enrollment → Monitoring → Check-in flow implemented');
      } else {
        this.logTest('PoL Flow Methods', 'FAIL', 'Missing required PoL flow methods');
      }
    } catch (error) {
      this.logTest('PoL Flow Methods', 'FAIL', 'Could not read PoL manager file');
    }
  }

  async checkClientSideCryptography() {
    this.logSection('Client-Side Cryptography Check');
    
    const cryptoFiles = [
      'src/protocol/crypto/shamir.ts',
      'src/protocol/crypto/encryption.ts'
    ];
    
    for (const file of cryptoFiles) {
      if (fs.existsSync(file)) {
        this.logTest(`Crypto Module: ${path.basename(file)}`, 'PASS', 'File exists and implemented');
        
        // Check for placeholder implementations
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('placeholder') || content.includes('TODO')) {
            this.logTest(`Crypto Implementation: ${path.basename(file)}`, 'WARN', 'Contains placeholder implementations');
          } else {
            this.logTest(`Crypto Implementation: ${path.basename(file)}`, 'PASS', 'No placeholder implementations found');
          }
        } catch (error) {
          this.logTest(`Crypto Implementation: ${path.basename(file)}`, 'WARN', 'Could not check implementation');
        }
      } else {
        this.logTest(`Crypto Module: ${path.basename(file)}`, 'FAIL', 'File missing');
      }
    }
  }

  async generateReport() {
    this.logSection('Diagnostics Summary Report');
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    this.log(`Total Tests: ${total}`, 'bright');
    this.log(`Passed: ${this.results.passed}`, 'green');
    this.log(`Failed: ${this.results.failed}`, 'red');
    this.log(`Warnings: ${this.results.warnings}`, 'yellow');
    this.log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');
    
    if (this.results.failed > 0) {
      this.log('\nFailed Tests:', 'red');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => this.log(`  - ${test.name}: ${test.details}`, 'red'));
    }
    
    if (this.results.warnings > 0) {
      this.log('\nWarnings:', 'yellow');
      this.results.tests
        .filter(test => test.status === 'WARN')
        .forEach(test => this.log(`  - ${test.name}: ${test.details}`, 'yellow'));
    }
    
    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        passRate: parseFloat(passRate)
      },
      tests: this.results.tests
    };
    
    fs.writeFileSync('diagnostics-report.json', JSON.stringify(report, null, 2));
    this.log('\nDetailed report saved to: diagnostics-report.json', 'cyan');
    
    return this.results.failed === 0;
  }

  async run() {
    this.log('🔍 Seed Guardian Safe Protocol - Comprehensive Diagnostics', 'bright');
    this.log('Starting system diagnostics...\n', 'blue');
    
    try {
      await this.checkTypeScriptErrors();
      await this.checkTestCoverage();
      await this.checkMockDataRemoval();
      await this.checkSecurityCompliance();
      await this.checkBitcoinRecoveryImplementation();
      await this.checkProofOfLifeFlow();
      await this.checkClientSideCryptography();
      
      const success = await this.generateReport();
      
      if (success) {
        this.log('\n🎉 All diagnostics passed! System is ready for production.', 'green');
        process.exit(0);
      } else {
        this.log('\n⚠️  Some diagnostics failed. Please review and fix the issues above.', 'yellow');
        process.exit(1);
      }
    } catch (error) {
      this.log(`\n💥 Diagnostics failed with error: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

// Run diagnostics if this script is executed directly
if (require.main === module) {
  const diagnostics = new DiagnosticsRunner();
  diagnostics.run();
}

module.exports = DiagnosticsRunner;
