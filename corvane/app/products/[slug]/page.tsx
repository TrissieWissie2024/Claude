import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { VaneIcon } from "@/components/brand/VaneIcon";
import { FaqSection, faqItemsFor } from "@/components/home/FaqSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { NotesCard } from "@/components/media/NotesCard";
import { SLOT_TONES } from "@/components/media/PhotoSlot";
import { ProductMedia, type ProductMediaVariant } from "@/components/media/ProductMedia";
import { CrossSell } from "@/components/pdp/CrossSell";
import { DeliveryEstimate } from "@/components/pdp/DeliveryEstimate";
import { ProductAccordions } from "@/components/pdp/ProductAccordions";
import { ProductConfigurator } from "@/components/pdp/ProductConfigurator";
import { ProductGallery, type GallerySlide } from "@/components/pdp/ProductGallery";
import { ProductInfo } from "@/components/pdp/ProductInfo";
import { SimpleConfigurator } from "@/components/pdp/SimpleConfigurator";
import { TrustRow } from "@/components/pdp/TrustRow";
import { Container } from "@/components/ui/Container";
import { getProductImage } from "@/content/assets";
import { pdp } from "@/content/pdp";
import { getSticks, isStick } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { commerce } from "@/lib/commerce";
import type { Product, StickProduct } from "@/lib/types";

/**
 * /products/[slug] (brief §6 "Productpagina", docs/PLAN.md §9).
 *
 * Next.js 16.4 with Cache Components: every listed slug is prerendered
 * (generateStaticParams), and `ensureStatic = 'navigation'` makes the whole
 * route static, so an unknown slug waits for the full render and notFound()
 * answers the first request with a 404. `params` is read inside <Suspense>
 * (ProductView), so the route's shell stays URL-independent.
 *
 * Order: gallery · title block (family, name, tagline, price, description,
 * notes, intensity) · configurator (scent, sets, mix & match, purchase type,
 * Add to cart) · delivery estimate · trust row · accordions · cross-sell ·
 * reviews · FAQ. Phones: one column, the gallery edge to edge. Tablets: one
 * centred column. lg+: gallery left (about 55%), buy box right; whichever
 * column is shorter stays in view while the other scrolls (sticky).
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
  if (!product) return {};
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

/** Both columns: edge to edge (gallery) or full width on phones, one centred column on tablets. */
const columnClasses = "md:mx-auto md:w-full md:max-w-[36rem] lg:mx-0 lg:max-w-none";

/** lg+: a column shorter than its neighbour stays in view under the sticky header. */
const stickyClasses = "lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start";

const gridClasses =
  "grid gap-y-8 md:gap-y-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-x-14 xl:gap-x-20";

function ProductDetail({ product, products }: { product: Product; products: Product[] }) {
  const sticks = getSticks(products);

  return (
    <>
      <Container className="pt-4 pb-4 md:pt-6 md:pb-8 lg:pt-8 lg:pb-20">
        <Breadcrumb product={product} className={columnClasses} />
        <div className={cn("mt-4 md:mt-6", gridClasses)}>
          <div className={cn("-mx-5", columnClasses, stickyClasses)}>
            <ProductGallery slides={getGallerySlides(product, sticks)} />
          </div>

          <div className={cn(columnClasses, stickyClasses)}>
            <ProductInfo product={product} sticks={sticks} />
            <BuyBox product={product} sticks={sticks} />
            <ProductAccordions product={product} className="mt-10 md:mt-12" />
          </div>
        </div>
      </Container>

      <CrossSell product={product} products={products} divider="lg" />
      <ReviewsSection productSlug={product.slug} eyebrow={pdp.reviews.heading} divider />
      <FaqSection
        id="questions"
        items={faqItemsFor("product")}
        heading={pdp.faq.heading}
        link={pdp.faq.allLink}
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
  const link = "underline-offset-4 hover:text-ink hover:underline";
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
 * only) and lifestyle (photo slot). Thumbnails reuse the render and the notes
 * card; a photo slot without a photo gets a quiet tile with the vane, since a
 * "PHOTO: ..." label cannot be read at thumbnail size.
 */
function getGallerySlides(product: Product, sticks: readonly StickProduct[]): GallerySlide[] {
  const discoveryScents = sticks.length >= 6 ? sticks : undefined;
  const copy = pdp.gallery.slides;

  const slides: GallerySlide[] = [
    {
      id: "packshot",
      label: copy.packshot(product.name),
      content: (
        <ProductMedia product={product} aspect="fill" priority sizes={SLIDE_SIZES} discoveryScents={discoveryScents} />
      ),
      thumb: <ProductMedia product={product} aspect="fill" decorative sizes="80px" discoveryScents={discoveryScents} />,
    },
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
      content: <NotesCard product={product} />,
      thumb: <NotesCard product={product} />,
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

/** Thumbnail of a photo slot: the photo once supplied, otherwise a quiet sand tile with the vane. */
function SlotThumb({ product, variant }: { product: Product; variant: Exclude<ProductMediaVariant, "packshot"> }) {
  const asset = getProductImage(product.slug, variant === "in-hand" ? "inHand" : "lifestyle");
  if (asset?.src) {
    return <ProductMedia product={product} variant={variant} aspect="fill" decorative sizes="80px" />;
  }
  return (
    <span
      className="absolute inset-0 flex items-center justify-center text-ink-soft"
      style={{ backgroundImage: SLOT_TONES.sand.background }}
    >
      <VaneIcon className="size-5 opacity-50" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton (unknown slugs, before the 404)                            */
/* ------------------------------------------------------------------ */

function PdpSkeleton() {
  const bar = "rounded-full bg-ink/[0.06]";
  return (
    <Container className="pt-4 pb-16 md:pt-6 md:pb-24 lg:pt-8 lg:pb-28" aria-busy="true">
      <p className="sr-only">{pdp.loading}</p>
      <div aria-hidden="true" className={cn("mt-9 md:mt-11", gridClasses)}>
        <div className={cn("-mx-5", columnClasses)}>
          <div className="aspect-[4/5] w-full md:rounded-card" style={{ backgroundImage: SLOT_TONES.sand.background }} />
        </div>
        <div className={cn("flex flex-col gap-4", columnClasses)}>
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
