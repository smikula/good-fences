describe('cli', () => {
    it('returns the expected results', () => {
        // Arrange
        const errors: string[] = [];
        process.argv = ['node', './lib/core/cli.js', '--rootDir', './sample'];

        spyOn(console, 'error').and.callFake(error => {
            errors.push(error);
        });

        // Act
        require('../../src/core/cli');

        // Assert
        expect(errors).toEqual(expectedErrors);
    });
});

// TODO: get errors from file?
// TODO: deal with absolute paths
// TODO: rename endToEndTests
// Maybe just go to runner?
const expectedErrors = [
    `Good-fences violation in C:\\repos\\good-fences\\sample\\src\\componentA\\helperA1.ts:\n
    Module is not exported: C:\\repos\\good-fences\\sample\\src\\componentB\\helperB1.ts\n
    Fence: C:\\repos\\good-fences\\sample\\src\\componentB\\fence.json`,
    `Good-fences violation in C:\\repos\\good-fences\\sample\\src\\componentA\\helperA1.ts:\n
    Import not allowed: ../componentB/helperB1\n
    Fence: C:\\repos\\good-fences\\sample\\src\\componentA\\fence.json`,
    `Good-fences violation in C:\\repos\\good-fences\\sample\\src\\componentA\\componentA.ts:\n
    Import not allowed: ../componentB/componentB\n
    Fence: C:\\repos\\good-fences\\sample\\src\\componentA\\fence.json`,
    `Good-fences violation in C:\\repos\\good-fences\\sample\\src\\index.ts:\n
    Module is not exported: C:\\repos\\good-fences\\sample\\src\\componentB\\componentB.ts\n
    Fence: C:\\repos\\good-fences\\sample\\src\\componentB\\fence.json`,
];
