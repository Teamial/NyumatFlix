# NyumatFlix Design System

## Product Context

NyumatFlix is a cinematic streaming app and watchlist platform for movies and TV shows. Users discover, track, and manage their media consumption. The app emphasizes visual appeal with a premium dark cinema aesthetic.

**Key Pages**: Home, Movies, TV Shows, Watchlist, Search, Movie/TV Detail, Watch
**Target Audience**: Movie/TV enthusiasts who want a premium, ad-free streaming experience

## Color System (Dark Mode — Forced)

### Core Colors
| Token | HSL | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `0 0% 0%` | `#000000` | Page background |
| `--foreground` | `200 6.67% 91.18%` | `#E5E7E8` | Primary text |
| `--primary` | `203.77 87.6% 52.55%` | `#1E90FF` | Brand blue, CTAs, focus |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Text on primary |
| `--card` | `228 9.8% 10%` | `#171A1F` | Card backgrounds |
| `--card-foreground` | `0 0% 85.1%` | `#D9D9D9` | Card text |
| `--muted` | `0 0% 9.41%` | `#181818` | Muted surfaces |
| `--muted-foreground` | `210 3.39% 46.27%` | `#727476` | Secondary text |
| `--accent` | `205.71 70% 7.84%` | `#062136` | Accent surfaces |
| `--accent-foreground` | `203.77 87.6% 52.55%` | `#1E90FF` | Accent text (=primary) |
| `--destructive` | `356.3 90.56% 54.31%` | `#F02849` | Error/delete |
| `--border` | `210 5.26% 14.9%` | `#242628` | Borders |
| `--input` | `207.69 27.66% 18.43%` | `#223044` | Input borders |
| `--ring` | `202.82 89.12% 53.14%` | `#2196F3` | Focus ring |

### Chart Colors
- Chart 1: `#2196F3` (blue)
- Chart 2: `#00B868` (green)
- Chart 3: `#E8A838` (yellow)
- Chart 4: `#3CB371` (teal)
- Chart 5: `#E04080` (pink)

### Glassmorphism Palette
| Pattern | CSS |
|---|---|
| Card glass | `bg-card/40 backdrop-blur-md border border-white/10` |
| Button glass | `bg-white/10 backdrop-blur-md border border-white/30` |
| Overlay glass | `bg-black/70 backdrop-blur-xl border border-white/10` |
| Status pill | `bg-white/[0.04] text-white/50` |
| Floating bar | `bg-black/80 backdrop-blur-2xl border border-white/[0.1]` |

## Typography

### Font Stack
- **Primary (Sans)**: `Open Sans, sans-serif` (CSS var `--font-sans`)
- **Serif**: `Georgia, serif` (CSS var `--font-serif`)
- **Mono**: `Menlo, monospace` (CSS var `--font-mono`)
- **Body font loaded**: `Inter` via `next/font/google` (applied to `<body>`)

### Type Scale (Tailwind)
| Usage | Classes |
|---|---|
| Page heading | `text-4xl md:text-5xl font-bold tracking-tight` |
| Section heading | `text-lg font-semibold tracking-tight` |
| Card title | `text-sm sm:text-base md:text-lg font-semibold` |
| Body text | `text-sm text-muted-foreground` |
| Caption/meta | `text-[11px] sm:text-xs text-muted-foreground/80 font-medium` |
| Badge text | `text-[9px] font-semibold uppercase tracking-wider` |
| Micro text | `text-[7px] font-bold uppercase tracking-wider` |

## Spacing & Layout

### Container
- Max width: `max-w-7xl` (80rem / 1280px)
- Padding: `px-4 sm:px-6`
- Content spacing: `space-y-14`

### Border Radius
- CSS var: `--radius: 1.3rem` (20.8px)
- Cards: `rounded-lg` (0.5rem)
- Badges: `rounded-full` or `rounded-sm`
- Buttons: `rounded-md` (default) or `rounded-full` (pills)
- Status pills: `rounded-full`

### Shadows
All box-shadow CSS vars are set to `0` opacity (transparent) — shadows come from Tailwind utilities:
- Cards: `shadow-xl`, `shadow-2xl`
- Floating bars: `shadow-2xl shadow-black/40`
- Hover: `hover:shadow-lg hover:shadow-black/40`

## Component Patterns

### Button Variants (CVA)
| Variant | Style |
|---|---|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` |
| `outline` | `border border-input bg-background hover:bg-accent` |
| `chrome` | `bg-white/10 backdrop-blur-md border border-white/30 text-white` |
| `stylish` | `bg-gradient-to-r from-[#D247BF]/20 to-primary/20 text-white border-white/20` |
| `destructive` | `bg-destructive text-destructive-foreground` |

### Card Patterns
- **Standard**: `rounded-lg border bg-card text-card-foreground shadow-sm`
- **Media Card**: `bg-card/40 backdrop-blur-md border border-white/10 hover:border-primary/50 shadow-xl h-full flex flex-col`
- **Carousel Card**: `rounded-lg bg-neutral-950 border border-white/[0.04] hover:border-white/[0.12]`

### Badge Variants
| Variant | Style |
|---|---|
| `default` | `bg-primary text-primary-foreground rounded-full` |
| `outline` | `text-foreground border border-input` |
| `chrome` | `bg-white/10 backdrop-blur-md border border-white/30` |
| `stylish` | `bg-gradient-to-r from-[#D247BF]/20 to-primary/20` |

### Toggle Group (Status Selector)
- Container: `bg-black/70 backdrop-blur-xl border border-white/10 rounded-lg p-0.5`
- Items: `px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider rounded-md`
- Active: `bg-primary text-primary-foreground shadow-lg`

## Interaction Patterns

### Hover States
- Card border: `hover:border-primary/50` or `hover:border-white/[0.12]`
- Poster scale: `group-hover:scale-[1.02]`
- Backdrop opacity: `group-hover:opacity-20`
- CardContent slide-up: `md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100`
- Status toggle reveal: `opacity-0 group-hover:opacity-100`
- Play icon: `opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100`

### Transitions
- All: `transition-all duration-300`
- Colors: `transition-colors`
- Opacity: `transition-opacity duration-300` or `duration-500`
- Transform: `transition-transform duration-500`

### Animations (framer-motion)
- Batch action bar: spring `stiffness: 400, damping: 30`
- Sections: `animate-in fade-in duration-500`

## Watchlist Page Specific

### Layout Structure
1. **Cinematic Header**: Blue glow blur `bg-[hsl(204,88%,53%)]/[0.07] blur-[120px]`, title `text-4xl md:text-5xl font-bold`
2. **Status Count Pills**: `rounded-full bg-white/[0.04] text-xs text-white/50`
3. **Sticky Controls Bar**: `sticky top-16 z-40`, glassmorphic pill toolbar with search, sort, edit
4. **Carousel Sections**: Horizontal scroll with snap, gradient fade edges, scroll arrows
5. **Batch Action Bar**: Fixed bottom floating bar with status change buttons

### Media Card (Compact Mode)
- Poster with 2:3 aspect ratio
- Status toggle (Watch/Wait/Done) appears top-right on hover
- CardContent slides up from bottom on hover with logo/title, metadata badges
- Play icon centered on hover

### Visual Hierarchy
1. Movie posters are the primary visual focus
2. Metadata appears on hover (desktop) or always visible (mobile)
3. Status controls are secondary, revealed on interaction
4. Section headers use primary blue accent with gradient underline

## Design Constraints
- **ALWAYS dark mode** — never light backgrounds
- **Primary blue `#1E90FF`** — used for all CTAs, accents, focus states
- **Open Sans** — primary font (avoid Inter, Roboto, Arial)
- **Glassmorphism** — key visual pattern for depth
- **Poster-centric** — media images are the hero element
- **No decorative clutter** — clean, minimal overlays
