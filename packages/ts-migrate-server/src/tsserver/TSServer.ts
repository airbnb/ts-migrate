import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import tsp from 'typescript/lib/protocol';
import { CommandArgs, CommandBody, commandHasResponse } from './commands';
import { Logger } from './Logger';
import Reader from './Reader';

export default class TSServer {
  private childProcess: ChildProcess;

  private readonly logger: Logger;

  private readonly reader: Reader;

  private emitter: EventEmitter;

  private nextSeq = 1;

  private requestsBySeq: {
    [seq: number]: {
      resolve: (value?: any) => void;
      reject: (reason?: any) => void;
    };
  } = {};

  private killed = false;

  constructor(childProcess: ChildProcess, logger: Logger) {
    this.childProcess = childProcess;
    this.logger = logger;
    this.reader = new Reader(childProcess.stdout);
    this.emitter = new EventEmitter();

    this.reader.onData((data) => this.handleData(data));
    this.initChildProcessListeners();
    this.initChildProcessStderrListeners();
  }

  kill() {
    if (this.killed) return;

    this.childProcess.kill();
    this.emitter.removeAllListeners();
    this.reader.dispose();
    this.logger.info('[TSServer] kill');
    this.killed = true;
  }

  sendRequest<C extends tsp.CommandTypes>(
    command: C,
    args: CommandArgs<C>,
  ): Promise<CommandBody<C>> {
    const seq = this.nextSeq;
    this.nextSeq += 1;
    const request: tsp.Request = { seq, type: 'request', command, arguments: args };
    this.logger.info(`[TSServer] request:\n${JSON.stringify(request, null, 2)}`);

    this.write(request);

    return commandHasResponse(command)
      ? new Promise((resolve, reject) => {
          this.requestsBySeq[seq] = { resolve, reject };
        })
      : (Promise.resolve() as Promise<CommandBody<C>>);
  }

  onEvent(listener: (event: tsp.Event) => void) {
    this.emitter.addListener('event', listener);
    return () => {
      this.emitter.removeListener('event', listener);
    };
  }

  private write(data: unknown) {
    this.childProcess.stdin!.write(`${JSON.stringify(data)}\r\n`, 'utf8');
  }

  private handleData(data: unknown) {
    const msg = data as tsp.Message;
    if (msg.type === 'response') {
      this.handleResponse(msg as tsp.Response);
    } else if (msg.type === 'event') {
      this.handleEvent(msg as tsp.Event);
    } else {
      this.logger.err(`[TSServer] unrecognized message:\n${JSON.stringify(msg, null, 2)}`);
    }
  }

  private handleResponse(response: tsp.Response) {
    this.logger.info(`[TSServer] response:\n${JSON.stringify(response, null, 2)}`);
    const seq = response.request_seq;
    if (this.requestsBySeq[seq] != null) {
      const { resolve, reject } = this.requestsBySeq[seq];
      if (response.success) {
        resolve(response.body);
      } else {
        reject(response.message);
      }
      delete this.requestsBySeq[seq];
    } else {
      this.logger.err(`[TSServer] Failed to find originating request for seq ${seq}.`);
    }
  }

  private handleEvent(evt: tsp.Event) {
    this.logger.info(`[TSServer] event:\n${JSON.stringify(evt, null, 2)}`);
    this.emitter.emit('event', evt);
  }

  private initChildProcessListeners() {
    this.childProcess.on('close', (code, signal) => {
      this.logger.err(`[TSServer][childProcess] close: code=${code},signal=${signal}`);
    });
    this.childProcess.on('disconnect', () => {
      this.logger.err('[TSServer][childProcess] disconnect');
    });
    this.childProcess.on('error', (err) => {
      this.logger.err(`[TSServer][childProcess] error: ${err.message}`);
    });
    this.childProcess.on('exit', (code, signal) => {
      this.logger.err(`[TSServer][childProcess] exit: code=${code},signal=${signal}`);
    });
    this.childProcess.on('message', (message, _sendHandle) => {
      this.logger.info(`[TSServer][childProcess] message: ${message}`);
    });
  }

  private initChildProcessStderrListeners() {
    this.childProcess.stderr!.on('close', () => {
      this.logger.err('[TSServer][childProcess][stderr] close');
    });
    this.childProcess.stderr!.on('data', (chunk) => {
      this.logger.err(`[TSServer][childProcess][stderr] data:\n${String(chunk)}`);
    });
    this.childProcess.stderr!.on('end', () => {
      this.logger.err('[TSServer][childProcess][stderr] end');
    });
    this.childProcess.stderr!.on('readable', () => {
      this.logger.info('[TSServer][childProcess][stderr] readable');
    });
    this.childProcess.stderr!.on('error', (err: Error) => {
      this.logger.err(`[TSServer][childProcess][stderr] error: ${err.message}`);
    });
  }
}
