export default interface Options {
    project?: string;
    rootDir?: string;
    requiredFences?: string[];
    onError?: (message: string) => void;
};
