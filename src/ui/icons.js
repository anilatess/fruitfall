const paths = {
  leaf: '<path d="M5 17C1 5 11 2 21 3c1 11-5 18-14 15L17 7"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10m3-8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  muted: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/>',
  pause: '<path d="M8 5v14m8-14v14"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  chart: '<path d="M4 4v16h16M8 15v-3m5 3V8m5 7V5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sprout: '<path d="M12 21V11C5 11 3 7 3 3c7 0 9 4 9 8 0-6 4-8 9-8 0 7-4 10-9 10"/>',
};

export function icon(name, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ''}</svg>`;
}
