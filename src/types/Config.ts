export default interface Config {
    path: string;
    tags?: string[];
    exports?: { [files: string]: string | string[] };
};
