jest.mock('../../src/utils/getConfigsForFile');

import NormalizedPath from '../../src/types/NormalizedPath';
import Config from '../../src/types/config/Config';
import { default as gcff } from '../../src/utils/getConfigsForFile';
import getTagsForFile from '../../src/utils/getTagsForFile';

const getConfigsForFile: jest.Mock<Config[]> = gcff as any;

const DIRECTORY_A = <NormalizedPath>'/home/admin/good-fences';

const FILEPATH_A = <NormalizedPath>`${DIRECTORY_A}/a.txt`;
const FILEPATH_B = <NormalizedPath>`${DIRECTORY_A}/b.txt`;

describe('getTagsForTest', () => {
  beforeEach(() => {
    getConfigsForFile.mockReset();
  });

  it('should return an empty array for files without configs', () => {
    getConfigsForFile.mockReturnValue([]);

    const tags = getTagsForFile(FILEPATH_A);

    expect(tags).toHaveLength(0);
  });

  it('should skip over config file that don\'t define any tags', () => {
    getConfigsForFile.mockReturnValue([{
      path: DIRECTORY_A,
      tags: null,
      exports: null,
      dependencies: null,
      imports: null
    }]);

    const tags = getTagsForFile(FILEPATH_A);

    expect(tags).toHaveLength(0);
  });

  it('should alphabetize the tags returned', () => {
    getConfigsForFile.mockReturnValue([
      {
        path: DIRECTORY_A,
        tags: [{
          applicableTo: null,
          tag: 'zzzz'
        },{
          applicableTo: null,
          tag: 'aaaa'
        }],
        exports: null,
        dependencies: null,
        imports: null
      }
    ]);

    const tags = getTagsForFile(FILEPATH_A);

    expect(tags).toEqual(['aaaa', 'zzzz']);
  });

  it('should remove duplicated tags', () => {
    getConfigsForFile.mockReturnValue([
      {
        path: DIRECTORY_A,
        tags: [{
          applicableTo: null,
          tag: 'hello'
        },{
          applicableTo: null,
          tag: 'hello'
        }],
        exports: null,
        dependencies: null,
        imports: null
      }
    ]);

    const tags = getTagsForFile(FILEPATH_A);

    expect(tags).toEqual(['hello']);
  });

  it('should include all globally-applicable tags defined for all config files', () => {
    getConfigsForFile.mockReturnValue([
      {
        path: DIRECTORY_A,
        tags: [{
          applicableTo: null,
          tag: 'hello'
        },{
          applicableTo: null,
          tag: 'world'
        }],
        exports: null,
        dependencies: null,
        imports: null
      },
      {
        path: DIRECTORY_A,
        tags: [{
          applicableTo: null,
          tag: 'goodbye'
        }],
        exports: null,
        dependencies: null,
        imports: null
      }
    ]);

    const tags = getTagsForFile(FILEPATH_A);

    expect(tags).toEqual(['goodbye', 'hello', 'world']);
  });

  it('should should respect tag applicability, if defined', () => {
    getConfigsForFile.mockReturnValue([
      {
        path: DIRECTORY_A,
        tags: [{
          applicableTo: ['a.txt'],
          tag: 'a-files'
        },{
          applicableTo: ['b.txt'],
          tag: 'b-files'
        }],
        exports: null,
        dependencies: null,
        imports: null
      }
    ]);

    const aTags = getTagsForFile(FILEPATH_A);
    const bTags = getTagsForFile(FILEPATH_B);

    expect(aTags).toEqual(['a-files']);
    expect(bTags).toEqual(['b-files'])
  });

  it('should should allow for glob patterns relative to the config directory', () => {
    getConfigsForFile.mockReturnValue([
      {
        path: DIRECTORY_A,
        tags: [{
          applicableTo: ['**/*.log'],
          tag: 'logs'
        }],
        exports: null,
        dependencies: null,
        imports: null
      }
    ]);

    const logTags = getTagsForFile(<NormalizedPath>`${DIRECTORY_A}/some/nested/directory/my.log`);
    const jsonTags = getTagsForFile(<NormalizedPath>`${DIRECTORY_A}/some/nested/directory/my.json`);

    expect(logTags).toEqual(['logs']);
    expect(jsonTags).toEqual([]);
  });
});