export default interface Options {
    project?: string;
    rootDir?: string;
    ignoreExternalFences?: boolean;
    onError?: (message: string) => void;
};
