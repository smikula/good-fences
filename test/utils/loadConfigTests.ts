import * as fs from 'fs';
import RawConfig from '../../src/types/rawConfig/RawConfig';
import loadConfig, { normalizeExportRules } from '../../src/utils/loadConfig';
import * as normalizePath from '../../src/utils/normalizePath';

describe('loadConfig', () => {
    const configPath = 'configPath';
    const normalizedPath = 'normalizedPath';

    let rawConfig: RawConfig;

    beforeEach(() => {
        spyOn(fs, 'readFileSync').and.returnValue({});
        spyOn(JSON, 'parse').and.callFake(() => rawConfig);
        spyOn(normalizePath, 'default').and.returnValue(normalizedPath);
    });

    it('adds the normalized path to the config object', () => {
        // Arrange
        rawConfig = {};

        // Act
        let config = loadConfig(configPath);

        // Assert
        expect(config.path).toBe(normalizedPath);
    });

    it('includes the tags', () => {
        // Arrange
        let tags = ['tag1', 'tag2'];
        rawConfig = { tags };

        // Act
        let config = loadConfig(configPath);

        // Assert
        expect(config.tags).toBe(tags);
    });

    it('includes the imports', () => {
        // Arrange
        let imports = [];
        rawConfig = { imports };

        // Act
        let config = loadConfig(configPath);

        // Assert
        expect(config.imports).toBe(imports);
    });

    it('normalizes the dependency rules', () => {
        // Arrange
        let dependencies = [
            'dependency1',
            {
                dependency: 'dependency2',
                accessibleTo: 'tag1',
            },
        ];

        let normalizedDependencies = [
            { dependency: 'dependency1', accessibleTo: null },
            { dependency: 'dependency2', accessibleTo: 'tag1' },
        ];

        rawConfig = { dependencies };

        // Act
        let config = loadConfig(configPath);

        // Assert
        expect(config.dependencies).toEqual(normalizedDependencies);
    });
});

describe('normalizeExportRules', () => {
    const testModules = 'test';

    it('handles null', () => {
        // Act
        const returnValue = normalizeExportRules(null);

        // Assert
        expect(returnValue).toEqual(null);
    });

    it('does not modify a full ExportRule', () => {
        // Arrange
        const exportRules = [
            {
                modules: testModules,
                accessibleTo: ['tag1', 'tag2'],
            },
        ];

        // Act
        const returnValue = normalizeExportRules(exportRules);

        // Assert
        expect(returnValue).toEqual(exportRules);
    });

    it('converts a simple strings to ExportRules', () => {
        // Arrange
        const exportRules = [testModules];

        // Act
        const returnValue = normalizeExportRules(exportRules);

        // Assert
        expect(returnValue).toEqual([
            {
                modules: testModules,
                accessibleTo: null,
            },
        ]);
    });

    // it('converts a LegacyExportRule accessible to *', () => {
    //     fail();
    // });

    // it('converts a LegacyExportRule accessible to a single tag', () => {
    //     fail();
    // });

    // it('converts a LegacyExportRule accessible to multiple tags', () => {
    //     fail();
    // });
});
