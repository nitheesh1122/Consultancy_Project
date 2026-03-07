/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
                heading: ['Source Sans 3', 'system-ui', 'sans-serif'],
                display: ['Source Sans 3', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            borderRadius: {
                'sm-token': 'var(--radius-sm)',
                'md-token': 'var(--radius-md)',
                'lg-token': 'var(--radius-lg)',
            },
            colors: {
                canvas: 'var(--bg-canvas)',
                card: 'var(--bg-card)',
                elevated: 'var(--bg-elevated)',
                background: 'var(--bg-card)',
                subtle: 'var(--border-subtle)',
                'border-strong': 'var(--border-strong)',
                border: 'var(--border-subtle)',
                surface: 'var(--bg-card)',
                'surface-highlight': 'var(--bg-elevated)',
                void: 'var(--bg-canvas)',
                brand: {
                    primary: 'var(--brand-primary)',
                    hover: 'var(--brand-hover)',
                    light: 'var(--brand-light)',
                    gold: 'var(--brand-primary)',
                    copper: 'var(--brand-primary)',
                },
                primary: {
                    DEFAULT: 'var(--brand-primary)',
                    hover: 'var(--brand-hover)',
                    foreground: '#ffffff',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                },
                status: {
                    success: 'var(--status-success)',
                    warning: 'var(--status-warning)',
                    danger: 'var(--status-danger)',
                    critical: 'var(--status-danger)',
                    info: 'var(--status-info)',
                },
                success: 'var(--status-success)',
                warning: 'var(--status-warning)',
                danger: 'var(--status-danger)',
                info: 'var(--status-info)',
            },
            spacing: {
                '4.5': '1.125rem',
            },
            maxWidth: {
                '8xl': '1600px',
            },
            animation: {
                'fade-in': 'fadeIn 0.25s ease-out forwards',
                'slide-up': 'slideUp 0.4s ease-out forwards',
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};
