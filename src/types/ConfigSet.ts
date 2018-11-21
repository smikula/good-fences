import Config from './config/Config';

export default interface ConfigSet {
    [path: string]: Config;
};
