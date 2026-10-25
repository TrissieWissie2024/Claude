import Link from "next/link";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Buttons and button-styled links.
 *
 * - primary: signal with ink text (never white); hover and pressed get lighter
 *   (signal-hover), never darker, so ink stays above AA (docs/PLAN.md §3).
 * - secondary: ink with fog text.
 * - outline / ghost: for light surfaces.
 * - on-dark / outline-on-dark / ghost-on-dark: for deep and kelp surfaces
 *   (fog focus ring included).
 *
 * Filled variants carry a transparent 1px border: invisible normally, but
 * forced colors (Windows High Contrast) paints it, so the button keeps its
 * shape there when the background is dropped.
 *
 * Renders a Next <Link> when `href` is set (and not disabled), otherwise a
 * <button type="button">. An in-page anchor ("#scent-finder") renders a plain
 * <a> instead: a native fragment jump moves the focus starting point to the
 * target, so the next Tab continues there (WCAG 2.4.3); <Link> only scrolls.
 * Spreads extra props and `ref`, so it works with Radix `asChild`.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "on-dark"
  | "outline-on-dark"
  | "ghost-on-dark";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the width of the container. */
  fullWidth?: boolean;
  /** Square button for a single icon. Give it an aria-label. */
  iconOnly?: boolean;
  /** Disabled look (no hover). Loading buttons keep their normal look. */
  disabled?: boolean;
}

const base =
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-sans font-semibold " +
  "tracking-[0.01em] whitespace-nowrap select-none no-underline transition-[background-color,border-color,color,transform] " +
  "duration-200 ease-out motion-safe:active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary: "border border-transparent bg-signal text-ink hover:bg-signal-hover active:bg-signal-hover",
  secondary: "border border-transparent bg-ink text-fog hover:bg-ink/85 active:bg-ink/85",
  outline: "border border-ink/80 text-ink hover:border-ink hover:bg-ink hover:text-fog active:bg-ink active:text-fog",
  ghost: "text-ink hover:bg-ink/[0.06] active:bg-ink/10",
  "on-dark": "border border-transparent bg-fog text-ink hover:bg-white active:bg-white focus-visible:outline-fog",
  "outline-on-dark":
    "border border-fog/45 text-fog hover:border-fog hover:bg-fog hover:text-deep active:bg-fog active:text-deep focus-visible:outline-fog",
  "ghost-on-dark": "text-fog hover:bg-fog/10 active:bg-fog/15 focus-visible:outline-fog",
};

/** Disabled look per variant: neutral and quiet, no hover change. */
const disabledVariants: Record<ButtonVariant, string> = {
  primary: "border border-transparent bg-ink/[0.08] text-ink/40",
  secondary: "border border-transparent bg-ink/[0.08] text-ink/40",
  outline: "border border-ink/15 text-ink/40",
  ghost: "text-ink/35",
  "on-dark": "border border-transparent bg-fog/10 text-fog/40",
  "outline-on-dark": "border border-fog/15 text-fog/40",
  "ghost-on-dark": "text-fog/35",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

/**
 * Square icon buttons. sm is 44px, the smallest touch target used on the site (dialog close buttons).
 * In px, not rem: the icons are px too, and with a large default font size (e.g. 24 or 32 px)
 * rem-sized buttons grew past the 64 px header and pushed into the wordmark on a phone.
 */
const iconOnlySizes: Record<ButtonSize, string> = {
  sm: "size-[44px]",
  md: "size-[48px]",
  lg: "size-[56px]",
};

/** Class names of a button, for elements that cannot use <Button> (e.g. a styled <summary>). */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconOnly = false,
  disabled = false,
}: ButtonStyleOptions = {}): string {
  return cn(
    base,
    disabled ? cn(disabledVariants[variant], "cursor-not-allowed motion-safe:active:scale-100") : variants[variant],
    iconOnly ? iconOnlySizes[size] : sizes[size],
    fullWidth && "w-full",
  );
}

interface ButtonOwnProps extends ButtonStyleOptions {
  /** Shows a spinner, sets aria-busy and blocks clicks. */
  loading?: boolean;
  /** Label while loading, e.g. "Adding". Defaults to the normal label. */
  loadingLabel?: ReactNode;
  /** Icon before the label (decorative; mark it aria-hidden). */
  iconStart?: ReactNode;
  /** Icon after the label (decorative; mark it aria-hidden). */
  iconEnd?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export type ButtonAsButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithRef<"button">, keyof ButtonOwnProps> & { href?: undefined };

export type ButtonAsLinkProps = ButtonOwnProps &
  Omit<ComponentPropsWithRef<typeof Link>, keyof ButtonOwnProps | "href"> & { href: string };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-[1.1em] shrink-0 motion-safe:animate-spin"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ButtonContent({
  loading,
  loadingLabel,
  iconStart,
  iconEnd,
  children,
}: Pick<ButtonOwnProps, "loading" | "loadingLabel" | "iconStart" | "iconEnd" | "children">) {
  return (
    <>
      {loading ? <Spinner /> : iconStart}
      {loading && loadingLabel ? loadingLabel : children}
      {loading ? null : iconEnd}
    </>
  );
}

/** True for a same-document fragment link such as "#scent-finder". */
export function isInPageAnchor(href: string): boolean {
  return href.startsWith("#");
}

export function Button(props: ButtonProps) {
  if (props.href !== undefined && !props.disabled) {
    const {
      href,
      variant,
      size,
      fullWidth,
      iconOnly,
      loading,
      loadingLabel,
      iconStart,
      iconEnd,
      disabled,
      className,
      children,
      ...rest
    } = props;
    void disabled;
    const classes = cn(buttonClasses({ variant, size, fullWidth, iconOnly }), loading && "pointer-events-none", className);
    const content = (
      <ButtonContent loading={loading} loadingLabel={loadingLabel} iconStart={iconStart} iconEnd={iconEnd}>
        {children}
      </ButtonContent>
    );

    if (isInPageAnchor(href)) {
      // Drop the props only <Link> understands; the rest are plain anchor attributes.
      const {
        as,
        replace,
        scroll,
        shallow,
        passHref,
        prefetch,
        locale,
        legacyBehavior,
        onNavigate,
        transitionTypes,
        ...anchorRest
      } = rest;
      void [as, replace, scroll, shallow, passHref, prefetch, locale, legacyBehavior, onNavigate, transitionTypes];
      return (
        <a href={href} aria-busy={loading || undefined} className={classes} {...anchorRest}>
          {content}
        </a>
      );
    }

    return (
      <Link
        href={href}
        aria-busy={loading || undefined}
        className={classes}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  const {
    href,
    variant,
    size,
    fullWidth,
    iconOnly,
    loading,
    loadingLabel,
    iconStart,
    iconEnd,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  } = props as ButtonAsButtonProps;
  void href;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonClasses({ variant, size, fullWidth, iconOnly, disabled: disabled && !loading }),
        loading && "cursor-progress",
        className,
      )}
      {...rest}
    >
      <ButtonContent loading={loading} loadingLabel={loadingLabel} iconStart={iconStart} iconEnd={iconEnd}>
        {children}
      </ButtonContent>
    </button>
  );
}
