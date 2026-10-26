# Plan

Fase 2 van de brief. Dit plan is het contract voor de bouw: sitemap, mappen, componenten, datamodel en de rekenregels. Wie iets bouwt, houdt zich aan de namen en typen hieronder. Afwijkingen gaan eerst in dit document en in `docs/DECISIONS.md`.

## 1. Sitemap

| Route | Pagina | Bijzonderheden |
| --- | --- | --- |
| `/` | Homepage | Secties in de volgorde van §4 hieronder |
| `/collections/all` | Collectie | Filter op geurfamilie, sorteren (featured, prijs oplopend en aflopend, nieuwste), via `?family=&sort=` |
| `/products/[slug]` | Productpagina | Zes geuren, `discovery-set`, `travel-pouch`, `e-gift-card`. Statisch gegenereerd; `app/products/layout.tsx` houdt de keuzes vast bij het wisselen van geur |
| `/about` | Over CORVANE | Merkverhaal (fictief) |
| `/faq` | FAQ | Alle vragen uit `content/faq.ts`, per categorie |
| `/contact` | Contact | Formulier als stub (`POST /api/contact`) |
| `/shipping-returns` | Shipping & Returns | Tarieven uit `content/shipping.ts`, 14 dagen herroepingsrecht, 30 dagen garantie. Juridisch: banner `TODO: laten controleren` |
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
| Favicon | `app/icon.svg`, `app/favicon.ico` (16, 32, 48 px), `app/apple-icon.png` | Windvaan-icoon |

Navigatie desktop: Shop (`/collections/all`), Discovery Set (`/products/discovery-set`), Gift Cards (`/products/e-gift-card`), About, FAQ. Mobiel: hamburger links opent een menu (Radix Dialog als drawer van links) met dezelfde links en de Help-links. Header: hamburger links (alleen mobiel), logo in het midden, account en cart met teller rechts; op desktop staat de nav horizontaal. Sticky.

## 2. Mappen en bestanden

```
corvane/
  app/                       routes (zie sitemap), layout.tsx, globals.css
  components/
    brand/                   Wordmark, VaneIcon (SVG-paden, D19 en D20)
    media/                   StickRender, GroupRender, DiscoverySetRender, PouchRender,
                             GiftCardRender, NotesCard, PhotoSlot, VideoSlot, ProductMedia
    ui/                      Button, Pill, Badge, Container, SectionHeading, Price,
                             Accordion, Sheet (drawer), Modal, Stars, Flag, VisuallyHidden,
                             MotionStyles (keyframes voor Accordion, Sheet en Modal)
    layout/                  PromoBar, Header, MobileNav, Footer, NewsletterForm,
                             PaymentIcons, SkipLink; hulpbestanden in promo/
                             (CampaignMessage, UspBar), header/ (DesktopNav,
                             CartButton) en footer/ (CookieSettingsButton)
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
    catalog/                 CatalogProvider (productdata voor client components)
    finder/                  ScentFinder, FinderQuiz, finderState, tones
    email/                   EmailCapture (pill, modal), RewardCards, EmailCaptureForm,
                             RewardCode, state (opslag en afkoelperiode)
    legal/                   LegalPage, LegalNotice ("TODO: laten controleren")
    contact/                 ContactForm (en veldhulpjes die de checkout ook gebruikt)
    checkout/                CheckoutView
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
    catalog.ts               pure hulpfuncties op een productlijst (sorteren, filteren, kaartnoten)
    analytics.ts             dataLayer-events en consent
    storage.ts               localStorage in try/catch
    hooks/useNow.ts          huidige tijd pas na mount (geen hydration-verschil)
    commerce/                types.ts (interface), local.ts, shopify.ts (stub), index.ts
    cn.ts                    classnames
  tests/e2e/                 Playwright-smoketests
  docs/                      Nederlandse documentatie
  public/brand/              woordmerk en windvaan als losse SVG-bestanden, in ink en in fog
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

**Vorm:** cards met 16 px radius (`rounded-card`), pills volledig rond, subtiele schaduw (`shadow-soft`), veel witruimte (secties 64–96 px verticaal op mobiel, 96–128 px op desktop; de homepage gebruikt 80, 112 en 128 px, D37). Geen goud of bruin in de huisstijl. De ringkleuren van de geuren zijn productkleuren en worden alleen bij het product gebruikt.

**Knoppen:** primair `bg-signal text-ink`; hover en pressed worden lichter (#E86A43, contrast 5,8 met ink), nooit donkerder, want ink op een donkerder oranje zakt onder AA. Tekst op ringkleuren kan niet: overlays op productbeelden staan op een vlak van fog of deep.

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
| 8 | Scent finder | `finder/ScentFinder` (quiz `finder/FinderQuiz`, op deep, D51) | `content/finder.ts`, `home.scentFinder` |
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
| `site.ts` | merk (naam, uitspraak, betekenis, tagline, verhaal: zie brief §3), URL, nav, footerkolommen, USP's, betaalmethoden, socials, bedrijfsgegevens (placeholders), analytics-config, e-mailpopup-config, specificaties, badgelabels |
| `home.ts` | alle copy van de homepage-secties |
| `products.ts` | zes geuren en de drie overige producten |
| `offers.ts` | alle prijzen (sticks, Discovery Set, pouch, cadeaukaarten), abonnement, gratis pouch, kortingscodes, campagne, garantie |
| `pdp.ts` | alle UI-copy van de productpagina |
| `cart.ts` | copy van cart drawer en checkout-stub |
| `shipping.ts` | landen, tarieven, gratis-grens, cut-off, tijdzone, feestdagen, levertijden |
| `reviews.ts` | lege array met het `Review`-type |
| `faq.ts` | vragen en antwoorden per categorie |
| `claims.ts` | prestatieclaims, allemaal `verified: false`; een geverifieerde claim verschijnt vanzelf in de accordion Details van de geuren en in het FAQ-antwoord dat ernaar linkt (D55) |
| `finder.ts` | quizvragen en scoretabel |
| `assets.ts` | manifest voor echte foto's en video's (nu alles `null`) |
| `pages.ts` | copy voor About, Contact, Account, Checkout, 404 |
| `collection.ts` | copy voor de collectiepagina (kop, intro, familiefilter, lege staat) en de productcards ("From €25", quick-add) |
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

Alle berekeningen gebruiken hele centen en gehele rekenkunde: `Math.round(cents * pct / 100)`, nooit `cents * 0.85`. Afronden gaat half naar boven.

1. **Groeperen per aankooptype.** Sticks worden geteld per aankooptype: eenmalig of abonnement, ongeacht het interval (D10). Zo staat het in de brief: "Groepering geldt per aankooptype".
2. **Bundelprijs per groep.** Per 3 sticks €59,95; een rest van 2 €44,95; een rest van 1 €24,95. Dus 4 sticks = €84,90 en 7 sticks = €144,85.
3. **Abonnement.** −15% per bundelprijs, per bundel afgerond: 3 → €50,96, 2 → €38,21, 1 → €21,21 (D12). De cart klopt daardoor altijd met de tegels op de productpagina. 7 sticks op abonnement = €123,13.
4. **Toewijzen aan regels.** De groepsprijs wordt over de regels verdeeld naar rato van hun eigen tegelprijs (`standaloneTotal`), naar beneden afgerond, met de rest op de laatste regel (D13). Omdat bundelen nooit duurder is, staat een regel nooit hoger dan op de productpagina beloofd.
5. **Gratis Travel Pouch.** Bij 3 of meer sticks in de hele bestelling (beide aankooptypes samen) is één Travel Pouch gratis, één per bestelling (D11). Zit er al een pouch in de cart, dan wordt één pouch €0. Anders toont de cart een cadeauregel. Tegels en cart zeggen "Free Travel Pouch (one per order)".
6. **Kortingscode.** Eén code per bestelling, hoofdletterongevoelig na `trim()`. Procentuele korting op alles behalve cadeaukaarten, na bundel-, abonnements- en pouchprijs: `Math.round(eligible * pct / 100)`. De campagnecode werkt alleen als `campaign.active` waar is en `now` binnen `startsAt`–`endsAt` valt. De korting staat als één regel in het overzicht.
7. **Verzending.** Per land uit `content/shipping.ts`. Gratis als de verzendbare producten (sticks, Discovery Set, pouch; geen cadeaukaarten) samen minstens €50 kosten, gemeten vóór de kortingscode (D14). Zo betekent "Free shipping from €50" precies wat er staat. Alleen cadeaukaarten: geen verzending.
8. **Besparing.** Bundelbesparing (ten opzichte van de prijs van 1 stick uit `offers.stickPricing[1]`) + abonnementskorting + gratis pouch + kortingscode. Verzending telt niet mee.
9. **Prijsweergave.** Nooit een doorgestreepte prijs, behalve bij een product met een echte `previousPrice` (regel 4; bij launch nergens). Besparing staat als tekst ("Save €14.90").
10. **Tegels.** `getBundleTileQuote(size, plan)` geeft totaal, prijs per stick (alleen ter informatie, half naar boven afgerond: €24,95 / €22,48 / €19,98), besparing zonder pouch (€0 / €4,95 / €14,90) en `isBestValue` (laagste prijs per stick, dus de 3-tegel). Tegels krijgen geen andere badges.

`priceCart({ lines, discountCode, country, now })` geeft een `PricingSummary` terug met regels, groepen, subtotaal, verzending, totaal en besparing.

**Vaste testwaarden.** Eenmalig 1–7 sticks: 2495, 4495, 5995, 8490, 10490, 11990, 14485. Abonnement 1, 2, 3, 4, 7, 8: 2121, 3821, 5096, 7217, 12313, 14013. Twee keer eenmalig plus één abonnement: 4495 + 2121.

## 8. Tijd, verzenddag en campagne (`lib/delivery.ts`, `lib/campaign.ts`)

- Alle tijdlogica neemt `now: Date` als argument en rekent in `Europe/Amsterdam`, ook rond de wisseling van zomer- naar wintertijd.
- **Verzenddag:** vandaag als het een werkdag is (ma–vr, geen Nederlandse feestdag) en vóór 15:00; anders de eerstvolgende werkdag.
- **Levering:** verzenddag plus de levertijd van het land in werkdagen (NL 1, BE 1–2), zonder feestdagen van dat land.
- **Geen afteltimer naar de cut-off.** De leverbalk en de leverschatting tonen vaste tekst ("Order before 15:00, ships today" of "Ships Monday"). Een timer die elke dag opnieuw begint, mag niet volgens regel 3.
- **Campagne:** `endsAt` is een vaste ISO-tekst met tijdzone in `content/offers.ts` (`2026-11-01T23:59:59+01:00`, zeven dagen na de builddatum, wintertijd). Hij wordt nooit berekend uit `Date.now()` of de buildtijd. De campagne is actief als `active` waar is en `now` tussen `startsAt` en `endsAt` ligt. De balk noemt alleen wat er echt eindigt: de code LAUNCH15. Vaste aanbiedingen (bundels, pouch, verzending) worden nooit als aflopend gepresenteerd.
- **Weergave:** `useNow(1000)` in de promobalk. Vóór mount en na `endsAt` staat in dezelfde hoogte de USP-balk, met alleen tekst die altijd klopt. Wordt `endsAt` bereikt terwijl de pagina open is, dan verdwijnt de balk vanzelf en wordt de code ongeldig. Cijfers in `tabular-nums`; de timer zelf zit niet in een live-regio. De knop "Pause countdown" zet de aftelling stil en toont dan de vaste eindtijd ("Ends 1 November, 23:59"); met `prefers-reduced-motion` staat die vaste eindtijd er meteen en is er geen knop (WCAG 2.2.2, D32).
- **USP-balk:** roteert drie regels. Met `prefers-reduced-motion` roteert hij ook, maar zonder fade, zodat alle drie de regels zichtbaar blijven. Rotatie pauzeert bij hover en focus en heeft een pauzeknop (WCAG 2.2.2).
- **Hoogte:** de balk is minstens 48 px onder `lg` (twee regels campagnetekst) en 40 px vanaf `lg`. Past de tekst niet (bijv. met eigen tekstafstand op 320 px), dan wordt de balk hoger in plaats van tekst af te knippen (WCAG 1.4.12).

## 9. Productpagina

**Volgorde:** galerij · titel, familie, korte omschrijving · geurkiezer · bundeltegels · mix & match (bij 2 of 3) · aankooptype · Add to cart · leverschatting · trustrij · noten als chips · intensiteitsmeters ("Indicative") · accordions · cross-sell · reviews · FAQ (D50: noten en meters staan onder de trustrij, zodat Add to cart hoger staat).

- **Galerij:** scroll-snap met swipe op mobiel, vorige/volgende-knoppen en thumbnails (knoppen) op desktop. Dia's: render, schaalbeeld in de hand (placeholder), notenkaart, lifestyle (placeholder).
- **Geurkiezer:** swatches in de ringkleur, met een rand van 1 px `ink-soft` (enkele ringkleuren halen anders geen 3:1 op fog), de naam als zichtbaar label en een geselecteerde staat die niet alleen op kleur leunt. Elke swatch is een link naar `/products/[slug]` (`scroll={false}`) met `aria-current`. De keuzes (tegel, aankooptype, interval, extra sticks) staan in `PdpStateProvider` in `app/products/layout.tsx` en blijven dus bewaard bij het wisselen van geur. Stick 1 is altijd de geur van de pagina.
- **Bundeltegels, aankooptype, interval, mix & match:** native radiogroepen. Standaard: 1 stick, eenmalig, interval 2 maanden (D45). Extra sticks staan standaard op de geur van de pagina. De besparing op een tegel is altijd gemeten tegen losse eenmalige sticks.
- **Abonnement:** "Delivered and billed every N months", met de prijs per levering. Opzeggen staat in de Terms; de koppeling met echte facturering volgt bij launch.
- **Per producttype:** stick = tegels + aankooptype. Discovery Set en Travel Pouch = aantal, alleen eenmalig. E-gift card = bedrag (€25, €50, €100), "Delivered by email", geen leverschatting; de trustrij toont alleen veilig betalen (geen verzending, en de garantie geldt niet voor cadeaukaarten, D28 en D48).
- **Sticky add-to-cart:** alleen onder `lg`, verschijnt zodra de hoofdknop boven de onderkant van de sticky header is verdwenen (IntersectionObserver, ook bij een sprong voorbij de knop), met `env(safe-area-inset-bottom)` (D46).
- **Lay-out:** vanaf `md` twee kolommen (gelijk op tablets), vanaf `lg` galerij links (ongeveer 55%) en de koopkolom rechts met de accordions onder de trustrij; de kortste kolom blijft in beeld (D44, D50).

## 10. Cart drawer, e-mailpopup en vaste elementen

**Cart drawer** (Radix Dialog, rechts): twee indicatoren boven elkaar: een balk in euro's naar gratis verzending (zelfde basis als regel 7) en een stap 0–3 sticks naar de gratis pouch. Daaronder de regels met geur(en), aankooptype, stepper en verwijderen; upsell (pouch als die nog niet gratis is, Discovery Set, "+1 stick" als er één stick mist tot de volgende bundel); subtotaal, "You save", "Taxes included", checkoutknop (vuurt `begin_checkout`), betaaliconen (onderaan de scrollende inhoud). Stickregels tonen hun eigen tegelprijs; groepering over regels staat als notitie onder het subtotaal (D34). Nette lege staat. De teller in de header telt artikelen (elke stick telt één).

**E-mailpopup** (`email/EmailCapture`):
1. De pill linksonder opent altijd de modal. Hij verschijnt pas als de bezoeker de pagina 240 px heeft gescrold of de modal op die pagina open is geweest, zodat het eerste beeld van een pagina vrij blijft; daarna blijft hij op die pagina staan. Niet op `/checkout` en niet op productpagina's onder `lg` (daar hoort de onderrand bij de sticky add-to-cart, D51).
2. Automatisch openen gebeurt na 8 seconden of bij exit-intent op desktop (`pointer: fine`, muis verlaat het venster aan de bovenkant). Alleen als `corvane:email-capture:last-shown` ontbreekt of ouder is dan 7 dagen, en nooit meer na aanmelden. Het tijdstip wordt opgeslagen bij automatisch openen, en ook als de bezoeker de popup zelf via de pill opent of de pill verbergt: wie de aanbieding zag of afsloeg, krijgt hem 7 dagen niet vanzelf (D55). Werkt localStorage niet, dan opent de popup nooit vanzelf.
3. Vóór het kiezen staat er al: "Every card reveals the same reward: 10% off your first order." Het percentage en de code komen uit `offers.welcomeCode`. De voorwaarden staan erbij: one code per order, excludes gift cards.
4. De kaarten zijn `<button>`s. Met reduced motion draaien ze niet om maar wisselen ze direct.
5. Bij het e-mailveld staat waarvoor je je aanmeldt (CORVANE e-mails over nieuwe geuren en aanbiedingen, afmelden kan altijd, link naar de Privacy Policy). Er is geen vinkje; als er ooit een komt, staat het standaard uit.
6. Na aanmelden (`POST /api/subscribe`, vuurt `sign_up`) staat de code in beeld, kopieerbaar, en kan hij in één klik op de cart worden toegepast. De code werkt echt in `priceCart`.
7. Dezelfde consenttekst staat bij de nieuwsbrief in de footer. Een aanmelding daar telt ook als aanmelding (`markSubscribed`): de popup opent daarna nooit meer vanzelf, de pill biedt de code aan en de bevestiging noemt de welkomstcode (D52).
8. Zolang `/api/subscribe` een stub is, zeggen beide formulieren dat er niets wordt bewaard of verstuurd (`demoNote`), en heet de knop in de popup "Show my code" (D52).

**Opbouw van elke pagina** (`app/layout.tsx`, D31): SkipLink · PromoBar (in de flow, scrolt weg) · Header (sticky) · `<main id="main">` · Footer · EmailCapture · CartDrawer. Pagina's renderen geen eigen `<main>`. Bij afdrukken vallen skiplink, promobalk, header, footer en pill weg.

**Stapelvolgorde** (laag naar hoog): sticky header 30 · sticky add-to-cart 40 · e-mailpill 45 · consentbanner 50 · drawers en modals 60 · skiplink 70 (alleen zichtbaar bij focus). Is de sticky add-to-cart zichtbaar of staat de consentbanner open (`data-consent-open="true"` op `<body>`), dan is de pill verborgen en opent de popup niet vanzelf. `EmailCapture` staat in `app/layout.tsx` tussen Footer en CartDrawer, binnen `CartProvider`. Een Playwright-test controleert dat pill en sticky add-to-cart elkaar op 390×844 niet overlappen.

## 11. Commerce, catalogus en cart

- `lib/commerce/types.ts` definieert `CommerceProvider` met `getProducts()`, `getProduct(slug)` en `createCheckout({ lines, discountCode, country })`.
- `lib/commerce/local.ts` is het enige bestand dat `content/products.ts` importeert. Het geeft `/checkout` als checkout-URL. `lib/commerce/shopify.ts` is een gedocumenteerde stub voor de Storefront API (handle, variant-id's en selling plans uit `externalIds`). `COMMERCE_PROVIDER` (`local` of `shopify`) kiest de provider (D26).
- Server components en route handlers halen productdata via `commerce`. Client components krijgen die via `CatalogProvider` (in `app/layout.tsx` gevuld met `await commerce.getProducts()`; een externe provider cachet dat met `'use cache'`, D18) of via props. `lib/catalog.ts` bevat pure hulpfuncties die een productlijst als argument krijgen.
- `CartProvider` (React context) staat in `app/layout.tsx` binnen `CatalogProvider`. Hij bewaart regels en kortingscode in localStorage (`corvane:cart:v1`) en het land apart (`corvane:country:v1`), via `lib/storage.ts` (D24). Opslag wordt pas na mount gelezen. Zonder storage werkt de cart in het geheugen. De cart rekent met `priceCart`.
- Collectie: alle negen producten; het familiefilter toont alleen sticks, met daarna een linkkaart naar de Discovery Set (geen productcard, D50). Filter en sortering staan in de URL en worden client-side bijgewerkt met `history.replaceState` (D47). Gelijke waarden sorteren op `featuredRank`. Card-prijs: stick €24,95, cadeaukaart "From €25". Quick-add voegt 1 stick eenmalig toe en opent de drawer.

## 12. Toegankelijkheid, SEO, analytics, performance

- Radix Dialog voor cart drawer, mobiel menu en popup (focus-trap, Esc, focus terug). Radix Accordion voor alle accordions.
- Skiplink, `lang="en"`, één `h1` per pagina, labels bij alle velden, `aria-live` voor toevoegen en verwijderen in de cart.
- Metadata per pagina met titeltemplate `%s | CORVANE`, OG-beelden, JSON-LD `Product` met `offers`. `aggregateRating`, de ratingregel in de hero en sterren op cards verschijnen alleen als `getRatingSummary()` niet `null` is. `Organization` op de homepage.
- `lib/analytics.ts`: `view_item` bij het openen van een productpagina, `add_to_cart` in de cart, `begin_checkout` bij de checkoutknop, `sign_up` na een geslaagde aanmelding. Events in GA4-vorm (`currency: 'EUR'`, `value`, `items`) in `window.dataLayer`. Scripts van derden laden pas na toestemming. De consentbanner en een link "Cookie settings" in de footer bestaan alleen als `site.analytics.enabled` waar is (standaard false).
- Performance: in fase 8 draait Lighthouse (mobiel) op `next start` voor `/` en `/products/north-swell`. Ondergrens 90; scores gaan in `docs/COMPLIANCE.md`.

## 13. Conventies

- TypeScript strict, geen `any`. Server components waar het kan; `'use client'` alleen voor interactie.
- Tekst die bezoekers zien komt uit `content/`. Ook knoppen en labels. USP's en trustregels worden opgebouwd uit `shipping.ts` en `offers.ts`, zodat bedragen en dagen nooit uit elkaar lopen.
- Copy in het Engels: kort, droog, zelfverzekerd. Niet toegestaan:
  - uitroeptekens, emoji en hypewoorden (irresistible, magnetic, addictive, seductive, alluring);
  - verwijzingen naar andere parfums of merken ("inspired by", "smells like", "dupe");
  - feromoon- en aantrekkingsclaims;
  - prestatieclaims buiten `content/claims.ts` (geurduur, aantal toepassingen, handbagage);
  - klantaantallen, "X people viewing", "just bought" en voorraadmeldingen;
  - badges van derden.
- Feiten in de copy: 15 g, alcoholvrij, twist-up, plantaardige wasbasis (jojoba en kokos), mat zwarte aluminium huls, smelt op huidtemperatuur (brief §4).
- `content/content-guard.test.ts` (Vitest) scant alle tekst in `content/`, behalve `claims.ts`, op die verboden patronen, op een lijst van namen van parfumhuizen, merken en parfums, en op de pilltekst van de referentie (D55). De test controleert ook:
  - badges anders dan `new`;
  - een ingevulde `previousPrice`;
  - reviews in `reviews.ts`;
  - claims met `verified: true`.
- Het wettelijke herroepingsrecht van 14 dagen is geen verkoopargument: nooit in de trustrij, badges, USP's of de promobalk. Volledig staat het op `/shipping-returns` en in de Terms. Als neutrale informatie staat het ook in de FAQ, het garantieblok ("On top of your rights") en de accordion "Shipping & returns" op de productpagina; daar altijd met de uitzondering voor verzegelde sticks, want die geldt alleen als de klant het vóór het bestellen weet (D28). De garantie van 30 dagen staat er altijd naast als iets aparts.
- Geen `Date.now()` of `new Date()` tijdens het renderen; gebruik `useNow()`.

## 14. Beeld (`content/assets.ts`, `docs/ASSETS.md`)

Elke beeldplek heeft vaste sleutel, pad, verhouding en pixelmaat. `src: null` betekent "nog niet aangeleverd": de site toont dan de SVG-render of een placeholder in dezelfde verhouding met het label "PHOTO: …" of "VIDEO: …".

| Sleutel | Pad | Verhouding en maat |
| --- | --- | --- |
| `products.<slug>.packshot` | `/images/products/<slug>/packshot.webp` | 4:5, 1600×2000 |
| `products.<slug>.inHand` | `/images/products/<slug>/in-hand.webp` | 4:5, 1600×2000 |
| `products.<slug>.lifestyle` | `/images/products/<slug>/lifestyle.webp` | 4:5, 1600×2000 |
| `lifestyle.gym`, `.work`, `.travel`, `.night` | `/images/lifestyle/<naam>.webp` | 4:5, 1600×2000 |
| `hero.group` | `/images/hero/group.webp` | 4:5, 1600×2000; ook op desktop (D39). De 16:10-uitsnede (`group-desktop.webp`, 2560×1600) blijft in het manifest voor een latere bredere layout |
| `story.coast` | `/images/story/coast.webp` | 4:5, 1600×2000 (merkverhaal op de homepage en About, D41) |
| `ugc[1–4]` | `/videos/ugc-0n.mp4` + `/videos/ugc-0n-poster.webp` | 9:16, 1080×1920, H.264 |

De video-rij heet "From CORVANE": eigen merkcontent, nooit "customer" of "review".

De hero toont North Swell, Drift & Ember en Lantern Smoke. De render krijgt een lichtrand, zodat de zwarte huls zichtbaar blijft op `deep`.

## 15. Tests

- **Vitest:** `lib/pricing.test.ts` (vaste waarden uit §7, toewijzing, codes, verzending, pouch), `lib/delivery.test.ts` (vrijdag 14:59 en 15:00, weekend, feestdagen, kerst, zomertijdwissel 25-10-2026 en 28-03-2027), `lib/campaign.test.ts` (vóór, op en na `endsAt`), `content/finder.test.ts`, `content/content-guard.test.ts`, en sinds D55 componenttests in `components/` (`ReviewsSection`, `Price`, `VerifiedClaimsRow`, de afkoelperiode van de popup).
- **Playwright** (`tests/e2e/`, op `next build && next start`):
  - de homepage laadt;
  - een product toevoegen werkt;
  - het cart-subtotaal klopt bij 1, 2, 3, 4 en 7 sticks (€24,95, €44,95, €59,95, €84,90, €144,85);
  - de campagnebalk is weg na `endsAt` (via `page.clock`);
  - de popup opent maximaal één keer (8 s vooruitspoelen, sluiten, herladen, opnieuw vooruitspoelen); ook zelf openen en afslaan start de afkoelperiode, exit-intent opent hem op desktop, zonder opslag opent hij nooit vanzelf en na 7 dagen weer (D55);
  - `WELCOME10` uit de popup haalt 10% af in de cart drawer en op `/checkout`;
  - er is geen horizontale scroll;
  - pill en sticky add-to-cart overlappen niet.

  Andere tests en de screenshots zetten `last-shown` vooraf via `addInitScript`, zodat de popup niet in beeld komt.
- **Screenshots:** home, collectie, productpagina en open cart drawer (met 3 sticks) op 390×844 en 1440×900, in `screenshots/` (niet in git).

## 16. Fasering

Na elke fase volgt een commit met een Engelse boodschap "Phase N: …". De prijslogica, de cart en de content worden in fase 3 gebouwd, omdat de layout in fase 4 ze nodig heeft (D16).

| Fase | Oplevering |
| --- | --- |
| 1 | `docs/REFERENCE.md` |
| 2 | dit plan en `docs/DECISIONS.md` |
| 3 | tokens, fonts, typen, content, prijslogica en tests, commerce, cart, UI-primitives, logo, favicon, renders |
| 4 | promobalk, header, mobiel menu, footer, cart drawer |
| 5 | homepage |
| 6 | collectie en productpagina's |
| 7 | e-mailpopup, scent finder, overige pagina's |
| 8 | SEO, analytics, toegankelijkheid, performance (Lighthouse) |
| 9 | Vitest en Playwright, screenshots bekijken en alles rechttrekken |
| 10 | README, `TODO-LAUNCH.md`, `ASSETS.md`, `COMPLIANCE.md`, eindcontrole, eindbericht |

**`docs/TODO-LAUNCH.md`** bevat minimaal:
- echte foto's en video's (zie `ASSETS.md`);
- een review-app koppelen (Judge.me, Trustpilot);
- Shopify of een betaalprovider;
- een e-mailtool (Klaviyo) en de koppeling met echte abonnementsfacturering; daarna de demoregel bij de aanmeldformulieren weghalen (`signUpDemoNote` in `content/site.ts`) en de bevestigingstekst aanpassen (D52);
- juridische teksten laten controleren;
- merknaam en domein checken (BOIP/EUIPO);
- prestatieclaims testen;
- KvK, btw-nummer, adres en het e-mailadres invullen (het adres `hello@corvane.example` is een placeholder op het gereserveerde domein `.example` en kan geen mail ontvangen, D52);
- de garantietermijn bevestigen;
- de launch-campagne omzetten naar een echte actie;
- de referentie opnieuw bekijken zodra penroseskin.com bereikbaar is.
