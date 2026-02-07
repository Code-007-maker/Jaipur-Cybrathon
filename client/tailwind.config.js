/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdfa', // Teal-50
                    100: '#ccfbf1', // Teal-100
                    200: '#99f6e4', // Teal-200
                    300: '#5eead4', // Teal-300
                    400: '#2dd4bf', // Teal-400
                    500: '#14b8a6', // Teal-500
                    600: '#0d9488', // Teal-600
                    700: '#0f766e', // Teal-700
                    800: '#115e59', // Teal-800
                    900: '#134e4a', // Teal-900
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
                emergency: {
                    500: '#ef4444',
                    600: '#dc2626',
                },
                success: '#22c55e',
                warning: '#f59e0b',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
