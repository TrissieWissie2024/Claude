import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";
import { CookieSettingsButton } from "@/components/layout/footer/CookieSettingsButton";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { PaymentIcons } from "@/components/layout/PaymentIcons";
import { Container } from "@/components/ui/Container";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { site } from "@/content/site";

/**
 * Site footer (brief §6.12, docs/PLAN.md §4.13). Server component on deep;
 * NewsletterForm and CookieSettingsButton are the only client islands.
 *
 * Top to bottom:
 * 1. Newsletter: heading, one line, the form with its consent text.
 * 2. Link columns Shop / Help / Company / Legal (site.footer.columns):
 *    2 columns on mobile, 4 from md.
 * 3. Payment methods (our own text badges, no brand logos) and socials as
 *    text links with a generic external-link arrow.
 * 4. Company details (site.company, placeholders until launch), copyright
 *    (fixed year from content, never computed), demo notice, and "Cookie
 *    settings" only when site.analytics.enabled is true.
 * 5. The wordmark in fog across the full container width (decorative: the
 *    name is in the copyright line).
 */

/** 44 px tall targets; the link lists have no gap, so the 44 px pitch is the rhythm. */
const linkClass =
  "inline-flex min-h-11 items-center text-[15px] leading-6 text-fog underline-offset-4 decoration-fog/40 hover:underline";

export function Footer() {
  const { footer, newsletter, company } = site;
  const companyLines = [company.legalName, company.kvk, company.vat, company.address];

  return (
    <footer className="focus-on-dark bg-deep text-fog print:hidden">
      <Container>
        <section
          aria-labelledby="footer-newsletter-heading"
          className="grid grid-cols-1 gap-8 pt-16 pb-14 md:pt-24 md:pb-20 lg:grid-cols-12 lg:items-start lg:gap-x-8"
        >
          <div className="lg:col-span-5">
            <h2 id="footer-newsletter-heading" className="text-[2rem] leading-[1.1] text-fog md:text-[2.75rem]">
              {newsletter.heading}
            </h2>
            <p className="mt-3 max-w-[26rem] text-base leading-relaxed text-mist md:mt-4 md:text-lg">
              {newsletter.intro}
            </p>
          </div>
          <NewsletterForm className="lg:col-span-6 lg:col-start-7 lg:pt-2" />
        </section>

        <nav
          aria-label={footer.navLabel}
          className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-line-on-deep py-12 md:grid-cols-4 md:gap-x-8 md:py-16"
        >
          {footer.columns.map((column) => (
            <div key={column.heading}>
              <h2 className="label-caps text-mist">{column.heading}</h2>
              <ul className="mt-3 flex flex-col">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.href.includes("#") ? (
                      // A fragment link ("/#scent-finder") as a plain <a>: on "/" a native jump that
                      // moves the focus starting point to the target (WCAG 2.4.3); elsewhere a normal load.
                      <a href={link.href} className={linkClass}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-8 border-t border-line-on-deep pt-10 md:flex-row md:items-center md:justify-between">
          <PaymentIcons tone="dark" size="auto" />
          <ul aria-label={site.socialsLabel} className="flex items-center gap-7">
            {site.socials.map((social) => (
              <li key={social.id}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {social.label}
                  <ArrowUpRight aria-hidden="true" className="ml-1 size-4 text-mist" strokeWidth={1.75} />
                  <span className="sr-only">, {footer.newTab}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-6 text-[13px] leading-relaxed text-mist md:mt-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <VisuallyHidden as="h2">{footer.companyLabel}</VisuallyHidden>
          <address className="flex flex-col not-italic">
            {companyLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span>
              <a href={`mailto:${company.email}`} className="underline underline-offset-4 hover:text-fog">
                {company.email}
              </a>
              {company.emailNote ? ` ${company.emailNote}` : null}
            </span>
          </address>

          <div className="flex flex-col gap-1 lg:shrink-0 lg:items-end lg:text-right">
            <p className="text-fog">{footer.copyright}</p>
            <p className="text-balance">{footer.demoNotice}</p>
            {site.analytics.enabled ? <CookieSettingsButton className="w-fit text-left lg:ml-auto" /> : null}
          </div>
        </div>

        <div className="pt-14 pb-8 md:pt-20 md:pb-10">
          <Wordmark decorative className="h-auto w-full text-fog" />
        </div>
      </Container>
    </footer>
  );
}
