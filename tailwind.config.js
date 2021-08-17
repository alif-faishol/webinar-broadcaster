const aspectRatioPlugin = require('@tailwindcss/aspect-ratio');

module.exports = {
  purge: ['./src/**/*.tsx'],
  mode: 'jit',
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'ant-red': '#ff4d4f',
        'ant-blue': '#1890ff',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [aspectRatioPlugin],
  corePlugins: {
    preflight: false,
  },
};
