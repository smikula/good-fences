// We mock the fs module here because in newer version of node,
// the builtin module epxorts are non-writeable. This means that
// spyOn(fs, 'readFileSync') will error in beforeEach and no mocks
// will actually be set.
//
// By providing a mock module here and calling jest.mock('fs')
// before any imports, we replace any imports of fs with
// this module, which has mutable exports.

export function readFileSync() {
    throw new Error('readFileSync mock was not overridden');
}
