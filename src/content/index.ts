import './styles.css';
import { createLogger } from '@/shared/util/logger';
import { debounce } from '@/shared/util/debounce';
import { buildMappings, applyFill, type FieldMapping } from '@/features/autofill';
import { sendMessage } from '@/shared/messaging';
import { mountPill } from './pill';
import { openPreview } from './preview';
import type { Profile } from '@/shared/schema/profile';

const log = createLogger('content');
let currentProfile: Profile | null = null;
let currentMappings: FieldMapping[] = [];

const pill = mountPill({
  onClick: () => {
    if (!currentProfile) return;
    openPreview(currentMappings, (keys) => {
      const result = applyFill(document.body, currentMappings, keys);
      log.info('fill result', result);
    }, currentProfile);
  },
});

async function refresh(): Promise<void> {
  if (!currentProfile) {
    currentProfile = await sendMessage('profile/get-active', undefined as never);
  }
  if (!currentProfile) {
    pill.setCount(0);
    return;
  }
  currentMappings = buildMappings(document.body, currentProfile, location.href);
  const fillable = currentMappings.filter((m) => m.key !== 'unknown' && m.value).length;
  pill.setCount(fillable);
}

const refreshDebounced = debounce(refresh, 300);

document.addEventListener('DOMContentLoaded', () => void refresh());
if (document.readyState !== 'loading') void refresh();

const observer = new MutationObserver(() => refreshDebounced());
observer.observe(document.documentElement, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((msg: { type: string }, _sender, sendResponse) => {
  if (msg.type === 'content/open-preview') {
    if (currentProfile) {
      openPreview(currentMappings, (keys) => {
        const result = applyFill(document.body, currentMappings, keys);
        sendResponse({ ok: true, value: result });
      }, currentProfile);
      return true;
    }
    sendResponse({ ok: false, error: 'no profile' });
    return false;
  }
  return false;
});

log.info('content ready on', location.host);
