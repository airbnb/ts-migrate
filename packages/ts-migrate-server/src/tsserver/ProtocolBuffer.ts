/**
 * Modeled after https://github.com/Microsoft/vscode/blob/92f9f50a93ba278f7bb637386ac1ffcdfd38a55e/extensions/typescript-language-features/src/utils/wireProtocol.ts#L17
 */
const DEFAULT_SIZE = 8192;
const CONTENT_LENGTH = 'Content-Length: ';
const CONTENT_LENGTH_SIZE: number = Buffer.byteLength(CONTENT_LENGTH, 'utf8');
const BLANK: number = Buffer.from(' ', 'utf8')[0];
const BACKSLASH_R: number = Buffer.from('\r', 'utf8')[0];
const BACKSLASH_N: number = Buffer.from('\n', 'utf8')[0];

export default class ProtocolBuffer {
  private index = 0;

  private buffer = Buffer.allocUnsafe(DEFAULT_SIZE);

  append(data: string | Buffer): void {
    let toAppend: Buffer | null = null;
    if (Buffer.isBuffer(data)) {
      toAppend = data;
    } else {
      toAppend = Buffer.from(data, 'utf8');
    }

    if (this.buffer.length - this.index >= toAppend.length) {
      toAppend.copy(this.buffer, this.index, 0, toAppend.length);
    } else {
      const newSize = (Math.ceil((this.index + toAppend.length) / DEFAULT_SIZE) + 1) * DEFAULT_SIZE;
      if (this.index === 0) {
        this.buffer = Buffer.allocUnsafe(newSize);
        toAppend.copy(this.buffer, 0, 0, toAppend.length);
      } else {
        this.buffer = Buffer.concat([this.buffer.slice(0, this.index), toAppend], newSize);
      }
    }

    this.index += toAppend.length;
  }

  tryReadContentLength(): number {
    let result = -1;
    let current = 0;
    // we are utf8 encoding...
    while (
      current < this.index &&
      (this.buffer[current] === BLANK ||
        this.buffer[current] === BACKSLASH_R ||
        this.buffer[current] === BACKSLASH_N)
    ) {
      current += 1;
    }

    if (this.index < current + CONTENT_LENGTH_SIZE) {
      return result;
    }

    current += CONTENT_LENGTH_SIZE;

    const start = current;
    while (current < this.index && this.buffer[current] !== BACKSLASH_R) {
      current += 1;
    }

    if (
      current + 3 >= this.index ||
      this.buffer[current + 1] !== BACKSLASH_N ||
      this.buffer[current + 2] !== BACKSLASH_R ||
      this.buffer[current + 3] !== BACKSLASH_N
    ) {
      return result;
    }

    const data = this.buffer.toString('utf8', start, current);
    result = parseInt(data, 10);
    this.buffer = this.buffer.slice(current + 4);
    this.index -= current + 4;

    return result;
  }

  tryReadContent(length: number): string | null {
    if (this.index < length) {
      return null;
    }

    const result = this.buffer.toString('utf8', 0, length);
    let sourceStart = length;
    while (
      sourceStart < this.index &&
      (this.buffer[sourceStart] === BACKSLASH_R || this.buffer[sourceStart] === BACKSLASH_N)
    ) {
      sourceStart += 1;
    }

    this.buffer.copy(this.buffer, 0, sourceStart);
    this.index -= sourceStart;

    return result;
  }
}
