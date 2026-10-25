# CORVANE: bouwopdracht voor Claude Code

> **Gebruik:** zet dit bestand in een lege map, open Claude Code in die map en typ:
> `Lees CORVANE-BRIEF.md en voer de opdracht volledig uit.`

<!-- Transcriptie van CORVANE-BRIEF.pdf (aangeleverd als PDF). Inhoud ongewijzigd. -->

## 0. Zo werk je

- Werk autonoom van begin tot eind. Stel geen vragen; neem redelijke aannames en noteer ze in `docs/DECISIONS.md`.
- Bouw het project in de submap `corvane/`. Deze brief blijft in de hoofdmap.
- Werk de fases uit §9 op volgorde af en commit na elke fase (begin met `git init` als er nog geen repo is).
- Taal: alle sitecopy in het Engels. Code, comments en commits in het Engels. `README.md` en alles in `docs/` in het Nederlands.

## 1. Doel

Bouw een complete, mobile-first webshop voor het verzonnen merk **CORVANE** (direct-to-consumer, verkeer vooral via Instagram en TikTok). Gebruik penroseskin.com als referentie voor paginastructuur, klantreis en conversiemechanieken. Al het andere maak je zelf: merk, product, teksten, beeld en look. Het eindresultaat moet eruitzien als een volwassen premium merk, niet als een template.

## 2. Harde regels

Deze regels gaan boven alles in deze brief. Ze houden de shop binnen het auteurs- en merkenrecht en de Nederlandse regels voor online verkoop (ACM).

1. **Referentie, geen kopie.** Neem van penroseskin.com alleen structuur, sectievolgorde, flow en interactiepatronen over. Kopieer geen teksten, afbeeldingen, logo's, iconen, code, CSS of kleurenschema's.
2. **Geen verzonnen social proof.** Geen bedachte reviews, sterrenscores, Trustpilot-badges, klantaantallen, "X mensen bekijken dit"- of "zojuist gekocht"-meldingen. Review- en ratingcomponenten bouw je wel, maar ze tonen niets (of een nette lege staat) zolang `content/reviews.ts` leeg is.
3. **Echte timers.** Een afteltimer hoort alleen bij een actie met een vaste einddatum uit `content/offers.ts`. Nooit resetten per bezoeker of per dag; na de einddatum verdwijnen balk en timer vanzelf.
4. **Eerlijke prijzen.** Geen doorgestreepte van-prijs, tenzij die echt gold (de laagste prijs in de 30 dagen ervoor). Bundelbesparing ten opzichte van de losse prijs tonen mag.
5. **Geen dupes of wondermiddelen.** Geen verwijzingen naar bestaande parfums of merken ("inspired by ...", "smells like ..."), geen feromoon- of aantrekkingsclaims.
6. **Claims.** In de copy alleen productspecificaties: 15 g, alcoholvrij, twist-up, plantaardige wasbasis. Prestatieclaims (geurduur, aantal toepassingen, handbagagevriendelijk) staan in `content/claims.ts` met `verified: false` en verschijnen pas op de site als ze op `true` staan.
7. **Badges.** "Best seller" en "Most popular" alleen via een handmatige flag in de productdata. Bij launch staat alleen "New" aan, want het merk is nieuw. "Best value" op de 3-sticks-tegel mag, omdat dat feitelijk de laagste stukprijs is.
8. **E-mailpopup.** De beloning is echt en komt uit config. Elke kaart geeft dezelfde beloning en dat staat er ook bij. Geen vooraf aangevinkte vakjes, en duidelijk waarvoor iemand zich aanmeldt.

## 3. Het merk

- **Naam:** CORVANE (uitspraak kor-VAYN). *Cor* (Latijn: hart) + *vane* (windvaan): draait mee met de wind, maar staat vast op zijn punt.
- **Tagline:** Scent with direction.
- **Verhaal (fictief):** ontstaan aan de Noordzeekust, gemaakt voor mannen die goed willen ruiken zonder een fles parfum mee te slepen.
- **Doelgroep:** mannen van 20 tot 40; gym, werk, reizen, uitgaan.
- **Tone of voice:** zelfverzekerd, droog, korte zinnen. Geen hypewoorden ("irresistible", "magnetic"), geen uitroeptekens, geen emoji in de copy. Voorbeeldregels voor de toon (de rest schrijf je zelf):
  - "Cologne that fits in your pocket."
  - "Twist. Swipe. Go."
  - "No glass. No spray. No fuss."
- **Logo:** wordmark CORVANE in Fraunces semibold met ruime letterspatiëring, plus een minimalistisch windvaan-pijltje als los icoon en favicon. Beide als SVG.

## 4. Het product (verzonnen)

**CORVANE Solid Cologne:** vaste eau de cologne in een twist-up stick.

- 15 g, mat zwarte aluminium huls met gegraveerd windvaan-icoon; per geur een gekleurde ring onderaan.
- Formule (fictief): plantaardige wasbasis met jojoba- en kokosolie, alcoholvrij, smelt op huidtemperatuur.
- Gebruik: omhoog draaien, twee of drie halen over polsen, nek en borst.

**Geuren** (alle zes origineel):

| Slug | Naam | Familie | Top / hart / basis | Ringkleur |
| --- | --- | --- | --- | --- |
| north-swell | North Swell | Fresh | sea salt, bergamot / sage / white cedar | #6FA8C7 |
| drift-and-ember | Drift & Ember | Woody | pink pepper / driftwood / smoked vetiver, amber | #C26A3D |
| lantern-smoke | Lantern Smoke | Dark | black pepper / leather / tonka | #8B2E2E |
| dune-fig | Dune Fig | Green | green fig / dune grass / soft musk | #7E9A5B |
| iron-coast | Iron Coast | Citrus | grapefruit / mineral accord / vetiver | #8C9399 |
| harbour-tea | Harbour Tea | Aromatic | cardamom / black tea / cedarwood | #A9844F |

**Overige producten**

- Discovery Set: 6 mini-sticks van 3 g (alle geuren), €29,95
- Travel Pouch (canvas): €9,95 los, gratis vanaf 3 sticks
- E-gift card: €25, €50 of €100 (digitaal, geen verzending)

**Prijzen en aanbod** (EUR incl. btw, alles in `content/offers.ts`):

- 1 stick €24,95 · 2 sticks €44,95 · 3 sticks €59,95 + gratis Travel Pouch.
- De cart groepeert sticks automatisch: per 3 stuks €59,95, een rest van 2 €44,95, een rest van 1 €24,95. Discovery Set, pouch en gift cards tellen niet mee.
- Subscribe & save: 15% korting, levering elke 1, 2 of 3 maanden (UI en datamodel; de echte koppeling volgt later). Groepering geldt per aankooptype.
- Verzending: landen en tarieven in `content/shipping.ts`. Start met NL en BE: €4,95, gratis vanaf €50. Cut-off 15:00 (Europe/Amsterdam), alleen werkdagen, feestdagen in config.
- Garantie: `guaranteeDays: 30` in config, los van het wettelijke herroepingsrecht van 14 dagen.
- Kortingscodes in config: een welkomstcode voor de popup (bijv. `WELCOME10`, 10%) en een optionele campagnecode.
- Campagne: `{ active, name, message, endsAt, code? }`. Zet voor de demo een launch-campagne aan met `endsAt` 7 dagen na de builddatum, en noteer in `docs/TODO-LAUNCH.md` dat dit vóór livegang een echte actie moet worden.

## 5. Visuele identiteit

Design tokens als CSS-variabelen en in het Tailwind-theme:

| Token | Hex | Gebruik |
| --- | --- | --- |
| ink | #101418 | tekst |
| deep | #0F2733 | donkere secties, hero |
| sand | #EEE6D8 | lichte secties |
| fog | #F7F5F1 | paginaachtergrond |
| signal | #E2562B | CTA's en accenten, spaarzaam |
| kelp | #2E4A3F | secundair |

- Op signal altijd ink-tekst, nooit wit (wit haalt geen AA-contrast). Controleer alle kleurcombinaties op WCAG AA.
- Typografie via `next/font`: koppen in Fraunces (600), body en UI in Inter (400 tot 600), labels in Inter uppercase met ruime tracking.
- Stijl: veel witruimte, grote serif-koppen, afgeronde cards (16px) en pills, subtiele schaduwen. Bewust geen goud of bruin in de huisstijl, zodat het niet op de referentie lijkt.
- **Beeld:** geen foto's van anderen. Maak per geur een consistente SVG-productrender (huls, gekleurde ring, gegraveerd icoon) en een groepsrender van drie sticks voor de hero. Lifestyle- en UGC-plekken krijgen nette placeholders (verloop + label "PHOTO: ..."). Schrijf `docs/ASSETS.md`: een shotlist voor echte foto's en video's (packshot per geur, schaalfoto in de hand, lifestyle gym/werk/reizen, 9:16 UGC-video's) met de formaten en bestandsnamen die de site verwacht, zodat alles later één op één te vervangen is.

## 6. Wat de referentie doet en wat CORVANE ervan maakt

**Homepage, bovenste deel:**

1. Promobalk met seizoensactie, bundelaanbod en live timer → campagnebalk uit config. Zonder actieve campagne een roterende USP-balk (gratis verzending vanaf €50, garantie, verzenddag).
2. Header met hamburger links, logo in het midden, account en winkelwagen met teller rechts → zelfde opbouw op mobiel, op desktop een horizontale nav (Shop, Discovery Set, Gift Cards, About, FAQ). Sticky.
3. Hero op donkere achtergrond: groepsfoto van drie producten, ratingregel, grote kop, subregel, twee USP-pills → groepsrender, eigen kop, USP-pills uit de specificaties. Ratingregel alleen bij echte reviews.
4. Leverbalk met verzenddag, landvlag en gratis-verzendgrens → dynamisch berekend uit `content/shipping.ts`.
5. Productgrid met sectielabel en sorteerdropdown; cards met badge, beeld met tekstoverlay, sterren en aantal → cards met badge, render, familie en drie noten als overlay, naam, prijs en quick-add. Sterren alleen bij echte reviews.
6. Zwevende pill "kies een kaart, win een beloning" → pill linksonder die een modal opent met drie omgedraaide kaarten. Elke kaart onthult dezelfde echte beloning (de welkomstcode). E-mailveld met consenttekst. Verschijnt na 8 seconden of bij exit-intent op desktop, maximaal één keer per 7 dagen (localStorage in try/catch).

**Lager op de homepage:** bekijk de volgorde bij de referentie (§8) en neem die over waar het logisch is. Bouw in elk geval:

7. How it works: drie stappen met iconen.
8. Solid vs spray: eerlijke vergelijking van solid cologne met spray in het algemeen (geen merknamen): formaat, alcohol, glas, lekrisico.
9. Scent finder: quiz van drie vragen die een geur aanraadt (client-side).
10. Reviews (alleen echte data) en een rij 9:16-videoplekken voor eigen content.
11. Garantieblok, FAQ-accordion, teaser van het merkverhaal.
12. Footer: nieuwsbrief, kolommen Shop / Help / Company / Legal, betaaliconen uit config, placeholders voor KvK-nummer, btw-nummer en adres, socials.

**Productpagina** (`/products/[slug]`; de referentie werkt met geurvarianten, bundels, abonnementen en cadeaukaarten):

- Galerij (swipe op mobiel, thumbnails op desktop): render, schaalbeeld in de hand, notenkaart, lifestyle.
- Titel, korte omschrijving, familie, noten als chips en intensiteitsmeters (Fresh ↔ Warm, Projection), gemarkeerd als indicatief.
- Geurkiezer als swatches in de ringkleur.
- Bundelkiezer: tegels voor 1, 2 en 3 sticks met stukprijs en besparing. Bij 2 of 3 kiest de klant per stick een geur (mix & match). De 3-tegel toont de gratis Travel Pouch.
- Aankooptype: eenmalig of Subscribe & save (–15%, elke 1, 2 of 3 maanden).
- Add to cart, plus een sticky add-to-cart-balk op mobiel zodra de knop uit beeld is.
- Leverschatting en trustrij (veilig betalen, gratis verzending vanaf €50, garantie).
- Accordions: Details, How to use, Ingredients (INCI-placeholder), Shipping & returns.
- Cross-sell (Discovery Set, Travel Pouch), reviews (alleen echte), FAQ.

**Collectie** (`/collections/all`): filter op geurfamilie, sorteren (featured, prijs, nieuwste), dezelfde cards.

**Cart drawer:** schuift in van rechts, focus-trap, sluit met Esc. Voortgangsbalk naar gratis verzending met een tweede mijlpaal (3 sticks = gratis pouch). Regels met geur(en), aankooptype, aantal-stepper en verwijderen. Upsellrij, subtotaal, totale besparing, "Taxes included", checkoutknop, betaaliconen en een nette lege staat.

**Overige pagina's:** About, FAQ, Contact (formulier als stub), Shipping & Returns (inclusief 14 dagen herroepingsrecht), Privacy Policy, Terms & Conditions, Cookie Policy, Legal notice, Account (stub), Checkout (stub met besteloverzicht, kortingscodeveld en de melding "Demo checkout: no payment is taken"), 404. Juridische teksten krijgen bovenaan `TODO: laten controleren`.

## 7. Techniek

- Next.js (App Router), TypeScript strict, Tailwind CSS. Toegankelijke primitives (bijv. Radix) voor dialog, drawer en accordion; geen zware UI-kits.
- Alle content en data in `content/` (`site.ts`, `products.ts`, `offers.ts`, `shipping.ts`, `reviews.ts`, `faq.ts`, `claims.ts`), zodat tekst aanpassen nooit componentwerk is.
- Prijslogica puur en getest in `lib/pricing.ts`: bundelgroepering per aankooptype, abonnementskorting, kortingscodes, verzendkosten en besparing.
- Commerce-laag in `lib/commerce/` met een interface (`getProducts`, `getProduct`, `createCheckout`) en een lokale implementatie, zodat Shopify (Storefront API) later kan worden ingeplugd zonder UI-wijzigingen. De README legt uit hoe.
- Cart in React context + localStorage (in try/catch, werkt ook zonder storage).
- SEO: metadata per pagina, OG-afbeeldingen, JSON-LD `Product` met `offers` (zonder `aggregateRating` zolang er geen echte reviews zijn), `sitemap.ts`, `robots.ts`.
- Analytics: `lib/analytics.ts` met dataLayer-events (`view_item`, `add_to_cart`, `begin_checkout`, `sign_up`). Niets van derden laadt zonder cookieconsent; de consentbanner staat alleen aan als `analytics.enabled` true is.
- Toegankelijkheid: zichtbare focus, volledige toetsenbordbediening, `prefers-reduced-motion` respecteren.
- Performance: Lighthouse mobiel 90+ voor home en productpagina; `next/image`, `next/font`, geen layout shift door balken of popups.
- Tests: Vitest voor `lib/pricing.ts` en de verzenddaglogica; Playwright-smoketests (home laadt, product toevoegen, cart-subtotaal klopt bij 1, 2, 3, 4 en 7 sticks, campagnebalk weg na `endsAt`, popup maximaal één keer).

## 8. Referentie zelf bekijken

Bekijk voor je bouwt de homepage, de collectie, één productpagina en de cart drawer van penroseskin.com. De site rendert veel via JavaScript; levert WebFetch te weinig op, gebruik dan Playwright met een mobiele viewport (390×844). Schrijf je observaties in `docs/REFERENCE.md`: alleen structuur, volgorde, interacties en conversiemechanieken, in je eigen woorden. Screenshots van de referentie gaan in `reference/` (in `.gitignore`), nooit in `public/`.

## 9. Fases

1. Referentie bekijken → `docs/REFERENCE.md`
2. Plan → `docs/PLAN.md` (sitemap, componenten, datamodel); niet wachten op goedkeuring
3. Scaffold, design tokens, logo, favicon en productrenders
4. Layout: promobalk, header, footer, cart drawer
5. Homepage
6. Collectie en productpagina
7. E-mailpopup, scent finder en overige pagina's
8. SEO, analytics-hooks, toegankelijkheid, performance
9. Tests en visuele controle
10. Oplevering

## 10. Klaar is pas klaar als

- `npm run lint`, `npm run typecheck` (`tsc --noEmit`), `npm run build` en alle tests slagen.
- Je met Playwright screenshots hebt gemaakt van home, collectie, productpagina en open cart drawer op 390×844 en 1440×900, ze zelf hebt bekeken en alles hebt opgelost wat niet strak is (overlap, afgekapte tekst, horizontale scroll, rommelige afstanden).
- `docs/COMPLIANCE.md` per regel uit §2 beschrijft hoe die in de code is afgedwongen, en je hebt gecontroleerd dat er geen tekst uit de referentie in de site staat.

## 11. Oplevering

- `README.md`: starten (`npm install`, `npm run dev`), content aanpassen, deployen op Vercel, Shopify koppelen.
- `docs/TODO-LAUNCH.md`: echte foto's en video's (zie `ASSETS.md`), review-app koppelen (bijv. Judge.me of Trustpilot), Shopify of een betaalprovider, e-mailtool (bijv. Klaviyo), juridische teksten laten controleren, merknaam en domein checken (BOIP/EUIPO), prestatieclaims testen, KvK, btw-nummer en adres invullen, garantietermijn bevestigen, launch-campagne omzetten naar een echte actie.
- Eindbericht in de chat: wat er gebouwd is, welke aannames je deed en de vijf belangrijkste open punten.
