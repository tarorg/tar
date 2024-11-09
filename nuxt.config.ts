export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['shadcn-nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/ionic'],
  ssr: false,

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    r2: {
      region: process.env.R2_REGION,
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucketName: process.env.R2_BUCKET_NAME,
      publicCustomDomain: process.env.PUBLIC_R2_CUSTOM_DOMAIN,
      endpoint: process.env.R2_ENDPOINT,
    },
    tursoDbUrl: process.env.TURSO_DB_URL,
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN,
    public: {
      nhostSubdomain: process.env.NHOST_SUBDOMAIN,
      nhostRegion: process.env.NHOST_REGION,
    }
  },

  compatibilityDate: '2024-10-19',
  nitro: {
    routeRules: {
      '/api/**': { 
        cors: true, 
        headers: { 'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE' } 
      }
    }
  },
})
