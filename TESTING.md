# Testing & CI/CD Guide

## Local Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test:watch
```

### View Test Coverage
```bash
npm test -- --coverage
```

### Run Specific Test Suite
```bash
npm test circuit-breaker.test.ts
npm test automation-simulator.test.ts
npm test automation.test.ts
```

## Test Suite Overview

### Circuit Breaker Tests (`src/lib/__tests__/circuit-breaker.test.ts`)
Tests the circuit breaker pattern implementation:
- Initialization in CLOSED state
- Function execution on healthy circuit
- Opening circuit after threshold failures
- Fail-fast behavior when OPEN
- Transition to HALF_OPEN after timeout
- Recovery to CLOSED state
- Metrics reporting

**Coverage**: All 8 tests passing

### Automation Simulator Tests (`src/lib/__tests__/automation-simulator.test.ts`)
Tests rule simulation and conflict detection:
- Empty rules handling
- Rule impact detection on doctors
- Conflict detection when multiple rules target same doctor
- Priority-based conflict resolution
- Summary accuracy

**Coverage**: All 5 tests passing

### Automation Rules Tests (`src/lib/__tests__/automation.test.ts`)
Tests core automation evaluation logic:
- Empty rules evaluation
- Doctor status matching
- Time-based rule evaluation
- Fuzzy doctor name matching
- Data immutability (rules don't modify doctors)
- Graceful error handling

**Coverage**: All 5 tests passing

## GitHub Actions CI Pipeline

### Workflow: `.github/workflows/ci.yml`

Automatically runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Jobs

#### 1. **Test Job** (runs on Node 18.x and 20.x)
- Install dependencies
- Run ESLint (continues on error)
- Run Jest test suite with coverage
- Build Next.js application

#### 2. **Security Job**
- Run `npm audit` on production dependencies
- Fail if critical vulnerabilities detected

#### 3. **Type Check Job**
- Run TypeScript type checking without emitting
- Ensures no type errors

### Features
- **Concurrency Control**: Cancels in-progress runs when new push arrives
- **Node.js Matrix**: Tests on both Node 18 and 20
- **Npm Caching**: Speeds up repeated builds
- **Continue on Error**: Lint failures don't block build

## Setting Up Tests Locally

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation
```bash
# Install dependencies (including Jest)
npm install

# Optional: Install dev dependencies only
npm install --save-dev
```

### Configuration Files
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest test setup (empty, can add globals here)
- `.github/workflows/ci.yml` - CI/CD pipeline

## Writing New Tests

### Test File Naming
- Location: `src/lib/__tests__/`
- Naming: `<module>.test.ts` or `<module>.test.tsx`

### Test Structure
```typescript
import { functionToTest } from '@/lib/module';

describe('Module Name', () => {
  it('should do something', () => {
    const result = functionToTest();
    expect(result).toBe(expectedValue);
  });

  it('should handle errors', async () => {
    await expect(functionToTest()).rejects.toThrow();
  });
});
```

### Import Paths
Use `@/path/to/file` for imports:
```typescript
import { evaluateRules } from '@/lib/automation';
import { CircuitBreaker } from '@/lib/circuit-breaker';
```

## Continuous Integration Benefits

1. **Automated Testing**: Every push/PR runs tests immediately
2. **Early Detection**: Catch bugs before merging
3. **Security Scanning**: Automatic vulnerability detection
4. **Type Safety**: TypeScript validation on every commit
5. **Multi-Node Testing**: Ensures compatibility across Node versions

## Troubleshooting

### "Cannot find module" errors
- Check `jest.config.js` has correct `moduleNameMapper`
- Verify imports use `@/` alias

### Tests timeout
- Increase timeout: `jest.setTimeout(10000)` in test file
- Check for unresolved promises

### Build fails after test changes
- Run `npm run build` locally to debug
- Check TypeScript errors: `npx tsc --noEmit`

### GitHub Actions credential issues
- Ensure repository has GitHub Actions enabled
- Check branch protection rules allow CI

## Future Enhancements

- [ ] Add E2E tests with Cypress or Playwright
- [ ] Add performance benchmarks
- [ ] Send coverage reports to Codecov
- [ ] Add code quality checks (Sonarqube, CodeClimate)
- [ ] Add performance regression detection
- [ ] Automated API testing (Postman/newman)
