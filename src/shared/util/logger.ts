type Level = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = '[resume-bin]';

function emit(level: Level, scope: string, args: unknown[]): void {
  const fn = level === 'debug' ? console.log : console[level];
  fn.call(console, PREFIX, `[${scope}]`, ...args);
}

export function createLogger(scope: string) {
  return {
    debug: (...a: unknown[]) => emit('debug', scope, a),
    info: (...a: unknown[]) => emit('info', scope, a),
    warn: (...a: unknown[]) => emit('warn', scope, a),
    error: (...a: unknown[]) => emit('error', scope, a),
  };
}
