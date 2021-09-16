import type NormalizedPath from '../../../src/types/NormalizedPath';
import { diffList, getFenceDiff } from '../../../src/utils/diffing/getFenceDiff';

let strictCmp = (a: any, b: any): boolean => {
    return a === b;
};

describe('diffList (internal)', () => {
    describe('a null -> null transition', () => {
        it('returns null (no change)', () => {
            expect(diffList(null, null, strictCmp)).toBe(null);
        });
    });

    describe('a null -> array with content transition', () => {
        it('returns the new list as added', () => {
            expect(diffList(null, ['a'], strictCmp)).toEqual({
                added: ['a'],
                removed: null,
            });
        });

        it('breaks referential equality between the added list and the a.added list', () => {
            const a = ['a'];
            const res = diffList(null, a, strictCmp);
            expect(a).not.toBe(res.added);
        });
    });

    describe('a null -> empty array transition', () => {
        it('returns the new list as added', () => {
            expect(diffList(null, [], strictCmp)).toEqual({
                added: [],
                removed: null,
            });
        });
    });

    describe('an array with content -> null transition', () => {
        it('returns the old list content as removed', () => {
            expect(diffList(['a'], null, strictCmp)).toEqual({
                added: null,
                removed: ['a'],
            });
        });
    });

    describe('an empty array -> null transition', () => {
        it('returns the old list content as removed', () => {
            expect(diffList([], null, strictCmp)).toEqual({
                added: null,
                removed: [],
            });
        });
    });

    describe('when an element is removed', () => {
        it('returns the removed element in the removed array', () => {
            expect(diffList(['a', 'b'], ['a'], strictCmp)).toEqual({
                added: [],
                removed: ['b'],
            });
        });
    });

    describe('when an element is added', () => {
        it('returns the added element in the added array', () => {
            expect(diffList(['a'], ['a', 'b'], strictCmp)).toEqual({
                added: ['b'],
                removed: [],
            });
        });
    });

    describe('when there is a mix of added and removed elements', () => {
        it('returns the added element in the added array', () => {
            expect(diffList(['a', 'c'], ['a', 'b'], strictCmp)).toEqual({
                added: ['b'],
                removed: ['c'],
            });
        });
    });

    describe('when the input and output arrays have identical content in a different order', () => {
        it('returns null (no change)', () => {
            expect(diffList(['a', 'b'], ['b', 'a'], strictCmp)).toBe(null);
        });
    });
});

describe('getFenceDiff', () => {
    describe('when diffing two fences that have all null entries', () => {
        it('returns null (no fence-level change)', () => {
            expect(
                getFenceDiff(
                    {
                        imports: null,
                        exports: null,
                        tags: null,
                        dependencies: null,
                        path: '/mock/path1' as NormalizedPath,
                    },
                    {
                        imports: null,
                        exports: null,
                        tags: null,
                        dependencies: null,
                        path: '/mock/path2' as NormalizedPath,
                    }
                )
            ).toBe(null);
        });
    });

    describe('when diffing two fences that have identical content', () => {
        it('returns null (no fence-level change)', () => {
            expect(
                getFenceDiff(
                    {
                        imports: ['a', 'b'],
                        exports: [
                            {
                                modules: 'src/index',
                                accessibleTo: null,
                            },
                        ],
                        tags: ['a', 'b'],
                        dependencies: [
                            {
                                dependency: 'react-router',
                                accessibleTo: 'src/router/*',
                            },
                        ],
                        path: '/mock/path1' as NormalizedPath,
                    },
                    {
                        imports: ['a', 'b'],
                        exports: [
                            {
                                modules: 'src/index',
                                accessibleTo: null,
                            },
                        ],
                        tags: ['a', 'b'],
                        dependencies: [
                            {
                                dependency: 'react-router',
                                accessibleTo: 'src/router/*',
                            },
                        ],
                        path: '/mock/path2' as NormalizedPath,
                    }
                )
            ).toBe(null);
        });
    });

    describe('when diffing two fences that have different imports, exports, dependencies, and tags', () => {
        it('returns the diff of each list', () => {
            expect(
                getFenceDiff(
                    {
                        imports: ['a'],
                        exports: [
                            {
                                modules: 'src/indexOld',
                                accessibleTo: null,
                            },
                        ],
                        tags: ['tag-a', 'tag-b'],
                        dependencies: null,
                        path: '/mock/path1' as NormalizedPath,
                    },
                    {
                        imports: ['a', 'b'],
                        exports: [
                            {
                                modules: 'src/index',
                                accessibleTo: null,
                            },
                        ],
                        tags: ['tag-b'],
                        dependencies: [
                            {
                                dependency: 'react-router',
                                accessibleTo: 'src/router/*',
                            },
                        ],
                        path: '/mock/path2' as NormalizedPath,
                    }
                )
            ).toEqual({
                tags: { removed: ['tag-a'], added: [] },
                imports: { added: ['b'], removed: [] },
                dependencies: {
                    added: [{ accessibleTo: 'src/router/*', dependency: 'react-router' }],
                    removed: null,
                },
                exports: {
                    added: [{ accessibleTo: null, modules: 'src/index' }],
                    removed: [{ accessibleTo: null, modules: 'src/indexOld' }],
                },
            });
        });
    });
});
