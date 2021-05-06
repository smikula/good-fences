import * as path from 'path';
import Config from '../types/config/Config';
import NormalizedPath from '../types/NormalizedPath';

export default function getFilePathRelativeToConfig(filePath: NormalizedPath, config: Config): NormalizedPath {
  // If the provided path doesn't start with the config directory, then return
  // the absolute path.
  const lowercasePath = filePath.toLowerCase();
  if (!lowercasePath.startsWith(config.path.toLowerCase())) {
    return filePath;
  }

  let startIndex = config.path.length;

  // Remove the leading path separator from the relative path, if removing the
  // config directory path would leave it
  if (filePath[startIndex] === path.sep) {
    startIndex += path.sep.length;
  }

  return <NormalizedPath>filePath.substr(startIndex);
}