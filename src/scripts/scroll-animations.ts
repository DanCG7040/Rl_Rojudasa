// Script para animaciones al hacer scroll
export function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-on-scroll');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observar todos los elementos con clase 'animate-on-scroll'
  document.querySelectorAll('.section-title, .info-card, .rule-item, .bracket-round').forEach((el) => {
    observer.observe(el);
  });
}

// Inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}
