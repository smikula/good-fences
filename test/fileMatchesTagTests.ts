import fileMatchesTag from '../src/fileMatchesTag';
import * as getTagsForFile from '../src/getTagsForFile';

const MATCHING_TAG = 'matchingTag';
const NONMATCHING_TAG = 'nonmatchingTag';

describe('fileMatchesTag', () => {
    beforeEach(() => {
        spyOn(getTagsForFile, 'default').and.returnValue([MATCHING_TAG]);
    });

    it('returns false if no tag matches', () => {
        let match = fileMatchesTag(null, NONMATCHING_TAG);
        expect(match).toBe(false);
    });

    it('matches anything to *', () => {
        let match = fileMatchesTag(null, '*');
        expect(match).toBe(true);
    });

    it('matches a single tag', () => {
        let match = fileMatchesTag(null, MATCHING_TAG);
        expect(match).toBe(true);
    });

    it('matches an array of tags', () => {
        let match = fileMatchesTag(null, [NONMATCHING_TAG, MATCHING_TAG]);
        expect(match).toBe(true);
    });
});
