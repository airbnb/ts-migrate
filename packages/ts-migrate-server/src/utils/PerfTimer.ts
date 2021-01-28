import { performance } from 'perf_hooks';
import prettyMilliseconds from 'pretty-ms';

export default class PerfTimer {
  private start = performance.now();

  elapsed(): number {
    return performance.now() - this.start;
  }

  elapsedStr(): string {
    return prettyMilliseconds(this.elapsed());
  }
}
