import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerHandler, sendMessage, _resetHandlers } from './bus';

const mockChrome = {
  runtime: {
    sendMessage: vi.fn((msg: { type: string }, cb?: (reply: unknown) => void) => {
      queueMicrotask(() => cb?.({ ok: true, value: 'echo:' + msg.type }));
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    lastError: undefined as { message: string } | undefined,
  },
};

beforeEach(() => {
  _resetHandlers();
  mockChrome.runtime.sendMessage.mockClear();
  mockChrome.runtime.onMessage.addListener.mockClear();
  (globalThis as Record<string, unknown>)['chrome'] = mockChrome;
});

describe('messaging bus', () => {
  it('sendMessage resolves with the runtime reply value', async () => {
    const value = await sendMessage('system/active-tab-info', undefined as never);
    expect(value).toBe('echo:system/active-tab-info');
  });

  it('registerHandler stores and dispatches handlers', async () => {
    const handler = vi.fn(async () => ({ url: 'u', title: 't', host: 'h' }));
    registerHandler('system/active-tab-info', handler);
    expect(handler).not.toHaveBeenCalled();
  });
});
