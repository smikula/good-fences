export async function batchRunAll<I>(
    maxBatchSize: number,
    inputs: I[],
    cb: (input: I) => Promise<void>
): Promise<void> {
    const i = [...inputs];
    console.log(inputs.length);
    const initialWorkingSet = i.splice(0, maxBatchSize);
    const queueNext = (): Promise<void> => {
        const next = i.shift();
        if (i.length % 1000 === 0) {
            console.log(i.length);
        }
        return cb(next).then(queueNext);
    };
    await Promise.all(initialWorkingSet.map(i => cb(i).then(queueNext)));
}
