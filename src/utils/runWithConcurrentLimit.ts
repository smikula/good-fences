import * as CliProgress from 'cli-progress';

export async function runWithConcurrentLimit<I>(
    maxBatchSize: number,
    inputs: I[],
    cb: (input: I) => Promise<void>,
    progress: boolean
): Promise<void> {
    const i = [...inputs];
    let completedJobs = 0;
    const initialWorkingSet = i.splice(0, maxBatchSize);

    let progressBar: CliProgress.SingleBar | undefined;
    if (progress) {
        progressBar = new CliProgress.SingleBar(
            {
                etaBuffer: maxBatchSize,
            },
            CliProgress.Presets.shades_grey
        );
        progressBar.start(inputs.length, 0);
    }

    const queueNext = (): Promise<void> | void => {
        const next = i.shift();
        completedJobs += 1;
        progressBar?.update(completedJobs);
        if (next) {
            return cb(next).then(queueNext);
        }
    };
    await Promise.all(initialWorkingSet.map(i => cb(i).then(queueNext)));

    progressBar?.stop();
}
