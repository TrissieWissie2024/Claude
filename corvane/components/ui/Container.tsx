import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /** Element to render. Default "div". */
  as?: "div" | "section" | "header" | "footer" | "main" | "nav" | "article" | "aside";
  children?: ReactNode;
}

/** Page-width wrapper: 1240px max, 20px side padding on mobile, 32px from md. */
export function Container({ as: Tag = "div", className, children, ...rest }: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full max-w-[1240px] px-5 md:px-8", className)} {...rest}>
      {children}
    </Tag>
  );
}
