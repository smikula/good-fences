import * as fs from 'fs';
import RawConfig from '../../src/types/rawConfig/RawConfig';
import loadConfig, { normalizeExportRules } from '../../src/utils/loadConfig';
import * as normalizePath from '../../src/utils/normalizePath';
import ConfigSet from '../../src/types/ConfigSet';

describe('loadConfig', () => {
    const configPath = 'configPath';
    const normalizedPath = 'normalizedPath';

    let rawConfig: RawConfig;
    let configSet: ConfigSet;

    beforeEach(() => {
        spyOn(fs, 'readFileSync').and.returnValue({});
        spyOn(JSON, 'parse').and.callFake(() => rawConfig);
        spyOn(normalizePath, 'default').and.returnValue(normalizedPath);
        configSet = {};
    });

    it('adds the config to the configSet object', () => {
        // Arrange
        rawConfig = {};

        // Act
        loadConfig(configPath, configSet);

        // Assert
        expect(configSet[normalizedPath]).toBeDefined();
    });

    it('adds the normalized path to the config object', () => {
        // Arrange
        rawConfig = {};

        // Act
        loadConfig(configPath, configSet);

        // Assert
        expect(configSet[normalizedPath].path).toBe(normalizedPath);
    });

    it('includes the tags', () => {
        // Arrange
        let tags = ['tag1', 'tag2'];
        rawConfig = { tags };

        // Act
        loadConfig(configPath, configSet);

        // Assert
        expect(configSet[normalizedPath].tags).toHaveLength(2);
        expect(configSet[normalizedPath].tags[0]).toEqual({
            applicableTo: null,
            tag: tags[0]
        });
        expect(configSet[normalizedPath].tags[1]).toEqual({
            applicableTo: null,
            tag: tags[1]
        });
    });

    it('includes the imports', () => {
        // Arrange
        let imports = [];
        rawConfig = { imports };

        // Act
        loadConfig(configPath, configSet);

        // Assert
        expect(configSet[normalizedPath].imports).toBe(imports);
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
        loadConfig(configPath, configSet);

        // Assert
        expect(configSet[normalizedPath].dependencies).toEqual(normalizedDependencies);
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
});
