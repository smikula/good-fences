let lastUptime = 0;
export function tick() {
    const now = process.uptime();
    const diff = now - lastUptime;
    lastUptime = now;
    return diff;
}
