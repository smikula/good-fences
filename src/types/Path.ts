// Simulate nominal typing
// https://github.com/Microsoft/TypeScript/issues/202#issuecomment-302402671
export declare class Nominal<T extends string> {
    private as: T;
}

type Path = string & Nominal<'Path'>;
export default Path;
