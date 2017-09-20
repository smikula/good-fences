import Config from './Config';

export default interface ConfigSet {
    [path: string]: Config;
};
