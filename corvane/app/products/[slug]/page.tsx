import { Camera, Hand } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FaqSection, faqItemsFor } from "@/components/home/FaqSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { NotesCard, NotesThumb } from "@/components/media/NotesCard";
import { SLOT_TONES } from "@/components/media/PhotoSlot";
import { ProductMedia, type ProductMediaVariant } from "@/components/media/ProductMedia";
import { CrossSell } from "@/components/pdp/CrossSell";
import { DeliveryEstimate } from "@/components/pdp/DeliveryEstimate";
import { ProductAccordions } from "@/components/pdp/ProductAccordions";
import { ProductConfigurator } from "@/components/pdp/ProductConfigurator";
import { ProductGallery, type GallerySlide } from "@/components/pdp/ProductGallery";
import { ProductInfo, ScentProfile } from "@/components/pdp/ProductInfo";
import { SimpleConfigurator } from "@/components/pdp/SimpleConfigurator";
import { TrustRow } from "@/components/pdp/TrustRow";
import { Container } from "@/components/ui/Container";
import { getProductImage } from "@/content/assets";
import { faq } from "@/content/faq";
import { pdp } from "@/content/pdp";
import { getSticks, isStick } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { commerce } from "@/lib/commerce";
import type { FaqItem, Product, StickProduct } from "@/lib/types";

/**
 * /products/[slug] (brief §6 "Productpagina", docs/PLAN.md §9).
 *
 * Next.js 16.4 with Cache Components: every listed slug is prerendered
 * (generateStaticParams), and `ensureStatic = 'navigation'` makes the whole
 * route static, so an unknown slug waits for the full render and notFound()
 * answers the first request with a 404. `params` is read inside <Suspense>
 * (ProductView), so the route's shell stays URL-independent.
 *
 * Unknown slugs: the layout is server-rendered, the not-found UI inside the
 * boundary only after hydration (Next.js 16.4 with Cache Components renders
 * it on the client; reading `params` before the boundary instead gives an
 * empty error document, measured with `next build`). So the skeleton
 * fallback says nothing about loading, the <title> says "Product not found"
 * and visitors without JavaScript get a short notice instead of the skeleton.
 *
 * Order (D50): gallery · title block (family, name, tagline, price,
 * description) · configurator (scent, sets, mix & match, purchase type, Add to
 * cart) · delivery estimate · trust row · notes and intensity (sticks) ·
 * accordions · cross-sell · reviews (one quiet row while there are none; none
 * on the gift card) · FAQ (questions per product kind). Phones: one column,
 * the gallery edge to edge. md+: two columns, gallery left (half; about 55%
 * from lg), buy box right; whichever column is shorter stays in view while
 * the other scrolls (sticky).
 *
 * app/products/layout.tsx (PdpStateProvider) keeps the configurator choices
 * when the visitor switches scents.
 */

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const products = await commerce.getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await commerce.getProduct(slug);
  if (!product) return { title: pdp.notFound.title };
  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<PdpSkeleton />}>
      <ProductView params={params} />
    </Suspense>
  );
}

async function ProductView({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const product = await commerce.getProduct(slug);
  if (!product) notFound();
  const products = await commerce.getProducts();
  return <ProductDetail product={product} products={products} />;
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/** md+: a column shorter than its neighbour stays in view under the sticky header. */
const stickyClasses = "md:sticky md:top-[calc(var(--header-height)+1.5rem)] md:self-start";

/** Phones: one column. md (tablets): two equal columns. lg+: gallery about 55%. */
const gridClasses =
  "grid gap-y-8 md:grid-cols-2 md:gap-x-8 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-x-14 xl:gap-x-20";

/** The FAQ of a product kind: pdp.faq.idsFor, or the `onProduct` questions for scent sticks. */
function faqFor(product: Product): FaqItem[] {
  const ids = pdp.faq.idsFor[product.kind];
  if (!ids) return faqItemsFor("product");
  return ids.map((id) => faq.find((item) => item.id === id)).filter((item): item is FaqItem => item !== undefined);
}

function ProductDetail({ product, products }: { product: Product; products: Product[] }) {
  const sticks = getSticks(products);

  return (
    <>
      <Container className="pt-4 pb-4 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20">
        <Breadcrumb product={product} />
        <div className={cn("mt-4 md:mt-6", gridClasses)}>
          <div className={cn("-mx-5 md:mx-0", stickyClasses)}>
            <ProductGallery slides={getGallerySlides(product, sticks)} />
          </div>

          <div className={stickyClasses}>
            <ProductInfo product={product} sticks={sticks} />
            <BuyBox product={product} sticks={sticks} />
            {isStick(product) ? <ScentProfile product={product} className="mt-10 md:mt-12" /> : null}
            <ProductAccordions product={product} className="mt-10 md:mt-12" />
          </div>
        </div>
      </Container>

      <CrossSell product={product} products={products} divider="lg" />
      {/* A gift card is not reviewed: no reviews row on its page. */}
      {product.kind === "gift-card" ? null : (
        <ReviewsSection
          productSlug={product.slug}
          eyebrow={pdp.reviews.heading}
          emptyHeading={pdp.reviews.empty.heading}
          emptyBody={pdp.reviews.empty.body}
          variant="inline"
          divider
        />
      )}
      <FaqSection
        id="questions"
        items={faqFor(product)}
        heading={pdp.faq.heading}
        link={pdp.faq.allLink}
        eyebrowRule="neutral"
        divider
      />
    </>
  );
}

/**
 * Configurator with the delivery estimate and the trust row under its Add to
 * cart button. The e-gift card gets no delivery estimate (its configurator
 * already says "Delivered by email. No shipping." under the amounts) and a
 * trust row without shipping and guarantee.
 */
function BuyBox({ product, sticks }: { product: Product; sticks: StickProduct[] }) {
  if (isStick(product)) {
    return (
      <ProductConfigurator product={product} sticks={sticks} className="mt-8 border-t border-line pt-8">
        <DeliveryEstimate />
        <TrustRow className="pt-1" />
      </ProductConfigurator>
    );
  }

  const digital = product.kind === "gift-card";
  return (
    <SimpleConfigurator product={product} className="mt-8 border-t border-line pt-8">
      {digital ? null : <DeliveryEstimate />}
      <TrustRow digital={digital} className="pt-1" />
    </SimpleConfigurator>
  );
}

function Breadcrumb({ product, className }: { product: Product; className?: string }) {
  // 20 px of text, a 44 px target: min-h-11 and side padding, cancelled by negative margins, so the layout stays.
  const link = "-mx-1.5 -my-3 inline-flex min-h-11 items-center px-1.5 underline-offset-4 hover:text-ink hover:underline";
  return (
    <nav aria-label={pdp.breadcrumb.label} className={className}>
      <ol role="list" className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] leading-5 text-ink-soft">
        <li>
          <Link href="/" className={link}>
            {pdp.breadcrumb.home}
          </Link>
        </li>
        <li aria-hidden="true" className="text-ink-soft/60">
          /
        </li>
        <li>
          <Link href="/collections/all" className={link}>
            {pdp.breadcrumb.shop}
          </Link>
        </li>
        <li aria-hidden="true" className="text-ink-soft/60">
          /
        </li>
        <li>
          <span aria-current="page" className="text-ink">
            {product.name}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery                                                             */
/* ------------------------------------------------------------------ */

const SLIDE_SIZES = "(min-width: 1280px) 620px, (min-width: 1024px) 50vw, (min-width: 768px) 576px, 100vw";

/**
 * Packshot (photo or SVG render), in hand (photo slot), notes card (sticks
 * only) and lifestyle (photo slot). The e-gift card is digital: only its
 * render (a hand or a lifestyle shot of an email would never be shot, and the
 * gallery drops its thumbnails and dots for a single slide).
 *
 * Thumbnails carry no text (their button is named "Show image 2 of 4"): the
 * packshot render without its printed text, a text-free notes card, and for a
 * photo slot without a photo a tile with a hand or camera icon (a "PHOTO: ..."
 * label cannot be read at thumbnail size).
 */
function getGallerySlides(product: Product, sticks: readonly StickProduct[]): GallerySlide[] {
  const discoveryScents = sticks.length >= 6 ? sticks : undefined;
  const copy = pdp.gallery.slides;

  const packshot: GallerySlide = {
    id: "packshot",
    label: copy.packshot(product.name),
    content: (
      <ProductMedia product={product} aspect="fill" priority sizes={SLIDE_SIZES} discoveryScents={discoveryScents} />
    ),
    thumb: (
      <ProductMedia product={product} aspect="fill" decorative textless sizes="80px" discoveryScents={discoveryScents} />
    ),
  };
  if (product.kind === "gift-card") return [packshot];

  const slides: GallerySlide[] = [
    packshot,
    {
      id: "in-hand",
      label: copy.inHand(product.name),
      content: <ProductMedia product={product} variant="in-hand" aspect="fill" sizes={SLIDE_SIZES} />,
      thumb: <SlotThumb product={product} variant="in-hand" />,
    },
  ];

  if (isStick(product)) {
    slides.push({
      id: "notes",
      label: copy.notes(product.name),
      content: <NotesCard product={product} controlsInset />,
      thumb: <NotesThumb product={product} />,
    });
  }

  slides.push({
    id: "lifestyle",
    label: copy.lifestyle(product.name),
    content: <ProductMedia product={product} variant="lifestyle" aspect="fill" sizes={SLIDE_SIZES} />,
    thumb: <SlotThumb product={product} variant="lifestyle" />,
  });

  return slides;
}

/**
 * Thumbnail of a photo slot: the photo once supplied, otherwise a sand tile
 * with an icon for the shot (a hand for the scale shot, a camera for
 * lifestyle), at full strength, so it reads as "a photo goes here", not as a
 * broken image.
 */
function SlotThumb({ product, variant }: { product: Product; variant: Exclude<ProductMediaVariant, "packshot"> }) {
  const asset = getProductImage(product.slug, variant === "in-hand" ? "inHand" : "lifestyle");
  if (asset?.src) {
    return <ProductMedia product={product} variant={variant} aspect="fill" decorative sizes="80px" />;
  }
  const Icon = variant === "in-hand" ? Hand : Camera;
  return (
    <span
      className="absolute inset-0 flex items-center justify-center text-ink-soft"
      style={{ backgroundImage: SLOT_TONES.sand.background }}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-fog/80 ring-1 ring-ink/10">
        <Icon className="size-[18px]" strokeWidth={1.6} />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton (client navigations before the page arrives; unknown slugs) */
/* ------------------------------------------------------------------ */

/**
 * The Suspense fallback. Listed products are prerendered in full, so it shows
 * only during a client navigation that is faster than its prefetch, and for
 * an unknown slug until the client renders the not-found UI. It is decorative
 * (no "loading" text: for an unknown slug it would never stop). Without
 * JavaScript the skeleton is hidden and a short not-found notice shows.
 */
function PdpSkeleton() {
  const bar = "rounded-full bg-ink/[0.06]";
  return (
    <Container className="pt-4 pb-16 md:pt-6 md:pb-24 lg:pt-8 lg:pb-28">
      <noscript>
        <style>{"[data-pdp-skeleton]{display:none}"}</style>
        <div className="py-16 md:py-24">
          <h1 className="text-[2.5rem] leading-[1.05]">{pdp.notFound.title}</h1>
          <p className="mt-4 text-base text-ink-soft">{pdp.notFound.body}</p>
          <p className="mt-6">
            <a href={pdp.notFound.link.href} className="font-semibold text-ink underline underline-offset-4">
              {pdp.notFound.link.label}
            </a>
          </p>
        </div>
      </noscript>
      <div data-pdp-skeleton="" aria-hidden="true" className={cn("mt-9 md:mt-11", gridClasses)}>
        <div className="-mx-5 md:mx-0">
          <div className="aspect-[4/5] w-full md:rounded-card" style={{ backgroundImage: SLOT_TONES.sand.background }} />
        </div>
        <div className="flex flex-col gap-4">
          <div className={cn(bar, "h-3 w-24")} />
          <div className={cn(bar, "h-12 w-3/4")} />
          <div className={cn(bar, "h-5 w-2/3")} />
          <div className={cn(bar, "mt-2 h-6 w-20")} />
          <div className={cn(bar, "mt-4 h-24 w-full rounded-card")} />
        </div>
      </div>
    </Container>
  );
}
