/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 自定义颜色，与现有的 CSS 变量保持一致
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        radius: 'var(--radius)',

        // Element Plus 主题色
        'el-primary': 'var(--el-color-primary)',
        'el-primary-light-3': 'var(--el-color-primary-light-3)',
        'el-primary-light-5': 'var(--el-color-primary-light-5)',
        'el-primary-light-7': 'var(--el-color-primary-light-7)',
        'el-primary-light-8': 'var(--el-color-primary-light-8)',
        'el-primary-light-9': 'var(--el-color-primary-light-9)',
        'el-primary-dark-2': 'var(--el-color-primary-dark-2)',
        'el-primary-bg': 'var(--el-color-primary-bg)',
      },
      borderRadius: {
        radius: 'var(--radius)',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      maxWidth: {
        '7xl': '80rem',
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },
    },
  },
  plugins: [
    // 可以在这里添加 Tailwind 插件
  ],
  // 与 Element Plus 的兼容性
  corePlugins: {
    preflight: false, // 避免与 Element Plus 的样式冲突
  },
}
