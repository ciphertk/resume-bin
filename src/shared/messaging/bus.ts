import type { Message, MessageType, PayloadOf, ResponseOf } from './types';

type Handler<T extends MessageType> = (
  payload: PayloadOf<T>,
  sender?: chrome.runtime.MessageSender,
) => Promise<ResponseOf<T>> | ResponseOf<T>;

const handlers = new Map<MessageType, Handler<MessageType>>();

export function registerHandler<T extends MessageType>(type: T, handler: Handler<T>): void {
  handlers.set(type, handler as unknown as Handler<MessageType>);
}

export function _resetHandlers(): void {
  handlers.clear();
}

export interface BusReply<V> {
  ok: boolean;
  value?: V;
  error?: string;
}

export function attachRuntimeListener(): void {
  chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
    const handler = handlers.get(msg.type);
    if (!handler) {
      sendResponse({ ok: false, error: `no handler for ${msg.type}` });
      return false;
    }
    Promise.resolve(handler(msg.payload as never, sender))
      .then((value) => sendResponse({ ok: true, value }))
      .catch((e: unknown) => sendResponse({ ok: false, error: String(e) }));
    // returning true keeps the message channel open for async sendResponse
    return true;
  });
}

export function sendMessage<T extends MessageType>(
  type: T,
  payload: PayloadOf<T>,
): Promise<ResponseOf<T>> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload } as Message, (reply: BusReply<ResponseOf<T>>) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      if (!reply?.ok) {
        reject(new Error(reply?.error ?? 'unknown bus error'));
        return;
      }
      resolve(reply.value as ResponseOf<T>);
    });
  });
}
