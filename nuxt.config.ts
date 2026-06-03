export default defineNuxtConfig({
  compatibilityDate: '2025-06-02',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    'nuxt-auth-utils',
    '@vite-pwa/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Shushzerv',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.svg' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f2f2f7' },
        { name: 'description', content: 'Shushzerv — book sports courts, classes, and coaches' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Shushzerv' },
      ],
    },
  },

  i18n: {
    restructureDir: false,
    bundle: { optimizeTranslationDirective: false },
    locales: [
      { code: 'fa', language: 'fa-IR', name: 'فارسی', dir: 'rtl', file: 'fa.json' },
      { code: 'en', language: 'en-US', name: 'English', dir: 'ltr', file: 'en.json' },
    ],
    defaultLocale: 'fa',
    strategy: 'prefix_except_default',
    lazy: true,
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'shushzerv_locale',
      redirectOn: 'root',
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Shushzerv — Sports Booking',
      short_name: 'Shushzerv',
      description: 'Book sports courts, classes, and coaches',
      lang: 'fa',
      dir: 'rtl',
      theme_color: '#f2f2f7',
      background_color: '#f2f2f7',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icons/apple-touch-icon.svg', sizes: '192x192', type: 'image/svg+xml' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },

  runtimeConfig: {
    session: {
      // overridden by NUXT_SESSION_PASSWORD env
      password: '',
    },
  },
})
