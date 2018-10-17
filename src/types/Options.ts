export default interface Options {
    project?: string;
    rootDir?: string;
    ignoreNodeModules?: boolean;
    onError?: (message: string) => void;
};
