declare module 'updatable-log' {
  const log: {
    error: (...msg: any[]) => void;
    important: (...msg: any[]) => void;
    info: (...msg: any[]) => void;
    warn: (...msg: any[]) => void;
    update: (...msg: any[]) => void;
    clear: () => void;
    quiet: boolean;
  };

  export = log;
}
