/**
 * Modeled after https://github.com/Microsoft/vscode/blob/92f9f50a93ba278f7bb637386ac1ffcdfd38a55e/extensions/typescript-language-features/src/utils/wireProtocol.ts#L83
 */
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import ProtocolBuffer from './ProtocolBuffer';

export default class Reader {
  private readable: Readable;

  private readonly buffer = new ProtocolBuffer();

  private readonly emitter = new EventEmitter();

  private nextMessageLength = -1;

  private isDisposed = false;

  constructor(readable: Readable) {
    this.readable = readable;
    this.readable.addListener('data', this.onReadableData);
  }

  onData(listener: (data: any) => void): void {
    if (this.isDisposed) return;

    this.emitter.addListener('data', listener);
  }

  onError(listener: (err: any) => void): void {
    if (this.isDisposed) return;

    this.emitter.addListener('error', listener);
  }

  dispose() {
    if (this.isDisposed) return;

    this.emitter.removeAllListeners();
    this.readable.removeListener('data', this.onReadableData);
    this.isDisposed = true;
  }

  private onReadableData = (data: Buffer | string): void => {
    try {
      this.buffer.append(data);

      while (true) {
        if (this.nextMessageLength === -1) {
          this.nextMessageLength = this.buffer.tryReadContentLength();
          if (this.nextMessageLength === -1) {
            return;
          }
        }

        const msg = this.buffer.tryReadContent(this.nextMessageLength);
        if (msg === null) {
          return;
        }

        this.nextMessageLength = -1;

        const json = JSON.parse(msg);
        this.emitter.emit('data', json);
      }
    } catch (e) {
      this.emitter.emit('error', e);
    }
  };
}
