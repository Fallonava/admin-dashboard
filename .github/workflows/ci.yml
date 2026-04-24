name: CI Pipeline

on:
  push:
    branches: [master, dev]
  pull_request:
    branches: [master, dev]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    strategy:
      matrix:
        node-version: [20.x]

    env:
      DATABASE_URL: postgresql://user:password@localhost:5432/testdb?sslmode=disable
      DIRECT_URL: postgresql://user:password@localhost:5432/testdb?sslmode=disable
      ADMIN_KEY: dev_key_123

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Sync Database Schema
        run: npx prisma migrate deploy

      - name: Run linter
        run: npm run lint
        continue-on-error: true

      - name: Run tests
        run: npm test -- --coverage

      - name: Build application
        run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --production
        continue-on-error: true

      - name: Check for critical vulnerabilities
        run: |
          if npm audit --json --production | grep -q '"severity":"critical"'; then
            echo "Critical vulnerabilities found!"
            exit 1
          fi
        continue-on-error: true

  type-check:
    runs-on: ubuntu-latest

    env:
      DATABASE_URL: postgresql://user:password@localhost:5432/testdb?sslmode=disable

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check with TypeScript
        run: npx tsc --noEmit

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
