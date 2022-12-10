module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  testTimeout: 60000,
  transform: {
    '^.+\\.(jsx|ts|tsx|d.ts)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  preset: 'ts-jest',
  testPathIgnorePatterns: ['/node_modules/', '/.dist/'],
};
