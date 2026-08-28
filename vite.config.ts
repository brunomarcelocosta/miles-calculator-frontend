/// <reference types="vitest/config" />
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // `import.meta.dirname` em vez de `__dirname`: o carregador nativo de
      // config do Vite nao expoe as globais de CommonJS.
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // A Travion-API sobe na 3000 em desenvolvimento.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // O portal admin nunca deve pesar a landing de trafego pago, então ele sai
    // em chunk proprio. O motor de calculo tambem, porque e reaproveitado.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/features/admin/')) return 'admin'
          if (id.includes('/src/domain/')) return 'domain'
          return undefined
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // `app/config/env.ts` falha rapido quando falta variavel, o que e o
    // comportamento desejado em producao. Declarar as variaveis aqui torna a
    // suite independente dos arquivos .env da maquina de quem roda.
    env: {
      VITE_API_BASE_URL: '/api',
      VITE_WHATSAPP_NUMBER: '5512997643952',
      VITE_PUBLIC_APP_URL: 'http://localhost:5173',
      VITE_GTM_ID: '',
      VITE_META_PIXEL_ID: '',
    },
  },
})
