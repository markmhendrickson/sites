/* Additive enhancement: no geometry, image, theme, rail or motion-player changes. */
const mounted = new WeakMap();

function asButton(node, className) {
  let button = node;
  if (node.tagName !== 'BUTTON') {
    button = node.ownerDocument.createElement('button');
    for (const attribute of node.attributes) button.setAttribute(attribute.name, attribute.value);
    while (node.firstChild) button.append(node.firstChild);
    node.replaceWith(button);
  }
  button.type = 'button';
  button.classList.add(className);
  button.removeAttribute('aria-hidden');
  return button;
}

export function enhanceScene(scene, view = scene.ownerDocument.defaultView) {
  if (mounted.has(scene)) return () => {};
  const caption = scene.querySelector('figcaption');
  // Hidden worked-case captions are not interactive. Prefer an explicit author opt-out.
  if (!caption || scene.hasAttribute('data-static-legend') ||
      (view?.getComputedStyle && view.getComputedStyle(caption).display === 'none')) return () => {};
  const originals = [...caption.children].filter(node => node.matches('span, button'));
  if (!originals.length) return () => {};
  const items = originals.map((node, index) => {
    const key = node.dataset.objectKey || String(index + 1);
    const button = asButton(node, 'legend-item');
    button.dataset.objectKey = key;
    return { key, label: button.textContent.trim().replace(/\s+/g, ' ').replace(/^(\d+)(?=\D)/, '$1 '), button };
  });
  const byKey = new Map(items.map(item => [item.key, item]));
  const pins = [...scene.querySelectorAll('.photo > .pin')].flatMap((node, index) => {
    const key = node.dataset.objectKey || items[index]?.key;
    if (!byKey.has(key)) return [];
    const button = asButton(node, 'pin');
    button.dataset.objectKey = key;
    button.setAttribute('aria-label', byKey.get(key).label);
    return [button];
  });
  // Regions must be authored native buttons whose rectangles match measured objects.
  // We never manufacture rectangles from pin locations or image proportions.
  const regions = [...scene.querySelectorAll('button[data-object-region][data-object-key]')]
    .filter(button => byKey.has(button.dataset.objectKey));
  for (const button of regions) {
    button.type = 'button';
    button.setAttribute('aria-label', byKey.get(button.dataset.objectKey).label);
  }
  const controls = [...items.map(item => item.button), ...pins, ...regions];
  const hover = view?.matchMedia?.('(any-hover: hover)');
  const status = scene.ownerDocument.createElement('p');
  status.className = 'scene-selection-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  scene.append(status);
  let announced;
  let focused;
  const select = (key, announce = false) => {
    if (!byKey.has(key)) return;
    scene.dataset.activeObject = key;
    for (const control of controls) {
      control.setAttribute('aria-pressed', String(control.dataset.objectKey === key));
    }
    // Hover/focus already communicate through visual state and the named button.
    // A live message is reserved for explicit activation, and deduplicated.
    if (announce && announced !== key) {
      status.textContent = `Selected: ${byKey.get(key).label}`;
      announced = key;
    }
  };
  const disposers = [];
  function listen(control, eventName, callback) {
    control.addEventListener(eventName, callback);
    disposers.push(() => control.removeEventListener(eventName, callback));
  }
  for (const control of controls) {
    const key = control.dataset.objectKey;
    listen(control, 'pointerenter', event => {
      if (hover?.matches && event.pointerType !== 'touch' && !focused?.matches(':focus-visible')) select(key);
    });
    listen(control, 'focus', () => { focused = control; select(key); });
    listen(control, 'blur', () => { if (focused === control) focused = undefined; });
    listen(control, 'click', () => select(key, true));
  }
  select(items[0].key);
  scene.dataset.legendReady = 'true';
  const cleanup = () => {
    disposers.forEach(dispose => dispose());
    status.remove();
    delete scene.dataset.legendReady;
    mounted.delete(scene);
  };
  mounted.set(scene, cleanup);
  return cleanup;
}

export function enhanceReveals(root, view = root.ownerDocument?.defaultView || root.defaultView) {
  const reduced = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!view?.IntersectionObserver || !reduced || reduced.matches) return () => {};
  const animations = new Set();
  const seen = new WeakSet();
  const observer = new view.IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || seen.has(entry.target)) continue;
      seen.add(entry.target);
      observer.unobserve(entry.target);
      if (!reduced.matches && typeof entry.target.animate === 'function') {
        // Visible before, during and after: no opacity:0 or persistent staging class.
        const animation = entry.target.animate([
          { opacity: .85, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'none' }
        ], { duration: 360, easing: 'cubic-bezier(.2,.7,.3,1)' });
        animations.add(animation);
        animation.finished?.then(() => animations.delete(animation), () => animations.delete(animation));
      }
    }
  }, { threshold: .12 });
  root.querySelectorAll('[data-brief-reveal]').forEach(element => observer.observe(element));
  const stop = () => {
    observer.disconnect();
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
  const onChange = () => { if (reduced.matches) stop(); };
  reduced.addEventListener?.('change', onChange);
  return () => { stop(); reduced.removeEventListener?.('change', onChange); };
}

export function initTensionInteractions(root = document) {
  const cleanups = [...root.querySelectorAll('.scene')].map(scene => enhanceScene(scene));
  cleanups.push(enhanceReveals(root));
  return () => cleanups.forEach(cleanup => cleanup());
}
