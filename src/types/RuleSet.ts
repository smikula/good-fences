interface DepCopJson {
    tags: string[];
}

export default interface RuleSet {
    [path: string]: DepCopJson;
};
