import getOptions from './getOptions';

export default function reportError(message: string) {
    (getOptions().onError || logToConsole)(message);
}

function logToConsole(message: string) {
    console.error(`Error: ${message}`);
}
