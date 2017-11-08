import * as path from 'path';
import createPath from '../src/createPath';
import fileMatchesConfigGlob from '../src/fileMatchesConfigGlob';

const importFilePath = createPath('a\\b\\c\\d\\e\\file.ts');
const configPath = createPath('a\\b');

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
        let key = 'c\\d\\e\\file';
        let match = fileMatchesConfigGlob(importFilePath, configPath, key);
        expect(match).toBe(true);
    });

    it('matches file wildcards', () => {
        let key = 'c\\d\\e\\*';
        let match = fileMatchesConfigGlob(importFilePath, configPath, key);
        expect(match).toBe(true);
    });

    it('matches path wildcards', () => {
        let key = 'c\\**\\file';
        let match = fileMatchesConfigGlob(importFilePath, configPath, key);
        expect(match).toBe(true);
    });
});
