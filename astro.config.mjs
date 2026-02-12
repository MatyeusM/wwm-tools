// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import yaml from '@rollup/plugin-yaml'

import icon from 'astro-icon'

// https://astro.build/config
export default defineConfig({
  site: 'https://matyeusm.github.io/wwm-tools/',
  base: '/wwm-tools/',
  output: 'static',
  integrations: [sitemap(), icon()],
  vite: { plugins: [yaml({})] },
})
