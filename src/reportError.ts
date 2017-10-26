let errorReporter = logToConsole;

export default function reportError(message: string) {
    errorReporter(message);
}

export function setErrorReporter(onError: (message: string) => void) {
    errorReporter = onError;
}

function logToConsole(message: string) {
    console.error(`Error: ${message}`);
}
