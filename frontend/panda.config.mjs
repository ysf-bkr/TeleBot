import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,

  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  exclude: [],

  theme: {
    extend: {
      tokens: {
        colors: {
          bg: { value: "#000000" },
          surface: { value: "#0a0a0a" },
          card: { value: "#ffffff" },
          border: { value: "#e4e4e7" },
          primary: { value: "#ef4444" }, // Crimson Red 500
          primaryHover: { value: "#dc2626" }, // Red 600
          success: { value: "#10b981" }, // Emerald 500
          danger: { value: "#ef4444" }, // Red 500
          warning: { value: "#f59e0b" }, // Amber 500
          gray: {
            50: { value: "#fafafa" },
            100: { value: "#f4f4f5" },
            200: { value: "#e4e4e7" },
            300: { value: "#d4d4d8" },
            500: { value: "#71717a" },
            700: { value: "#3f3f46" },
            800: { value: "#27272a" },
            900: { value: "#18181b" },
          },
        },
        spacing: {
          xs: { value: "4px" },
          sm: { value: "8px" },
          md: { value: "16px" },
          lg: { value: "24px" },
          xl: { value: "32px" },
          "2xl": { value: "48px" },
        },
        radii: {
          sm: { value: "6px" },
          md: { value: "10px" },
          lg: { value: "14px" },
          xl: { value: "20px" },
        },
        fontSizes: {
          xs: { value: "12px" },
          sm: { value: "14px" },
          md: { value: "16px" },
          lg: { value: "18px" },
          xl: { value: "22px" },
          "2xl": { value: "28px" },
        },
      },
      semanticTokens: {
        colors: {
          bgCanvas: {
            value: {
              base: "#fafafa",
              _dark: "#000000"
            }
          },
          bgSurface: {
            value: {
              base: "#ffffff",
              _dark: "#0a0a0a"
            }
          },
          textMain: {
            value: {
              base: "#18181b",
              _dark: "#f4f4f5"
            }
          },
          textMuted: {
            value: {
              base: "#71717a",
              _dark: "#a1a1aa"
            }
          },
          borderMain: {
            value: {
              base: "#e4e4e7",
              _dark: "#221111" // Dark red-tinted border
            }
          },
          bgButtonSecondary: {
            value: {
              base: "#f4f4f5",
              _dark: "#1e1111" // Dark red-tinted button bg
            }
          },
          bgButtonSecondaryHover: {
            value: {
              base: "#e4e4e7",
              _dark: "#2a1515" // Red-tinted hover state
            }
          },
          textButtonSecondary: {
            value: {
              base: "#52525b",
              _dark: "#fca5a5" // Light red text
            }
          }
        }
      },
      breakpoints: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      recipes: {
        button: {
          className: "btn",
          base: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontWeight: "500",
            borderRadius: "lg",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            boxShadow: "sm",
            _disabled: { opacity: 0.6, cursor: "not-allowed" },
            _active: { transform: "scale(0.98)" },
            _focus: { outline: "2px solid", outlineColor: "primary", outlineOffset: "2px" },
          },
          variants: {
            variant: {
              primary: {
                bg: "primary",
                color: "white",
                _hover: { bg: "primaryHover", boxShadow: "md" },
              },
              secondary: {
                bg: "bgButtonSecondary",
                color: "textButtonSecondary",
                _hover: { bg: "bgButtonSecondaryHover" },
              },
              ghost: {
                bg: "transparent",
                color: "textButtonSecondary",
                _hover: { bg: "bgButtonSecondary" },
              },
              danger: {
                bg: "danger",
                color: "white",
                _hover: { bg: "#dc2626", boxShadow: "md" },
              },
            },
            size: {
              sm: { px: "3", py: "1.5", fontSize: "sm", h: "36px" },
              md: { px: "4", py: "2", fontSize: "md", h: "42px" },
              lg: { px: "6", py: "2.5", fontSize: "lg", h: "48px" },
            },
          },
          defaultVariants: {
            variant: "primary",
            size: "md",
          },
        },
        badge: {
          className: "badge",
          base: {
            display: "inline-flex",
            alignItems: "center",
            px: "3",
            py: "1",
            fontSize: "xs",
            fontWeight: "600",
            borderRadius: "full",
            borderWidth: "1px",
            borderStyle: "solid",
          },
          variants: {
            variant: {
              success: {
                bg: "#ecfdf5",
                color: "#047857",
                borderColor: "#a7f3d0",
                _dark: { bg: "#064e3b/30", color: "#34d399", borderColor: "#065f46" }
              },
              danger: {
                bg: "#fef2f2",
                color: "#b91c1c",
                borderColor: "#fca5a5",
                _dark: { bg: "#7f1d1d/30", color: "#f87171", borderColor: "#991b1b" }
              },
              warning: {
                bg: "#fffbeb",
                color: "#b45309",
                borderColor: "#fde68a",
                _dark: { bg: "#78350f/30", color: "#fbbf24", borderColor: "#92400e" }
              },
              neutral: {
                bg: "#f8fafc",
                color: "#475569",
                borderColor: "#cbd5e1",
                _dark: { bg: "#1e293b/30", color: "#cbd5e1", borderColor: "#334155" }
              },
              active: {
                bg: "#ecfdf5",
                color: "#047857",
                borderColor: "#a7f3d0",
                _dark: { bg: "#064e3b/30", color: "#34d399", borderColor: "#065f46" }
              },
              inactive: {
                bg: "#f8fafc",
                color: "#475569",
                borderColor: "#cbd5e1",
                _dark: { bg: "#1e293b/30", color: "#cbd5e1", borderColor: "#334155" }
              },
            },
          },
          defaultVariants: { variant: "neutral" },
        },
      },
    },
  },

  outdir: "styled-system",

  // Generate JSX style props
  jsxFramework: "react",
});
