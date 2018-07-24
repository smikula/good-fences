import getOptions from '../utils/getOptions';

export default function reportError(message: string) {
    if (getOptions().onError) {
        getOptions().onError(message);
    }
}
