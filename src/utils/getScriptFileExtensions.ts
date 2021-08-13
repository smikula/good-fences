export type PartialConfigOptions = {
    allowJs: boolean;
    jsx: boolean;
    includeJson?: boolean;
    includeDefinitions?: boolean;
};

export function getScriptFileExtensions(options: PartialConfigOptions): string[] {
    const extensions: string[] = ['.ts'];
    if (options.allowJs) {
        extensions.push('.js');
        if (options.jsx) {
            extensions.push('.jsx');
        }
    }

    if (options.includeJson) {
        extensions.push('.json');
    }

    if (options.jsx) {
        extensions.push('.tsx');
    }

    if (options.includeDefinitions) {
        extensions.push('.d.ts');
        if (options.jsx) {
            // I don't know why this would ever
            // be a thing, but it is, so I'm adding it here.
            extensions.push('.d.jsx');
        }
    }

    return extensions;
}
