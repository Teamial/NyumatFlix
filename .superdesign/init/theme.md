# NyumatFlix Theme

## Global CSS

- **File:** `app/globals.css`
- **Description:** Defines CSS custom properties for light and dark themes, scrollbar styling, base layer resets, and custom keyframes. The app forces dark mode via ThemeProvider. Primary color is a vivid blue (`hsl(203.7736 87.6033% 52.549%)`).

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
  overflow-x: hidden;
}

/* *=========== Default theme =========== */
@layer base {
  /* :root {
    --background: 253 48% 99%;
    --foreground: 253 78% 4%;
    --muted: 223 38% 94%;
    --muted-foreground: 223 8% 39%;
    --popover: 253 48% 98%;
    --popover-foreground: 253 78% 3%;
    --card: 253 48% 98%;
    --card-foreground: 253 78% 3%;
    --border: 253 6% 89%;
    --input: 253 6% 89%;
    --primary: 253 92% 48%;
    --primary-foreground: 0 0% 100%;
    --secondary: 223 92% 48%;
    --secondary-foreground: 0 0% 100%;
    --accent: 283 92% 48%;
    --accent-foreground: 0 0% 100%;
    --destructive: 18 96% 26%;
    --destructive-foreground: 18 96% 86%;
    --ring: 253 92% 48%;
    --radius: 0.5rem;
  } */
  /*
  :root {
    --background: 253 50% 4%;
    --foreground: 253 20% 99%;
    --muted: 223 38% 6%;
    --muted-foreground: 223 8% 61%;
    --popover: 253 50% 5%;
    --popover-foreground: 0 0% 100%;
    --card: 253 50% 5%;
    --card-foreground: 0 0% 100%;
    --border: 253 6% 10%;
    --input: 253 6% 10%;
    --primary: 253 92% 48%;
    --primary-foreground: 0 0% 100%;
    --secondary: 223 92% 48%;
    --secondary-foreground: 0 0% 100%;
    --accent: 283 92% 48%;
    --accent-foreground: 0 0% 100%;
    --destructive: 18 96% 49%;
    --destructive-foreground: 0 0% 100%;
    --ring: 253 92% 48%;
    --radius: 0.5rem;
  } */

  :root {
    --background: 0 0% 100%;
    --foreground: 210 25% 7.8431%;
    --card: 180 6.6667% 97.0588%;
    --card-foreground: 210 25% 7.8431%;
    --popover: 0 0% 100%;
    --popover-foreground: 210 25% 7.8431%;
    --primary: 203.8863 88.2845% 53.1373%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 25% 7.8431%;
    --secondary-foreground: 0 0% 100%;
    --muted: 240 1.9608% 90%;
    --muted-foreground: 210 25% 7.8431%;
    --accent: 211.5789 51.3514% 92.7451%;
    --accent-foreground: 203.8863 88.2845% 53.1373%;
    --destructive: 356.3033 90.5579% 54.3137%;
    --destructive-foreground: 0 0% 100%;
    --border: 201.4286 30.4348% 90.9804%;
    --input: 200 23.0769% 97.451%;
    --ring: 202.8169 89.1213% 53.1373%;
    --chart-1: 203.8863 88.2845% 53.1373%;
    --chart-2: 159.7826 100% 36.0784%;
    --chart-3: 42.029 92.8251% 56.2745%;
    --chart-4: 147.1429 78.5047% 41.9608%;
    --chart-5: 341.4894 75.2% 50.9804%;
    --sidebar: 180 6.6667% 97.0588%;
    --sidebar-foreground: 210 25% 7.8431%;
    --sidebar-primary: 203.8863 88.2845% 53.1373%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 211.5789 51.3514% 92.7451%;
    --sidebar-accent-foreground: 203.8863 88.2845% 53.1373%;
    --sidebar-border: 205 25% 90.5882%;
    --sidebar-ring: 202.8169 89.1213% 53.1373%;
    --font-sans: Open Sans, sans-serif;
    --font-serif: Georgia, serif;
    --font-mono: Menlo, monospace;
    --radius: 1.3rem;
    --shadow-2xs: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-xs: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-sm:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 1px 2px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 1px 2px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-md:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 2px 4px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-lg:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 4px 6px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-xl:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 8px 10px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-2xl: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0);
  }

  .dark {
    --background: 0 0% 0%;
    --foreground: 200 6.6667% 91.1765%;
    --card: 228 9.8039% 10%;
    --card-foreground: 0 0% 85.098%;
    --popover: 0 0% 0%;
    --popover-foreground: 200 6.6667% 91.1765%;
    --primary: 203.7736 87.6033% 52.549%;
    --primary-foreground: 0 0% 100%;
    --secondary: 195 15.3846% 94.902%;
    --secondary-foreground: 210 25% 7.8431%;
    --muted: 0 0% 9.4118%;
    --muted-foreground: 210 3.3898% 46.2745%;
    --accent: 205.7143 70% 7.8431%;
    --accent-foreground: 203.7736 87.6033% 52.549%;
    --destructive: 356.3033 90.5579% 54.3137%;
    --destructive-foreground: 0 0% 100%;
    --border: 210 5.2632% 14.902%;
    --input: 207.6923 27.6596% 18.4314%;
    --ring: 202.8169 89.1213% 53.1373%;
    --chart-1: 203.8863 88.2845% 53.1373%;
    --chart-2: 159.7826 100% 36.0784%;
    --chart-3: 42.029 92.8251% 56.2745%;
    --chart-4: 147.1429 78.5047% 41.9608%;
    --chart-5: 341.4894 75.2% 50.9804%;
    --sidebar: 228 9.8039% 10%;
    --sidebar-foreground: 0 0% 85.098%;
    --sidebar-primary: 202.8169 89.1213% 53.1373%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 205.7143 70% 7.8431%;
    --sidebar-accent-foreground: 203.7736 87.6033% 52.549%;
    --sidebar-border: 205.7143 15.7895% 26.0784%;
    --sidebar-ring: 202.8169 89.1213% 53.1373%;
    --font-sans: Open Sans, sans-serif;
    --font-serif: Georgia, serif;
    --font-mono: Menlo, monospace;
    --radius: 1.3rem;
    --shadow-2xs: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-xs: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-sm:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 1px 2px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 1px 2px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-md:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 2px 4px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-lg:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 4px 6px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-xl:
      0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0), 0px 8px 10px -1px
      hsl(202.8169 89.1213% 53.1373% / 0);
    --shadow-2xl: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0);
  }
}

/* *=========== Orange theme =========== */
/* @layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 20 14.3% 4.1%;

    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 4.1%;

    --popover: 0 0% 100%;
    --popover-foreground: 20 14.3% 4.1%;

    --primary: 24.6 95% 53.1%;
    --primary-foreground: 60 9.1% 97.8%;

    --secondary: 60 4.8% 95.9%;
    --secondary-foreground: 24 9.8% 10%;

    --muted: 60 4.8% 95.9%;
    --muted-foreground: 25 5.3% 44.7%;

    --accent: 60 4.8% 95.9%;
    --accent-foreground: 24 9.8% 10%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 60 9.1% 97.8%;

    --border: 20 5.9% 90%;
    --input: 20 5.9% 90%;
    --ring: 24.6 95% 53.1%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 20 14.3% 4.1%;
    --foreground: 60 9.1% 97.8%;

    --card: 24 9.8% 8%;
    --card-foreground: 0 0% 95%;

    --popover: 20 14.3% 4.1%;
    --popover-foreground: 60 9.1% 97.8%;

    --primary: 20.5 90.2% 48.2%;
    --primary-foreground: 60 9.1% 97.8%;

    --secondary: 12 6.5% 15.1%;
    --secondary-foreground: 60 9.1% 97.8%;

    --muted: 12 6.5% 15.1%;
    --muted-foreground: 24 5.4% 63.9%;

    --accent: 12 6.5% 15.1%;
    --accent-foreground: 60 9.1% 97.8%;

    --destructive: 0 72.2% 50.6%;
    --destructive-foreground: 60 9.1% 97.8%;

    --border: 12 6.5% 15.1%;
    --input: 12 6.5% 15.1%;
    --ring: 20.5 90.2% 48.2%;
  }
} */

.shadow-light {
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.085);
}

.shadow-dark {
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.141);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    @apply !min-w-full;
  }

  #scrollbar_hide {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--background));
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.4);
  border-radius: 3px;
  border: none;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.6);
}

::-webkit-scrollbar-corner {
  background: hsl(var(--background));
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.4) hsl(var(--background));
}

@theme inline {
  @keyframes float {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
}
```

---

## Tailwind Configuration

- **File:** `tailwind.config.ts`
- **Description:** Tailwind CSS configuration with class-based dark mode, custom color tokens mapped to CSS variables, extended border-radius using `--radius`, custom keyframe animations (accordion, collapsible, spin-around, slide, shine-pulse, border-beam), and plugins for `tailwindcss-animate` and a custom `addVariablesForColors` plugin that exposes all theme colors as CSS custom properties on `:root`.

```ts
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  safelist: ["dark"],
  prefix: "",

  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],

  theme: {
    container: {
      center: "true",
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "collapsible-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-collapsible-content-height)",
          },
        },
        "collapsible-up": {
          from: {
            height: "var(--radix-collapsible-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "spin-around": {
          "0%": {
            transform: "translateZ(0) rotate(0)",
          },
          "15%, 35%": {
            transform: "translateZ(0) rotate(90deg)",
          },
          "65%, 85%": {
            transform: "translateZ(0) rotate(270deg)",
          },
          "100%": {
            transform: "translateZ(0) rotate(360deg)",
          },
        },
        slide: {
          to: {
            transform: "translate(calc(100cqw - 100%), 0)",
          },
        },
        "shine-pulse": {
          "0%": {
            "background-position": "0% 0%",
          },
          "50%": {
            "background-position": "100% 100%",
          },
          to: {
            "background-position": "0% 0%",
          },
        },
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-in-out",
        "collapsible-up": "collapsible-up 0.2s ease-in-out",
        "spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
        slide: "slide var(--speed) ease-in-out infinite alternate",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
      },
    },
  },
  plugins: [animate, addVariablesForColors],
};

function addVariablesForColors({
  addBase,
  theme,
}: {
  addBase: (styles: Record<string, unknown>) => void;
  theme: (path: string) => unknown;
}) {
  const allColors = flattenColorPalette(theme("colors"));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val]),
  );

  addBase({
    ":root": newVars,
  });
}
```

---

## Theme Summary

### Color Tokens (Dark Mode — Active)

| Token | HSL Value | Description |
|---|---|---|
| `--background` | `0 0% 0%` | Pure black background |
| `--foreground` | `200 6.67% 91.18%` | Light gray text |
| `--card` | `228 9.8% 10%` | Dark card background |
| `--primary` | `203.77 87.6% 52.55%` | Vivid blue — main accent |
| `--primary-foreground` | `0 0% 100%` | White text on primary |
| `--secondary` | `195 15.38% 94.9%` | Near-white secondary |
| `--muted` | `0 0% 9.41%` | Dark muted background |
| `--muted-foreground` | `210 3.39% 46.27%` | Gray muted text |
| `--accent` | `205.71 70% 7.84%` | Deep blue accent |
| `--destructive` | `356.3 90.56% 54.31%` | Red for errors/destructive |
| `--border` | `210 5.26% 14.9%` | Subtle dark border |
| `--input` | `207.69 27.66% 18.43%` | Input field background |
| `--ring` | `202.82 89.12% 53.14%` | Focus ring blue |
| `--radius` | `1.3rem` | Default border radius |

### Fonts

- **Sans:** Open Sans
- **Serif:** Georgia
- **Mono:** Menlo

### Design Language

- Forced dark mode with pure black (`#000`) background
- Blue primary accent (`~hsl(204, 88%, 53%)`) used for interactive elements, focus rings, and highlights
- Glassmorphism patterns: `backdrop-blur`, `bg-white/10`, `border-white/20` for overlays
- Gradient overlays on cards and hero sections for depth
- Custom thin scrollbars matching the theme
