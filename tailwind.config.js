const aspectRatioPlugin = require('@tailwindcss/aspect-ratio');

module.exports = {
  purge: ['./src/**/*.tsx'],
  mode: 'jit',
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [aspectRatioPlugin],
  corePlugins: {
    preflight: false,
  },
};
