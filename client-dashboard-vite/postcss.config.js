export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
  // Optimize for production builds
  parser: 'postcss-js',
  map: process.env.NODE_ENV === 'production' ? { inline: false } : undefined,
}