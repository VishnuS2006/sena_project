export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        surface: '#fafbff',
        brand: '#1158d4',
        neutral: '#4b5563',
      },
    },
  },
  plugins: [],
};
