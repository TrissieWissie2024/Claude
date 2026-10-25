"use client";

import * as RadixAccordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { MotionStyles } from "@/components/ui/MotionStyles";
import { cn } from "@/lib/cn";

/**
 * Accessible accordion (Radix): buttons with aria-expanded inside headings,
 * arrow-key navigation between triggers. Height and chevron animate only with
 * motion allowed.
 */

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

interface AccordionBaseProps {
  items: AccordionItem[];
  /** Heading element around each trigger. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** "dark" for deep and kelp surfaces. */
  tone?: "light" | "dark";
  className?: string;
}

export type AccordionProps = AccordionBaseProps &
  (
    | { type?: "single"; defaultValue?: string; collapsible?: boolean }
    | { type: "multiple"; defaultValue?: string[]; collapsible?: undefined }
  );

export function Accordion(props: AccordionProps) {
  const { items, headingLevel = 3, tone = "light", className } = props;
  const dark = tone === "dark";
  const Heading = `h${headingLevel}` as const;

  const content = items.map((item) => (
    <RadixAccordion.Item
      key={item.id}
      value={item.id}
      className={cn("border-b", dark ? "border-line-on-deep" : "border-line")}
    >
      <RadixAccordion.Header asChild>
        <Heading className="m-0">
          <RadixAccordion.Trigger
            className={cn(
              "group flex w-full items-center justify-between gap-6 py-5 text-left font-sans text-base font-semibold tracking-normal md:py-6 md:text-[1.0625rem]",
              dark ? "text-fog focus-visible:outline-fog" : "text-ink",
            )}
          >
            <span>{item.title}</span>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                dark ? "text-mist group-hover:bg-fog/10" : "text-ink-soft group-hover:bg-ink/[0.06]",
              )}
            >
              <ChevronDown
                className="size-[18px] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out group-data-[state=open]:rotate-180"
                strokeWidth={1.75}
              />
            </span>
          </RadixAccordion.Trigger>
        </Heading>
      </RadixAccordion.Header>
      <RadixAccordion.Content
        className={cn(
          "overflow-hidden",
          "motion-safe:data-[state=open]:animate-[corvane-accordion-down_280ms_cubic-bezier(0.32,0.72,0,1)]",
          "motion-safe:data-[state=closed]:animate-[corvane-accordion-up_220ms_ease-in]",
        )}
      >
        <div className={cn("pr-10 pb-6 text-[0.9375rem] leading-relaxed md:text-base", dark ? "text-mist" : "text-ink-soft")}>
          {item.content}
        </div>
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  ));

  const rootClass = cn("border-t", dark ? "border-line-on-deep" : "border-line", className);

  return (
    <>
      <MotionStyles />
      {props.type === "multiple" ? (
        <RadixAccordion.Root type="multiple" defaultValue={props.defaultValue} className={rootClass}>
          {content}
        </RadixAccordion.Root>
      ) : (
        <RadixAccordion.Root
          type="single"
          collapsible={props.collapsible ?? true}
          defaultValue={props.defaultValue}
          className={rootClass}
        >
          {content}
        </RadixAccordion.Root>
      )}
    </>
  );
}
