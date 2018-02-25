import getOptions from './getOptions';

export default function reportError(message: string) {
    if (getOptions().onError) {
        getOptions().onError(message);
    }
}
