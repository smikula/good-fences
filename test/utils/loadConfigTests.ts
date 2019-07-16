import * as fs from 'fs';
import RawConfig from '../../src/types/rawConfig/RawConfig';
import loadConfig from '../../src/utils/loadConfig';
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

    it('includes the exports', () => {
        // Arrange
        let exports = {};
        rawConfig = { exports };

        // Act
        let config = loadConfig(configPath);

        // Assert
        expect(config.exports).toBe(exports);
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

    it('includes the required fences', () => {
        // Arrange
        let requiredFences = [];
        rawConfig = { requiredFences };

        // Act
        let config = loadConfig(configPath);

        // Assert
        expect(config.requiredFences).toBe(requiredFences);
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
