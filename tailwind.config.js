const windmill = require('@windmill/react-ui/config');

module.exports = windmill({
  purge: ['./src/**/*.tsx'],
  mode: 'jit',
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
});
