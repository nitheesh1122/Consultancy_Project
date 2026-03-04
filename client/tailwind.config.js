/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Space Grotesk', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                canvas: 'var(--bg-canvas)',
                card: 'var(--bg-card)',
                elevated: 'var(--bg-elevated)',
                subtle: 'var(--border-subtle)',
                border: 'var(--border-subtle)', // alias for backwards compat
                surface: 'var(--bg-card)', // alias for backwards compat
                void: 'var(--bg-canvas)', // alias for backwards compat
                brand: {
                    primary: 'var(--brand-primary)',
                    hover: 'var(--brand-hover)',
                    light: 'var(--brand-light)',
                    gold: 'var(--brand-primary)', // legacy alias
                    copper: 'var(--brand-primary)', // legacy alias
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
                    critical: 'var(--status-danger)', // legacy alias
                    info: 'var(--status-info)',
                },
                // keep aliases during migration
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
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'slide-up': 'slideUp 0.8s ease-out forwards',
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
