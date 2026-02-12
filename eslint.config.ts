import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'
import unicorn from 'eslint-plugin-unicorn'
import sonarjs from 'eslint-plugin-sonarjs'

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  unicorn.configs.recommended,
  // @ts-expect-error - sonarjs types don't perfectly align with ESLint 9.x flat config
  sonarjs.configs.recommended,
  { ignores: ['dist/**', 'node_modules/**', '.astro/**', 'tests/**'] },
)
