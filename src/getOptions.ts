import Options from './types/Options';

let options: Options;

export default function getOptions() {
    return options;
}

export function setOptions(value: Options) {
    options = value;
}
