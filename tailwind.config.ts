import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
					light: 'hsl(var(--primary-light))',
					10: 'hsl(var(--primary) / 0.1)',
					20: 'hsl(var(--primary) / 0.2)',
					50: 'hsl(var(--primary) / 0.5)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					10: 'hsl(var(--secondary) / 0.1)',
					20: 'hsl(var(--secondary) / 0.2)',
					50: 'hsl(var(--secondary) / 0.5)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					10: 'hsl(var(--accent) / 0.1)',
					20: 'hsl(var(--accent) / 0.2)',
					50: 'hsl(var(--accent) / 0.5)'
				},
				teal: {
					DEFAULT: 'hsl(var(--teal))',
					foreground: 'hsl(var(--teal-foreground))',
					10: 'hsl(var(--teal) / 0.1)',
					20: 'hsl(var(--teal) / 0.2)',
					50: 'hsl(var(--teal) / 0.5)'
				},
				gold: {
					DEFAULT: 'hsl(var(--gold))',
					foreground: 'hsl(var(--gold-foreground))',
					10: 'hsl(var(--gold) / 0.1)',
					20: 'hsl(var(--gold) / 0.2)',
					50: 'hsl(var(--gold) / 0.5)'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					hover: 'hsl(var(--success-hover))',
					10: 'hsl(var(--success) / 0.1)',
					20: 'hsl(var(--success) / 0.2)',
					50: 'hsl(var(--success) / 0.5)'
				},
				professional: {
					DEFAULT: 'hsl(var(--professional))',
					foreground: 'hsl(var(--professional-foreground))',
					hover: 'hsl(var(--professional-hover))',
					10: 'hsl(var(--professional) / 0.1)',
					20: 'hsl(var(--professional) / 0.2)',
					50: 'hsl(var(--professional) / 0.5)'
				},
				fresh: {
					DEFAULT: 'hsl(var(--fresh))',
					foreground: 'hsl(var(--fresh-foreground))',
					hover: 'hsl(var(--fresh-hover))',
					10: 'hsl(var(--fresh) / 0.1)',
					20: 'hsl(var(--fresh) / 0.2)',
					50: 'hsl(var(--fresh) / 0.5)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'slide-in-up': {
					'0%': { 
						transform: 'translateY(20px)',
						opacity: '0'
					},
					'100%': { 
						transform: 'translateY(0)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'slide-in-up': 'slide-in-up 0.4s ease-out',
				'spin-smooth': 'spin 2s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
