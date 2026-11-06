/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bosque: { 50: '#eef6f1', 100: '#d5e9dd', 200: '#a9d1b9', 400: '#4f9a6f', 500: '#2f7d51', 600: '#22643f', 700: '#1b4f33', 800: '#163f2a', 900: '#0f2e1e' },
        grafito: { 50: '#f4f5f6', 100: '#e6e8ea', 200: '#cdd1d5', 300: '#a9afb6', 400: '#7c848d', 500: '#5c636b', 600: '#454b52', 700: '#33383d', 800: '#24282c', 900: '#181b1e' },
        ambar: { 50: '#fff8eb', 100: '#feecc7', 500: '#d98b06', 600: '#b46f04', 700: '#8c5507' },
        alerta: { 50: '#fdf0ef', 100: '#fadbd8', 500: '#cc3a2f', 600: '#ad2d23', 700: '#8a241c' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
