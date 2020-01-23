import { performance } from 'perf_hooks';

export default class PerfTimer {
  private start = performance.now();

  elapsed(): number {
    return performance.now() - this.start;
  }

  elapsedStr(): string {
    return `${this.elapsed().toFixed(3)}ms`;
  }
}
