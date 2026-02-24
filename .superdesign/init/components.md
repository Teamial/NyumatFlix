# NyumatFlix UI Components

Key UI components used across the application, primarily on the watchlist page.

---

## Button

- **File:** `components/ui/button.tsx`
- **Component:** `Button`
- **Description:** Versatile button with multiple variants (default, destructive, outline, secondary, ghost, link, icon, stylish, chrome) and sizes. Uses `class-variance-authority` and supports polymorphism via `asChild` with Radix Slot.

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        icon: "size-10 rounded-full",
        stylish:
          "bg-gradient-to-r from-[#D247BF]/20 to-primary/20 text-white border border-white/20 backdrop-blur-sm hover:from-[#D247BF]/30 hover:to-primary/30 hover:border-white/30 transition-all duration-300",
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        chrome:
          "w-full font-bold transition-all duration-200 shadow-lg group/arrow backdrop-blur-md bg-white/10 border border-white/30 text-white hover:bg-white/20 hover:border-white/40 hover:shadow-xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

---

## Card

- **File:** `components/ui/card.tsx`
- **Component:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Description:** Composable card layout primitives. The root `Card` provides a rounded, bordered container with card background color and shadow.

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm border-secondary",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
```

---

## Badge

- **File:** `components/ui/badge.tsx`
- **Component:** `Badge`
- **Description:** Inline badge/chip with variants (default, secondary, destructive, outline, chrome, stylish). Supports optional `href` for click-to-navigate via Next.js router with prefetching on hover.

```tsx
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border border-input",
        chrome:
          "backdrop-blur-md bg-white/10 border border-white/30 text-white hover:bg-white/20 hover:border-white/40 shadow-lg",
        stylish:
          "bg-gradient-to-r from-[#D247BF]/20 to-primary/20 text-white border border-white/20 backdrop-blur-sm hover:from-[#D247BF]/30 hover:to-primary/30 hover:border-white/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  href?: string;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, href, ...props }, ref) => {
    const router = useRouter();

    const handleMouseEnter = () => {
      if (href) {
        router.prefetch(href);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
        onClick={(e) => {
          props.onClick?.(e);
          if (href) {
            router.push(href);
          }
        }}
        onMouseEnter={handleMouseEnter}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
```

---

## Input

- **File:** `components/ui/input.tsx`
- **Component:** `Input`
- **Description:** Standard text input with consistent border, focus ring, and placeholder styling.

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

---

## Toggle

- **File:** `components/ui/toggle.tsx`
- **Component:** `Toggle`
- **Description:** Radix UI toggle primitive with default and outline variants, and sm/default/lg sizes. Exports `toggleVariants` used by ToggleGroup.

```tsx
"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
```

---

## ToggleGroup

- **File:** `components/ui/toggle-group.tsx`
- **Component:** `ToggleGroup`, `ToggleGroupItem`
- **Description:** Radix UI toggle group built on top of Toggle variants. Provides single/multi-select toggle groups with shared variant/size context. Used for watchlist status toggles on MediaCard.

```tsx
"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";
import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
});

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
```

---

## Checkbox

- **File:** `components/ui/checkbox.tsx`
- **Component:** `Checkbox`
- **Description:** Radix UI checkbox with check icon indicator. Used in watchlist edit/batch-select mode.

```tsx
"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

---

## Select

- **File:** `components/ui/select.tsx`
- **Component:** `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectValue`, `SelectLabel`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`
- **Description:** Full Radix UI select dropdown with scroll buttons, portal rendering, and animated open/close transitions. Used for the watchlist sort dropdown.

```tsx
"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center !bg-background justify-between rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] border-secondary overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
```

---

## Tooltip

- **File:** `components/ui/tooltip.tsx`
- **Component:** `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- **Description:** Radix UI tooltip with animated entrance/exit. `TooltipProvider` is mounted once in the root layout.

```tsx
"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
```

---

## Skeleton

- **File:** `components/ui/skeleton.tsx`
- **Component:** `Skeleton`
- **Description:** Simple animated pulse placeholder for loading states.

```tsx
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
```

---

## CountryBadge

- **File:** `components/ui/country-badge.tsx`
- **Component:** `CountryBadge`, `CountryBadgeList`
- **Description:** Displays a country flag emoji + name inside a Badge. Supports click-to-browse by country, tooltip with browse text, and configurable size/visibility. `CountryBadgeList` renders multiple with optional `maxDisplay` truncation.

```tsx
"use client";
import { countries } from "country-data-list";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getFriendlyCountryName } from "@/utils/country-helpers";

const sizeClasses = {
  sm: "text-xs px-2 py-1 gap-1",
  md: "text-sm px-2.5 py-1.5 gap-1.5",
  lg: "text-base px-3 py-2 gap-2",
};

export type ProductionCountry = {
  iso_3166_1: string;
  name: string;
};

type CountryBadgeProps = {
  country: ProductionCountry;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  showFlag?: boolean;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
  clickable?: boolean;
  mediaType?: "movie" | "tv";
};

type CountryBadgeListProps = {
  countries: ProductionCountry[];
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  showFlag?: boolean;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
  maxDisplay?: number;
  clickable?: boolean;
  mediaType?: "movie" | "tv";
};

const CountryBadge = ({
  country,
  variant = "outline",
  className,
  showFlag = true,
  showName = true,
  size = "md",
  clickable = true,
  mediaType = "movie",
}: CountryBadgeProps) => {
  const countryData = countries.all.find(
    (c) => c.alpha2 === country.iso_3166_1,
  );

  const displayName = getFriendlyCountryName(country.iso_3166_1, country.name);

  const emojiSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const href = `/browse/country/${country.iso_3166_1.toLowerCase()}?type=${mediaType}`;
  const tooltipText = `Browse ${displayName} ${
    mediaType === "movie" ? "movies" : "TV shows"
  }`;

  const badgeContent = (href?: string) => (
    <Badge
      variant={variant}
      href={href}
      className={cn(
        "inline-flex items-center font-medium",
        sizeClasses[size],
        clickable &&
          "cursor-pointer transition-all hover:scale-105 hover:shadow-md",
        className,
      )}
    >
      {showFlag && countryData?.emoji && (
        <span className={cn("leading-none", emojiSizeClasses[size])}>
          {countryData.emoji}
        </span>
      )}
      {showName && <span className="truncate">{displayName}</span>}
    </Badge>
  );

  if (!clickable) {
    return badgeContent();
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeContent(href)}</TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const CountryBadgeList = ({
  countries,
  variant = "outline",
  className,
  showFlag = true,
  showName = true,
  size = "md",
  maxDisplay,
  clickable = true,
  mediaType = "movie",
}: CountryBadgeListProps) => {
  const displayCountries = maxDisplay
    ? countries.slice(0, maxDisplay)
    : countries;
  const remainingCount =
    maxDisplay && countries.length > maxDisplay
      ? countries.length - maxDisplay
      : 0;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayCountries.map((country) => (
        <CountryBadge
          key={country.iso_3166_1}
          country={country}
          variant={variant}
          showFlag={showFlag}
          showName={showName}
          size={size}
          clickable={clickable}
          mediaType={mediaType}
        />
      ))}
      {remainingCount > 0 && (
        <Badge
          variant={variant}
          className={cn("font-medium", sizeClasses[size])}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};

export { CountryBadge, CountryBadgeList };
```

---

## GenreBadge

- **File:** `components/ui/genre-badge.tsx`
- **Component:** `GenreBadge`, `PrimaryGenreBadge`, `SmartGenreBadgeGroup`
- **Description:** Genre badge that links to browse-by-genre pages. `SmartGenreBadgeGroup` renders a limited number of visible genres with a "+N more" tooltip for overflow. Uses genre ID-to-name mapping.

```tsx
"use client";

import Link from "next/link";
import { getGenreName } from "@/components/content/genre-helpers";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface GenreBadgeProps {
  genreId: number;
  genreName: string;
  mediaType?: "movie" | "tv";
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "chrome"
    | "stylish";
  className?: string;
  clickable?: boolean;
}

export function GenreBadge({
  genreId,
  genreName,
  mediaType,
  variant = "chrome",
  className,
  clickable = true,
}: GenreBadgeProps) {
  const href =
    mediaType === "movie"
      ? `/movies/browse?genre=${genreId}`
      : `/tvshows/browse?genre=${genreId}`;
  const tooltipText = `Browse ${genreName} ${mediaType === "movie" ? "movies" : "TV shows"}`;

  if (!clickable) {
    return (
      <Badge variant={variant} className={className}>
        {genreName}
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={href} className="inline-block" aria-label={tooltipText}>
          <Badge
            variant={variant}
            className={cn(
              "cursor-pointer transition-all hover:scale-105 hover:shadow-md",
              className,
            )}
          >
            {genreName}
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function PrimaryGenreBadge(props: GenreBadgeProps) {
  return (
    <GenreBadge
      {...props}
      variant="chrome"
      className={cn(
        "focus:ring-0 focus:ring-offset-0 active:ring-0 active:ring-offset-0",
        props.className,
      )}
    />
  );
}

interface SmartGenreBadgeGroupProps {
  genreIds: number[];
  mediaType: "movie" | "tv";
  maxVisible?: number;
  className?: string;
  badgeClassName?: string;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "chrome"
    | "stylish";
}

export function SmartGenreBadgeGroup({
  genreIds,
  mediaType,
  maxVisible = 2,
  className,
  badgeClassName,
  variant = "chrome",
}: SmartGenreBadgeGroupProps) {
  if (!genreIds || genreIds.length === 0) {
    return null;
  }

  const visibleGenres = genreIds.slice(0, maxVisible);
  const hiddenGenres = genreIds.slice(maxVisible);
  const hasHiddenGenres = hiddenGenres.length > 0;

  const hiddenGenreNames = hiddenGenres.map((id) =>
    getGenreName(id, mediaType),
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visibleGenres.map((genreId) => (
        <GenreBadge
          key={genreId}
          genreId={genreId}
          genreName={getGenreName(genreId, mediaType)}
          mediaType={mediaType}
          variant={variant}
          className={badgeClassName}
        />
      ))}

      {hasHiddenGenres && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={variant}
              className={cn(
                "cursor-help transition-colors hover:bg-primary/20 hover:text-primary hover:border-primary/50",
                badgeClassName,
              )}
            >
              +{hiddenGenres.length} more
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm font-medium">Additional genres:</p>
            <p className="text-xs text-muted-foreground">
              {hiddenGenreNames.join(", ")}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
```
