export default function dedupe<T>(...arrays: T[][]) {
    return Array.from(new Set([].concat(...arrays)));
}