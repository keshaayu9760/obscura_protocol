/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#14100D',
          50: '#1B1511',
          100: '#241B16',
          200: '#30241E',
          300: '#443329',
          400: '#5D4838',
          500: '#7D6652',
        },
        teal: {
          DEFAULT: '#E3A65D',
          50: '#FFF5E8',
          100: '#FBE7CC',
          200: '#F5D19E',
          300: '#EEBC7A',
          400: '#E9AE65',
          500: '#E3A65D',
          600: '#CB8741',
          700: '#A6672C',
          800: '#7A4B20',
          900: '#533216',
        },
        accent: {
          green: '#88BE9F',
          red: '#D6725A',
          teal: '#E3A65D',
          purple: '#B78452',
        },
        neon: {
          orange: '#F3C382',
          red: '#D6725A',
          coral: '#D8C0A0',
        },
        smoke: '#B4A28D',
      },
      fontFamily: {
        heading: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],   // 10px
        'xs': ['0.6875rem', { lineHeight: '1rem' }],        // 11px
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],     // 13px
        'base': ['0.875rem', { lineHeight: '1.375rem' }],   // 14px
        'md': ['0.9375rem', { lineHeight: '1.5rem' }],      // 15px
        'lg': ['1.0625rem', { lineHeight: '1.625rem' }],    // 17px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],       // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],          // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],     // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],       // 36px
        '5xl': ['3rem', { lineHeight: '1.1' }],             // 48px
        '6xl': ['3.75rem', { lineHeight: '1.08' }],         // 60px
        '7xl': ['4.5rem', { lineHeight: '1.05' }],          // 72px
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 8s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 6px rgba(227, 166, 93, 0.16)' },
          '100%': { boxShadow: '0 0 28px rgba(227, 166, 93, 0.22), 0 0 46px rgba(136, 190, 159, 0.08)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '33%': { transform: 'translate(20px, -30px)' },
          '66%': { transform: 'translate(-15px, 15px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 6px rgba(227, 166, 93, 0.12)' },
          '100%': { boxShadow: '0 0 26px rgba(227, 166, 93, 0.18)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 14px -6px rgba(227, 166, 93, 0.28)',
        'glow': '0 0 28px -8px rgba(227, 166, 93, 0.24)',
        'glow-lg': '0 0 42px -10px rgba(227, 166, 93, 0.24)',
        'neon': '0 0 6px rgba(227, 166, 93, 0.38), 0 0 24px rgba(136, 190, 159, 0.14)',
        'card': '0 14px 40px -18px rgba(0, 0, 0, 0.72)',
        'card-hover': '0 26px 60px -22px rgba(0, 0, 0, 0.82), 0 0 48px -18px rgba(227, 166, 93, 0.18)',
      },
      borderRadius: {
        '3xl': '20px',
        '4xl': '24px',
      },
    },
  },
  plugins: [],
};
