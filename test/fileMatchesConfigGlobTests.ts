import * as path from 'path';
import fileMatchesConfigGlob from '../src/fileMatchesConfigGlob';

const importFilePath = path.resolve(normalize('a\\b\\c\\d\\e\\file.ts'));
const configPath = path.resolve(normalize('a\\b'));

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
        let key = normalize('c\\d\\e\\file');
        let match = fileMatchesConfigGlob(importFilePath, configPath, key);
        expect(match).toBe(true);
    });

    it('matches file wildcards', () => {
        let key = normalize('c\\d\\e\\*');
        let match = fileMatchesConfigGlob(importFilePath, configPath, key);
        expect(match).toBe(true);
    });

    it('matches path wildcards', () => {
        let key = normalize('c\\**\\file');
        let match = fileMatchesConfigGlob(importFilePath, configPath, key);
        expect(match).toBe(true);
    });
});

// Normalize slashes in the path so tests will work in different environments
function normalize(pathString: string) {
    return pathString.replace(/\\/g, path.sep);
}
