// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },

	modules: ['@nuxt/ui', '@nuxt/image', '@nuxt/hints', '@nuxt/eslint'],
	css: ['~/assets/css/main.css'],
	// app: {
	// 	baseURL: '/my-presence/', // Replace with your exact repository name
	// },
	nitro: {
		preset: 'vercel', // Optional, but recommended
	},
});
