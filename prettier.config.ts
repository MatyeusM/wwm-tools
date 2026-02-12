import type { Config } from 'prettier'

const config: Config = {
  printWidth: 100,
  semi: false,
  singleQuote: true,
  objectWrap: 'collapse',
  arrowParens: 'avoid',
  proseWrap: 'always',

  plugins: ['prettier-plugin-astro'],

  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
}

export default config
