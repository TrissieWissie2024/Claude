# Plan

Fase 2 van de brief. Dit plan is het contract voor de bouw: sitemap, mappen, componenten, datamodel en de rekenregels. Wie iets bouwt, houdt zich aan de namen en typen hieronder. Afwijkingen gaan eerst in dit document en in `docs/DECISIONS.md`.

## 1. Sitemap

| Route | Pagina | Bijzonderheden |
| --- | --- | --- |
| `/` | Homepage | Secties in de volgorde van §4 hieronder |
| `/collections/all` | Collectie | Filter op geurfamilie, sorteren (featured, prijs oplopend en aflopend, nieuwste), via `?family=&sort=` |
| `/products/[slug]` | Productpagina | Zes geuren, `discovery-set`, `travel-pouch`, `e-gift-card`. Statisch gegenereerd |
| `/about` | Over CORVANE | Merkverhaal (fictief) |
| `/faq` | FAQ | Alle vragen uit `content/faq.ts`, per categorie |
| `/contact` | Contact | Formulier als stub (`POST /api/contact`) |
| `/shipping-returns` | Shipping & Returns | Tarieven uit `content/shipping.ts`, 14 dagen herroepingsrecht, 30 dagen garantie |
| `/privacy-policy` | Privacy Policy | Juridisch: banner `TODO: laten controleren` |
| `/terms-and-conditions` | Terms & Conditions | Juridisch: banner |
| `/cookie-policy` | Cookie Policy | Juridisch: banner |
| `/legal-notice` | Legal notice | Juridisch: banner, KvK, btw en adres als placeholder |
| `/account` | Account | Stub |
| `/checkout` | Checkout | Stub: besteloverzicht, kortingscode, land, melding "Demo checkout: no payment is taken" |
| 404 | `app/not-found.tsx` | Eigen copy, links naar shop en FAQ |
| `/api/subscribe` | Route handler | Stub voor popup en nieuwsbrief, valideert e-mail |
| `/api/contact` | Route handler | Stub voor contactformulier |
| `/api/checkout` | Route handler | Roept `commerce.createCheckout()` aan, geeft een URL terug |
| `/sitemap.xml`, `/robots.txt` | `app/sitemap.ts`, `app/robots.ts` | |
| OG-beelden | `app/opengraph-image.tsx`, `app/products/[slug]/opengraph-image.tsx` | Met `next/og` |
| Favicon | `app/icon.svg`, `app/apple-icon.png` | Windvaan-icoon |

Navigatie desktop: Shop (`/collections/all`), Discovery Set (`/products/discovery-set`), Gift Cards (`/products/e-gift-card`), About, FAQ. Mobiel: hamburger links opent een menu (Radix Dialog als drawer van links) met dezelfde links en de Help-links.

## 2. Mappen en bestanden

```
corvane/
  app/                       routes (zie sitemap), layout.tsx, globals.css
  components/
    brand/                   Wordmark, VaneIcon
    media/                   StickRender, GroupRender, DiscoverySetRender, PouchRender,
                             GiftCardRender, NotesCard, PhotoSlot, VideoSlot, ProductMedia
    ui/                      Button, Pill, Badge, Container, SectionHeading, Price,
                             Accordion, Sheet (drawer), Modal, Stars, Flag, VisuallyHidden
    layout/                  PromoBar, Header, MobileNav, Footer, NewsletterForm,
                             PaymentIcons, SkipLink
    cart/                    CartProvider, CartDrawer, CartLine, ShippingProgress,
                             CartUpsell, CartSummary, QuantityStepper
    home/                    Hero, DeliveryBar, ProductGridSection, HowItWorks,
                             SolidVsSpray, ReviewsSection, VideoRow, GuaranteeBlock,
                             FaqSection, StoryTeaser
    product/                 ProductCard, ProductGrid, SortSelect, QuickAdd
    pdp/                     ProductGallery, ProductConfigurator, ScentSwatches,
                             BundlePicker, PurchaseTypePicker, StickyAddToCart,
                             NotesChips, IntensityMeters, DeliveryEstimate, TrustRow,
                             ProductAccordions, CrossSell
    finder/                  ScentFinder
    email/                   EmailCapture (pill, modal, kaarten)
    consent/                 ConsentBanner, AnalyticsLoader
    seo/                     JsonLd
  content/                   alle tekst en data (zie §5)
  lib/
    types.ts                 alle gedeelde typen
    money.ts                 formatMoney (centen naar "€24.95")
    pricing.ts               pure prijslogica (+ pricing.test.ts)
    delivery.ts              verzenddag en leverschatting (+ delivery.test.ts)
    campaign.ts              actieve campagne en aftellen (+ campaign.test.ts)
    claims.ts                alleen geverifieerde claims doorgeven
    reviews.ts               reviews en ratingsamenvatting (null zonder reviews)
    catalog.ts               hulpfuncties op de catalogus (geuren, kaartnoten)
    analytics.ts             dataLayer-events en consent
    storage.ts               localStorage in try/catch
    hooks/useNow.ts          huidige tijd pas na mount (geen hydration-verschil)
    commerce/                types.ts (interface), local.ts, shopify.ts (stub), index.ts
    cn.ts                    classnames
  tests/e2e/                 Playwright-smoketests
  docs/                      Nederlandse documentatie
  public/images/             echte foto's later (zie ASSETS.md); nu leeg
  reference/                 screenshots van de referentie (in .gitignore)
```

## 3. Ontwerpsysteem

**Kleuren** (CSS-variabelen in `:root` en als Tailwind-kleuren via `@theme`):

| Token | Hex | Rol |
| --- | --- | --- |
| `ink` | #101418 | tekst |
| `deep` | #0F2733 | donkere secties, hero |
| `sand` | #EEE6D8 | lichte secties |
| `fog` | #F7F5F1 | paginaachtergrond |
| `signal` | #E2562B | CTA's en accenten, spaarzaam |
| `kelp` | #2E4A3F | secundair |
| `ink-soft` | #4A5259 | afgeleid: secundaire tekst op fog en sand |
| `mist` | #B9C4C9 | afgeleid: secundaire tekst op deep |

**Contrast (WCAG AA, berekend):**

| Combinatie | Ratio | Gebruik |
| --- | --- | --- |
| ink op fog | 17,0 | alle tekst |
| ink op sand | 14,9 | alle tekst |
| ink op signal | 4,9 | knoppen en badges (AA voor normale tekst) |
| fog op deep | 14,2 | tekst in hero en donkere secties |
| sand op deep | 12,5 | tekst op donker |
| mist op deep | 8,7 | secundaire tekst op donker |
| ink-soft op fog | 7,3 | secundaire tekst |
| ink-soft op sand | 6,4 | secundaire tekst |
| kelp op fog | 8,9 | tekst en randen in kelp |
| fog op kelp | 8,9 | tekst op kelp |
| wit op signal | 3,8 | **verboden**, haalt geen AA |
| signal op fog | 3,4 | **verboden als tekst**, alleen decoratie of rand |
| signal op sand | 3,0 | **verboden als tekst** |
| signal op deep | 4,1 | alleen voor grote tekst (24 px of meer) en UI-randen |

**Typografie:** Fraunces 600 voor koppen (`font-serif`), Inter 400–600 voor body en UI (`font-sans`), labels in Inter uppercase met `tracking-[0.14em]`. Beide via `next/font/google`.

**Vorm:** cards met 16 px radius (`rounded-card`), pills volledig rond, subtiele schaduw (`shadow-soft`), veel witruimte (secties 64–96 px verticaal op mobiel, 96–128 px op desktop). Geen goud of bruin in de huisstijl. De ringkleuren van de geuren zijn productkleuren en worden alleen bij het product gebruikt.

**Focus en beweging:** zichtbare focusring (2 px `ink` met offset op licht, `fog` op donker). Alle animaties achter `motion-safe:`; bij `prefers-reduced-motion` geen flip, slide of rotatie.

## 4. Homepage

| # | Sectie | Component | Bron |
| --- | --- | --- | --- |
| 1 | Promobalk | `layout/PromoBar` | `offers.campaign`, `site.usps` |
| 2 | Header (sticky) | `layout/Header` | `site.nav` |
| 3 | Hero | `home/Hero` | `home.hero`, `GroupRender`, USP-pills uit specificaties |
| 4 | Leverbalk | `home/DeliveryBar` | `lib/delivery`, `content/shipping` |
| 5 | Productgrid met sorteren | `home/ProductGridSection` | zes geuren en Discovery Set |
| 6 | How it works | `home/HowItWorks` | `home.howItWorks` |
| 7 | Solid vs spray | `home/SolidVsSpray` | `home.comparison` |
| 8 | Scent finder | `finder/ScentFinder` | `content/finder.ts` |
| 9 | Reviews en video-rij | `home/ReviewsSection`, `home/VideoRow` | `content/reviews.ts`, `content/assets.ts` |
| 10 | Garantie | `home/GuaranteeBlock` | `offers.guaranteeDays` |
| 11 | FAQ | `home/FaqSection` | `content/faq.ts` (selectie) |
| 12 | Merkverhaal | `home/StoryTeaser` | `home.story` |
| 13 | Footer | `layout/Footer` | `site.footer` |
| | Zwevende pill en popup | `email/EmailCapture` | `site.emailCapture`, `offers.welcomeCode` |

De volgorde onder het productgrid is een eigen keuze (zie `docs/REFERENCE.md`).

## 5. Content (`content/`)

| Bestand | Inhoud |
| --- | --- |
| `site.ts` | merk, tagline, URL, nav, footerkolommen, USP's, betaalmethoden, socials, bedrijfsgegevens (placeholders), analytics-config, e-mailpopup-config, specificaties |
| `home.ts` | alle copy van de homepage-secties |
| `products.ts` | zes geuren en de drie overige producten |
| `offers.ts` | prijstabel sticks, abonnement, gratis pouch, kortingscodes, campagne, garantie |
| `shipping.ts` | landen, tarieven, gratis-grens, cut-off, tijdzone, feestdagen, levertijden |
| `reviews.ts` | lege array met het `Review`-type |
| `faq.ts` | vragen en antwoorden per categorie |
| `claims.ts` | prestatieclaims, allemaal `verified: false` |
| `finder.ts` | quizvragen en scoretabel |
| `assets.ts` | manifest voor echte foto's en video's (nu alles `null`) |
| `pages.ts` | copy voor About, Contact, Account, Checkout, 404 |
| `legal.ts` | juridische teksten, per pagina in secties |

## 6. Datamodel

Alle bedragen zijn **hele centen** (`number`). Alleen `lib/money.ts` maakt er tekst van (`€24.95`, Engelse notatie omdat de copy Engels is).

```ts
type ScentFamily = 'Fresh' | 'Woody' | 'Dark' | 'Green' | 'Citrus' | 'Aromatic'
type BadgeId = 'new' | 'best-seller' | 'most-popular'   // handmatige flags
type CountryCode = 'NL' | 'BE'

interface ProductBase {
  slug: string
  name: string
  kind: 'stick' | 'discovery-set' | 'pouch' | 'gift-card'
  tagline: string            // één regel voor cards
  description: string        // korte omschrijving op de productpagina
  badges: BadgeId[]          // bij launch alleen ['new']
  featuredRank: number       // sortering 'featured'
  releasedAt: string         // ISO-datum, sortering 'newest'
  previousPrice?: { amount: number; lowestPriceLast30Days: true }  // regel 4, nu nergens gezet
  seo: { title: string; description: string }
  externalIds?: { shopifyHandle?: string; shopifyVariantIds?: Record<string, string> }
}
interface StickProduct extends ProductBase {
  kind: 'stick'
  family: ScentFamily
  notes: { top: string[]; heart: string[]; base: string[] }
  ringColor: string          // hex uit de brief
  intensity: { freshWarm: 1|2|3|4|5; projection: 1|2|3|4|5 }  // indicatief
  mood: string               // korte sfeerregel
}
interface DiscoverySetProduct extends ProductBase { kind: 'discovery-set'; contents: string }
interface PouchProduct extends ProductBase { kind: 'pouch' }
interface GiftCardProduct extends ProductBase { kind: 'gift-card' }
// Alle prijzen staan in content/offers.ts (brief §4): stickPricing, prices.discoverySet,
// prices.travelPouch en giftCardDenominations. Producten bevatten geen prijzen.

type PurchasePlan = { type: 'one-time' } | { type: 'subscription'; intervalMonths: 1 | 2 | 3 }

type CartLine =
  | { id: string; kind: 'stick'; scents: string[]; plan: PurchasePlan; quantity: number }   // scents: 1–3 slugs, één set
  | { id: string; kind: 'discovery-set'; slug: 'discovery-set'; quantity: number }
  | { id: string; kind: 'pouch'; slug: 'travel-pouch'; quantity: number }
  | { id: string; kind: 'gift-card'; slug: 'e-gift-card'; amount: number; quantity: number }
```

Een stickregel bevat de geuren van één keuze op de productpagina (1, 2 of 3 sticks, mix & match). Dezelfde set met hetzelfde plan wordt samengevoegd door de hoeveelheid te verhogen. De volgorde van de geuren telt niet voor het samenvoegen.

De volledige typen staan in `lib/types.ts`.

## 7. Rekenregels (`lib/pricing.ts`)

1. **Groeperen per plan.** Sticks worden geteld per plan: eenmalig, abonnement elke maand, elke 2 maanden, elke 3 maanden. Elk plan is een eigen groep, omdat elk abonnementsritme een eigen zending is (D10).
2. **Bundelprijs per groep.** Per 3 sticks €59,95; een rest van 2 €44,95; een rest van 1 €24,95. Dus 4 sticks = €84,90 en 7 sticks = €144,85.
3. **Abonnement.** −15% op de bundelprijs van de groep, afgerond op hele centen (half naar boven).
4. **Toewijzen aan regels.** De groepsprijs wordt naar rato van het aantal sticks over de regels verdeeld; het afrondingsverschil gaat naar de laatste regel. Zo klopt de som van de regels altijd met de groep.
5. **Gratis Travel Pouch.** Bij 3 of meer sticks in de hele bestelling is één Travel Pouch gratis. Zit er al een pouch in de cart, dan wordt één pouch €0. Anders toont de cart een cadeauregel. Eén per bestelling (D11).
6. **Kortingscode.** Eén code per bestelling. Procentuele korting op het subtotaal na bundel- en abonnementsprijs, zonder cadeaukaarten. Codes met een einddatum (de campagnecode) zijn daarna ongeldig.
7. **Verzending.** Per land uit `content/shipping.ts`. Gratis als het verzendbare subtotaal na korting minstens €50 is. Een bestelling met alleen cadeaukaarten heeft geen verzending.
8. **Besparing.** Bundelbesparing (ten opzichte van €24,95 per stick) + abonnementskorting + kortingscode + gratis pouch. Verzending telt niet mee.
9. **Prijsweergave.** Nooit een doorgestreepte prijs, behalve bij een product met een echte `previousPrice` (regel 4). Besparing staat als tekst ("Save €14.90").

`priceCart({ lines, discountCode, country, now })` geeft een `PricingSummary` terug met regels, groepen, subtotaal, verzending, totaal en besparing. De PDP-tegels gebruiken `getBundleTileQuote(size, plan)`.

## 8. Tijd en verzenddag (`lib/delivery.ts`, `lib/campaign.ts`)

- Alle tijdlogica neemt `now: Date` als argument en rekent in `Europe/Amsterdam`.
- Verzenddag: vandaag als het een werkdag is (ma–vr, geen feestdag uit config) en vóór 15:00; anders de eerstvolgende werkdag.
- Levering: verzenddag plus de levertijd van het land in werkdagen (NL 1, BE 1–2).
- Campagne: actief als `active` true is en `now` vóór `endsAt` ligt. De timer telt af naar die vaste datum en reset nooit.
- Componenten lezen de tijd alleen na mount via `useNow()`. Tot die tijd tonen ze tekst die altijd klopt (de USP-balk, een algemene leverbelofte) in dezelfde hoogte, zodat er geen layout shift is.

## 9. Commerce en cart

- `lib/commerce/types.ts` definieert `CommerceProvider` met `getProducts()`, `getProduct(slug)` en `createCheckout(input)`.
- `lib/commerce/local.ts` leest uit `content/` en geeft `/checkout` als checkout-URL.
- `lib/commerce/shopify.ts` is een gedocumenteerde stub voor de Storefront API.
- `lib/commerce/index.ts` kiest de provider via `COMMERCE_PROVIDER` (standaard `local`).
- `CartProvider` (React context) bewaart regels, kortingscode en land in localStorage (`corvane:cart:v1`, in try/catch). Zonder storage werkt de cart in het geheugen. De cart rekent met `priceCart`.

## 10. Toegankelijkheid, SEO, analytics

- Radix Dialog voor de cart drawer, het mobiele menu en de popup (focus-trap, Esc, focus terug). Radix Accordion voor alle accordions.
- Skiplink, `lang="en"`, één `h1` per pagina, labels bij alle velden, `aria-live` voor cart-updates.
- Metadata per pagina met titeltemplate `%s | CORVANE`, OG-beelden, JSON-LD `Product` met `offers` en zonder `aggregateRating` zolang er geen reviews zijn, `Organization` op de homepage.
- `lib/analytics.ts`: `track('view_item' | 'add_to_cart' | 'begin_checkout' | 'sign_up', payload)` zet events in `window.dataLayer` (alleen in de browser). Scripts van derden laden pas na toestemming, en de consentbanner verschijnt alleen als `site.analytics.enabled` true is (standaard false).

## 11. Conventies voor de code

- TypeScript strict, geen `any`. Server components waar het kan; `'use client'` alleen voor interactie.
- Tekst die bezoekers zien komt uit `content/`. In componenten staan alleen aria-labels en korte UI-woorden.
- Copy in het Engels: kort, droog, zelfverzekerd. Geen uitroeptekens, geen emoji, geen hypewoorden (irresistible, magnetic, addictive, seductive, alluring). Geen prestatieclaims buiten `content/claims.ts`. Geen merknamen van andere parfums.
- Afbeeldingen: SVG-renders als componenten; echte foto's via `next/image` zodra `content/assets.ts` een pad heeft.
- Geen `Date.now()` of `new Date()` tijdens het renderen van componenten; gebruik `useNow()`.

## 12. Fasering

| Fase | Oplevering |
| --- | --- |
| 1 | `docs/REFERENCE.md` |
| 2 | dit plan |
| 3 | tokens, fonts, typen, content, prijslogica en tests, commerce, cart, UI-primitives, logo, favicon, renders |
| 4 | promobalk, header, mobiel menu, footer, cart drawer |
| 5 | homepage |
| 6 | collectie en productpagina's |
| 7 | e-mailpopup, scent finder, overige pagina's |
| 8 | SEO, analytics, toegankelijkheid, performance |
| 9 | Vitest en Playwright, screenshots op 390×844 en 1440×900 |
| 10 | README, TODO-LAUNCH, ASSETS, COMPLIANCE, eindcontrole |
