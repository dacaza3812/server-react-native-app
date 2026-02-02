module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverage: true,
    collectCoverageFrom: [
        'controllers/**/*.{js,ts}',
        'models/**/*.{js,ts}',
        'routes/**/*.{js,ts}',
        'middleware/**/*.{js,ts}',
        'utils/**/*.{js,ts}'
    ],
    coveragePathIgnorePatterns: ['/node_modules/', 'errors/', 'config/', 'app.js', 'app.ts', 'server.js', 'server.ts'],
    coverageDirectory: 'coverage',
    verbose: true,
    forceExit: true,
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    moduleFileExtensions: ['js', 'ts', 'json'],
};
//# sourceMappingURL=jest.config.js.map