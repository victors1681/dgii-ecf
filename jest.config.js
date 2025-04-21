module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'node',
  testTimeout: 60000,
  transform: {
    '^.+\\.(jsx|ts|tsx|d.ts)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
