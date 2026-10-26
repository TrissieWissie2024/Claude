# Compliance

Dit document hoort bij brief §10. Het beschrijft per harde regel uit brief §2 hoe de code en de content die regel afdwingen, welke tests haar bewaken, hoe je haar met de hand controleert en wat er vóór de launch nog moet. Daarna volgt de controle op tekst uit de referentie en de stand van de overige controles.

Stand: 26 oktober 2026, fase 10, op de code na commit `6e3137b` ("Phase 9: visual polish after screenshot review") plus de oplossingen van de compliance-audit van fase 10 (D55). Testnamen staan als `describe › it`.

## Overzicht

| Regel | Kern van de afdwinging | Bewaakt door | Open punt vóór launch |
| --- | --- | --- | --- |
| 1. Referentie, geen kopie | Referentie nooit binnengehaald (D03); alles zelf gemaakt | Geen test mogelijk; scan in "Geen tekst uit de referentie" | Referentie alsnog bekijken en vergelijken |
| 2. Geen verzonnen social proof | `content/reviews.ts` leeg; ratings via `lib/reviews.ts`, `null` zonder reviews; "verified" alleen als `home.reviews.verification` de controle beschrijft (nu `null`) | Vitest (data, helpers, JSON-LD, `ReviewsSection`) | Alleen echte reviews koppelen en zeggen hoe ze gecontroleerd worden; geen e2e-test op de pagina |
| 3. Echte timers | Vaste `endsAt` in `content/offers.ts`; `getActiveCampaign()`; geen timer naar 15:00 | Vitest en Playwright | Demo-campagne vervangen door een echte actie |
| 4. Eerlijke prijzen | `previousPrice` nergens gezet; `Price` toont een doorgestreepte prijs alleen bij een `previousPrice` die verklaart de laagste prijs van de 30 dagen ervoor te zijn (een verklaring, geen controle) | Vitest (data, prijslogica, `Price`), Playwright (subtotalen) | Prijshistorie bijhouden vóór een `previousPrice`; `compareAtPrice` van Shopify nooit automatisch overnemen |
| 5. Geen dupes of wondermiddelen | Content guard op verwijzende formuleringen, een lijst van 89 parfumhuizen, merken en parfums, en aantrekkingsclaims; namen buiten die lijst alleen met de hand | Vitest (`content/content-guard.test.ts`) | Nieuwe copy door een mens laten lezen; ook beeld en advertenties volgens dezelfde regels |
| 6. Claims | Claims alleen in `content/claims.ts`, alle `verified: false`; een geverifieerde claim verschijnt vanzelf in de accordion Details en in het FAQ-antwoord dat ernaar linkt; denylist (ook omschrijvingen als "packs easily" en "liquids bag") in de content guard | Vitest | Claims testen en pas daarna op `true` zetten |
| 7. Badges | Alleen `new` in `content/products.ts`; "Best value" uit `isBestValue` | Vitest | "New" na een tijd weghalen |
| 8. E-mailpopup | Beloning uit `offers.welcomeCode`; dezelfde kaart overal; geen vinkje; vanzelf hooguit eens per 7 dagen, ook na zelf openen of de pill verbergen | Vitest (`components/email/state.test.ts`) en Playwright (`popup.spec.ts`, `welcome-code.spec.ts`) | E-mailtool koppelen; "first order" afdwingen (D09) |

## Regel 1. Referentie, geen kopie

**Regel.** Van penroseskin.com alleen structuur, sectievolgorde, flow en interactiepatronen. Geen teksten, afbeeldingen, logo's, iconen, code, CSS of kleurenschema's.

**Afdwinging in code en content.**

- De referentie was vanuit de bouwomgeving niet bereikbaar (D03, `docs/REFERENCE.md`). Er is dus nooit tekst, beeld, code of CSS van de site binnengehaald. De structuur volgt de beschrijving in brief §6, in eigen woorden in `docs/REFERENCE.md`. De volgorde lager op de homepage is een eigen keuze (`docs/REFERENCE.md`, PLAN §4).
- `reference/` is leeg en staat in `.gitignore` (`/reference/`). Er staat niets van de referentie in `public/`; daar staan alleen de eigen logobestanden in `public/brand/`.
- Kleuren: de tokens uit brief §5 in `app/globals.css` (`--ink`, `--deep`, `--sand`, `--fog`, `--signal`, `--kelp`), plus de afgeleide tinten `--ink-soft` en `--mist` (D17). Geen goud of bruin in de huisstijl.
- Logo en favicon: eigen SVG-paden (D19, D20) in `components/brand/Wordmark.tsx` en `components/brand/VaneIcon.tsx`, als bestand in `public/brand/` en als `app/icon.svg`, `app/favicon.ico` en `app/apple-icon.png`.
- Productbeeld: eigen inline SVG-renders (D21) in `components/media/` (`StickRender`, `GroupRender`, `DiscoverySetRender`, `PouchRender`, `GiftCardRender`, `NotesCard`). Foto- en videoplekken zijn placeholders (`PhotoSlot`, `VideoSlot`) tot er eigen beeld is (`docs/ASSETS.md`).
- Iconen: `lucide-react` (open source, ISC-licentie) en eigen tekeningen in `components/home/`. Betaalmethoden zijn eigen tekstbadges zonder logo's van de betaalmerken (D33, `components/layout/PaymentIcons.tsx`, lijst in `site.paymentMethods`).
- Fonts: Fraunces en Inter onder de SIL Open Font License 1.1, met de licenties in `assets/fonts/OFL-Fraunces.txt` en `assets/fonts/OFL-Inter.txt` (D53.2).
- Copy: zelf geschreven vanuit brief §3 en §4 en de drie voorbeeldzinnen voor de toon. Alle sitecopy staat in `content/`.

**Automatische tests.** Geen test kan bewijzen dat iets niet gekopieerd is. De content guard (`content/content-guard.test.ts › content guard › has no banned copy in any exported value`) weert wel verwijzingen naar andere merken (zie regel 5) en de formulering van de pill van de referentie zoals de brief die beschrijft ("pick a card", "win a reward", "kies een kaart", zie "Geen tekst uit de referentie").

**Handmatig controleren.** Zie de sectie "Geen tekst uit de referentie": de scan van alle content en van de HTML van elke route. Bekijk de referentie zodra die bereikbaar is en leg pagina's naast elkaar: tekst, beeld, iconen, kleuren.

**Restrisico en vóór launch.**

- De structuur steunt op de beschrijving in de brief, niet op eigen observatie. Bekijk de referentie opnieuw zodra dat kan (D06, `docs/REFERENCE.md` "Wat nog moet"), en controleer dan of geen sectie te letterlijk is overgenomen.
- Echte foto's en video's moeten eigen beeld zijn (`docs/ASSETS.md` §5).
- Merknaam en domein laten checken (BOIP/EUIPO, brief §11). Dat is een merkenrechtvraag, los van deze regel.

## Regel 2. Geen verzonnen social proof

**Regel.** Geen bedachte reviews, sterrenscores, Trustpilot-badges, klantaantallen, "X mensen bekijken dit" of "zojuist gekocht". Review- en ratingcomponenten bestaan, maar tonen niets of een nette lege staat zolang `content/reviews.ts` leeg is.

**Afdwinging in code en content.**

- `content/reviews.ts`: `export const reviews: Review[] = []`.
- `lib/reviews.ts`: `getReviews()`, `getRatingSummary()` (geeft `null` zonder reviews) en `hasReviews()`. Componenten lezen reviews alleen via deze functies.
- `components/ui/Stars.tsx`: rendert niets als `rating` `null` is of `count` 0.
- `components/home/Hero.tsx`: de ratingregel staat er alleen als `getRatingSummary()` iets teruggeeft. Zonder reviews is er ook geen lege plek.
- `components/product/ProductCard.tsx`: sterren alleen als `getRatingSummary(product.slug)` niet `null` is.
- `components/home/ReviewsSection.tsx`: zonder reviews de kop "No reviews yet." (`home.reviews.emptyTitle`) met één zin, zonder score, sterren of aantal (D43.2). Op de productpagina één rustige regel (`variant="inline"`, D50.7). De zin van de lege staat zegt niets over wie reviewt: "CORVANE is new. Reviews appear here as they come in." (`home.reviews.empty.body`, `pdp.reviews.empty.body`). De props `source` en `verification` zijn alleen voor tests en previews; geen pagina geeft ze mee.
- "Verified" moet verdiend zijn (ACM; richtlijn oneerlijke handelspraktijken art. 7 lid 6 en bijlage I punt 23 ter). De kop met reviews volgt uit de data (`reviewsHeading()`): "From verified buyers" (`home.reviews.headingVerified`) alleen als `home.reviews.verification` beschrijft hoe aankopen gecontroleerd worden én elke getoonde review `verifiedPurchase: true` heeft. Anders de neutrale kop "What reviewers say" (`home.reviews.heading`). Het label "Verified buyer" staat alleen bij een review met `verifiedPurchase: true` en alleen als die beschrijving er is. Onder de kop staat altijd hoe reviews gecontroleerd worden: de tekst van `verification`, of zolang die `null` is "Reviews are not checked against orders." (`home.reviews.unverifiedNote`). Bij de launch is `verification` `null`.
- `lib/seo.ts` `productJsonLd()`: `aggregateRating` en `review` alleen als `getRatingSummary()` echte reviews vindt (D53.3).
- De video-rij heet "From CORVANE", met de notitie "Brand content, filmed by CORVANE." (`home.videoRow.note`). Hij is nooit als klantcontent of review gepresenteerd (PLAN §14).
- `content/content-guard.test.ts` weert in alle content: "people viewing", "just bought", "as seen in", "loved by", "only X left", "left in stock", "selling fast" en "Trustpilot" (buiten `content/legal.ts`).

**Automatische tests.**

- `lib/guards.test.ts › launch state › has no reviews and no rating`
- `lib/guards.test.ts › claims and reviews helpers › filters reviews per product, newest first`, `› summarises ratings rounded to one decimal`
- `content/content-guard.test.ts › launch guards › has no reviews`
- `content/content-guard.test.ts › homepage copy added after the phase 5 review › has an honest reviews empty state: no score, no stars, no count`
- `content/content-guard.test.ts › content guard › has no banned copy in any exported value`
- `lib/seo.test.ts › JSON-LD › has no rating or reviews without real reviews` en `› adds aggregateRating and review once reviews exist`
- `components/home/ReviewsSection.test.tsx › ReviewsSection at launch (content/reviews.ts is empty) ›` twee tests (lege staat op home en productpagina zonder score, sterren, aantal of "verified"; neutrale copy en `verification` is `null`) en `› ReviewsSection with reviews (fixtures) ›` vier tests (neutrale kop en "not checked" zonder controle, ook bij `verifiedPurchase: true`; neutrale kop als één getoonde review niet gecontroleerd is; "From verified buyers" alleen met controle en alleen gecontroleerde reviews; de kop volgt uit de data)

Er is geen Playwright-test die op een gerenderde pagina controleert dat er geen sterren of `aggregateRating` staan. De scan in "Geen tekst uit de referentie" deed dat wel, met resultaat nul.

**Handmatig controleren.** Open `/`, `/collections/all` en `/products/north-swell`. Er staan nergens sterren of aantallen; de reviewsectie zegt "No reviews yet.". Zoek in de paginabron naar `aggregateRating`: geen resultaat.

**Restrisico en vóór launch.**

- Koppel een review-app (bijvoorbeeld Judge.me of Trustpilot, brief §11) en vul `reviews` alleen met echte reviews van echte kopers. Zet `verifiedPurchase` alleen als de aankoop is gecontroleerd, en vul `source`.
- De site moet zeggen hoe reviews gecontroleerd worden voordat hij ze "verified" noemt. Vul `home.reviews.verification` in `content/home.ts` pas in als de review-app aankopen echt aan bestellingen koppelt, met een korte beschrijving van die controle. Tot dan noemt de site geen review "verified" en staat er "Reviews are not checked against orders." Dit staat op `docs/TODO-LAUNCH.md`.
- Geef `ReviewsSection` op een live pagina nooit een eigen `source` mee.
- De content guard kent geen regel voor klantaantallen ("1,200 customers"). Ze staan nergens op de site (zie de scan), maar een test ontbreekt.
- Een Trustpilot-widget of -badge mag pas als er echte scores zijn. Noem de review-app dan ook in de privacytekst.

## Regel 3. Echte timers

**Regel.** Een afteltimer hoort alleen bij een actie met een vaste einddatum uit `content/offers.ts`. Nooit resetten per bezoeker of per dag. Na de einddatum verdwijnen balk en timer vanzelf.

**Afdwinging in code en content.**

- `content/offers.ts`: `campaign.endsAt: "2026-11-01T23:59:59+01:00"` en `startsAt: "2026-10-25T00:00:00+02:00"` staan als vaste tekst, met `active: true` en `code: "LAUNCH15"` (D08). Niets wordt berekend uit de klok of de builddatum. De code `LAUNCH15` heeft hetzelfde venster.
- `lib/campaign.ts`: `getActiveCampaign(now)` geeft de campagne alleen als `active` waar is en `startsAt <= now < endsAt`. Een tijd die niet te lezen is, geeft `null`. `getCountdown(now, endsAt)` rekent alleen naar die vaste `endsAt` en wordt nooit negatief.
- `components/layout/PromoBar.tsx`: leest de tijd met `useNow(1000)`, pas na het mounten. Vóór het mounten, vóór `startsAt` en vanaf `endsAt` staat de USP-balk (`components/layout/promo/UspBar.tsx`). Bij de eerste tik na `endsAt` wisselt de balk vanzelf, zonder herladen.
- `components/layout/promo/CampaignMessage.tsx`: de enige plek met een aftelling (`getCountdown` wordt verder nergens gebruikt). Met `prefers-reduced-motion` of na "Pause countdown" staat de vaste eindtijd er in plaats van de aftelling (D32, D43.11).
- Er is geen opslagsleutel voor een timer (`storageKeys` in `lib/storage.ts`), dus niets kan per bezoeker opnieuw beginnen.
- Geen aftelling naar de verzendgrens van 15:00 (PLAN §8, D15). `lib/delivery.ts` `getDispatchInfo()` geeft alleen `dispatchDate` en `shipsToday`. De leverbalk (`components/home/DeliveryBar.tsx`) en de leverschatting (`components/pdp/DeliveryEstimate.tsx`) tonen vaste tekst.
- `lib/pricing.ts` `validateDiscountCode()` keurt `LAUNCH15` af buiten het venster van de code én van de campagne. De code werkt dus precies zo lang als de balk hem noemt (D30).
- `next build` faalt als een component tijdens het renderen de tijd leest (D05b).

**Automatische tests.**

- `lib/campaign.test.ts › getActiveCampaign › is active between startsAt and endsAt`, `› is gone exactly at endsAt and after`, `› is null before startsAt`, `› is null when active is false`, `› works without startsAt and fails closed on a broken endsAt`, `› defaults to the campaign in content/offers.ts`
- `lib/campaign.test.ts › content/offers.ts campaign (brief §2.3) › ends at a fixed ISO timestamp with an explicit offset`, `› writes endsAt as a literal in the source, never computed from the clock`, `› names a code that works for as long as the bar promotes it`
- `lib/campaign.test.ts › malformed campaign data (phase 9 coverage audit) ›` vier tests, waaronder `counts down the last second and is gone at endsAt`
- `content/offers.test.ts › launch campaign (D08) › runs from 25 October 2026 00:00 CEST to 1 November 2026 23:59:59 CET`, `› promotes LAUNCH15, a campaign code with the same window`
- `lib/pricing.test.ts › discount codes › LAUNCH15 is valid during the campaign`, `› LAUNCH15 expires at endsAt (exclusive) and stays expired`, `› LAUNCH15 has not started before startsAt`, `› LAUNCH15 is rejected when the campaign is not active`
- `lib/delivery.test.ts › dispatch day › exposes the cut-off as fixed text and no countdown fields`
- `tests/e2e/campaign.spec.ts`: `before endsAt the campaign bar shows its code and the countdown`, `after endsAt the campaign bar is gone and the USP bar shows`, `the campaign bar disappears by itself when endsAt passes while the page is open`

**Handmatig controleren.** Open `/` in twee browsers (of een privévenster): beide tonen dezelfde resterende tijd. Herladen verandert niets. Om het einde te zien: zet in een lokale dev-omgeving `endsAt` (in de campagne en in `launchCode`) op een minuut na nu en wacht. De balk wisselt zonder herladen naar de USP-balk, en de cart rekent geen korting meer voor `LAUNCH15` (D24, D30). Zet de waarde daarna terug. Of draai `npx playwright test tests/e2e/campaign.spec.ts`.

**Restrisico en vóór launch.**

- De launch-campagne is een demo met een einde 7 dagen na de builddatum (brief §4, D08). Vervang hem vóór livegang door een echte, geplande actie, of zet `active: false`. Dit hoort op `docs/TODO-LAUNCH.md` (brief §11).
- Na 1 november 2026 23:59 is de balk weg en werkt `LAUNCH15` niet meer. Dat is correct gedrag, geen fout.
- Een nieuwe campagne krijgt een nieuwe, vaste `endsAt`. Verleng een lopende actie nooit stilletjes: een timer die opnieuw begint, valt onder deze regel.

## Regel 4. Eerlijke prijzen

**Regel.** Geen doorgestreepte van-prijs, tenzij die echt gold (de laagste prijs in de 30 dagen ervoor). Bundelbesparing ten opzichte van de losse prijs tonen mag.

**Afdwinging in code en content.**

- `lib/types.ts`: `previousPrice?: { amount: number; lowestPriceLast30Days: true }`. Wie een vorige prijs zet, moet expliciet verklaren dat het de laagste prijs van de 30 dagen ervoor was.
- `content/products.ts`: geen enkel product heeft `previousPrice` en producten bevatten geen prijzen. Alle prijzen staan in `content/offers.ts` (D07).
- `components/ui/Price.tsx`: een doorgestreepte prijs (`<s>`) verschijnt alleen als `previousPrice` bestaat, `lowestPriceLast30Days === true` is en het bedrag hoger is dan de huidige prijs. `components/pdp/ProductInfo.tsx` en `components/product/ProductCard.tsx` geven alleen `product.previousPrice` door.
- Besparing staat als tekst: "Save €14.90" op de tegels (`content/pdp.ts` `bundle.savings`), "You save" in de cart (`content/cart.ts`). `lib/pricing.ts` `getBundleTileQuote()` rekent de besparing tegen de prijs van één losse stick (`offers.stickPricing[1]`), voor abonnementen tegen losse eenmalige sticks (D45). De groepering in de cart staat als notitie, niet als doorgestreepte prijs (D34).

**Automatische tests.**

- `content/content-guard.test.ts › launch guards › sets no previousPrice and no prices on products`
- `content/offers.test.ts › prices (brief §4, D07) › prices 1, 2 and 3 sticks at €24.95, €44.95 and €59.95`, `› never makes a bundle dearer than buying its sticks in smaller groups (needed for D13)`
- `lib/pricing.test.ts › bundle tile quotes (PLAN §7 rule 10) › quotes one-time tiles`, `› quotes subscription tiles`, `› matches what the cart charges for the same tile`
- `lib/pricing.test.ts › savings ›` drie tests, en `› bundle prices (PLAN §7 fixed values) › matches the e2e cart subtotals for 1, 2, 3, 4 and 7 single-stick lines`
- `tests/e2e/cart-subtotals.spec.ts`: vijf tests, `1 one-time stick: subtotal €24.95` tot en met `7 one-time sticks: subtotal €144.85`
- `tests/e2e/add-to-cart.spec.ts › a 3-stick set goes into the cart as one line with the free Travel Pouch`
- `components/ui/Price.test.tsx › Price ›` drie tests: geen doorgestreepte prijs zonder `previousPrice`; wel bij een verklaarde, hogere vorige prijs; niet bij een vorige prijs die niet hoger is of zonder de verklaring `lowestPriceLast30Days === true` (Vitest verzamelt sinds D55 ook tests in `components/`).

De scan in "Geen tekst uit de referentie" vond op geen enkele route `<s>`, `<del>` of `line-through`.

**Handmatig controleren.** Kijk op een productpagina, de collectie en in de cart: nergens een doorgestreepte prijs. De 3-tegel toont "Save €14.90", de cart "You save". Reken na: 3 × €24,95 − €59,95 = €14,90.

**Restrisico en vóór launch.**

- `lowestPriceLast30Days: true` is een verklaring, geen controle. Houd een prijshistorie bij (de shop of Shopify) voordat iemand een `previousPrice` zet.
- Koppel bij Shopify een `compareAtPrice` niet automatisch aan `previousPrice`; dezelfde voorwaarde blijft gelden. Laat `compareAtPrice` in Shopify leeg, zodat ook de checkout geen doorgestreepte prijs toont.
- Beide punten staan op `docs/TODO-LAUNCH.md` (hoofdstuk 8) en in README, "Shopify koppelen", stap 1.

## Regel 5. Geen dupes of wondermiddelen

**Regel.** Geen verwijzingen naar bestaande parfums of merken ("inspired by …", "smells like …"). Geen feromoon- of aantrekkingsclaims.

**Afdwinging in code en content.**

- `content/content-guard.test.ts` loopt door elke export van elk bestand in `content/` (ook nieuwe bestanden, behalve `content/claims.ts`), roept functies aan met voorbeeldwaarden en faalt op drie soorten tekst:
  - verwijzende formuleringen: "inspired by", "smells like", "dupe", "alternative to", "for fans of", "our answer to" en "our take on", "impression of", "reminiscent of", "similar to", "version of", "clone", "replica", "designer fragrance" en "iconic scent", "same notes as", "a fraction of the price";
  - namen: een lijst van 89 parfumhuizen, modemerken met parfums en bekende parfums (`PERFUME_BRANDS`, onder meer Dior, Chanel, Creed, Tom Ford, Armani, Acqua di Giò, Versace, YSL, Hugo Boss, Paco Rabanne, Jo Malone, Le Labo, Byredo, Margiela, 4711, Guerlain, Hermès, Sauvage, Aventus, Bleu de Chanel, Light Blue en Baccarat Rouge). De lijst is niet volledig: een naam die er niet op staat, vindt alleen een lezer. Omdat Light Blue een parfum is, heet de ringkleur van North Swell nu "Sea blue" (`pdp.ringColour`, `content/assets.ts`);
  - feromoon- en aantrekkingsclaims: "pheromone", "attract", "seduc", "compliment", "women will", "turn heads", "women love" en "she notices", de woorden "she", "her", "ladies" en "girls", "date night", "sex" en "sex appeal", "get noticed", "magnet" en "flirt", plus de hypewoorden (onder meer "irresistible", "magnetic", "addictive", "seductive", "alluring", "sexy", "game-changer", "miracle", "ultimate", "must-have").
- De zes geuren hebben eigen namen en noten uit de brief (`content/products.ts`).
- Solid vs spray vergelijkt met "Spray (in general)", zonder merknamen, met de notitie "A general comparison of formats, not of any product or brand. Sprays differ." (`home.comparison`).
- Alle zichtbare tekst komt uit `content/` (PLAN §13). In componenten staat geen losse copy.

**Automatische tests.**

- `content/content-guard.test.ts › content guard › covers every content module except claims.ts`
- `content/content-guard.test.ts › content guard › has no banned copy in any exported value`
- `content/content-guard.test.ts › content guard › catches what it should (self-test)`: onder meer "For fans of Aventus.", "Our answer to Sauvage.", "Bleu de Chanel, but solid.", "Women love it.", "She will notice.", "Built for date night." en "Sex appeal in a stick." worden gevangen.

**Handmatig controleren.** Lees de productteksten, de FAQ en de vergelijking, en let op namen van andere parfums of merken. De content guard en de scan in "Geen tekst uit de referentie" zoeken alleen naar de formuleringen en de namen op hun lijst; andere namen vindt alleen een lezer.

**Restrisico en vóór launch.**

- De content guard is een lijst met verboden woorden en namen. Een nieuwe omschrijving of een merknaam die niet op de lijst staat, glipt erdoor. Laat nieuwe copy dus ook door een mens lezen, en vul de lijst aan als er een naam bij komt.
- Tekst die niet in `content/` staat, zoals advertenties, social posts en tekst in video's, valt buiten de test. Dezelfde regels gelden daar (`docs/ASSETS.md` §5).

## Regel 6. Claims

**Regel.** In de copy alleen productspecificaties: 15 g, alcoholvrij, twist-up, plantaardige wasbasis. Prestatieclaims (geurduur, aantal toepassingen, handbagagevriendelijk) staan in `content/claims.ts` met `verified: false` en verschijnen pas op de site als ze op `true` staan.

**Afdwinging in code en content.**

- `content/claims.ts`: drie claims (`longevity`, `applications`, `carry-on`), alle `verified: false`, elk met de test die nog moet gebeuren in `evidence`.
- `lib/claims.ts`: `getVerifiedClaim(id)` en `getVerifiedClaims()` geven alleen claims met `verified === true` door. Een waarde als `"true"` (tekst) telt niet.
- De specificaties die de copy mag noemen, staan in `site.specs` (`content/site.ts`): 15 g, alcoholvrij, twist-up, plantaardige wasbasis met jojoba- en kokosolie die smelt op huidtemperatuur, mat zwarte aluminium huls (brief §4).
- `content/content-guard.test.ts` weert in alle content behalve `content/claims.ts`: "hours", "all day", "lasts", "long-lasting", "applications", "carry-on", "hand luggage", "TSA", "leak-proof" en "won't leak", en ook dezelfde claims in andere woorden: "packs easily", "travel-friendly" (en "travel size", "travel-ready"), "fly" en "flight", "liquids bag", "airport-safe", "hrs", "12-hour", "150 uses", "lasting", "weeks of use", "spill-proof" en "mess-free", "no leaks", "waterproof" en "sweat-proof", en "dermatologically tested".
- Waar bezoekers ernaar vragen, belooft de copy niets. De FAQ "How long does it last on skin?" zegt dat het nog wordt getest. "Can I take it when I travel?" noemt alleen de feiten en het voorbehoud: "It is a 15 g solid stick in an aluminium tube. Security rules for solid cosmetics differ per airport and change over time, so check the current rules for your trip." (`content/faq.ts`). Tot de audit van fase 10 stond er "so it packs easily" en "before you fly"; dat las naast de Travel Pouch als een belofte over reizen (D55).
- Een geverifieerde claim verschijnt vanzelf, zonder ander werk (D55):
  - in de accordion "Details" van elke geurpagina, als rij "Tested" met de `text` van elke geverifieerde claim (`VerifiedClaimsRow` in `components/pdp/ProductAccordions.tsx`, via `getVerifiedClaims()`). Zonder geverifieerde claims rendert de rij niets, dus de pagina ziet er bij de launch hetzelfde uit. De claims gaan over de stick van 15 g; de Discovery Set toont ze niet;
  - als antwoord op de FAQ-vraag die ernaar linkt (`claim` in `content/faq.ts`: "how-long-does-it-last" → `longevity`, "travel" → `carry-on`). `faqAnswer()` in `lib/claims.ts` geeft dan de `faqAnswer` (of de `text`) van de claim uit `content/claims.ts`, anders het eigen antwoord. Dat geldt op `/faq`, de homepage en de productpagina's.

**Automatische tests.**

- `lib/guards.test.ts › launch state › has every performance claim unverified, so none is shown`
- `lib/guards.test.ts › claims and reviews helpers › passes on verified claims only`, `› only treats verified: true as verified`
- `content/content-guard.test.ts › launch guards › has no verified claims`
- `content/content-guard.test.ts › content guard › has no banned copy in any exported value` en `› catches what it should (self-test)` (onder meer "It packs easily.", "Fly with it.", "Stays out of the liquids bag.", "Airport-safe.", "8 hrs on skin.", "A 12-hour scent.", "Around 150 uses.", "Spill-proof." en "No leaks, ever.")
- `components/pdp/ProductAccordions.test.tsx › VerifiedClaimsRow › renders nothing at launch (every claim in content/claims.ts is unverified)`, `› renders only the verified claims once a claim is set to verified: true`, `› does not treat a truthy non-boolean as verified`
- `lib/guards.test.ts › FAQ answers and verified claims (brief §2.6) › links the longevity and travel questions to their claims`, `› shows each question's own answer at launch, never the claim`, `› shows the claim's FAQ answer once that claim is verified, and its text when it has none`

**Handmatig controleren.** Zoek op de site naar "hours", "lasts", "carry-on" en "TSA": je vindt niets. De enige vraag over geurduur is de FAQ "How long does it last on skin?", met een antwoord zonder claim. De teksten uit `content/claims.ts` ("Lasts up to 6 hours", "Around 150 applications", "Carry-on friendly") staan op geen enkele pagina; de scan bevestigt dat. Wie wil zien dat een claim verschijnt: zet in een lokale dev-omgeving één claim op `true`, open de accordion "Details" op `/products/north-swell` en de vraag op `/faq`, en zet hem terug (bij de audit zo gecontroleerd op 390 en 1440 px).

**Restrisico en vóór launch.**

- Een claim op `true` staat meteen op elke geurpagina en in de FAQ. Lees de `text` en de `faqAnswer` dus opnieuw na de test: ze moeten precies zeggen wat de test aantoont.
- Zet een claim pas op `true` als de test is gedaan en het bewijs bewaard is. Daarna faalt `content/content-guard.test.ts › launch guards › has no verified claims` bewust: pas die test dan aan.
- De lijst met verboden woorden vangt niet elke formulering ("for weeks", "a long time"). Laat nieuwe copy door een mens lezen.
- Prestatieclaims testen staat op de launchlijst (brief §11).

## Regel 7. Badges

**Regel.** "Best seller" en "Most popular" alleen via een handmatige flag in de productdata. Bij launch staat alleen "New" aan. "Best value" op de 3-sticks-tegel mag, omdat dat feitelijk de laagste stukprijs is.

**Afdwinging in code en content.**

- `lib/types.ts`: `BadgeId = "new" | "best-seller" | "most-popular"`, als lijst `badges` per product.
- `content/products.ts`: de zes geuren en de Discovery Set hebben `badges: ["new"]`; de Travel Pouch en de cadeaukaart hebben geen badge.
- Badges komen alleen uit `product.badges`: `components/product/ProductCard.tsx` en `components/pdp/ProductInfo.tsx` renderen `<Badge>` per item. De labels staan in `site.badges`.
- "Best value": `components/pdp/BundlePicker.tsx` toont hem alleen als `quote.isBestValue` waar is. `lib/pricing.ts` `getBundleTileQuote()` zet dat op de tegel met de laagste prijs per stick (€19,98 tegen €22,48 en €24,95); bij een gelijke stand wint de grotere tegel.

**Automatische tests.**

- `content/content-guard.test.ts › launch guards › only uses the 'new' badge`
- `lib/pricing.test.ts › bundle tile quotes (PLAN §7 rule 10) › quotes one-time tiles` en `› quotes subscription tiles` (alleen de 3-tegel is `isBestValue`)
- `lib/pricing.test.ts › best value tile with other configs › marks the 1-stick tile when it is the cheapest per stick`, `› gives an exact per-stick tie to the larger tile`
- `content/offers.test.ts › prices (brief §4, D07) › never makes a bundle dearer than buying its sticks in smaller groups (needed for D13)` (de prijs per stick daalt met de bundelgrootte)

**Handmatig controleren.** Op home en in de collectie: alleen "New", en geen badge op de Travel Pouch en de cadeaukaart. Op een geurpagina: "Best value" alleen op de tegel "3 sticks".

**Restrisico en vóór launch.**

- Zet `best-seller` of `most-popular` alleen op basis van echte verkoopcijfers. De test `only uses the 'new' badge` faalt dan bewust; pas hem pas aan als die cijfers er zijn.
- "New" blijft nu altijd staan. Haal hem na een redelijke periode weg.

## Regel 8. E-mailpopup

**Regel.** De beloning is echt en komt uit config. Elke kaart geeft dezelfde beloning en dat staat er ook bij. Geen vooraf aangevinkte vakjes, en duidelijk waarvoor iemand zich aanmeldt.

**Afdwinging in code en content.**

- Beloning uit config: `offers.welcomeCode` is `WELCOME10`, een actieve code van 10% in `offers.discountCodes` (`content/offers.ts`). `content/site.ts` leidt `facts.welcomeCode`, `facts.welcomeLabel` en `facts.welcomePercent` daarvan af en gooit een fout als de code ontbreekt. De code werkt echt in `lib/pricing.ts` `priceCart()`, met de voorwaarden "One code per order. Excludes gift cards." (D09).
- Dezelfde beloning: `components/email/RewardCards.tsx` toont op elke kaart dezelfde voorkant (`site.emailCapture.cardFace`). Na het kiezen draaien ook de andere twee om, met "Same reward". Vóór het kiezen staat in de dialoog "Every card reveals the same reward: 10% off your first order." (`sameRewardNote`, `components/email/EmailCapture.tsx`). De pill heet "Turn a card for 10% off", met voor schermlezers "Every card gives the same reward."; de dialoog heet vóór het kiezen "Three cards, one reward" (D55: eigen woorden in plaats van "Pick a card", zie "Geen tekst uit de referentie").
- Geen vinkje: de popup (`components/email/EmailCaptureForm.tsx`) en de nieuwsbrief in de footer (`components/layout/NewsletterForm.tsx`) hebben geen checkbox. Onder het veld staat waarvoor je je aanmeldt: "By signing up you get CORVANE emails about product news, new scents and offers. Unsubscribe any time.", met een link naar de Privacy Policy (`site.emailCapture.consent`).
- Eerlijk over de demo: `/api/subscribe` (`app/api/subscribe/route.ts`) controleert alleen het adres. De knop heet daarom "Show my code" en onder beide formulieren staat "Demo store: your address is not saved and no emails are sent." (`signUpDemoNote`, D52.1).
- Frequentie: `components/email/state.ts` `canAutoOpen()` opent alleen als opslag werkt, de bezoeker zich niet heeft aangemeld en de bezoeker de aanbieding minstens `cooldownDays` (7) dagen geleden voor het laatst zag (`corvane:email-capture:last-shown`). Dat tijdstip wordt gezet bij een automatische opening, en ook als de bezoeker de popup zelf via de pill opent of de pill verbergt (`markShown()`): wie de aanbieding zag of afsloeg, krijgt hem 7 dagen niet vanzelf te zien (D55). Automatisch openen na `delayMs` (8 seconden) of bij exit-intent met een muis (PLAN §10, D51.3).

**Automatische tests.**

- `lib/guards.test.ts › launch state › has a real welcome code: it exists, is active and is a percent code`
- `content/offers.test.ts › discount codes (D08, D09) › has a 10% WELCOME10 code for the popup`
- `lib/pricing.test.ts › discount codes › WELCOME10 on 1 stick rounds half up (2495 -> 250)`, `› WELCOME10 on 3 sticks is 600`, `› never discounts gift cards`
- `content/content-guard.test.ts › withdrawal and sign-up copy (phase 7 review) › never claims that a sign-up was saved or that an email was sent while the endpoint is a stub`
- `components/email/state.test.ts › isCooldownOver ›` vier tests (nooit getoond of onleesbaar; niet binnen 7 dagen, wel vanaf precies 7 dagen; een tijd in de toekomst telt als recent; ISO-tekst) en `› canAutoOpen ›` vijf tests (nooit zonder opslag, ook niet als opslag een fout gooit; wel bij een eerste bezoek; dicht binnen de afkoelperiode na `markShown`, weer open erna; nooit na aanmelden; de testsleutel wordt opgeruimd)
- `tests/e2e/popup.spec.ts`: `the popup opens once, then not after a reload or on another page; the pill still opens it` (controleert ook dat `sameRewardNote` zichtbaar is), `the popup does not open on its own within the cooldown after a client-side navigation`, `opening it from the pill and declining starts the cooldown as well`, `exit intent opens it on desktop, before the timer` (alleen desktop), `without working storage it never opens on its own; the pill still opens it` en `once the 7-day cooldown has passed it opens on its own again`
- `tests/e2e/email-capture.spec.ts › a footer sign-up stops the sign-up window from opening on its own`
- `tests/e2e/welcome-code.spec.ts › WELCOME10 from the popup takes 10% off in the cart drawer and at checkout` (één stick: −€2,50 in de drawer en op `/checkout`)

Geen test controleert dat de drie kaarten dezelfde voorkant hebben of dat de consenttekst in beeld staat; dat volgt uit de code (één `cardFace` voor alle kaarten, de consenttekst altijd onder het veld). De scan in "Geen tekst uit de referentie" vond op geen enkele route `type="checkbox"`.

**Handmatig controleren.** Open `/` in een privévenster en wacht 8 seconden. De popup zegt vóór het kiezen dat elke kaart dezelfde beloning geeft. Draai een kaart om: alle drie tonen 10%. Onder het e-mailveld staat waarvoor je je aanmeldt, zonder vinkje. Na "Show my code" staat `WELCOME10` in beeld; toegepast in de cart gaat er 10% af (niet op cadeaukaarten). Herlaad: de popup opent niet opnieuw. In een nieuw privévenster: open de popup zelf via de pill, kies "No thanks" en herlaad; ook dan opent hij niet vanzelf.

**Restrisico en vóór launch.**

- Koppel een e-mailtool (bijvoorbeeld Klaviyo) aan `/api/subscribe`, met double opt-in en een vastgelegde toestemming. Haal daarna `signUpDemoNote` weg en pas de knop en de bevestiging aan (D52).
- "10% off your first order" wordt nu niet afgedwongen (D09). De e-mailtool of Shopify moet dat doen.
- Stuur alleen e-mail over wat de consenttekst noemt: productnieuws, nieuwe geuren en aanbiedingen.

## Geen tekst uit de referentie

Brief §10 vraagt te controleren dat er geen tekst uit de referentie op de site staat.

**Waarom een directe vergelijking niet kan.** penroseskin.com was vanuit de bouwomgeving niet te bereiken: de proxy weigerde de verbinding, WebFetch werkte op geen enkel domein en ook archiefkopieën waren geblokkeerd (D03, `docs/REFERENCE.md`). Er is dus nooit tekst, beeld, code of CSS van de referentie in de bouwomgeving geweest, en `reference/` is leeg. Alle copy is geschreven vanuit de brief: het merk (§3), het product (§4), de toon met de drie voorbeeldzinnen en de beschrijving van de onderdelen (§6). Een tekst naast de referentie leggen kon daardoor niet.

**De controle.** Op 25 oktober 2026 heb ik daarom gezocht naar sporen van overname:

- (a) de beschrijving van de referentie in de brief zelf (§1 en §6, links van elke pijl), in het Nederlands en in een waarschijnlijke Engelse vertaling: "penrose", "kies een kaart, win een beloning", "kies een kaart", "win een beloning", "win a reward", "pick a card", "choose a card", "spin" en "prize", "seasonal sale", "zojuist gekocht" en "just bought", "people viewing", "Trustpilot", en rating- of klantaantallen (zoals "1,200 customers" of "350 reviews");
- (b) typische copy van de productcategorie die op kopiëren of op verboden claims wijst: namen van parfumhuizen, merken en parfums (bij de audit van fase 10 toegevoegd, dezelfde lijst als `PERFUME_BRANDS` in de content guard), "pheromone", "inspired by", "body butter", "iconic fragrances", "designer fragrance", "luxury perfume", "smells like", "dupe", "impression of", "our take on", "alternative to", "compliments", "attract", "women love", "turn heads", "skincare", "body wash", "long-lasting", "lasts all day", "TSA", "travel-friendly", "carry-on friendly", hypewoorden, "only 3 left", "selling fast", "sold out", "as seen in" en "loved by";
- daarnaast, alleen op de gerenderde pagina's: `aggregateRating`, "Rated … out of 5", een doorgestreepte prijs (`<s>`, `<del>`, `line-through`), de claimteksten uit `content/claims.ts`, "Best seller" en "Most popular", en `type="checkbox"`.

Waar gezocht is:

1. **Alle strings in `content/*.ts`.** Alle 15 contentbestanden, inclusief `content/claims.ts` en `content/assets.ts`: elke export, recursief, met de functies aangeroepen met voorbeeldwaarden, net als de content guard. Samen 2.975 strings.
2. **De broncode.** Alle 173 bestanden in `app/`, `components/`, `lib/`, `content/` en `public/` (`.ts`, `.tsx`, `.css`, `.svg`, zonder tests), regel voor regel, inclusief commentaar.
3. **De gerenderde HTML van elke route.** De 19 URL's uit de sitemap, plus `/checkout`, `/account`, een onbekende productslug en een onbekende pagina: 23 routes, elk op 390 × 844 en 1440 × 900. Per route de HTML van de server (inclusief de RSC-payload) en de zichtbare tekst na hydratie, met de klok vastgezet in de campagne, zodat de campagnebalk meedoet. Op `/` is ook de e-mailpopup geopend. Gemeten met Playwright op de dev-server.

**Resultaat.**

- Gerenderde pagina's: **0 treffers** op alle 23 routes in beide breedtes, voor (a), (b) en de extra regelcontroles, met de patronen van 25 oktober.
- Broncode: **geen treffer in copy**. Wel zes treffers in commentaar: regelbeschrijvingen ("No chance, no prize draw" in `content/site.ts`, de woorden die de content guard weert in `content/legal.ts`, het voorbeeldlabel in `components/ui/Stars.tsx`) en woorden die toevallig matchen ("separated by", "must have"). De zevende treffer is de claim in `content/claims.ts` (zie hieronder).
- Content: **geen treffer voor (a) of (b)**, op twee verwachte plekken na. `content/claims.ts` bevat "Carry-on friendly", de claim met `verified: false` die nergens wordt getoond (regel 6). En drie labelfuncties voor echte reviews (`home.reviews.count`, `home.reviews.ratingLabel` en `site.ui.rating`) gaven met voorbeeldwaarden teksten als "3 reviews" en "Rated 3 out of 5". Die verschijnen alleen bij echte reviews (regel 2).

**Correctie na de audit van fase 10 (D55).** De scan van 25 oktober zocht in (a) alleen naar de lange vorm "pick a card, win". De site gebruikte de eerste helft van die formulering wel: de pill heette "Pick a card for 10% off" (`site.emailCapture.pillLabel`) en de dialoog "Pick a card" (`site.emailCapture.title`); de kaartgroep had het label "Choose a card" (`cardsLabel`). Met de patronen "pick a card" en "choose a card" waren dat drie treffers in `content/site.ts`; de pill staat na 240 px scrollen op bijna elke route en de titel in elke geopende popup. "0 treffers" en "geen copy die erop wijst" klopten dus niet. Het is een korte, algemene instructie voor het mechaniek dat de brief zelf voorschrijft, maar regel 1 gaat boven alles. Daarom zijn de teksten herschreven in eigen woorden: de pill "Turn a card for 10% off" (het werkwoord dat de popup al gebruikte: "Turn any card, then leave your email to get the code."), de titel "Three cards, one reward" en het groepslabel "Reward cards". De content guard weert nu "pick a card", "choose a card", "win a reward", "kies een kaart" en "win een beloning" (regel "reference pill wording").

**Herhaald op 26 oktober 2026**, na de oplossingen van D55, met het uitgebreide patroon uit "Zelf herhalen" (inclusief de namen van parfumhuizen en parfums):

- broncode (`content`, `app`, `components`, `lib`, zonder tests): **0 treffers**;
- de HTML van de server, inclusief de RSC-payload, van de 19 URL's uit de sitemap plus `/checkout` en `/account`: **0 treffers** per route;
- de popup, die pas in de browser rendert, met Playwright op 390 × 844 en 1440 × 900: pill "Turn a card for 10% off", titel "Three cards, one reward", na het kiezen "Your reward";
- alle strings in `content/` via de content guard (`npm test`), met de nieuwe regels voor formuleringen, namen en aantrekkingsclaims: geen treffer.

Een eerdere audit scande de gerenderde site ook op ongeveer 90 namen van parfums en ontwerpers (23 routes, beide breedtes, tijdens en na de campagne, met drawer, menu, popup, finder en formulieren). De enige treffer was de ringkleur "Light blue" van North Swell, ook de naam van een bekend parfum; die heet nu "Sea blue".

Conclusie: er staat geen tekst van de referentie op de site. De ene korte formulering die erop leek ("Pick a card"), is gevonden en vervangen.

**Zelf herhalen.** Met de dev-server op `localhost:3000`:

```sh
PATTERN='pheromon|inspired by|body butter|iconic (fragrance|scent)|smells? like|\bdupes?\b|penrose|trustpilot|(pick|choose) a card|win a reward|kies een kaart|win een beloning|for fans of|reminiscent of|impression of|\b(dior|chanel|creed|tom ford|armani|acqua di|versace|ysl|saint laurent|hugo boss|rabanne|jo malone|le labo|byredo|margiela|4711|guerlain|herm[eè]s|givenchy|prada|gucci|burberry|calvin klein|davidoff|cool water|montblanc|bvlgari|bulgari|lacoste|gaultier|azzaro|valentino|dolce|issey miyake|kenzo|ralph lauren|diptyque|kilian|amouage|kurkdjian|mugler|old spice|lynx|sauvage|aventus|bleu de|invictus|light blue|baccarat|santal 33)\b'
grep -rniE "$PATTERN" content app components lib --include=*.ts --include=*.tsx | grep -v '\.test\.tsx\?:'
for path in $(curl -s http://localhost:3000/sitemap.xml | grep -o '<loc>[^<]*' | sed -E 's#<loc>https?://[^/]+##') /checkout /account; do
  printf '%s %s\n' "${path:-/}" "$(curl -s "http://localhost:3000${path}" | grep -ciE "$PATTERN")"
done
```

De `grep` hoort niets terug te geven en elke route hoort op 0 te eindigen. De popup rendert pas in de browser en staat dus niet in deze HTML; zijn teksten staan in `content/site.ts` en vallen onder de `grep` en de content guard. Deze lijst is een deel van de patronen hierboven; de content guard (`npm test`) dekt de woorden en namen uit regels 2, 5 en 6 voor `content/`.

**Vóór launch.** Bekijk de referentie zodra die bereikbaar is en leg de teksten echt naast elkaar (D06, `docs/REFERENCE.md`).

## Overige controles uit brief §10

| Controle | Stand | Bron |
| --- | --- | --- |
| `npm run lint` | Slaagt: `eslint .` meldt geen fouten en geen waarschuwingen (eindverificatie 26 oktober 2026, na de oplossingen van D55) | eindverificatie fase 10 |
| `npm run typecheck` | Slaagt: `next typegen` ("Types generated successfully"), daarna `tsc --noEmit` zonder fouten (idem) | eindverificatie fase 10 |
| `npm test` (Vitest) | 17 testbestanden, 317 tests, alle geslaagd (idem; was 13 bestanden en 293 tests op 25 oktober) | eindverificatie fase 10 |
| `npm run build` | Slaagt (idem): 43 statische pagina's gegenereerd. Alle pagina's `○`; de negen productpagina's volledig vooraf gerenderd (alleen de lege schil `◐ /products/[slug]`, D44; de regel `[+7 more paths]` krijgt het symbool van die schil); de OG-beelden `○` en `●`; alleen de API-routes `ƒ` | eindverificatie fase 10, D53.8, D54.4 |
| Playwright (`npm run test:e2e`) | Op de productiebuild (`next build` en `next start -p 3200` via de `webServer` uit `playwright.config.ts`): 64 geslaagd, 10 overgeslagen, 0 mislukt (1,3 minuut). Overgeslagen: de acht screenshots, die alleen met `SCREENSHOTS=1` draaien, de mobiele overlaptest in het desktopproject en de exit-intent-test in het mobiele project. In fase 9: 55 geslaagd, 9 overgeslagen | eindverificatie fase 10, verificatie fase 9 |
| `npm run screenshots` | 8 van de 8 geslaagd (idem), op een nieuwe productiebuild | eindverificatie fase 10 |

**Screenshots.** `npm run screenshots` maakt home, collectie, productpagina en de open cart drawer met 3 sticks op 390 × 844 en 1440 × 900 in `screenshots/` (niet in git, PLAN §15). Fase 9 heeft ze bekeken en de afwijkingen opgelost (commit `6e3137b`). In de eindverificatie van 26 oktober 2026 zijn de acht bestanden opnieuw gemaakt en over de volle paginalengte bekeken. Er is geen overlap, geen afgekapte tekst, geen horizontale scroll en geen rommelige afstand gevonden, dus er hoefde niets te worden opgelost. Ook de teksten van D55 staan goed: de pill "Turn a card for 10% off" en de lege staat van de reviews ("No reviews yet", "CORVANE is new. Reviews appear here as they come in."). Op de desktopscreenshot van de productpagina staat de galerij alleen bovenaan en is de linkerkolom daaronder leeg. Dat komt door de screenshot, niet door de pagina: de galerij is vanaf `md` sticky en blijft bij het scrollen in beeld.

**Lighthouse (mobiel, gesimuleerde throttling, op `next start`).**

| Meting | `/` | `/products/north-swell` | Overig |
| --- | --- | --- | --- |
| Fase 8, mediaan van 3 runs (D53.7) | 95 | 97 | Toegankelijkheid, best practices en SEO 100; CLS 0 |
| Fase 8, 10 extra runs (D53.7) | mediaan 96, laagste 93 | mediaan 96, laagste 90 | CLS 0 in elke run |
| Na de review van fase 8, 10 runs (D54.4) | mediaan 97 | mediaan 94, laagste 91 | Toegankelijkheid, best practices en SEO 100; CLS 0 |
| Eindmeting, mediaan van 3 runs (26 oktober 2026) | **95** (runs 93, 95, 96); FCP 1,07 s, LCP 2,36 s, TBT 208 ms | **96** (runs 95, 96, 97); FCP 1,06 s, LCP 2,41 s, TBT 166 ms | Toegankelijkheid, best practices en SEO 100 in elke run; CLS 0 in elke run |

De eindmeting draaide op de build van de eindverificatie, geserveerd met `npx next start -p 3800` en na één opwarmverzoek per pagina. Lighthouse 13.5.0 (`npx --yes lighthouse@13`) gebruikte dezelfde instellingen als in fase 8: mobiel, gesimuleerde throttling, `--only-categories=performance,accessibility,best-practices,seo` en headless Chromium.

De ondergrens uit brief §7 is 90. Elke run van de eindmeting haalt die; de laagste was 93 op `/` en 95 op de productpagina. Na het plaatsen van echte foto's (de hero-foto en de packshots) moet de meting opnieuw (`docs/ASSETS.md` §2).

**Toegankelijkheid.** Samenvatting van de audit in fase 8 (D53.6):

- axe (WCAG 2.0 en 2.1, A en AA, plus best practices): 0 overtredingen op alle 22 routes uit PLAN §1 op 390 × 844 en 1440 × 900, en in extra toestanden (open en lege cart drawer, mobiel menu, popup voor en na het omdraaien, resultaat van de finder, mix & match, foutmeldingen in formulieren). Na de review van fase 8 opnieuw 0 op de productpagina's, de onbekende slug, `/` en `/collections/all` (D54.4).
- `tests/e2e/a11y.spec.ts` draait axe bij elke e2e-run op `/`, `/collections/all`, `/products/north-swell`, `/checkout` en de open en lege cart drawer, in beide breedtes.
- Met de hand gecontroleerd: de hele koopflow met alleen het toetsenbord, zichtbare focus op 17 routes, focusvolgorde, focus-trap, Esc en focus terug in drawer, menu en popup, de skiplink, `prefers-reduced-motion`, 200 % zoom, reflow op 320 px, tekstafstand (WCAG 1.4.12) en raakvlakken.
- Bekende beperkingen: bij een standaardlettergrootte van 32 px op 390 px steken de antwoordtegels van de finder ongeveer 11 px uit en worden de labels van de fotoplekken afgekapt. Kleurstalen tonen op telefoons alleen kleur (de naam bij selectie of focus). Drie secundaire bedieningen zijn kleiner dan 44 px, maar minstens 24 px (WCAG AA). Niet getest: echte schermlezers en Windows-hoogcontrast.

## Samenvatting: wat er vóór de launch moet

Deze punten horen op `docs/TODO-LAUNCH.md` (brief §11):

1. De referentie bekijken zodra die bereikbaar is en de site ernaast leggen (regel 1).
2. Een review-app koppelen, alleen echte reviews tonen en pas "verified" zeggen als `home.reviews.verification` beschrijft hoe aankopen gecontroleerd worden (regel 2).
3. De demo-campagne vervangen door een echte actie met een vaste einddatum, of uitzetten (regel 3).
4. Een prijshistorie bijhouden vóór iemand een `previousPrice` zet, en `compareAtPrice` van Shopify nooit automatisch overnemen (regel 4).
5. De claims testen en een claim pas na de test op `true` zetten; hij verschijnt dan vanzelf in Details en de FAQ (regel 6).
6. Een e-mailtool koppelen met double opt-in, "first order" afdwingen en de demoregel weghalen (regel 8).
7. Echte foto's en video's volgens `docs/ASSETS.md`, met licenties en modelreleases (regel 1).
