import { run } from '../../src/core/runner';
import GoodFencesResult from '../../src/types/GoodFencesResult';
import normalizePath from '../../src/utils/normalizePath';

describe('runner', () => {
    it('returns the expected results', async () => {
        // Arrange
        const expectedResults = require('./endToEndTests.expected.json');

        // Act
        const actualResults = await run({
            rootDir: './sample',
        });

        // Assert
        removeDetailedMessages(actualResults);
        normalizePaths(expectedResults);
        expect(actualResults).toEqual(expectedResults);
    });
});

function removeDetailedMessages(results: GoodFencesResult) {
    for (const error of results.errors) {
        delete error.detailedMessage;
    }

    for (const warning of results.warnings) {
        delete warning.detailedMessage;
    }
}

function normalizePaths(results: GoodFencesResult) {
    for (const error of results.errors) {
        error.fencePath = normalizePath(error.fencePath);
        error.sourceFile = normalizePath(error.sourceFile);
    }

    for (const warning of results.warnings) {
        warning.fencePath = normalizePath(warning.fencePath);
    }
}
