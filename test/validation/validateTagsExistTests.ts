import * as result from '../../src/core/result';
import * as getConfigManager from '../../src/utils/getConfigManager';
import ConfigSet from '../../src/types/ConfigSet';
import { validateTagsExist } from '../../src/validation/validateTagsExist';

describe('validateTagsExist', () => {
    let allConfigs: ConfigSet;

    beforeEach(() => {
        spyOn(result, 'reportWarning');
        spyOn(getConfigManager, 'default').and.callFake(() => ({
            getAllConfigs: () => allConfigs,
        }));
    });

    it('passes for an empty config', () => {
        // Arrange
        initializeAllConfigs({});

        // Act
        validateTagsExist();

        // Assert
        expect(result.reportWarning).not.toHaveBeenCalled();
    });

    it('passes for a known tag in export rules', () => {
        // Arrange
        initializeAllConfigs({
            exports: [
                {
                    modules: 'testModule',
                    accessibleTo: 'tag1',
                },
            ],
        });

        // Act
        validateTagsExist();

        // Assert
        expect(result.reportWarning).not.toHaveBeenCalled();
    });

    it('passes for a known tag in dependency rules', () => {
        // Arrange
        initializeAllConfigs({
            dependencies: [
                {
                    dependency: 'test-dependency',
                    accessibleTo: 'tag2',
                },
            ],
        });

        // Act
        validateTagsExist();

        // Assert
        expect(result.reportWarning).not.toHaveBeenCalled();
    });

    it('passes for a known tag in import rules', () => {
        // Arrange
        initializeAllConfigs({
            imports: ['tag3'],
        });

        // Act
        validateTagsExist();

        // Assert
        expect(result.reportWarning).not.toHaveBeenCalled();
    });

    it('warns for an unknown tag in export rules', () => {
        // Arrange
        const testConfig = {
            path: 'testPath',
            exports: [
                {
                    modules: 'testModule',
                    accessibleTo: ['unknownTag'],
                },
            ],
        };

        initializeAllConfigs(testConfig);

        // Act
        validateTagsExist();

        // Assert
        expect(result.reportWarning).toHaveBeenCalledWith(
            "Tag 'unknownTag' is referred to but is not defined in any fence.",
            testConfig.path
        );
    });

    it('warns for an unknown tag in dependency rules', () => {
        // Arrange
        const testConfig = {
            path: 'testPath',
            dependencies: [
                {
                    dependency: 'test-dependency',
                    accessibleTo: ['unknownTag'],
                },
            ],
        };

        initializeAllConfigs(testConfig);

        // Act
        validateTagsExist();

        // Assert
        expect(result.reportWarning).toHaveBeenCalledWith(
            "Tag 'unknownTag' is referred to but is not defined in any fence.",
            testConfig.path
        );
    });

    it('warns for an unknown tag in import rules', () => {
        // Arrange
        const testConfig = {
            path: 'testPath',
            imports: ['unknownTag'],
        };

        initializeAllConfigs(testConfig);

        // Act
        validateTagsExist();

        // Assert
        expect(result.reportWarning).toHaveBeenCalledWith(
            "Tag 'unknownTag' is referred to but is not defined in any fence.",
            testConfig.path
        );
    });

    function initializeAllConfigs(testConfig: any) {
        allConfigs = {
            config1: {
                tags: ['tag1', 'tag2'],
            },
            config2: {
                tags: ['tag3'],
            },
            testConfig,
        } as any;
    }
});
