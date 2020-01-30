import { performance } from 'perf_hooks';
export default class PerfTimer {
    constructor() {
        this.start = performance.now();
    }
    elapsed() {
        return performance.now() - this.start;
    }
    elapsedStr() {
        return `${this.elapsed().toFixed(3)}ms`;
    }
}
//# sourceMappingURL=PerfTimer.js.map