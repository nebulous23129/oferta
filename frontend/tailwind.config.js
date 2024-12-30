/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        md: '1.5rem',
        lg: '2rem',
      },
    },
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "#1DA6E0",
          hover: "#1890C7",
          foreground: "#FFFFFF"
        },
        checkout: {
          step: {
            active: {
              bg: "#1DA6E0",
              text: "#FFFFFF",
              border: "#1DA6E0"
            },
            inactive: {
              bg: "#F3F4F6",
              text: "#6B7280",
              border: "#E5E7EB"
            },
            completed: {
              bg: "#1DA6E0",
              text: "#FFFFFF",
              border: "#1DA6E0"
            },
            line: {
              bg: "#E5E7EB",
              fill: "#1DA6E0"
            }
          },
          card: {
            bg: "#FFFFFF",
            border: "#E5E7EB",
            hover: "#F9FAFB",
            shadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
          },
          form: {
            label: {
              text: "#374151",
              required: "#EF4444"
            },
            input: {
              text: "#111827",
              placeholder: "#9CA3AF",
              border: {
                DEFAULT: "#E5E7EB",
                focus: "#1DA6E0",
                error: "#EF4444"
              },
              bg: {
                DEFAULT: "#FFFFFF",
                disabled: "#F9FAFB"
              }
            }
          },
          radio: {
            border: {
              DEFAULT: "#E5E7EB",
              checked: "#1DA6E0"
            },
            dot: "#1DA6E0"
          },
          summary: {
            header: {
              bg: "#F9FAFB",
              border: "#E5E7EB"
            },
            row: {
              border: "#E5E7EB"
            },
            text: {
              title: "#111827",
              subtitle: "#6B7280",
              price: {
                regular: "#374151",
                highlight: "#1DA6E0"
              }
            }
          },
          button: {
            primary: {
              bg: "#1DA6E0",
              hover: "#1890C7",
              text: "#FFFFFF",
              disabled: {
                bg: "#E5E7EB",
                text: "#9CA3AF"
              }
            },
            secondary: {
              bg: "#FFFFFF",
              hover: "#F9FAFB",
              text: "#374151",
              border: "#E5E7EB"
            }
          }
        },
        'checkout-bg': '#F4F6F8',
      },
      spacing: {
        'container': {
          padding: {
            DEFAULT: '1rem',
            sm: '2rem',
            lg: '4rem',
            xl: '5rem',
            '2xl': '6rem',
          }
        },
        'step': {
          size: '1.5rem',
          gap: '0.5rem',
          padding: '3rem'
        },
        'card': {
          padding: {
            x: '1.5rem',
            y: '1.25rem'
          }
        },
        'form': {
          gap: '1rem',
          'group-gap': '1.5rem',
          'section-gap': '2rem'
        }
      },
      borderRadius: {
        'card': '0.5rem',
        'input': '0.375rem',
        'button': '0.375rem',
        'step': '9999px'
      },
      fontSize: {
        'step': '0.875rem',
        'label': '0.875rem',
        'input': '0.875rem',
        'helper': '0.75rem',
        'error': '0.75rem'
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'input': '0 1px 2px rgba(0, 0, 0, 0.05)'
      },
      aspectRatio: {
        'card': '1.6/1'
      },
      maxWidth: {
        'card-preview': '280px'
      },
      height: {
        'card-preview': '176px',
        'step-line': '1px'
      },
      animation: {
        'progress': 'progress 1s ease-in-out infinite',
        'slide-down': 'slide-down 0.2s ease-out',
        'slide-up': 'slide-up 0.2s ease-out'
      },
      keyframes: {
        'progress': {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    require('tailwindcss-animate')
  ],
}
