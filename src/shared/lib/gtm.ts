import { env } from '@/app/config/env'

/**
 * Injeta o script do Google Tag Manager no <head> se VITE_GTM_ID estiver
 * preenchido. Sem o ID, é no-op — nenhum script externo é carregado.
 *
 * O Meta Pixel é gerenciado pelo próprio GTM (configuração no container),
 * então não precisa de script separado aqui.
 */
export function initGTM(): void {
  const gtmId = env.VITE_GTM_ID
  if (!gtmId) return

  // GTM snippet padrão
  const script = document.createElement('script')
  script.textContent = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `
  document.head.insertBefore(script, document.head.firstChild)
}
