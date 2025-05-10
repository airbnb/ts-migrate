declare module 'updatable-log' {
  const log: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    error: (...msg: any[]) => void;
    important: (...msg: any[]) => void;
    info: (...msg: any[]) => void;
    warn: (...msg: any[]) => void;
    update: (...msg: any[]) => void;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    clear: () => void;
    quiet: boolean;
  };

  export = log;
}
