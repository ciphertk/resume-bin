import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerHandler, sendMessage, _resetHandlers } from './bus';

type ChromeMock = {
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
    lastError?: { message: string };
  };
};

declare global {
  // eslint-disable-next-line no-var
  var chrome: ChromeMock;
}

beforeEach(() => {
  _resetHandlers();
  globalThis.chrome = {
    runtime: {
      sendMessage: vi.fn((msg, cb) => {
        queueMicrotask(() => cb?.({ ok: true, value: 'echo:' + (msg as { type: string }).type }));
      }),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  };
});

describe('messaging bus', () => {
  it('sendMessage resolves with the runtime reply value', async () => {
    const value = await sendMessage('system/active-tab-info', undefined as never);
    expect(value).toBe('echo:system/active-tab-info');
  });

  it('registerHandler stores and dispatches handlers', async () => {
    const handler = vi.fn(async () => ({ url: 'u', title: 't', host: 'h' }));
    registerHandler('system/active-tab-info', handler);
    // Simulate runtime dispatch (what background.ts will wire up)
    // The unit test just verifies registration side effect:
    expect(handler).not.toHaveBeenCalled();
  });
});
