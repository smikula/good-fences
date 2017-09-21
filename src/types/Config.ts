export default interface Config {
    tags?: string[];
    exports?: { [files: string]: string | string[] };
};
