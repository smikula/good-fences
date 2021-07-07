module.exports = {
    testEnvironment: 'node',
    moduleDirectories: ['node_modules'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '.ts': '<rootDir>/jest.preprocessor.js',
    },
    transformIgnorePatterns: ['node_modules'],
    testMatch: ['<rootDir>/test/**/*Tests.ts'],
};
