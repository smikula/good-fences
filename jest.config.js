module.exports = {
    testEnvironment: 'node',
    moduleDirectories: ['node_modules'],
    moduleFileExtensions: [
        'ts',
        'js',
        // nodegit parses its own package.json file,
        // so we need this moduleFileExtension to be
        // specified for tests.
        'json',
    ],
    transform: {
        '.ts': '<rootDir>/jest.preprocessor.js',
    },
    transformIgnorePatterns: ['node_modules'],
    testMatch: ['<rootDir>/test/**/*Tests.ts'],
};
