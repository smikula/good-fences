/**
 * Extensions to check for when resolving with tsconfig-paths or from relative requires
 *
 * TODO: Should this be settable in options / from the CLI when using FdirSourceFileProvider?
 * Or possibly parsed out of the tsconfig.json?
 */
const SCRIPT_FILE_EXTENSIONS = ['.d.ts', '.d.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'];

export function getScriptFileExtensions(): string[] {
    return SCRIPT_FILE_EXTENSIONS;
}
