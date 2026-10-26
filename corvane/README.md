# CORVANE

Webshop voor CORVANE Solid Cologne: vaste eau de cologne in een twist-up stick.

## Wat dit is

CORVANE is een verzonnen merk. Dit project is een demowebshop: zes geuren, een Discovery Set, een Travel Pouch en een e-gift card, met bundelprijzen, Subscribe & save, een e-mailpopup en een scent finder. Er is geen database en geen externe dienst gekoppeld. Alle tekst, prijzen en data staan in `content/`, en de checkout neemt geen betaling aan. De stack is Next.js 16.4.3 (App Router, Cache Components), React 19.3, TypeScript 5.9 in strict mode, Tailwind CSS 4, Radix UI (`@radix-ui/react-dialog` en `@radix-ui/react-accordion` 1.3) en `lucide-react` voor iconen. Tests draaien op Vitest 5 en Playwright 1.63 met axe-core. De achtergrond staat in `docs/`:

| Bestand | Inhoud |
| --- | --- |
| `docs/PLAN.md` | sitemap, mappen, componenten, datamodel en de rekenregels voor prijzen |
| `docs/DECISIONS.md` | alle beslissingen en aannames, genummerd als D01, D02, ... |
| `docs/REFERENCE.md` | wat er van de referentiesite bekend is (D03) |
| `docs/ASSETS.md` | shotlist voor echte foto's en video's |
| `docs/COMPLIANCE.md` | hoe elke harde regel uit de brief (§2) in de code is afgedwongen |
| `docs/TODO-LAUNCH.md` | alles wat vóór livegang nog moet gebeuren |

De opdracht zelf staat in `../CORVANE-BRIEF.md`, in de hoofdmap van de repository.

## Starten

Je hebt Node.js 20.9 of nieuwer nodig; dat eist Next.js 16. Het project is getest met Node 22 (22.22) en npm 10.9. Alle commando's draai je in de map `corvane/`.

```bash
cd corvane
npm install
npm run dev
```

Open daarna http://localhost:3000.

| Commando | Wat het doet |
| --- | --- |
| `npm run dev` | Start de ontwikkelserver met hot reload op http://localhost:3000. |
| `npm run lint` | Draait ESLint 9 met `eslint-config-next`. `next lint` bestaat niet meer in Next.js 16 (D05). |
| `npm run typecheck` | Maakt eerst de routetypen met `next typegen` en draait daarna `tsc --noEmit` (D05). |
| `npm test` | Draait alle Vitest-tests in `lib/` en `content/` één keer. |
| `npm run test:watch` | Draait Vitest opnieuw bij elke wijziging. |
| `npm run test:coverage` | Draait Vitest met een dekkingsrapport (v8) in `coverage/`. |
| `npm run test:e2e` | Draait de Playwright-smoketests op 390 × 844 (project `mobile`) en 1440 × 900 (project `desktop`). |
| `npm run screenshots` | Maakt screenshots van home, collectie, productpagina en de open cart drawer in `screenshots/`. |
| `npm run build` | Maakt de productiebuild. Faalt als een pagina tijdens het renderen de tijd leest of niet statisch kan worden (D05b). |
| `npm run start` | Serveert de productiebuild op http://localhost:3000. Draai eerst `npm run build`. |

Over de Playwright-commando's:

- `npm run test:e2e` en `npm run screenshots` bouwen eerst zelf (`npm run build`) en starten dan `next start` op poort 3200 (`playwright.config.ts`). Draait er al een server op die poort, dan gebruikt Playwright die (behalve met `CI`).
- `PORT=3300 npm run test:e2e` kiest een andere poort. `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e` test een server die al draait, zonder te bouwen.
- Op een nieuwe machine moet je de browser eerst installeren: `npx playwright install chromium`. Op Linux heb je soms ook de systeembibliotheken nodig: `npx playwright install --with-deps chromium`. Beide projecten draaien in Chromium.

Vóór een oplevering moeten `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` en `npm run build` slagen (brief §10).

## Projectstructuur

```
corvane/
  app/          routes, root layout, API-routes, sitemap, robots, manifest, OG-beelden, favicon
  components/   React-componenten per onderdeel: layout, home, pdp, cart, email, finder, legal, ui, ...
  content/      alle tekst, prijzen en data van de shop; hier pas je de shop aan
  lib/          pure logica (prijzen, verzenddag, campagne, SEO, analytics, opslag) en de commerce-laag
  tests/e2e/    Playwright-smoketests
  docs/         documentatie in het Nederlands
  public/       statische bestanden: woordmerk en vaan in public/brand/, later foto's en video's
  assets/fonts/ fonts voor de OG-beelden en de zelf gehoste Inter, met hun licenties
```

Configuratie staat in `next.config.ts`, `playwright.config.ts`, `vitest.config.mts`, `eslint.config.mjs` en `tsconfig.json`. De mappen `reference/`, `screenshots/`, `coverage/` en `test-results/` staan in `.gitignore`.

Twee regels voor de datastroom (PLAN §11):

- Alleen `lib/commerce/local.ts` importeert `content/products.ts`. Server components halen producten via `commerce` uit `lib/commerce/index.ts`; client components via `useCatalog()` of props.
- Prijzen komen altijd uit `content/offers.ts` en worden berekend in `lib/pricing.ts`. Productdata bevat geen prijzen (D07).

## Content aanpassen

Alles wat bezoekers zien, staat in `content/`. Tekst aanpassen is dus nooit componentwerk. Houd rekening met deze afspraken:

- Bedragen zijn hele centen inclusief btw: `2495` is €24,95 (D07).
- De sitecopy is Engels (brief §0). De toonregels staan in PLAN §13.
- Bedragen, dagen en tijden in de copy komen uit `facts` in `content/site.ts`. Typ nooit zelf "€50" of "15:00" in een tekst; dan lopen copy en config uit elkaar.
- Draai na elke wijziging `npm test`. De content guard (zie onder) vangt verboden tekst af.
- Verandert de content inhoudelijk, zet dan ook `CONTENT_UPDATED` in `lib/seo.ts` op de nieuwe datum (de `lastModified` van de sitemap, D53.4). Voor de juridische pagina's is dat `UPDATED` in `content/legal.ts` ("Last updated"). Het copyrightjaar staat vast in `site.footer.copyright` (D35).

### Prijzen en bundels (`content/offers.ts`)

| Sleutel | Nu | Betekenis |
| --- | --- | --- |
| `stickPricing` | `{ 1: 2495, 2: 4495, 3: 5995 }` | Prijs van een groep van 1, 2 of 3 sticks. De cart groepeert per aankooptype: per 3 sticks €59,95, een rest van 2 €44,95, een rest van 1 €24,95 (PLAN §7, D10). |
| `prices.discoverySet` | `2995` | Discovery Set. |
| `prices.travelPouch` | `995` | Travel Pouch, los gekocht. |
| `giftCardDenominations` | `[2500, 5000, 10000]` | Bedragen van de e-gift card. |
| `freePouch` | `minSticks: 3`, `perOrder: 1` | Gratis Travel Pouch vanaf 3 sticks, één per bestelling (D11). |
| `subscription` | `discountPercent: 15`, `intervalsMonths: [1, 2, 3]`, `defaultIntervalMonths: 2` | Subscribe & save. De korting gaat per bundel van de prijs af en wordt per bundel afgerond (D12). |
| `guaranteeDays` | `30` | Garantietermijn. Staat los van het herroepingsrecht. |
| `withdrawalDays` | `14` | Wettelijk herroepingsrecht. Geen verkoopargument (PLAN §13). |

De tests leggen de prijzen uit de brief vast. Verander je een prijs, pas dan in dezelfde commit `content/offers.test.ts`, de vaste waarden in `lib/pricing.test.ts`, `tests/e2e/cart-subtotals.spec.ts` en PLAN §7 aan. Zo is elke prijswijziging een bewuste keuze.

### Campagne (`offers.campaign`)

De campagnebalk bovenaan toont een aftelling. Die aftelling hoort alleen bij een actie met een vaste einddatum (regel 3). Een campagne heeft deze velden: `active`, `name`, `message`, `startsAt`, `endsAt` en `code`. Zo zet je een nieuwe actie op:

1. Maak de kortingscode in `discountCodes` (of pas `launchCode` bovenaan het bestand aan), met `source: "campaign"` en een eigen `startsAt` en `endsAt`.
2. Zet in `offers.campaign` `active: true`, een `name` en de `code`.
3. Schrijf `startsAt` en `endsAt` als vaste ISO-tekst met tijdzone, bijvoorbeeld `"2026-12-31T23:59:59+01:00"`. Gebruik `+01:00` in de wintertijd en `+02:00` in de zomertijd. Bereken de datum nooit (geen `new Date()`, geen builddatum): dan begint de timer bij elke deploy opnieuw (D08). `lib/campaign.test.ts` controleert dat `endsAt` letterlijk in de broncode staat.
4. Het venster van de code moet dat van de campagne omvatten. Anders toont de balk een code die niet werkt (D30, `lib/campaign.test.ts`).
5. `message` wordt afgeleid van de code en noemt alleen wat echt afloopt: de code en "Excludes gift cards". Vaste aanbiedingen (bundels, pouch, verzending) presenteer je nooit als aflopend (PLAN §8).
6. Pas de tests aan die de demodata vastleggen: het blok "launch campaign (D08)" in `content/offers.test.ts` en de test "defaults to the campaign in content/offers.ts" in `lib/campaign.test.ts`. `tests/e2e/campaign.spec.ts` rekent zelf vanaf `endsAt` en hoeft niet mee.

Geen actie? Zet `active: false`. Dan staat er de roterende USP-balk uit `site.usps`. Let op: de tests die de demo-actie verwachten (`content/offers.test.ts`, `lib/campaign.test.ts` en `tests/e2e/campaign.spec.ts`) moeten dan mee.

De balk leest de tijd in de browser. Op `endsAt` verdwijnt hij vanzelf en stopt de code in dezelfde seconde in de cart (D30). Een nieuwe deploy is daarvoor nooit nodig.

### Kortingscodes (`offers.discountCodes`)

Elke code heeft `code` (hoofdletters en cijfers), `kind: "percent"`, `value`, `label`, `source` (`"welcome"` of `"campaign"`), `active` en optioneel `startsAt` en `endsAt`. `offers.welcomeCode` is de code uit de e-mailpopup (nu `WELCOME10`); die moet in `discountCodes` staan, anders faalt `content/site.ts` bij het laden.

De regels uit D09: één code per bestelling, niet op cadeaukaarten, hoofdletterongevoelig. "For your first order" controleert de demo niet; dat moet de e-mailtool of Shopify afdwingen. Met Shopify moeten dezelfde codes daar ook bestaan (zie [Shopify koppelen](#shopify-koppelen)).

### Verzending (`content/shipping.ts`)

| Sleutel | Nu | Betekenis |
| --- | --- | --- |
| `countries[].rate` | `495` | Verzendkosten per bestelling. |
| `countries[].freeFrom` | `5000` | Gratis verzending vanaf dit bedrag, gemeten vóór de kortingscode (D14). |
| `countries[].transitDays` | NL `{ min: 1, max: 1 }`, BE `{ min: 1, max: 2 }` | Levertijd in werkdagen na verzending (D15). |
| `countries[].deliveryHolidays` | `nlHolidays`, `beHolidays` | Feestdagen waarop in dat land niet wordt bezorgd. |
| `cutoff` | `{ hour: 15, minute: 0 }` | Vóór dit tijdstip op een werkdag gaat de bestelling dezelfde dag weg. |
| `timeZone` | `"Europe/Amsterdam"` | Tijdzone van het magazijn. |
| `dispatchWeekdays` | `[1, 2, 3, 4, 5]` | Verzenddagen, maandag tot en met vrijdag. |
| `holidays` | `nlHolidays` | Dagen waarop het magazijn niet verzendt. |

- Vul de feestdagen elk jaar aan. Nu staan 2026 en 2027 erin. `content/shipping.test.ts` rekent de verwachte data uit de kalenderregels na en faalt bij een tikfout of een vergeten dag.
- Er is nooit een afteltimer naar 15:00. Zo'n timer begint elke dag opnieuw (regel 3, D15).
- Een nieuw land is meer dan content. Het type `CountryCode` in `lib/types.ts`, de vlag in `components/ui/Flag.tsx`, `content/shipping.test.ts` (die vastlegt dat het NL en BE zijn) en de juridische teksten gaan dan mee.

### Producten en noten (`content/products.ts`)

Per product staan hier naam, tagline, omschrijving, `seo` en voor de sticks `family`, `notes` (`top`, `heart`, `base`), `ringColor`, `intensity` en `mood`. Er staan geen prijzen in.

- **Badges** komen alleen uit de array `badges`: `"new"`, `"best-seller"` of `"most-popular"`. Bij launch staat alleen `"new"` aan, want het merk is nieuw (regel 7). "Best value" op de 3-sticks-tegel zet de site zelf, omdat dat feitelijk de laagste stukprijs is. "Best seller" mag pas met verkoopcijfers die het onderbouwen. De launchtest "only uses the 'new' badge" in `content/content-guard.test.ts` faalt dan bewust; pas hem aan in dezelfde commit.
- **`previousPrice`** (`{ amount, lowestPriceLast30Days: true }`) zet je alleen als dat bedrag echt de laagste prijs was in de 30 dagen vóór de prijsverlaging (regel 4). Alleen dan toont de site een doorgestreepte prijs. Ook hier faalt een launchtest bewust.
- **Intensiteit** (`freshWarm`, `projection`, 1 tot 5) is indicatief en niet gemeten (D22).
- **Een nieuwe geur** raakt meer bestanden: `content/products.ts`, `content/finder.ts` (`ScentSlug`, `finderScentOrder` en de punten in `finderQuestions`), `content/assets.ts` (`ASSET_PRODUCT_SLUGS` en `productBriefs`), `pdp.ringColour.names` in `content/pdp.ts` en `aboutScents` in `content/pages.ts`. Een nieuwe familie hoort ook in `ScentFamily` (`lib/types.ts`) en `SCENT_FAMILIES` (`lib/catalog.ts`). Controleer daarna de rijen van de collectie (`ITEM_CLASSES` in `app/collections/all/page.tsx`, D47) en de tests die het aantal producten tellen (`lib/catalog.test.ts`, `lib/commerce/commerce.test.ts`, `tests/e2e/layout.spec.ts`).

### Copy per pagina

| Bestand | Wat erin staat |
| --- | --- |
| `content/site.ts` | merk, navigatie, header, promobalk en USP's (`site.usps`), badgelabels, betaalmethoden (`site.paymentMethods`), socials, bedrijfsgegevens (`site.company`), analytics, e-mailpopup (`site.emailCapture`), nieuwsbrief, consentbanner, footer |
| `content/home.ts` | alle secties van de homepage: `hero`, `deliveryBar`, `productGrid`, `howItWorks`, `comparison`, `scentFinder`, `reviews`, `videoRow`, `guarantee`, `faq`, `story` |
| `content/pdp.ts` | productpagina: bundeltegels, mix & match, aankooptype, sticky balk, leverschatting, trustrij, accordions (ook de INCI-placeholder), cross-sell, galerij, FAQ-selectie per producttype (`pdp.faq.idsFor`) |
| `content/cart.ts` | cart drawer en de democheckout (`cartCopy.checkout`) |
| `content/collection.ts` | collectiepagina en productcards |
| `content/pages.ts` | About, FAQ-pagina, Contact, Account, Checkout (metadata), 404 en Shipping & Returns |
| `content/legal.ts` | Privacy Policy, Terms & Conditions, Cookie Policy, Legal notice, en `legalCheckpoints` voor de jurist |
| `content/faq.ts` | vragen en antwoorden per categorie; `onHome` en `onProduct` bepalen waar een vraag ook staat |
| `content/finder.ts` | de drie quizvragen, de punten per antwoord en de teksten van het resultaat (D23) |

### Prestatieclaims (`content/claims.ts`)

Claims over geurduur, aantal toepassingen en handbagage staan alleen hier, elk met `text`, `verified` en `evidence` (regel 6). Alle drie staan op `verified: false`.

- Zet `verified: true` pas als de claim getest is en het bewijs (testrapport) bewaard is. Beschrijf dat bewijs in `evidence`.
- `lib/claims.ts` (`getVerifiedClaim`, `getVerifiedClaims`, `faqAnswer`) geeft alleen geverifieerde claims door. Een claim op `true` verschijnt vanzelf op twee plekken: als rij "Tested" in de accordion Details van elke geurpagina (`text`), en als antwoord op de FAQ-vraag die er met `claim` naar linkt in `content/faq.ts` (`faqAnswer`, anders `text`). Nu linken "How long does it last on skin?" (`longevity`) en "Can I take it when I travel?" (`carry-on`).
- De launchtests in `content/content-guard.test.ts` ("has no verified claims"), `lib/guards.test.ts` en `components/pdp/ProductAccordions.test.tsx` falen bewust zodra een claim op `true` staat. Pas ze aan in dezelfde commit als het bewijs.
- Woorden als "hours", "lasts", "applications", "carry-on" en "TSA", en omschrijvingen als "packs easily", "travel-friendly" en "liquids bag", zijn overal in `content/` verboden, behalve in `claims.ts`.

### Reviews (`content/reviews.ts`)

Hier komen alleen echte reviews, bijvoorbeeld geëxporteerd uit een review-app als Judge.me of Trustpilot. Nooit verzinnen (regel 2). Een `Review` heeft `id`, `productSlug` (`null` voor een winkelreview), `author`, `rating` (1 tot 5), `title`, `body`, `date`, `verifiedPurchase` en `source`.

Zodra er reviews in staan, verschijnen sterren op de cards, de ratingregel in de hero, de reviewsectie en `aggregateRating` in de JSON-LD vanzelf (`getRatingSummary()` in `lib/reviews.ts`). "Verified" zegt de site pas als `home.reviews.verification` in `content/home.ts` beschrijft hoe de review-app aankopen controleert: dan staat het label "Verified buyer" bij reviews met `verifiedPurchase: true`, en de kop "From verified buyers" als alle getoonde reviews zo'n aankoop zijn. Zolang `verification` `null` is, is de kop "What reviewers say" en staat er "Reviews are not checked against orders." (D55). De launchtests "has no reviews" (`content/content-guard.test.ts`) en "has no reviews and no rating" (`lib/guards.test.ts`) falen dan bewust; pas ze aan bij de eerste echte reviews. De naam "Trustpilot" mag in de content alleen in `content/legal.ts` staan; de guard bewaakt dat.

### Foto's en video's (`content/assets.ts` en `docs/ASSETS.md`)

Elke beeldplek heeft een vaste sleutel, een pad, een verhouding en een pixelmaat (PLAN §14). `src: null` betekent dat het bestand er nog niet is; de site toont dan de SVG-render of een placeholder ("PHOTO: …", "VIDEO: …").

1. Maak het beeld volgens de shotlist in `docs/ASSETS.md`. Foto's zijn WebP in 4:5 (1600 × 2000 px). Video's zijn MP4 (H.264) in 9:16 (1080 × 1920 px) met een WebP-posterframe.
2. Zet het bestand op het `path` onder `public/`, bijvoorbeeld `public/images/products/north-swell/packshot.webp`. De mappen `public/images/` en `public/videos/` bestaan nog niet; maak ze aan bij het eerste bestand.
3. Zet `src` op hetzelfde pad. Voor een video vul je ook `poster`.
4. Klopt de foto niet met de `alt`-tekst, pas die dan aan.

Komt het beeld van een CDN, zet dan de volledige URL in `src` en voeg het domein toe aan `images.remotePatterns` in `next.config.ts`; `next/image` weigert anders externe URL's. Gebruik alleen eigen beeld (brief §5).

### Omgevingsvariabelen

| Variabele | Gelezen in | Wat het doet | Standaard |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `content/site.ts` (`site.url`) | Domein voor canonical-URL's, Open Graph, sitemap, robots.txt en JSON-LD (D53.1). Geef een volledige URL met `https://`. Een lege waarde laat de build falen. | `https://corvane.example` |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `content/site.ts` (`site.analytics.enabled`) | `"true"` zet de consentbanner en de footerlink "Cookie settings" aan. Elke andere waarde laat analytics uit (D53.5). | uit |
| `NEXT_PUBLIC_GTM_ID` | `content/site.ts` (`site.analytics.gtmId`) | Container-id van Google Tag Manager (`GTM-` plus 4 tot 12 hoofdletters of cijfers). GTM laadt alleen met analytics aan, een geldige id en toestemming van de bezoeker. | leeg |
| `NEXT_PUBLIC_SHOW_LEGAL_CHECKS` | `content/legal.ts` (`legalUi.showChecks`) | `"true"` toont de notities "Legal check" op de juridische pagina's. Alleen voor de reviewbuild van de jurist (D52.2). | uit |
| `COMMERCE_PROVIDER` | `lib/commerce/index.ts` | `local` of `shopify`. Een onbekende waarde valt terug op `local`, met een waarschuwing (D26). | `local` |
| `SHOPIFY_STORE_DOMAIN` | `lib/commerce/shopify.ts` | Winkeldomein, bijvoorbeeld `corvane.myshopify.com`. Alleen op de server. | leeg |
| `SHOPIFY_STOREFRONT_TOKEN` | `lib/commerce/shopify.ts` | Access token van de Storefront API. Alleen op de server. | leeg |
| `SHOPIFY_STOREFRONT_API_VERSION` | `lib/commerce/shopify.ts` | Versie van de Storefront API (optioneel). | `2026-10` |

Variabelen die met `NEXT_PUBLIC_` beginnen, worden bij de build in de code gezet. Na een wijziging moet je dus opnieuw bouwen. Lokaal zet je ze in `.env.local`; alle `.env*`-bestanden staan in `.gitignore`.

Alleen voor de tests: `PORT` (poort van Playwright, standaard 3200), `PLAYWRIGHT_BASE_URL` (test een draaiende server), `CI` (strenger: geen `.only`, één herhaling, geen hergebruik van een server) en `SCREENSHOTS` (zet `npm run screenshots` zelf).

### De content guard

`content/content-guard.test.ts` loopt elke geëxporteerde tekst in `content/` na, behalve `claims.ts`. Hij roept ook de tekstfuncties aan en controleert hun uitkomst. Nieuwe bestanden in `content/` vindt hij vanzelf. De test faalt op:

- uitroeptekens en emoji;
- hypewoorden ("irresistible", "magnetic", "ultimate", ...);
- verwijzingen naar andere merken en parfums ("inspired by", "smells like", "dupe", "alternative to", "for fans of", "reminiscent of", "clone", ...), en een lijst van 89 namen van parfumhuizen, merken en parfums (`PERFUME_BRANDS`: Dior, Chanel, Creed, Sauvage, Aventus, ...). Een naam die niet op de lijst staat, vindt alleen een lezer;
- feromoon- en aantrekkingsclaims ("attract", "compliment", "turn heads", "women love", "date night", "sex appeal", ...);
- de pilltekst van de referentie ("pick a card", "win a reward", "kies een kaart");
- nep-schaarste en verzonnen social proof ("only 3 left", "selling fast", "just bought", "as seen in", "loved by", ...);
- prestatieclaims buiten `claims.ts` ("hours", "lasts", "applications", "carry-on", "TSA", "won't leak", en omschrijvingen als "packs easily", "travel-friendly", "fly", "liquids bag", "12-hour", "150 uses", "spill-proof", ...);
- de launchregels: andere badges dan `new`, een `previousPrice`, reviews, een geverifieerde claim, en een juridische pagina zonder de exacte melding "TODO: laten controleren";
- het herroepingsrecht zonder de uitzondering voor verzegelde sticks (D28), en aanmeldteksten die beweren dat er iets is opgeslagen of gemaild (D52).

Hij draait mee met `npm test`. Alleen de guard: `npx vitest run content/content-guard.test.ts`. Bij een fout noemt hij het bestand, het pad naar de tekst en de regel die faalde.

## Deployen op Vercel

1. Zet de repository op GitHub. Het project staat in de submap `corvane/`; de brief staat in de hoofdmap.
2. Kies in Vercel **Add New → Project** en importeer de repository.
3. Zet **Root Directory** op `corvane`. **Framework Preset** wordt Next.js. Laat Build Command, Install Command en Output Directory op de standaard staan: Vercel installeert met npm (`package-lock.json` legt de versies vast) en draait `npm run build`.
4. Zet de **Node.js Version** in de projectinstellingen op 22.x. Next.js 16 heeft minstens 20.9 nodig.
5. Zet de **Environment Variables**, per omgeving:

   | Variabele | Production | Preview |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | het echte domein, bijvoorbeeld `https://www.<domein>` | niet instellen, of het productiedomein |
   | `COMMERCE_PROVIDER` | `local` tot Shopify volledig werkt, daarna `shopify` | idem; test Shopify eerst hier |
   | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN` | alleen met `shopify`; markeer de token als gevoelig | idem |
   | `NEXT_PUBLIC_ANALYTICS_ENABLED`, `NEXT_PUBLIC_GTM_ID` | pas als de GTM-container en de Cookie Policy klaar zijn | naar keuze, om te testen |
   | `NEXT_PUBLIC_SHOW_LEGAL_CHECKS` | nooit | `true`, alleen voor een aparte reviewbranch voor de jurist |

   Na het wijzigen van een `NEXT_PUBLIC_`-variabele moet je opnieuw deployen (**Redeploy**), want de waarde zit in de build.
6. Deploy. In de buildlog staan de pagina's als `○` (statisch). Bij `/products/[slug]` staat `◐`: dat is de lege schil voor onbekende producten; de negen productpagina's zelf zijn volledig vooraf gerenderd (D44, D54.1). De OG-beelden zijn `○` en `●`. Alleen de API-routes zijn `ƒ`: die draaien als Vercel Functions.
7. **Eigen domein:** voeg het toe onder **Settings → Domains** en zet de DNS-records die Vercel toont. Zet daarna `NEXT_PUBLIC_SITE_URL` op dat domein en deploy opnieuw.
8. **Preview deployments:** elke push naar een andere branch en elke pull request krijgt een eigen URL. De productiebranch (meestal `main`) gaat naar het domein. Vercel geeft preview-URL's standaard de header `X-Robots-Tag: noindex`, zodat ze niet in zoekmachines komen.

Alle pagina's zijn statisch. Vercel serveert ze vanaf het CDN, zonder server die per bezoek rendert. De campagnebalk leest de tijd pas in de browser (`useNow(1000)`) en wisselt op `endsAt` zelf naar de USP-balk (D32). De statische HTML bevat altijd de USP-balk, die op elk moment klopt. Voor de timer is een nieuwe deploy dus nooit nodig. Je deployt alleen als je de content verandert, bijvoorbeeld voor een nieuwe actie.

## Shopify koppelen

De UI praat alleen met `commerce` uit `lib/commerce/index.ts`. Die volgt de interface `CommerceProvider` uit `lib/commerce/types.ts`:

- `getProducts()`: alle producten, in catalogusvolgorde;
- `getProduct(slug)`: één product, of `null`;
- `createCheckout({ lines, discountCode, country })`: maakt een checkout en geeft `{ checkoutUrl, provider }` terug.

Met `COMMERCE_PROVIDER=shopify` kiest `lib/commerce/index.ts` de provider in `lib/commerce/shopify.ts`. Die is nu een stub. De typen, `getShopifyConfig()` en `toShopifyCartInput()` bestaan al en zijn getest in `lib/commerce/commerce.test.ts`; de drie methoden gooien nog `ShopifyNotConfiguredError`. De cart drawer stuurt bij "Checkout" de regels naar `POST /api/checkout`, en een absolute `checkoutUrl` opent de browser direct (`components/cart/CartSummary.tsx`). Daarom hoeft er aan de UI niets te veranderen.

### Wat lokaal blijft en wat naar Shopify gaat

| Blijft lokaal | Gaat naar Shopify |
| --- | --- |
| alle copy en productinformatie (`content/`) | producten, varianten en voorraad |
| prijsweergave en besparing (`content/offers.ts` via `lib/pricing.ts`) | het echte afrekenen: prijzen, kortingen en verzendkosten in de checkout |
| leverschatting en feestdagen (`content/shipping.ts`) | betalen, bestellingen en orderbevestigingen |
| campagnebalk en timer | controle van kortingscodes in de checkout |
| beeld (`content/assets.ts`) en reviews | abonnementen (selling plans) en het uitgeven van cadeaukaarten |

### Stap 1. Winkel en producten

1. Maak de winkel aan. Zet Nederland en België als markt in euro's en kies "prijzen inclusief btw" (D07).
2. Kies een betaalprovider met de methoden uit `site.paymentMethods`: iDEAL, Bancontact, Visa, Mastercard, PayPal en Apple Pay (D33). Past de lijst niet, pas dan `site.paymentMethods` aan.
3. Installeer het Headless-verkoopkanaal en maak daar een Storefront API-token aan.
4. Maak één product per geur, met de slug als handle (`north-swell`, `drift-and-ember`, ...). Maak ook `discovery-set`, `travel-pouch` en een cadeaukaartproduct `e-gift-card` met drie varianten: €25, €50 en €100.
5. Geef elke variant exact de prijs uit `content/offers.ts`.
6. Laat `compareAtPrice` (de doorgestreepte "was"-prijs van een variant) leeg. Een doorgestreepte prijs mag alleen als die de laagste prijs van de 30 dagen ervoor was (regel 4), en dat vraagt een prijshistorie. Neem `compareAtPrice` dus ook nooit automatisch over als `previousPrice` in `lib/commerce/shopify.ts` (`docs/TODO-LAUNCH.md`, hoofdstuk 8).

### Stap 2. Bundelprijzen: kies een opzet

De bundelprijzen (per 3 €59,95, per 2 €44,95) gelden per aankooptype, ook als de sticks uit verschillende regels of geuren komen (PLAN §7). Shopify kan dat op twee manieren:

| | A. Eén variant per geur en een kortingsfunctie | B. Een variant per bundelgrootte |
| --- | --- | --- |
| Opzet | Elke geur heeft één variant van €24,95. Een Shopify Function (Discount API, in een eigen app) rekent de bundelprijs uit. De standaardkortingen van Shopify kennen geen groepen van 3 en 2 met een rest. | Elke geur heeft varianten "1 stick" (€24,95), "2 sticks" (€44,95) en "3 sticks" (€59,95). |
| Mix & match | Werkt: elke stick is een eigen regel. | Werkt niet: een set met drie geuren past niet in één variant. |
| Groeperen over regels | Werkt: de functie telt alle sticks per aankooptype (D10, D13). | Werkt niet: 1 + 2 losse sticks worden geen set van 3. |
| Voorraad | Per stick, eenvoudig. | Per variant; een set van 3 moet 3 sticks afboeken. |
| Werk | De functie moet PLAN §7 exact nabouwen, inclusief de afronding per bundel (D12). | Prijzen staan direct in Shopify, maar `linesFor()` in `lib/commerce/shopify.ts` moet per setgrootte een variant kiezen. |

Kies A. Zo werkt `toShopifyCartInput()` al: één regel per geur met de variant `default`, en per set een attribuut `_set`, zodat de functie de sticks van één set kan herkennen.

Tot Shopify exact dezelfde bedragen uitrekent, blijft `lib/pricing.ts` de bron voor alles wat de site toont: tegels, cart drawer en het overzicht op `/checkout`. Zet `COMMERCE_PROVIDER=shopify` pas in productie als de checkout van Shopify op de cent gelijk is aan de cart drawer.

De gratis Travel Pouch (vanaf 3 sticks, één per bestelling, D11) kan met een automatische korting "Buy X get Y" of in dezelfde functie. Let op: zonder pouch in de cart toont de site de pouch als cadeauregel; die regel bestaat niet in `lines`. `createCheckout()` moet dan zelf een pouchregel toevoegen (zie stap 5).

### Stap 3. Subscribe & save

1. Installeer een abonnementsapp, bijvoorbeeld Shopify Subscriptions.
2. Maak één selling plan group voor alle zes geuren, met drie plannen: elke 1, 2 en 3 maanden, met 15% korting. Omdat alle geuren in dezelfde groep zitten, hebben ze dezelfde plan-id's. Dat is nodig: de code neemt het plan van de eerste geur van een set (`line.scents[0]`).
3. Alleen sticks krijgen een plan. Discovery Set, pouch en cadeaukaart zijn alleen eenmalig (PLAN §9).
4. Controleer drie dingen voor livegang: de afronding per bundel (3 sticks €50,96, 2 sticks €38,21, 1 stick €21,21, D12), het groeperen van sticks met verschillende intervallen (D10), en of de bundelprijs ook op vervolgleveringen geldt. Opzeggen moet altijd kunnen vóór de volgende levering, zonder minimale looptijd (D28).

### Stap 4. Id's koppelen in `externalIds`

Zet de Shopify-id's per product in `content/products.ts`, in het veld `externalIds` (type in `lib/types.ts`):

```ts
externalIds: {
  shopifyHandle: "north-swell",
  shopifyVariantIds: { default: "gid://shopify/ProductVariant/1111111111" },
  shopifySellingPlanIds: {
    1: "gid://shopify/SellingPlan/2222222222",
    2: "gid://shopify/SellingPlan/3333333333",
    3: "gid://shopify/SellingPlan/4444444444",
  },
},
```

- De variantsleutel is `default` (`SHOPIFY_DEFAULT_VARIANT_KEY`) voor sticks, Discovery Set en pouch. Voor de cadeaukaart is het het bedrag in centen als tekst: `"2500"`, `"5000"` en `"10000"`.
- `shopifySellingPlanIds` staat alleen bij de sticks, met het interval in maanden als sleutel.
- De id's vind je met een Storefront-query, bijvoorbeeld in GraphiQL: `product(handle: "north-swell") { variants(first: 5) { nodes { id title } } sellingPlanGroups(first: 5) { nodes { sellingPlans(first: 5) { nodes { id name } } } } }`.

Ontbreekt een id, dan gooit `toShopifyCartInput()` een `ShopifyNotConfiguredError` met het product erbij.

### Stap 5. `lib/commerce/shopify.ts` bouwen

De uitleg bovenaan dat bestand beschrijft de mapping al. In het kort:

1. **Een helper voor de API.** POST naar `https://{SHOPIFY_STORE_DOMAIN}/api/{versie}/graphql.json` met de header `X-Shopify-Storefront-Access-Token` (of `Shopify-Storefront-Private-Token` voor een private token). Lees de instellingen met `getShopifyConfig()`. Gooi een fout bij `errors` in het antwoord.
2. **`getProducts()` en `getProduct(slug)`.** Begin bij `localCommerce.getProducts()` uit `./local`: daar staat alle productinformatie, en zo blijft `local.ts` het enige bestand dat `content/products.ts` importeert. Vraag bij Shopify per handle de varianten op (`id`, `price`, `availableForSale`) en voeg ze samen. Gooi een fout als een prijs afwijkt van `content/offers.ts`; dan faalt de build in plaats van de checkout.
3. **Cachen.** Zet het ophalen in een functie met `'use cache'`, `cacheLife("hours")` en `cacheTag("shopify-products")` (uit `next/cache`). De root layout roept `getProducts()` op elke pagina aan (D18). Zonder cache wordt elke pagina dynamisch, en `ensureStatic` op de productpagina laat de build dan falen. Gebruik niet het profiel `seconds`: dat valt buiten de prerender. Wil je direct verversen na een wijziging in Shopify, roep dan `revalidateTag("shopify-products", "max")` aan vanuit een webhook-route.
4. **`createCheckout(input)`.** Maak de regels met `toShopifyCartInput(input, await shopifyCommerce.getProducts())`. Reken de cart na met `priceCart({ ...input, now: new Date() })` uit `lib/pricing.ts`. Is `freePouch.eligible` waar en `freePouch.appliedToLineId` `null`, voeg dan één regel toe met de variant `default` van `travel-pouch`. Stuur daarna de mutatie `cartCreate` uit het commentaar in `shopify.ts`, met `@inContext(country: …)`. De input bevat `lines` (met `sellingPlanId` voor abonnementen), `discountCodes` en `buyerIdentity.countryCode`. Geef `{ checkoutUrl: cart.checkoutUrl, provider: "shopify" }` terug en gooi een fout bij `userErrors`. `/api/checkout` maakt daar een 502 van en de cart drawer toont een foutmelding.

`createCheckout()` draait per verzoek in een route handler en wordt niet gecachet. `new Date()` mag daar dus; in componenten nooit tijdens het renderen (D05b).

### Stap 6. Kortingscodes en verzending in Shopify

- Maak `WELCOME10` (10%) en `LAUNCH15` (15%) ook in Shopify. Geef `LAUNCH15` exact dezelfde start en eind als in `content/offers.ts`, en zet de tijdzone van de winkel op Amsterdam.
- Dwing "first order" af bij `WELCOME10`: één keer per klant, alleen voor klanten zonder eerdere bestelling (D09).
- Codes stapelen niet met elkaar (D09). Ze moeten wel samengaan met de bundelkorting en met gratis verzending, anders past Shopify alleen de grootste korting toe.
- Verzending: NL en BE €4,95, gratis vanaf €50. D14 meet die grens vóór de kortingscode. Controleer hoe Shopify hem meet; wijkt dat af, pas dan Shopify aan, of D14 en de copy.

### Stap 7. Omgevingsvariabelen

```bash
# .env.local (staat in .gitignore) of de Environment Variables in Vercel
COMMERCE_PROVIDER=shopify
SHOPIFY_STORE_DOMAIN=corvane.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=...
# optioneel, standaard 2026-10
SHOPIFY_STOREFRONT_API_VERSION=2026-10
```

Deze variabelen zijn alleen voor de server. Geef ze nooit het voorvoegsel `NEXT_PUBLIC_`. De producten worden bij de build opgehaald, dus na een wijziging bouw of deploy je opnieuw.

### Stap 8. Testen en controleren

1. Werk `lib/commerce/commerce.test.ts` bij: de test "throws a clear not-configured error" klopt dan niet meer. Test het samenvoegen van producten met een vast voorbeeldantwoord van de API, zonder netwerk.
2. Test lokaal met een development store: zet `.env.local`, draai `npm run build` en `npm run start`, voeg producten toe en klik in de cart drawer op "Checkout". Betaal in de testmodus van de betaalprovider.
3. Test daarna op een Vercel-preview met de Shopify-variabelen alleen voor Preview.
4. Controleer in de checkout van Shopify:
   - de prijzen, gelijk aan de tegels op de productpagina en de cart drawer: eenmalig 1 tot 7 sticks (€24,95, €44,95, €59,95, €84,90, €104,90, €119,90, €144,85), op abonnement 1, 2, 3, 4, 7 en 8 sticks (€21,21, €38,21, €50,96, €72,17, €123,13, €140,13), en een gemengde cart (2 eenmalig plus 1 op abonnement: €44,95 + €21,21);
   - een mix & match-set van drie geuren;
   - de gratis Travel Pouch: één per bestelling, met en zonder pouch in de cart;
   - de codes: `WELCOME10` één keer per klant, `LAUNCH15` alleen binnen zijn venster, nooit samen, nooit op cadeaukaarten;
   - verzending naar NL en BE: €4,95, gratis vanaf €50;
   - de cadeaukaart: geen verzending en geen korting.
5. Draai `npm test` en `npm run test:e2e`. De e2e-tests gebruiken de provider uit je omgeving.

## Tests en kwaliteit

### Vitest

Stand op 26 oktober 2026: 317 tests in 17 bestanden, alle groen. Vitest verzamelt tests in `lib/`, `content/` en `components/`; componenttests renderen met `renderToStaticMarkup` in Node, zonder browser.

| Bestand | Wat het test |
| --- | --- |
| `lib/pricing.test.ts` | de vaste waarden uit PLAN §7, verdeling over regels (D13), gratis pouch (D11), kortingscodes en hun vensters, verzending en de grens van €50 (D14), besparing, tegelprijzen, beschadigde cartregels |
| `lib/delivery.test.ts` | verzenddag rond 15:00, weekend, Nederlandse en Belgische feestdagen, kerst, de jaarwisseling en de wisseling van zomer- naar wintertijd (25-10-2026 en 28-03-2027) |
| `lib/campaign.test.ts` | de campagne vóór, op en na `endsAt`; `endsAt` letterlijk in de broncode; het codevenster omvat de campagne (D30) |
| `lib/catalog.test.ts` | sorteren, filteren, vanaf-prijzen, controle van opgeslagen cartregels, analytics-payloads |
| `lib/guards.test.ts` | launchstaat: geen geverifieerde claims, geen reviews of rating, een echte welkomstcode; FAQ-antwoorden tonen een claim pas als hij geverifieerd is |
| `lib/analytics.test.ts` | consent, GTM pas na toestemming, Consent Mode, `track()` |
| `lib/seo.test.ts` | sitemap, metadata, JSON-LD (geen `aggregateRating` zonder reviews) |
| `lib/color.test.ts` | contrastberekening voor het vinkje in de geurkiezer |
| `lib/commerce/commerce.test.ts` | keuze van de provider, de lokale provider, de Shopify-stub en de mapping naar Storefront-cartregels |
| `content/content-guard.test.ts` | verboden copy en de launchregels (zie [De content guard](#de-content-guard)) |
| `content/offers.test.ts` | prijzen uit de brief, codes, het venster van de launch-campagne |
| `content/shipping.test.ts` | feestdagen tegen de kalenderregels, tarieven, levertijden |
| `content/finder.test.ts` | de puntentelling van de scent finder, alle 64 paden, elke geur kan winnen |
| `components/home/ReviewsSection.test.tsx` | lege staat zonder score, sterren of "verified"; met reviews een kop en label "verified" alleen met een beschreven controle (D55) |
| `components/pdp/ProductAccordions.test.tsx` | de rij "Tested" is leeg bij de launch en toont alleen geverifieerde claims |
| `components/ui/Price.test.tsx` | een doorgestreepte prijs alleen bij een verklaarde, hogere `previousPrice` |
| `components/email/state.test.ts` | afkoelperiode van 7 dagen, geen automatische opening zonder opslag of na aanmelden |

### Playwright

De smoketests draaien op een productiebuild, elk in beide projecten: `mobile` (390 × 844) en `desktop` (1440 × 900). Laatste run (26 oktober 2026, na de audit van fase 10, D55): 64 geslaagd, 10 overgeslagen (de screenshots, één test die alleen op mobiel bestaat en de exit-intent-test, die alleen op desktop bestaat). D55 voegde vijf tests toe: vier in `popup.spec.ts` en één in `welcome-code.spec.ts`.

| Spec | Wat het test |
| --- | --- |
| `tests/e2e/home.spec.ts` | de homepage laadt met promobalk, header en footer, precies één h1 en geen consolefouten |
| `tests/e2e/add-to-cart.spec.ts` | Add to cart op de productpagina opent de drawer met de regel; een set van 3 is één regel met de gratis pouch; quick add in de collectie |
| `tests/e2e/cart-subtotals.spec.ts` | het subtotaal bij 1, 2, 3, 4 en 7 sticks: €24,95, €44,95, €59,95, €84,90 en €144,85 |
| `tests/e2e/campaign.spec.ts` | vóór `endsAt` code en aftelling; na `endsAt` de USP-balk; de balk verdwijnt vanzelf als `endsAt` verstrijkt terwijl de pagina open is (met `page.clock`) |
| `tests/e2e/popup.spec.ts` | de popup opent één keer, niet opnieuw na herladen of op een andere pagina, ook niet na client-navigatie; de pill opent hem wel; zelf openen en afslaan start ook de afkoelperiode; exit-intent opent hem op desktop; zonder opslag nooit vanzelf; na 7 dagen weer |
| `tests/e2e/welcome-code.spec.ts` | `WELCOME10` uit de popup haalt 10% af in de cart drawer en op `/checkout` |
| `tests/e2e/email-capture.spec.ts` | na aanmelden in de footer opent de popup niet meer vanzelf |
| `tests/e2e/layout.spec.ts` | geen horizontale scroll op alle routes en de 404's; een echte 404 voor onbekende URL's; pill en sticky add-to-cart overlappen niet op mobiel |
| `tests/e2e/a11y.spec.ts` | geen axe-overtredingen (WCAG 2 A en AA) op `/`, `/collections/all`, `/products/north-swell`, `/checkout` en de open en lege cart drawer |
| `tests/e2e/seo.spec.ts` | zonder JavaScript heeft elke productpagina het product als enige h1; een onbekende slug is een 404, ook voor bots; bots krijgen dezelfde pagina als browsers |
| `tests/e2e/screenshots.spec.ts` | alleen met `npm run screenshots`: home, collectie, productpagina en cart drawer met 3 sticks |

### Lighthouse

Lighthouse 13.5, mobiel, gesimuleerde throttling (150 ms RTT, 1,6 Mbit/s, 4× CPU), op `next start`:

| Meting | `/` | `/products/north-swell` |
| --- | --- | --- |
| Fase 8, mediaan van 3 runs (D53.7) | 95 | 97 |
| Fase 8, mediaan van 10 extra runs (laagste run) | 96 (93) | 96 (90) |
| Na de SEO-review, mediaan van 10 runs (D54.4) | 97 | 94 (91) |
| Eindmeting fase 10, mediaan van 3 runs (laagste run) | 95 (93) | 96 (95) |

Toegankelijkheid, best practices en SEO scoorden 100, en CLS was in elke run 0. Fase 9 veranderde daarna alleen details in de opmaak. Meet opnieuw vóór livegang en na het plaatsen van echte foto's:

```bash
npm run build
npx next start -p 3500
npx lighthouse@13 http://localhost:3500/ --only-categories=performance,accessibility,best-practices,seo --view
```

Lighthouse heeft Chrome nodig. Staat dat er niet, wijs dan met `CHROME_PATH` naar een Chromium-binary, bijvoorbeeld die van Playwright.

### Toegankelijkheid

- axe vindt 0 overtredingen op alle 22 routes uit PLAN §1, op 390 × 844 en 1440 × 900. Dat geldt ook voor extra toestanden: drawer open en leeg, menu open, popup, mix & match, foutmeldingen in formulieren (63 runs, D53.6).
- Met de hand gecontroleerd: de koopflow met alleen het toetsenbord, zichtbare focus op 17 routes, de focusvolgorde, focus-trap en Esc in drawer, menu en popup, de skiplink, `prefers-reduced-motion`, 200% zoom, reflow op 320 px en grote tekst.
- Bekende beperkingen staan in D53.6: bij 200% lettergrootte op 390 px steken de antwoorden van de finder iets uit en worden placeholderlabels afgekapt; kleurstalen tonen op telefoons alleen kleur; drie kleine bedieningen zijn kleiner dan 44 px, maar minstens 24 px. Niet getest: echte schermlezers en Windows-hoogcontrast.

Hoe elke harde regel uit de brief is afgedwongen, staat in `docs/COMPLIANCE.md`.

## Bekende beperkingen

- **Democheckout.** `/checkout` toont het overzicht, het kortingscodeveld en de melding "Demo checkout: no payment is taken". "Place demo order" bestelt niets; de cart blijft staan.
- **Stub-API's.** `POST /api/subscribe` controleert alleen het e-mailadres en bewaart of verstuurt niets (D35, D52). `POST /api/contact` controleert het formulier en gooit het bericht weg (D51.5). `POST /api/checkout` geeft met de lokale provider altijd `/checkout` terug. De Shopify-provider is een stub (D26).
- **Geen accounts.** `/account` is een pagina met hulplinks, zonder inloggen.
- **Abonnementen** bestaan alleen in de UI en het datamodel. Er wordt niets gefactureerd.
- **De referentie is niet bekeken.** penroseskin.com was vanuit de bouwomgeving niet bereikbaar (D03, D06). De structuur volgt §6 van de brief; zie `docs/REFERENCE.md`.
- **Placeholders voor beeld.** Producten zijn SVG-renders. Lifestyle-, schaal- en videoplekken tonen een placeholder tot er echte bestanden zijn (`docs/ASSETS.md`).
- **Juridische teksten zijn concepten.** Elke juridische pagina en `/shipping-returns` tonen "TODO: laten controleren". Bedrijfsgegevens, bewaartermijnen, verwerkers en de geldigheid van cadeaukaarten zijn placeholders (D27). De open punten voor de jurist staan in `legalCheckpoints` in `content/legal.ts`.
- **Geen claims en geen reviews.** Alle prestatieclaims staan op `verified: false`, dus de site toont er geen (een geverifieerde claim zou vanzelf in Details en de FAQ verschijnen). `content/reviews.ts` is leeg, dus de site toont nergens sterren of scores.
- **`WELCOME10` "for your first order"** wordt niet gecontroleerd (D09).
- **Alleen NL en BE**, en de site is alleen in het Engels.
- **De demo-campagne** "Launch week" loopt tot 1 november 2026, 23:59 (D08). Daarna staat de USP-balk er.
- **Afhankelijk van interne details.** `components/layout/InstantReveal.tsx` leunt op een interne variabele van React en `experimental.turbopackChunking` in `next.config.ts` is experimenteel (D53.7). Valt een van beide weg, dan werkt de site gewoon, maar zakt de Lighthouse-score iets.
