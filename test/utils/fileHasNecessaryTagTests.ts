import fileHasNecessaryTag from '../../src/utils/fileHasNecessaryTag';
import * as getTagsForFile from '../../src/utils/getTagsForFile';

const MATCHING_TAG = 'matchingTag';
const NONMATCHING_TAG = 'nonmatchingTag';

describe('fileHasNecessaryTag', () => {
    beforeEach(() => {
        spyOn(getTagsForFile, 'default').and.returnValue([MATCHING_TAG]);
    });

    it('returns false if no tag matches', () => {
        let match = fileHasNecessaryTag(null, NONMATCHING_TAG);
        expect(match).toBe(false);
    });

    it('matches anything to null', () => {
        let match = fileHasNecessaryTag(null, null);
        expect(match).toBe(true);
    });

    it('matches a single tag', () => {
        let match = fileHasNecessaryTag(null, MATCHING_TAG);
        expect(match).toBe(true);
    });

    it('matches an array of tags', () => {
        let match = fileHasNecessaryTag(null, [NONMATCHING_TAG, MATCHING_TAG]);
        expect(match).toBe(true);
    });
});
