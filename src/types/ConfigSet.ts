interface DirectoryConfig {
    tags: string[];
}

export default interface ConfigSet {
    [path: string]: DirectoryConfig;
};
