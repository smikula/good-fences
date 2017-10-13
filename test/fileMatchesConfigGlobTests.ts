import fileMatchesConfigGlob from '../src/fileMatchesConfigGlob';

const importFilePath = 'a:\\b\\c\\d\\e\\file.ts';
const configPath = 'a:\\b';

describe('fileMatchesConfigGlob', () => {
    it('returns false if not a match', () => {
        let match = fileMatchesConfigGlob(importFilePath, configPath, 'x');
        expect(match).toBe(false);
    });

    it('matches *', () => {
        let match = fileMatchesConfigGlob(importFilePath, configPath, '*');
        expect(match).toBe(true);
    });

    it('matches an exact file', () => {
        let match = fileMatchesConfigGlob(importFilePath, configPath, 'c\\d\\e\\file');
        expect(match).toBe(true);
    });

    it('matches file wildcards', () => {
        let match = fileMatchesConfigGlob(importFilePath, configPath, 'c\\d\\e\\*');
        expect(match).toBe(true);
    });

    it('matches path wildcards', () => {
        let match = fileMatchesConfigGlob(importFilePath, configPath, 'c\\**\\file');
        expect(match).toBe(true);
    });
});
