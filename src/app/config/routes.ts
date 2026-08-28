export const ROUTES = {
  /** O quiz e a raiz: e nela que o anuncio cai. */
  ROOT: '/',
  PRIVACY: '/privacidade',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_LEADS: '/admin/leads',
  NOT_FOUND: '*',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
