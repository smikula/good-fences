import * as CliProgress from 'cli-progress';

export async function batchRunAll<I>(
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
                etaBuffer: 20,
            },
            CliProgress.Presets.shades_grey
        );
        progressBar.start(inputs.length, 0);
    }

    const queueNext = (): Promise<void> | void => {
        const next = i.shift();
        completedJobs += 1;
        if (progressBar) {
            progressBar.update(completedJobs);
        }
        if (next) {
            return cb(next).then(queueNext);
        }
    };
    await Promise.all(initialWorkingSet.map(i => cb(i).then(queueNext)));

    if (progressBar) {
        progressBar.stop();
    }
}
