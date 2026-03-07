import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			config: 'wrangler.toml',
			platformProxy: {
				configPath: 'wrangler.toml',
				persist: true
			}
		}),
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$types: 'src/lib/types',
			$server: 'src/lib/server'
		}
	}
};

export default config;
