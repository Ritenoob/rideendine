/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#f2efe8',
        ink: '#151515',
        muted: '#6a6a6a',
        accent: '#1b7f5a',
        'accent-2': '#d24b4b',
        'accent-3': '#2f6fed',
      },
    },
  },
  plugins: [],
};
