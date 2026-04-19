import type { JobMeta } from './parseJobMeta';

const JOB_PAGE_PATTERNS = /\/jobs?\/|\/apply|\/careers?\/|\/job\/|\/posting\//i;
const CONFIRMATION_PATTERNS = /\/confirmation|\/success|\/applied|\/thank|application.submitted|application.complete/i;
const SUBMIT_BUTTON_PATTERNS = /\b(apply now|apply|submit application|send application|submit your application)\b/i;

export interface ApplyDetectorOptions {
  onDetected: (meta: Partial<JobMeta>) => void;
  ignoredPatterns?: string[];
  parseMetaFn: (doc: Document) => Partial<JobMeta>;
}

function isIgnored(url: string, patterns: string[]): boolean {
  return patterns.some((p) => url.includes(p));
}

function isJobPage(url: string): boolean {
  return JOB_PAGE_PATTERNS.test(url);
}

function isConfirmationUrl(url: string): boolean {
  return CONFIRMATION_PATTERNS.test(url);
}

export function mountApplyDetector(options: ApplyDetectorOptions): () => void {
  const { onDetected, ignoredPatterns = [], parseMetaFn } = options;
  let lastFiredUrl = '';
  let buttonDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  function fire(): void {
    const url = location.href;
    if (url === lastFiredUrl) return;
    if (isIgnored(url, ignoredPatterns)) return;
    lastFiredUrl = url;
    onDetected(parseMetaFn(document));
  }

  // Signal A — form submit
  function onFormSubmit(e: Event): void {
    const form = e.target as HTMLFormElement;
    const inputs = form.querySelectorAll('input, textarea, select');
    if (inputs.length < 2) return;
    const url = location.href;
    if (!isJobPage(url) && !isIgnored(url, [])) return;
    // small delay so the page may navigate to a confirmation URL first
    setTimeout(fire, 800);
  }

  // Signal B — submit button click
  function onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const button = target.closest('button, [role="button"], input[type="submit"], a') as HTMLElement | null;
    if (!button) return;
    const label = (button.textContent ?? '') + ' ' + (button.getAttribute('aria-label') ?? '');
    if (!SUBMIT_BUTTON_PATTERNS.test(label)) return;
    if (buttonDebounceTimer) return;
    buttonDebounceTimer = setTimeout(() => {
      buttonDebounceTimer = null;
      setTimeout(fire, 800);
    }, 1000);
  }

  // Signal C — SPA URL change (pushState / popstate)
  let prevUrl = location.href;

  const origPushState = history.pushState.bind(history);
  const origReplaceState = history.replaceState.bind(history);

  function checkUrlChange(): void {
    const current = location.href;
    if (current === prevUrl) return;
    const wasJobPage = isJobPage(prevUrl);
    const isConfirmation = isConfirmationUrl(current);
    prevUrl = current;
    if (wasJobPage && isConfirmation) {
      fire();
    }
  }

  history.pushState = function (...args) {
    origPushState(...args);
    checkUrlChange();
  };

  history.replaceState = function (...args) {
    origReplaceState(...args);
    checkUrlChange();
  };

  function onPopState(): void {
    checkUrlChange();
  }

  document.addEventListener('submit', onFormSubmit, true);
  document.addEventListener('click', onDocumentClick, true);
  window.addEventListener('popstate', onPopState);

  return () => {
    document.removeEventListener('submit', onFormSubmit, true);
    document.removeEventListener('click', onDocumentClick, true);
    window.removeEventListener('popstate', onPopState);
    history.pushState = origPushState;
    history.replaceState = origReplaceState;
    if (buttonDebounceTimer) clearTimeout(buttonDebounceTimer);
  };
}
