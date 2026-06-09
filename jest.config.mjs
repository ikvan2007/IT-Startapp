import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/_tests_/**/*.test.ts',
    '<rootDir>/_tests_/**/*.test.tsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
  ],
testPathIgnorePatterns: [
  '/node_modules/',
  '/.next/',
  '<rootDir>/_tests_/unit/auth.test.ts',
  '<rootDir>/_tests_/integration/auth.integration.test.ts',
  '<rootDir>/_tests_/integration/profile-leaderboard.integration.test.ts',
  '<rootDir>/_tests_/integration/courses.integration.test.ts',
],
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
}

export default createJestConfig(config)