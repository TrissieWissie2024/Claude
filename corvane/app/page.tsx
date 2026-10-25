import { Wordmark } from "@/components/brand/Wordmark";
import { GroupRender } from "@/components/media/GroupRender";
import { StickRender } from "@/components/media/StickRender";
import { Container } from "@/components/ui/Container";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { getSticks } from "@/lib/catalog";
import { commerce } from "@/lib/commerce";
import type { StickProduct } from "@/lib/types";

/**
 * Temporary homepage for phase 3: the wordmark, the hero group render and the
 * six stick renders. Replaced by the full homepage in phase 5.
 */
export default async function HomePage() {
  const sticks = getSticks(await commerce.getProducts());
  const heroSticks = home.hero.groupScents
    .map((slug) => sticks.find((stick) => stick.slug === slug))
    .filter((stick): stick is StickProduct => stick !== undefined);

  return (
    <main id="main">
      <section aria-labelledby="hero-heading" className="focus-on-dark bg-deep text-fog">
        <Container className="grid items-center gap-12 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div>
            <Wordmark className="h-5 w-auto text-fog md:h-7" />
            <p className="label-caps mt-10 text-mist">{home.hero.eyebrow}</p>
            <h1 id="hero-heading" className="mt-4 text-[2.625rem] leading-[1.04] md:text-[4.25rem]">
              {home.hero.heading}
            </h1>
            <p className="mt-6 max-w-md text-lg text-mist">{home.hero.subheading}</p>
          </div>
          <div className="mx-auto w-full max-w-[22rem] md:max-w-[28rem]">
            <GroupRender scents={heroSticks} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="range-heading" className="py-16 md:py-24">
        <Container>
          <p className="label-caps text-ink-soft">{home.productGrid.label}</p>
          <h2 id="range-heading" className="mt-4 text-[2.125rem] leading-[1.08] md:text-[3.25rem]">
            {home.productGrid.heading}
          </h2>
          <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
            {sticks.map((stick) => (
              <li key={stick.slug} className="flex flex-col items-center text-center">
                <div className="flex h-56 w-full justify-center rounded-card bg-sand py-6 md:h-64">
                  <StickRender ringColor={stick.ringColor} name={stick.name} />
                </div>
                <p className="mt-4 font-serif text-xl">{stick.name}</p>
                <p className="label-caps mt-1 text-ink-soft">{stick.family}</p>
              </li>
            ))}
          </ul>
          <p className="mt-16 text-ink-soft">{site.tagline}</p>
        </Container>
      </section>
    </main>
  );
}
