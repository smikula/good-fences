import * as fs from 'fs';
import * as path from 'path';
import RawConfig from '../types/rawConfig/RawConfig';
import Config from '../types/Config';
import normalizePath from './normalizePath';

export default function loadConfig(file: string): Config {
    let rawConfig: RawConfig = JSON.parse(fs.readFileSync(file).toString());

    let config: Config = <any>rawConfig;
    config.path = normalizePath(path.dirname(file));
    return config;
}
