import NormalizedPath from '../../../src/types/NormalizedPath';
import {
    FenceAndImportDiffs,
    SourceImportDiff,
} from '../../../src/utils/diffing/getFenceAndImportDiffsFromGit';
import { FenceDiff } from '../../../src/utils/diffing/getFenceDiff';
import { getPartialCheckFromImportDiffs } from '../../../src/utils/diffing/getPartialCheckFromImportDiffs';

function testGraphDiff({
    fenceDiffs,
    importDiffs,
}: {
    fenceDiffs?: Record<string, Partial<FenceDiff>>;
    importDiffs?: Record<string, Partial<SourceImportDiff>>;
}): FenceAndImportDiffs {
    return {
        fenceDiffs: new Map(
            Object.entries(fenceDiffs || {}).map(([fencePath, partialFenceDiff]): [
                NormalizedPath,
                FenceDiff
            ] => [
                fencePath as NormalizedPath,
                {
                    tags: null,
                    imports: null,
                    exports: null,
                    dependencies: null,
                    ...partialFenceDiff,
                },
            ])
        ),
        sourceImportDiffs: new Map(
            Object.entries(importDiffs || {}).map(([importPath, partialSourceImportDiff]): [
                NormalizedPath,
                SourceImportDiff
            ] => [
                importPath as NormalizedPath,
                {
                    addedImports: [],
                    removedImports: [],
                    ...partialSourceImportDiff,
                },
            ])
        ),
    };
}

describe('getPartialCheckFromImportDiffs', () => {
    describe('editing fences', () => {
        describe('in-place edits to existing fence sections', () => {
            it('performs a full check when exports are removed from a fence', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            exports: {
                                added: [],
                                removed: [{ accessibleTo: null, modules: 'src/indexOld' }],
                            },
                        },
                    },
                });
                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);

                // We fail to calculate a partial check, expect null here
                expect(partialCheck).toBe(null);
            });

            it('performs no additional checks when exports are added to a fence', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            exports: {
                                added: [{ accessibleTo: 'test', modules: 'src/dir/file' }],
                                removed: [],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: [], sourceFiles: [] });
            });

            it('performs no additional checks when imports are added to a fence', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            imports: {
                                added: ['new-allowed-import'],
                                removed: [],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: [], sourceFiles: [] });
            });

            it("re-checks a fence's children when imports are removed from a fence", () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            imports: {
                                added: [],
                                removed: ['old-allowed-import'],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: ['/path/to/fence'], sourceFiles: [] });
            });

            it('performs no additional checks when dependencies are added to a fence', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            dependencies: {
                                added: [
                                    {
                                        dependency: 'react-dom',
                                        accessibleTo: 'ui-mount-tag',
                                    },
                                ],
                                removed: [],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: [], sourceFiles: [] });
            });

            it("re-checks a fence's children when dependencies are removed from a fence", () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            dependencies: {
                                added: [],
                                removed: [
                                    {
                                        dependency: 'react-dom',
                                        accessibleTo: 'ui-mount-tag',
                                    },
                                ],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: ['/path/to/fence'], sourceFiles: [] });
            });
        });

        describe('adding or removing fence sections', () => {
            it('performs a full check when an exports section is added', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            exports: {
                                added: [],
                                removed: null,
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toBe(null);
            });

            it('performs no additional checks when the exports section is removed', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            exports: {
                                added: null,
                                removed: [],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: [], sourceFiles: [] });
            });

            it('checks the files under a fence when an imports section is added', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            imports: {
                                added: [],
                                removed: null,
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: ['/path/to/fence'], sourceFiles: [] });
            });

            it('performs no additional checks when the imports section is removed', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            imports: {
                                added: null,
                                removed: [],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: [], sourceFiles: [] });
            });

            it('checks the files under a fence when an dependencies section is added', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            dependencies: {
                                added: [],
                                removed: null,
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: ['/path/to/fence'], sourceFiles: [] });
            });

            it('performs no additional checks when the dependencies section is removed', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            dependencies: {
                                added: null,
                                removed: [],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: [], sourceFiles: [] });
            });
        });

        describe('when tags are added', () => {
            it('performs no additional checks', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            tags: {
                                added: ['some-tag'],
                                removed: [],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: [], sourceFiles: [] });
            });
        });

        describe('when tags are removed', () => {
            it('performs a full check', () => {
                const graphDiff = testGraphDiff({
                    fenceDiffs: {
                        '/path/to/fence': {
                            tags: {
                                added: [],
                                removed: ['some-tag'],
                            },
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual(null);
            });
        });
    });

    describe('editing source files', () => {
        describe('when imports are removed', () => {
            it('performs no additional checks', () => {
                const graphDiff = testGraphDiff({
                    importDiffs: {
                        '/path/to/source/file': {
                            removedImports: [
                                './path/to/foo',
                                'package-bar/lib/util/someThing',
                                './styles.scss',
                            ],
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: [], sourceFiles: [] });
            });
        });

        describe('when imports are added', () => {
            it('re-checks the file with the added imports', () => {
                const graphDiff = testGraphDiff({
                    importDiffs: {
                        '/path/to/source/file': {
                            addedImports: [
                                './path/to/foo',
                                'package-bar/lib/util/someThing',
                                './styles.scss',
                            ],
                        },
                    },
                });

                const partialCheck = getPartialCheckFromImportDiffs(graphDiff);
                expect(partialCheck).toEqual({ fences: [], sourceFiles: ['/path/to/source/file'] });
            });
        });
    });
});
