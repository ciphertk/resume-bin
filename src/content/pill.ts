export interface PillHandlers {
  onClick: () => void;
}

export function mountPill(h: PillHandlers): { setCount(n: number): void; remove(): void } {
  const pill = document.createElement('div');
  pill.className = 'rb-pill';
  pill.hidden = true;
  pill.textContent = 'Autofill';
  pill.addEventListener('click', h.onClick);
  document.body.appendChild(pill);
  return {
    setCount(n: number) {
      if (n <= 0) {
        pill.hidden = true;
      } else {
        pill.hidden = false;
        pill.textContent = `Autofill · ${n} fields`;
      }
    },
    remove() {
      pill.remove();
    },
  };
}
