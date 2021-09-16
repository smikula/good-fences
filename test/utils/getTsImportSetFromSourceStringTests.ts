import { getTsImportSetFromSourceString } from '../../src/utils/getTsImportSetFromSourceString';

describe('getTsImportSetFromSourceString', () => {
    it('handles root-level import statements', () => {
        const parsedImports = getTsImportSetFromSourceString(
            `
            import { foo } from 'import-specifier-from-root-level-import-statement'; 
            `
        );

        expect(parsedImports).toEqual(
            new Set(['import-specifier-from-root-level-import-statement'])
        );
    });

    it('handles static require statements in root-level assignemnts', () => {
        const parsedImports = getTsImportSetFromSourceString(
            `
            const foo = require('require-expression');
            `
        );

        expect(parsedImports).toEqual(new Set(['require-expression']));
    });

    it('handles static require expressions in non-root-level statements', () => {
        const parsedImports = getTsImportSetFromSourceString(
            `
            if (true) {
                const foo = false ? require('require-expression-1') : require('require-expression-2');
            }
            `
        );

        expect(parsedImports).toEqual(new Set(['require-expression-1', 'require-expression-2']));
    });

    it('handles import() expressions (webpack code splitting)', () => {
        const parsedImports = getTsImportSetFromSourceString(
            `
            const x = import('code-splitting-entrypoint' /* Webpack Chunk Name*/)
            `
        );

        expect(parsedImports).toEqual(new Set(['code-splitting-entrypoint']));
    });

    describe('failure scenarios', () => {
        // Exist as demonstrations of the limits of ts.preProcessFile,
        // not as a strict part of the feature spec.

        it('does not handle dynamic require expressions', () => {
            const parsedImports = getTsImportSetFromSourceString(
                `
                if (true) {
                    const foo = require(false ? 'require-expression-1' : 'require-expression-2';
                }
                `
            );

            expect(parsedImports).toEqual(new Set([]));
        });
    });
});
