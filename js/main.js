(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#primary-nav');

  if (!toggle || !nav) return;

  const setMenuOpen = (isOpen) => {
    nav.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar navegación' : 'Abrir navegación');
  };

  toggle.addEventListener('click', () => {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 701px)').addEventListener('change', () => setMenuOpen(false));
})();
