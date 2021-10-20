import { resetResult } from '../../src/core/result';
import { run } from '../../src/core/runner';
import GoodFencesError from '../../src/types/GoodFencesError';
import GoodFencesResult from '../../src/types/GoodFencesResult';
import normalizePath from '../../src/utils/normalizePath';

describe('runner', () => {
    afterEach(() => {
        resetResult();
    });

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
        normalizeOrder(actualResults);
        normalizeOrder(expectedResults);
        expect(actualResults).toEqual(expectedResults);
    });

    it('returns the expected results with looseRootFileDiscovery', async () => {
        // Arrange
        const expectedResults = require('./endToEndTests.expected.json');

        // Act
        const actualResults = await run({
            rootDir: './sample',
            looseRootFileDiscovery: true,
        });

        // Assert
        removeDetailedMessages(actualResults);
        normalizePaths(expectedResults);
        normalizeOrder(actualResults);
        normalizeOrder(expectedResults);
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

function normalizeOrder(results: GoodFencesResult) {
    results.errors.sort((a: GoodFencesError, b: GoodFencesError): number =>
        a.sourceFile.localeCompare(b.sourceFile)
    );
    results.warnings.sort((a: GoodFencesError, b: GoodFencesError): number =>
        a.sourceFile.localeCompare(b.sourceFile)
    );
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
