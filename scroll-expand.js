/**
 * Scroll-expand hero — vanilla port
 * Inspired by the React `ScrollExpandMedia` component.
 *
 * Behavior:
 *  - Page is "locked" while the hero media expands (0 → 1).
 *  - Wheel/touch increments progress; preventDefault swallows native scroll.
 *  - At progress >= 1, the section unlocks and normal scroll resumes.
 *  - Scrolling back up to the very top + upward gesture re-engages the shrink.
 */

(function () {
  const hero = document.querySelector('[data-scroll-expand]');
  if (!hero) return;

  const root = document.documentElement;
  const setProgress = (p) => hero.style.setProperty('--progress', p.toFixed(4));

  let progress = 0;
  let expanded = false;
  let touchStartY = 0;
  let rafPending = false;
  let pendingProgress = 0;

  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  const flush = () => {
    rafPending = false;
    setProgress(pendingProgress);
  };
  const schedule = (p) => {
    pendingProgress = p;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(flush);
    }
  };

  const lock = () => {
    document.body.style.overflow = 'hidden';
    root.classList.add('hero-locked');
  };
  const unlock = () => {
    document.body.style.overflow = '';
    root.classList.remove('hero-locked');
  };

  const expand = () => {
    progress = 1;
    expanded = true;
    schedule(1);
    unlock();
    hero.classList.add('is-expanded');
  };
  const collapse = () => {
    expanded = false;
    lock();
    hero.classList.remove('is-expanded');
  };

  // Initial state — lock the page until expanded
  lock();

  const onWheel = (e) => {
    if (expanded) {
      if (e.deltaY < 0 && window.scrollY <= 4) {
        // Re-engage shrink
        e.preventDefault();
        collapse();
        progress = Math.max(0, progress - 0.02);
        schedule(progress);
      }
      return;
    }
    e.preventDefault();
    const delta = e.deltaY * 0.0009;
    progress = Math.min(1, Math.max(0, progress + delta));
    schedule(progress);
    if (progress >= 1) expand();
  };

  const onTouchStart = (e) => {
    touchStartY = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (!touchStartY) return;
    const y = e.touches[0].clientY;
    const dy = touchStartY - y;

    if (expanded) {
      if (dy < -20 && window.scrollY <= 4) {
        e.preventDefault();
        collapse();
      }
      return;
    }
    e.preventDefault();
    const factor = dy < 0 ? 0.008 : 0.005;
    const delta = dy * factor;
    progress = Math.min(1, Math.max(0, progress + delta));
    schedule(progress);
    touchStartY = y;
    if (progress >= 1) expand();
  };
  const onTouchEnd = () => { touchStartY = 0; };

  const onScroll = () => {
    if (!expanded) window.scrollTo(0, 0);
  };

  // Skip motion lock for reduced-motion users — show fully expanded immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    expand();
    return;
  }

  // Escape hatch for previews / screenshots / debugging
  if (new URLSearchParams(location.search).has('preview')) {
    unlock();
    setProgress(0);
    return;
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Escape hatch — if user hits a key, skip the expand
  window.addEventListener('keydown', (e) => {
    if (expanded) return;
    if (['PageDown', 'End', 'ArrowDown', ' '].includes(e.key)) {
      e.preventDefault();
      progress = 1;
      expand();
    }
  });
})();
