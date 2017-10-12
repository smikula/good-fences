import fileMatchesTag from '../src/fileMatchesTag';

describe('fileMatchesTag', () => {
    it('matches anything to *', () => {
        expect(fileMatchesTag(null, '*')).toBe(true);
    });
});
