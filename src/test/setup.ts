import '@testing-library/jest-dom/vitest'

/**
 * O jsdom nao implementa `matchMedia`, e componentes que consultam
 * `prefers-reduced-motion` quebrariam ao montar. O padrao aqui e "sem
 * preferencia declarada", que e o comportamento da maioria dos navegadores;
 * testes que precisam do contrario sobrescrevem esta implementacao.
 */
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
}
