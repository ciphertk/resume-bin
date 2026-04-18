const inputValueSetter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
)?.set;
const textAreaValueSetter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype,
  'value',
)?.set;
const selectValueSetter = Object.getOwnPropertyDescriptor(
  HTMLSelectElement.prototype,
  'value',
)?.set;

function dispatch(el: HTMLElement, type: 'input' | 'change'): void {
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

export function fillField(el: HTMLElement, value: string): boolean {
  if (el instanceof HTMLInputElement) {
    if (!inputValueSetter) return false;
    inputValueSetter.call(el, value);
    dispatch(el, 'input');
    dispatch(el, 'change');
    return true;
  }
  if (el instanceof HTMLTextAreaElement) {
    if (!textAreaValueSetter) return false;
    textAreaValueSetter.call(el, value);
    dispatch(el, 'input');
    dispatch(el, 'change');
    return true;
  }
  if (el instanceof HTMLSelectElement) {
    if (!selectValueSetter) return false;
    selectValueSetter.call(el, value);
    dispatch(el, 'change');
    return true;
  }
  if (el.isContentEditable) {
    el.innerHTML = value;
    dispatch(el, 'input');
    return true;
  }
  return false;
}
