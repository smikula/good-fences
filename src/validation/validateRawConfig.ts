import { reportWarning, reportConfigError } from '../core/result';
import RawConfig from '../types/rawConfig/RawConfig';

// Returns true if the config validates successfully
export default function validateRawConfig(rawConfig: RawConfig, configPath: string) {
    let hasError = false;

    if ((rawConfig as any).export && !rawConfig.exports) {
        reportWarning("Config defines an 'export' property.  Did you mean 'exports'?", configPath);
    }

    if ((rawConfig as any).import && !rawConfig.imports) {
        reportWarning("Config defines an 'import' property.  Did you mean 'imports'?", configPath);
    }

    if (rawConfig.tags && !Array.isArray(rawConfig.tags)) {
        reportConfigError("The 'tags' property should be an array of tag strings.", configPath);
        hasError = true;
    }

    if (rawConfig.exports && !Array.isArray(rawConfig.exports)) {
        reportConfigError("The 'exports' property should be an array of export rules.", configPath);
        hasError = true;
    }

    if (rawConfig.dependencies && !Array.isArray(rawConfig.dependencies)) {
        reportConfigError(
            "The 'dependencies' property should be an array of dependency rules.",
            configPath
        );

        hasError = true;
    }

    if (rawConfig.imports && !Array.isArray(rawConfig.imports)) {
        reportConfigError("The 'imports' property should be an array of import rules.", configPath);
        hasError = true;
    }

    return !hasError;
}
