import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
	optimizeDeps: {
		include: [
			'@l-ark/types',
			'@tiptap/starter-kit',
			'@tiptap/core',
			'@tiptap/extension-color',
			'@tiptap/extension-highlight',
			'@tiptap/extension-text-align',
			'@tiptap/extension-text-style',
			'@tiptap/extension-underline',
			'@tiptap/extension-subscript',
			'@tiptap/extension-superscript',
			'@tiptap/extension-mention',
			'@tiptap/extension-placeholder',
			'@tiptap/react',
			'@tiptap/suggestion',
			'@tiptap/pm/state',
			'@tiptap/pm/model',
			'@tiptap/pm/view',
			'@tiptap/pm/commands',
			'@tiptap/pm/keymap',
			'@tiptap/pm/history',
			'@tiptap/pm/inputrules',
			'@tiptap/pm/schema-basic',
			'@tiptap/pm/schema-list',
			'@tiptap/pm/transform',
			'@tiptap/pm/dropcursor',
			'@tiptap/pm/gapcursor',
			'@tiptap/pm/tables',
		],
	},
	plugins: [react(), tailwindcss(), VitePWA({
		registerType: 'autoUpdate',
		injectRegister: 'auto',

		pwaAssets: {
			disabled: false,
			config: true,
		},

		manifest: {
			name: 'm-ark',
			short_name: 'm-ark',
			description: 'TO-DO list for gestories',
			theme_color: '#81D8D0',
			background_color: '#ffffff',
			display: 'standalone',
			start_url: '/',
			scope: '/',
			icons: [
				{
					src: '/pwa-64x64.png',
					sizes: '64x64',
					type: 'image/png'
				},
				{
					src: '/pwa-192x192.png',
					sizes: '192x192',
					type: 'image/png'
				},
				{
					src: '/pwa-512x512.png',
					sizes: '512x512',
					type: 'image/png'
				},
				{
					src: '/maskable-icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable'
				}
			]
		},

		workbox: {
			globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
			cleanupOutdatedCaches: true,
			clientsClaim: true,
		},

		devOptions: {
			enabled: false,
			navigateFallback: 'index.html',
			suppressWarnings: true,
			type: 'module',
		},
	})],
})