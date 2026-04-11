/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'rgb(var(--background-rgb) / <alpha-value>)',
                surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
                sidebar: 'rgb(var(--sidebar-rgb) / <alpha-value>)',
                header: 'rgb(var(--header-rgb) / <alpha-value>)',
                primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
                primaryDark: 'rgb(var(--primary-dark-rgb) / <alpha-value>)',
                success: 'rgb(var(--success-rgb) / <alpha-value>)',
                warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
                danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
                border: 'rgb(var(--border-rgb) / <alpha-value>)',
                textMain: 'rgb(var(--text-main-rgb) / <alpha-value>)',
                textDim: 'rgb(var(--text-dim-rgb) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['Roboto Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
