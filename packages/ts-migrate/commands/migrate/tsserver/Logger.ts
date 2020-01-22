/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define, class-methods-use-this */
/**
 * Modeled after https://github.com/Microsoft/TypeScript/blob/bb1ac81bb1ddab587e0a4c80c882b308268f7fc0/src/tsserver/server.ts#L120
 */
import fs from 'fs';

export enum LogLevel {
  terse,
  normal,
  requestTime,
  verbose,
}

export enum Msg {
  Err = 'Err',
  Info = 'Info',
  Perf = 'Perf',
}

export interface Logger {
  close(): void;
  hasLevel(level: LogLevel): boolean;
  loggingEnabled(): boolean;
  perftrc(s: string): void;
  info(s: string): void;
  err(s: string): void;
  startGroup(): void;
  endGroup(): void;
  msg(s: string, type?: Msg): void;
  getLogFileName(): string | undefined;
}

export class FileLogger implements Logger {
  private readonly logFilename: string;

  private readonly traceToConsole: boolean;

  private readonly level: LogLevel;

  private fd = -1;

  private seq = 0;

  private inGroup = false;

  private firstInGroup = true;

  constructor(logFilename: string, traceToConsole: boolean, level: LogLevel) {
    this.logFilename = logFilename;
    this.traceToConsole = traceToConsole;
    this.level = level;

    try {
      this.fd = fs.openSync(logFilename, 'w');
    } catch (_) {
      // swallow the error and keep logging disabled if file cannot be opened
    }
  }

  close() {
    if (this.fd >= 0) {
      fs.close(this.fd, noop);
    }
  }

  getLogFileName() {
    return this.logFilename;
  }

  perftrc(s: string) {
    this.msg(s, Msg.Perf);
  }

  info(s: string) {
    this.msg(s, Msg.Info);
  }

  err(s: string) {
    this.msg(s, Msg.Err);
  }

  startGroup() {
    this.inGroup = true;
    this.firstInGroup = true;
  }

  endGroup() {
    this.inGroup = false;
  }

  loggingEnabled() {
    return !!this.logFilename || this.traceToConsole;
  }

  hasLevel(level: LogLevel) {
    return this.loggingEnabled() && this.level >= level;
  }

  msg(s: string, type: Msg = Msg.Err) {
    if (!this.canWrite) return;
    s = `[${nowString()}] ${s}\n`;
    if (!this.inGroup || this.firstInGroup) {
      const prefix = padStringRight(`${type} ${this.seq}`, '          ');
      s = prefix + s;
    }
    this.write(s);
    if (!this.inGroup) {
      this.seq += 1;
    }
  }

  private get canWrite() {
    return this.fd >= 0 || this.traceToConsole;
  }

  private write(s: string) {
    if (this.fd >= 0) {
      const buf = bufferFrom(s);
      fs.writeSync(this.fd, buf, 0, buf.length, /* position */ null);
    }
    if (this.traceToConsole) {
      // eslint-disable-next-line no-console
      console.warn(s);
    }
  }
}

export class NoopLogger implements Logger {
  close(): void {
    /* noop */
  }

  hasLevel(_level: LogLevel): boolean {
    return false;
  }

  loggingEnabled(): boolean {
    return false;
  }

  perftrc(_s: string): void {
    /* noop */
  }

  info(_s: string): void {
    /* noop */
  }

  err(_s: string): void {
    /* noop */
  }

  startGroup(): void {
    /* noop */
  }

  endGroup(): void {
    /* noop */
  }

  msg(_s: string, _type?: Msg | undefined): void {
    /* noop */
  }

  getLogFileName(): string | undefined {
    return undefined;
  }
}

function nowString() {
  // E.g. "12:34:56.789"
  const d = new Date();
  return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
}

function padStringRight(str: string, padding: string) {
  return (str + padding).slice(0, padding.length);
}

function noop(_?: {} | null | undefined): void {}

function bufferFrom(input: string, encoding?: BufferEncoding): Buffer {
  return Buffer.from && (Buffer.from as Function) !== Int8Array.from
    ? Buffer.from(input, encoding)
    : new Buffer(input, encoding); // eslint-disable-line no-buffer-constructor
}
