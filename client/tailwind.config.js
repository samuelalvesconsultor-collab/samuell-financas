export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#1a1a1a',
        card:    '#2a2a2f',
        rim:     '#3a3a40',
        accent:  '#dc2626',
        tpetrol: '#0d9488',
        muted:   '#9ca3af',
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
