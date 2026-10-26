# Te doen vóór livegang

De shop draait nu als demo: verzonnen merk, geen betaling, placeholders voor beeld en bedrijfsgegevens, en juridische concepten. Deze lijst noemt alles wat vóór livegang nog moet gebeuren. Elk punt zegt waarom het nodig is, waar het in de code of content zit, en wanneer het klaar is. Vink een punt af in dezelfde commit als de wijziging. D-nummers verwijzen naar `docs/DECISIONS.md`; hoe je de content aanpast, staat in `README.md`.

Een paar launchtests falen bewust zodra content verandert zonder het bewijs dat de brief vraagt, bijvoorbeeld bij de eerste review of een geverifieerde claim. Pas zo'n test aan in dezelfde commit als het bewijs.

## 1. Merk, bedrijf en domein

- [ ] **Merknaam laten checken bij BOIP en EUIPO**
  - **Waarom:** CORVANE is verzonnen. Voor je investeert in verpakking, domein en marketing moet vaststaan dat de naam vrij is voor cosmetica en parfum (Nice-klasse 3).
  - **Waar:** buiten de code. Bij een nieuwe naam: `site.name` in `content/site.ts`, het woordmerk in `components/brand/Wordmark.tsx` en `public/brand/` (D19).
  - **Klaar als:** een merkenonderzoek in het Benelux-register (BOIP) en het EU-register (EUIPO) is gedaan en het merk is aangevraagd, of er is een andere naam gekozen.

- [ ] **Domein registreren en `NEXT_PUBLIC_SITE_URL` zetten**
  - **Waarom:** canonical-URL's, sitemap, robots.txt, Open Graph en JSON-LD gebruiken nu `https://corvane.example`, een gereserveerd domein dat niet werkt (D53.1).
  - **Waar:** domein in Vercel onder **Settings → Domains**; `NEXT_PUBLIC_SITE_URL` in de Environment Variables van Production (README, "Deployen op Vercel").
  - **Klaar als:** het domein werkt met HTTPS en `/sitemap.xml`, `/robots.txt` en de canonical-tag van de homepage tonen het echte domein.

- [ ] **KvK-nummer, btw-nummer, adres en telefoon invullen**
  - **Waarom:** een webwinkel moet zijn identiteit tonen. Nu zijn alle bedrijfsgegevens placeholders met "(placeholder)" erachter (D27).
  - **Waar:** `site.company` in `content/site.ts` (`legalName`, `kvk`, `vat`, `address`); de telefoon in `companyRows` in `content/legal.ts`; de directeur en andere gegevens in de Legal notice in `content/legal.ts`.
  - **Klaar als:** footer, Legal notice, Terms (artikel 1) en `/shipping-returns` echte gegevens tonen en geen bedrijfsgegeven nog "(placeholder)" draagt.

- [ ] **Echt e-mailadres en mailbox**
  - **Waarom:** `hello@corvane.example` staat op een gereserveerd domein en kan geen mail ontvangen (D52.1).
  - **Waar:** `companyEmail` en `companyEmailNote` in `content/site.ts`. De test "marks the placeholder company email like the other company details" in `content/content-guard.test.ts` gaat dan mee.
  - **Klaar als:** het adres mail ontvangt, de markering "(placeholder)" nergens meer achter het adres staat en de test het echte adres controleert.

- [ ] **Echte socials koppelen**
  - **Waarom:** Instagram en TikTok linken nu naar de homepage van het platform (`placeholder: true`).
  - **Waar:** `site.socials` in `content/site.ts`. Zonder `placeholder` komen de profielen vanzelf in `sameAs` van de JSON-LD (`realSocialProfiles()` in `lib/seo.ts`, D53.3).
  - **Klaar als:** beide links naar de eigen profielen gaan en `placeholder` weg is.

- [ ] **Merkverhaal laten kloppen**
  - **Waarom:** het verhaal ("Started on the North Sea coast") en de Legal notice ("CORVANE is a fictional brand") horen bij de demo. Een echt merk mag geen verhaal vertellen dat niet waar is.
  - **Waar:** `site.story` in `content/site.ts`, `home.story` in `content/home.ts`, de About-pagina in `content/pages.ts` en de sectie `demo` in de Legal notice in `content/legal.ts`.
  - **Klaar als:** elke zin over herkomst en productie klopt en de demo-sectie weg is.

- [ ] **JSON-LD van de organisatie aanvullen**
  - **Waarom:** `Organization` laat `legalName`, adres en e-mail weg zolang dat placeholders zijn (D53.3).
  - **Waar:** `organizationJsonLd()` in `lib/seo.ts`. Dat is een codewijziging; de gegevens komen uit `site.company`.
  - **Klaar als:** de JSON-LD van de homepage de echte bedrijfsnaam, het adres en het e-mailadres bevat en de Rich Results Test van Google geen fouten geeft.

## 2. Product en verpakking

- [ ] **Formule, INCI-lijst en cosmeticaregels**
  - **Waarom:** de formule is verzonnen (brief §4). Een cosmetisch product mag in de EU pas op de markt met een verantwoordelijke persoon, een veiligheidsbeoordeling, een melding in het CPNP-portaal en een etiket met de volledige ingrediëntenlijst (Verordening (EG) 1223/2009). De productpagina toont nu een placeholder voor de INCI-lijst.
  - **Waar:** `pdp.accordions.ingredients` in `content/pdp.ts` (`inciPlaceholder`, `isPlaceholder`).
  - **Klaar als:** de fabrikant de INCI-lijst per geur heeft geleverd, die op de productpagina staat, en de verantwoordelijke persoon de veiligheidsbeoordeling en de CPNP-melding heeft afgerond.

- [ ] **Noten en intensiteit vaststellen met de echte geuren**
  - **Waarom:** noten en meters zijn verzonnen en onderling ingeschat, niet gemeten (D22). Ze moeten passen bij wat de parfumeur levert.
  - **Waar:** `notes`, `intensity`, `description` en `mood` per geur in `content/products.ts`; de punten van de scent finder in `content/finder.ts` (D23).
  - **Klaar als:** de parfumeur noten en karakter per geur heeft bevestigd en `npm test` (ook `content/finder.test.ts`) slaagt.

- [ ] **Sticks verzegeld leveren**
  - **Waarom:** de uitzondering op het herroepingsrecht voor geopende sticks geldt alleen als sticks en mini-sticks echt verzegeld worden geleverd (D28). De teksten op de site gaan daar al van uit.
  - **Waar:** verpakking en magazijn. De belofte staat op `/shipping-returns`, in Terms artikel 12, in de accordion "Shipping & returns" op de productpagina, in de FAQ en in het garantieblok op de homepage.
  - **Klaar als:** elke stick en mini-stick een zegel heeft dat je moet breken om hem te openen. Is dat niet zo, dan moeten al die teksten aangepast worden (zie hoofdstuk 7).

## 3. Beeld en video

- [ ] **Echte foto's en video's maken en plaatsen**
  - **Waarom:** producten zijn nu SVG-renders en alle lifestyle-, schaal- en videoplekken zijn placeholders ("PHOTO: …", "VIDEO: …"). De brief verbiedt foto's van anderen (§5).
  - **Waar:** shotlist, formaten en bestandsnamen in `docs/ASSETS.md`; per plek `src` (en voor video's `poster`) in `content/assets.ts`; bestanden in `public/images/` en `public/videos/` (README, "Foto's en video's").
  - **Klaar als:** elke plek uit `docs/ASSETS.md` een eigen bestand heeft, `src` overal is ingevuld en geen pagina nog een placeholder toont.

- [ ] **Performance opnieuw meten na de foto's**
  - **Waarom:** de scores van fase 8 gelden voor SVG-renders (D53.7, D54.4). Een foto als hero kan de LCP verschuiven.
  - **Waar:** de hero (`components/home/Hero.tsx`) en de galerij op de productpagina; `PhotoSlot` heeft een `preload`-prop voor het LCP-beeld.
  - **Klaar als:** Lighthouse mobiel op `next start` voor `/` en `/products/north-swell` minstens 90 scoort en CLS 0 blijft (README, "Lighthouse").

- [ ] **Productfoto's eventueel in de sitemap (optioneel)**
  - **Waarom:** de sitemap bevat nu geen beelden, omdat Next.js `<image:image>` op een plek zet die een strikte validator afkeurt (D54.3).
  - **Waar:** `app/sitemap.ts` en de test in `lib/seo.test.ts` die controleert dat geen regel `images` heeft.
  - **Klaar als:** besloten is of echte productfoto's in de sitemap komen, en de sitemap valide is.

## 4. Reviews, claims en badges

- [ ] **Review-app koppelen**
  - **Waarom:** reviews en sterren tonen nu een lege staat, omdat er geen echte reviews zijn (regel 2). Echte reviews helpen verkopen, maar alleen als ze echt zijn.
  - **Waar:** een review-app zoals Judge.me of Trustpilot. Importeer alleen echte reviews in `content/reviews.ts` (type `Review` in `lib/types.ts`), of laad ze in een server component van de provider. Pas de launchtests "has no reviews" in `content/content-guard.test.ts` en "has no reviews and no rating" in `lib/guards.test.ts` aan. Voor reviewuitnodigingen per e-mail is een grondslag nodig (hoofdstuk 7, punt 13).
  - **Klaar als:** de app reviews van echte kopers verzamelt, de site alleen die toont (sterren, ratingregel, reviewsectie en `aggregateRating` in de JSON-LD verschijnen dan vanzelf) en de tests weer slagen.

- [ ] **Zeggen hoe reviews gecontroleerd worden, vóór "verified"**
  - **Waarom:** wie reviews toont, moet zeggen of en hoe hij controleert dat ze van echte kopers komen, en mag ze pas "verified" noemen als hij dat echt controleert (ACM; richtlijn oneerlijke handelspraktijken art. 7 lid 6 en bijlage I punt 23 ter, D55). Zonder controle toont de site de neutrale kop "What reviewers say", geen label "Verified buyer" en de regel "Reviews are not checked against orders."
  - **Waar:** `home.reviews.verification` in `content/home.ts` (nu `null`): één of twee zinnen die de echte controle beschrijven, bijvoorbeeld dat de app elke review aan een bestelling koppelt. Daarna toont `components/home/ReviewsSection.tsx` die tekst onder de kop, het label bij reviews met `verifiedPurchase: true` en de kop "From verified buyers" als alle getoonde reviews gecontroleerd zijn. Zet `verifiedPurchase` alleen bij een gecontroleerde aankoop. De test "keeps the empty-state copy neutral about who reviews" in `components/home/ReviewsSection.test.tsx` legt `verification: null` vast en gaat mee.
  - **Klaar als:** de review-app aankopen echt controleert, `verification` precies die controle beschrijft (en dezelfde uitleg in de Privacy Policy of een reviewbeleid staat), `verifiedPurchase` uit de app komt en `npm test` slaagt.

- [ ] **Prestatieclaims testen en onderbouwen**
  - **Waarom:** geurduur ("up to 6 hours"), aantal toepassingen ("around 150") en handbagage zijn niet getest (regel 6). Ongetest mogen ze niet op de site.
  - **Waar:** `content/claims.ts` (`text`, `faqAnswer`, `verified`, `evidence`). Een claim op `verified: true` verschijnt vanzelf: als rij "Tested" in de accordion Details van elke geurpagina (`VerifiedClaimsRow` in `components/pdp/ProductAccordions.tsx`) en als antwoord op de FAQ-vraag die ernaar linkt (`claim` in `content/faq.ts`, `faqAnswer()` in `lib/claims.ts`; "How long does it last on skin?" en "Can I take it when I travel?"). Pas de launchtests in `content/content-guard.test.ts` ("has no verified claims"), `lib/guards.test.ts` ("has every performance claim unverified" en "shows each question's own answer at launch") en `components/pdp/ProductAccordions.test.tsx` ("renders nothing at launch") aan.
  - **Klaar als:** per claim een testrapport bewaard is (draagtest met een panel, gebruikstest per stick, de geldende regels voor vaste cosmetica op luchthavens), `evidence` dat rapport beschrijft, `text` en `faqAnswer` precies zeggen wat de test aantoont en pas dan `verified: true` staat.

- [ ] **Badges alleen met cijfers**
  - **Waarom:** "Best seller" en "Most popular" mogen alleen als ze kloppen (regel 7). Bij launch staat alleen "New" aan.
  - **Waar:** de array `badges` per product in `content/products.ts`; de launchtest "only uses the 'new' badge" in `content/content-guard.test.ts`.
  - **Klaar als:** er een vaste regel is wanneer een badge aan mag (bijvoorbeeld de best verkochte geur van de afgelopen 30 dagen) en de verkoopcijfers die onderbouwen. Tot dan blijft het "New".

## 5. Verkopen en betalen

- [ ] **Shopify of een betaalprovider koppelen**
  - **Waarom:** de checkout is een demo; er wordt niets betaald of besteld. `lib/commerce/shopify.ts` is een stub (D26).
  - **Waar:** `lib/commerce/shopify.ts`, `externalIds` in `content/products.ts`, `COMMERCE_PROVIDER` en de `SHOPIFY_`-variabelen. Het stappenplan staat in `README.md`, "Shopify koppelen". Kies je een andere provider, schrijf dan een eigen `CommerceProvider` (`lib/commerce/types.ts`) en voeg hem toe in `lib/commerce/index.ts`.
  - **Klaar als:** een testbestelling via de echte checkout loopt, betaald wordt in testmodus en een orderbevestiging oplevert, en daarna één echte bestelling in productie.

- [ ] **Prijsregels in de checkout gelijk aan de site**
  - **Waarom:** de site rekent met `lib/pricing.ts`. De echte checkout moet op de cent hetzelfde uitkomen, anders klopt wat de klant zag niet met wat hij betaalt.
  - **Waar:** de bundelkorting (Shopify Function of automatische korting, D13), de gratis Travel Pouch (één per bestelling, D11), de afronding per bundel op abonnement (D12) en de grens voor gratis verzending vóór de kortingscode (D14). De testwaarden staan in PLAN §7 en in README, "Shopify koppelen", stap 8.
  - **Klaar als:** alle testwaarden uit PLAN §7 in de echte checkout hetzelfde totaal geven als de cart drawer.

- [ ] **Betaalmethoden gelijk aan de provider**
  - **Waarom:** footer en cart drawer tonen iDEAL, Bancontact, Visa, Mastercard, PayPal en Apple Pay als eigen tekstbadges (D33). Die lijst moet kloppen met wat de provider aanbiedt.
  - **Waar:** `site.paymentMethods` in `content/site.ts`; de betaalmethoden in Terms artikel 9 (`content/legal.ts`) volgen daaruit.
  - **Klaar als:** elke getoonde methode in de checkout werkt en elke methode van de checkout in de lijst staat.

- [ ] **Demoteksten weghalen**
  - **Waarom:** de site zegt op veel plekken dat het een demo is. Na livegang klopt dat niet meer.
  - **Waar:** `site.footer.demoNotice` en `signUpDemoNote` in `content/site.ts`; `cartCopy.checkout` in `content/cart.ts` (`demoNotice`, `placeOrder`, `result`, `formNote`); het antwoord over betaalmethoden in `content/faq.ts`; `pages.contact.demoNotice` en de meldingen van het contactformulier in `content/pages.ts`; `demoLine` en de sectie `demo` in `content/legal.ts`; `pdp.purchaseType.subscriptionNote` en `pdp.accordionsFor.giftCard.howItWorks.note` in `content/pdp.ts`. De tests in `content/content-guard.test.ts` die de demo bewaken ("never claims that a sign-up was saved…") gaan mee.
  - **Klaar als:** zoeken op "demo" in `content/` niets meer oplevert dat bezoekers zien.

- [ ] **Bestemming van `/checkout` bepalen**
  - **Waarom:** met een externe checkout stuurt de cart drawer klanten direct naar Shopify. De demopagina `/checkout` blijft dan bestaan en is direct bereikbaar, met de melding dat er niet betaald wordt.
  - **Waar:** `app/checkout/page.tsx`, `components/checkout/CheckoutView.tsx`, `NOINDEX_PATHS` in `lib/seo.ts`.
  - **Klaar als:** `/checkout` doorstuurt naar de echte checkout of de cart, of weg is, en de tests in `tests/e2e/` daarop zijn aangepast.

- [ ] **Cadeaukaarten echt uitgeven en inwisselen**
  - **Waarom:** de e-gift card is nu alleen een product in de cart. Er wordt geen code gemaild en inwisselen kan niet ("becomes available when the shop goes live").
  - **Waar:** de cadeaukaartfunctie van Shopify of de betaalprovider; `pdp.accordionsFor.giftCard` in `content/pdp.ts` (`howItWorks.note`, `validity.term`); Terms artikel 15.
  - **Klaar als:** een gekochte kaart per e-mail aankomt, in de checkout werkt, de geldigheidstermijn op de kaart staat en de teksten dat beschrijven.

- [ ] **Klantaccounts (optioneel)**
  - **Waarom:** `/account` is een stub zonder inloggen (D51.5). Abonnees willen hun abonnement zelf beheren.
  - **Waar:** `app/account/page.tsx`, `pages.account` in `content/pages.ts`; het klantportaal van de abonnementsapp.
  - **Klaar als:** besloten is of accounts er komen. Zo ja: inloggen werkt en abonnees kunnen zelf opzeggen.

## 6. Abonnementen

- [ ] **Echte facturering en opzeggen voor Subscribe & save**
  - **Waarom:** abonnementen bestaan nu alleen in de UI en het datamodel. De site belooft "Cancel any time before your next delivery" (D28).
  - **Waar:** selling plans in Shopify (elke 1, 2 en 3 maanden, 15%), `shopifySellingPlanIds` in `content/products.ts` (README, stap 3 en 4); `pdp.purchaseType.subscriptionNote` in `content/pdp.ts`; Terms artikelen 7 en 21.
  - **Klaar als:** een testabonnement de eerste levering en een vervolglevering correct afrekent en de klant online kan opzeggen, net zo makkelijk als afsluiten.

- [ ] **Groeperen per interval controleren**
  - **Waarom:** de cart telt abonnementssticks met verschillende intervallen samen voor de bundelprijs (D10). In Shopify kunnen dat aparte abonnementen worden, met elk hun eigen vervolgleveringen.
  - **Waar:** `groupSticks()` en `priceCart()` in `lib/pricing.ts`, de bundelkorting in Shopify.
  - **Klaar als:** vaststaat of sticks met verschillende intervallen samen een set mogen vormen, ook bij vervolgleveringen, en `lib/pricing.ts`, D10 en Shopify hetzelfde doen.

- [ ] **Prijs per vervolglevering controleren**
  - **Waarom:** de site belooft per levering de bundelprijs min 15%, per bundel afgerond: 3 sticks €50,96, 2 sticks €38,21, 1 stick €21,21 (D12). Een korting die alleen op de eerste bestelling werkt, maakt vervolgleveringen duurder.
  - **Waar:** de instellingen van de bundelkorting voor abonnementen in Shopify (geldig voor alle vervolgbetalingen).
  - **Klaar als:** de tweede levering van een testabonnement exact het bedrag van de tegel op de productpagina kost.

## 7. Juridisch

- [ ] **Juridische teksten laten controleren door een jurist**
  - **Waarom:** Privacy Policy, Terms & Conditions, Cookie Policy, Legal notice en `/shipping-returns` zijn Engelse concepten voor een Nederlandse B.V. die verkoopt in NL en BE (D27). Ze zijn niet gecontroleerd.
  - **Waar:** `content/legal.ts` (de vier juridische pagina's) en `pages.shippingReturns` in `content/pages.ts`. Maak voor de jurist een Vercel-preview met `NEXT_PUBLIC_SHOW_LEGAL_CHECKS=true`: dan staan de notities "Legal check" bij de teksten (D52.2).
  - **Klaar als:** de jurist alle teksten en de punten hieronder heeft beoordeeld en de wijzigingen in `content/legal.ts` en `content/pages.ts` staan.

- [ ] **De open juridische punten afhandelen** (de lijst `legalCheckpoints` in `content/legal.ts`)
  - **Waarom:** deze punten hangen af van keuzes of wetsuitleg die een jurist moet bevestigen.
  - **Waar:** per punt het artikel of de pagina tussen haakjes.
  - **Klaar als:** elk punt hieronder is afgevinkt en `legalCheckpoints` leeg is of alleen nog bewuste keuzes bevat.
  - [ ] 1. Uitzondering op het herroepingsrecht voor verzegelde cosmetica: geldt alleen als sticks en mini-sticks echt verzegeld zijn en de klant het vóór het bestellen weet (D28; `/shipping-returns`, Terms artikel 12, productpagina, FAQ, garantieblok).
  - [ ] 2. Cadeaukaarten: herroepingsrecht zolang de kaart ongebruikt is, en de geldigheidstermijn. België eist minstens één jaar met de einddatum op de kaart; bevestig wat in Nederland geldt (Terms artikel 15, productpagina).
  - [ ] 3. Btw op cadeaukaarten: waarschijnlijk vouchers voor meerdere doeleinden, met btw bij inwisselen in plaats van bij verkoop. De cart laat "Taxes included." weg bij een bestelling met alleen cadeaukaarten (D34). Bevestig de behandeling en de tekst in cart, checkout en factuur.
  - [ ] 4. Gedeeltelijke herroeping uit een set: terugbetaling van het aandeel van dat artikel in de setprijs; de gratis Travel Pouch blijft bij de klant (Terms artikelen 5 en 11, `/shipping-returns`).
  - [ ] 5. Abonnementen: online opzeggen even makkelijk als afsluiten, geen minimale looptijd, herroepingstermijn vanaf de eerste levering, termijn voor prijswijzigingen (nu placeholder: 30 dagen) (Terms artikelen 7 en 21).
  - [ ] 6. Garantie van 30 dagen: de eisen voor een commerciële garantie (artikel 7:6a BW): garantiegever, reikwijdte, gebied, duur en claimprocedure, plus retourkosten en één claim per artikel (Terms artikel 14, `/shipping-returns`, garantieblok).
  - [ ] 7. Vooruitbetaling: artikel 7:26 lid 2 BW beperkt hoeveel een consument vooruit moet betalen. Bevestig de checkout en Terms artikel 9.
  - [ ] 8. Totstandkoming en bevestiging: orderbevestiging per e-mail met de voorwaarden erbij (duurzame gegevensdrager) en de tekst op de bestelknop (Terms artikelen 2 en 8).
  - [ ] 9. Conformiteit: vermoedenstermijn van één jaar in Nederland en twee jaar in België, en de wettelijke garantie van minstens twee jaar in België (Terms artikel 13).
  - [ ] 10. Aansprakelijkheid: toetsen aan de grijze lijst voor consumentenvoorwaarden (artikel 6:237 BW) (Terms artikel 17).
  - [ ] 11. Klachten en geschillen: CORVANE is geen lid van een Nederlandse geschillencommissie (placeholder); de Belgische Consumentenombudsdienst; het Europese ODR-platform is gesloten, dus de Terms linken er niet naar (Terms artikel 19).
  - [ ] 12. Taal: site en teksten zijn alleen in het Engels. Bepaal of een Nederlandse versie nodig is, en voor België een Franse.
  - [ ] 13. Reviewuitnodigingen: grondslag (toestemming of de uitzondering voor bestaande klanten in artikel 11.7 Telecommunicatiewet) en afmelden (Privacy Policy).
  - [ ] 14. E-mailtool: het meten van openen en klikken vraagt toestemming of moet uit; de Privacy Policy volgt de instellingen van de tool.
  - [ ] 15. Bewaartermijnen (nu placeholders), de lijst van verwerkers en zelfstandige partijen (betaalprovider, vervoerder) en doorgifte buiten de EER met de waarborgen (Privacy Policy).
  - [ ] 16. Functionele opslag: bevestig dat de opslag van de e-mailpopup geen toestemming vraagt (Cookie Policy). Met analytics aan: provider, cookies en bewaartermijnen noemen.
  - [ ] 17. De tekst van het modelformulier voor herroeping op `/shipping-returns` (bijlage I(B) bij richtlijn 2011/83/EU).

- [ ] **Garantietermijn bevestigen**
  - **Waarom:** 30 dagen garantie is een commerciële belofte bovenop het wettelijke herroepingsrecht (brief §4, D28). Termijn en voorwaarden (retourkosten voor de klant, één claim per artikel, niet voor cadeaukaarten) moeten passen bij de marge en het retourproces.
  - **Waar:** `guaranteeDays: 30` in `content/offers.ts`; alle teksten volgen daaruit. De voorwaarden staan in `home.guarantee` (`content/home.ts`), Terms artikel 14 en `/shipping-returns`. `content/offers.test.ts` legt 30 vast.
  - **Klaar als:** eigenaar en jurist de termijn en de voorwaarden hebben bevestigd en de test de bevestigde termijn controleert.

- [ ] **Retourbeleid in de JSON-LD**
  - **Waarom:** `hasMerchantReturnPolicy` ontbreekt bewust zolang herroepingsrecht en de uitzondering voor verzegelde sticks niet gecontroleerd zijn (D53.3).
  - **Waar:** `productJsonLd()` en `offerJsonLd()` in `lib/seo.ts`.
  - **Klaar als:** na de juridische controle het retourbeleid in de JSON-LD staat en de Rich Results Test geen fouten geeft.

- [ ] **De zichtbare meldingen "TODO: laten controleren" weghalen na de controle**
  - **Waarom:** de melding hoort bij een concept (brief §6). Na de controle zegt hij iets wat niet meer klopt.
  - **Waar:** dit is een codewijziging. `<LegalNotice />` staat in `components/legal/LegalPage.tsx` en `app/shipping-returns/page.tsx`. De vlag `pages.shippingReturns.showLegalReviewNotice` in `content/pages.ts` wordt nu door geen component gelezen. De launchtest "puts the exact legal review notice on every legal page and on /shipping-returns" in `content/content-guard.test.ts` moet mee, net als `reviewNotice` in `content/legal.ts`.
  - **Klaar als:** geen pagina de melding nog toont, `npm test` slaagt en dit pas gebeurd is nadat de jurist klaar is.

## 8. Aanbod en kortingscodes

- [ ] **Prijshistorie en doorgestreepte prijzen**
  - **Waarom:** een doorgestreepte van-prijs mag alleen als die echt gold: de laagste prijs in de 30 dagen ervoor (brief §2.4; artikel 6 bis van de prijsaanduidingsrichtlijn 98/6/EG). De site controleert dat niet: `lowestPriceLast30Days: true` is een verklaring van wie de prijs invult. De meest waarschijnlijke weg naar een foute van-prijs is de `compareAtPrice` van een Shopify-variant.
  - **Waar:** `previousPrice` in `content/products.ts` (type in `lib/types.ts`), `components/ui/Price.tsx`; bij Shopify de `compareAtPrice` per variant. Die mag nooit automatisch naar `previousPrice` (ook niet in `lib/commerce/shopify.ts`) en blijft in Shopify leeg, zodat ook de checkout geen doorgestreepte prijs toont (README, "Shopify koppelen", stap 1). De launchtest "sets no previousPrice and no prices on products" in `content/content-guard.test.ts` gaat mee als er ooit een `previousPrice` komt.
  - **Klaar als:** er een prijslog is met per product en dag de prijs over minstens de 30 dagen vóór een korting, en elke `previousPrice` (en elke `compareAtPrice` in Shopify) daaruit volgt; of er nergens een staat.

- [ ] **Launch-campagne omzetten naar een echte actie**
  - **Waarom:** de demo-campagne "Launch week" (`LAUNCH15`, 15%) loopt tot 1 november 2026, 23:59. Die datum is gekozen als zeven dagen na de builddatum (D08). Een afteltimer mag alleen bij een echte actie met een vaste einddatum (regel 3).
  - **Waar:** `offers.campaign` en `launchCode` in `content/offers.ts`; dezelfde code met dezelfde start en eind in Shopify. Het blok "launch campaign (D08)" in `content/offers.test.ts` legt de demodata vast en gaat mee; zie ook `lib/campaign.test.ts` en `tests/e2e/campaign.spec.ts` (README, "Campagne").
  - **Klaar als:** er een geplande actie staat met een vaste `endsAt` als ISO-tekst en een code die precies zo lang werkt (D30), of `active: false` staat; en `npm test` en `npm run test:e2e` slagen.

- [ ] **`WELCOME10` alleen voor de eerste bestelling**
  - **Waarom:** popup en nieuwsbrief beloven "10% off your first order". De demo controleert dat niet (D09).
  - **Waar:** de kortingscode in Shopify (één keer per klant, alleen voor klanten zonder eerdere bestelling) of unieke codes uit de e-mailtool. Unieke codes vragen een UI-wijziging: de popup toont nu `offers.welcomeCode`.
  - **Klaar als:** een tweede gebruik van `WELCOME10` door dezelfde klant in de echte checkout geweigerd wordt.

## 9. E-mail en klantenservice

- [ ] **E-mailtool koppelen aan `/api/subscribe`**
  - **Waarom:** aanmelden via popup of footer bewaart en verstuurt nu niets (D35, D52).
  - **Waar:** `app/api/subscribe/route.ts`. Roep daar de e-mailtool aan (bijvoorbeeld Klaviyo), aan de serverkant met een geheime API-key uit de omgeving. Houd het antwoord `{ ok: true }` of `{ ok: false, error: "invalid-email" }` gelijk; dan hoeven `NewsletterForm` en de popup niet te veranderen. Geef `source` door ("footer" of "popup"). Regel double opt-in, afmelden en "first order" voor `WELCOME10` (D09).
  - **Klaar als:** een aanmelding in de lijst van de tool staat met de juiste bron, de welkomstmail met de code aankomt en afmelden werkt.

- [ ] **Aanmeldteksten aanpassen na de koppeling**
  - **Waarom:** de formulieren zeggen nu eerlijk dat er niets wordt bewaard (D52.1). Na de koppeling klopt dat niet meer.
  - **Waar:** `signUpDemoNote` in `content/site.ts` leeg maken (de formulieren laten de regel dan weg); `site.newsletter.success` en `site.emailCapture.submit` ("Show my code") herschrijven als de code ook gemaild wordt. Pas de test "never claims that a sign-up was saved or that an email was sent while the endpoint is a stub" in `content/content-guard.test.ts` aan.
  - **Klaar als:** geen aanmeldtekst nog over een demo gaat en de teksten precies zeggen wat er gebeurt.

- [ ] **Contactformulier koppelen aan een helpdesk**
  - **Waarom:** `POST /api/contact` controleert het formulier en gooit het bericht weg (D51.5).
  - **Waar:** `app/api/contact/route.ts`. Houd hetzelfde antwoord, dan hoeft `components/contact/ContactForm.tsx` niet te veranderen. Voeg daar ook rate limiting en spambescherming toe. Pas `pages.contact.demoNotice` en `pages.contact.form` in `content/pages.ts` aan.
  - **Klaar als:** een testbericht in de helpdesk binnenkomt en de bevestiging op de site dat zegt.

## 10. Analytics en consent

- [ ] **Google Tag Manager en Consent Mode inrichten**
  - **Waarom:** analytics staat standaard uit: geen banner, geen script, geen cookies (D53.5). Wie wil meten, heeft een container nodig die Consent Mode respecteert.
  - **Waar:** een GTM-container met GA4 en Consent Mode. Zet `NEXT_PUBLIC_ANALYTICS_ENABLED=true` en `NEXT_PUBLIC_GTM_ID` in Vercel en deploy opnieuw. De events (`view_item`, `add_to_cart`, `begin_checkout`, `sign_up`) gaan al naar `window.dataLayer` (`lib/analytics.ts`).
  - **Klaar als:** op een preview de banner bij het eerste bezoek verschijnt zonder verzoeken naar derden, GTM pas na "Accept analytics" laadt, "Reject analytics" geen cookies achterlaat en de events in GA4 binnenkomen.

- [ ] **Cookie Policy en Privacy Policy bijwerken voor analytics**
  - **Waarom:** de Cookie Policy zegt nu dat de site geen eigen cookies zet. Met analytics aan zetten GTM en GA wel cookies (`_ga`, `_gid`), en die moeten genoemd worden (D53.5).
  - **Waar:** de Cookie Policy en Privacy Policy in `content/legal.ts`; de teksten die nu "(placeholder)" voor de analyticsprovider noemen.
  - **Klaar als:** provider, cookies en bewaartermijnen er staan vóórdat analytics in productie aangaat.

## 11. Verzending

- [ ] **Vervoerder kiezen en levertijden bevestigen**
  - **Waarom:** de levertijden (NL 1 werkdag, BE 1 tot 2), de cut-off om 15:00 en het tarief van €4,95 zijn aannames (D15). De leverbalk en de leverschatting rekenen ermee.
  - **Waar:** `content/shipping.ts` (`cutoff`, `countries[].transitDays`, `rate`, `freeFrom`); dezelfde tarieven in de checkout (Shopify). `content/shipping.test.ts` legt de huidige waarden vast.
  - **Klaar als:** het contract met de vervoerder de levertijden en de ophaaltijd onderbouwt, de config daarbij past en de checkout dezelfde tarieven rekent.

## 12. Referentie

- [ ] **De referentie penroseskin.com opnieuw bekijken**
  - **Waarom:** de site was vanuit de bouwomgeving niet bereikbaar, dus de structuur volgt alleen §6 van de brief (D03, D06).
  - **Waar:** `docs/REFERENCE.md` (de lijst onder "Wat nog moet"); screenshots alleen in `reference/`, nooit in `public/`.
  - **Klaar als:** homepage, collectie, één productpagina en de cart drawer bekeken zijn op 390 × 844, de observaties in eigen woorden in `docs/REFERENCE.md` staan en besloten is of de volgorde van secties moet schuiven. Neem alleen structuur en flow over, geen tekst, beeld of code (regel 1).

## 13. Toegankelijkheid

- [ ] **Testen met echte schermlezers en Windows-hoogcontrast**
  - **Waarom:** axe en de handmatige controles vonden niets (D53.6), maar echte schermlezers en forced colors zijn niet getest.
  - **Waar:** de koopflow (productpagina, cart drawer, checkout), de e-mailpopup en de scent finder.
  - **Klaar als:** de koopflow werkt met NVDA, VoiceOver en TalkBack en in Windows-hoogcontrast, en gevonden problemen zijn opgelost.

- [ ] **Bekende beperkingen afwegen**
  - **Waarom:** D53.6 noemt beperkingen die binnen WCAG AA vallen maar beter kunnen: kleurstalen tonen op telefoons alleen kleur, de Tab-volgorde van de checkout op desktop en drie bedieningen kleiner dan 44 px.
  - **Waar:** `components/pdp/ScentSwatches.tsx`, `components/checkout/CheckoutView.tsx`, de pauzeknop in `components/layout/promo/CampaignMessage.tsx`, de geurkeuze in `components/cart/CartUpsell.tsx`.
  - **Klaar als:** per punt besloten is of het blijft, en de gekozen aanpassingen gedaan zijn.

## 14. Onderhoud (terugkerend)

- [ ] **Feestdagen elk jaar aanvullen**
  - **Waarom:** de lijsten lopen tot en met 2027. Zonder een nieuw jaar klopt de leverschatting rond feestdagen niet meer (D15).
  - **Waar:** `nlHolidays` en `beHolidays` in `content/shipping.ts`. `content/shipping.test.ts` rekent elk jaar in de lijst na. 5 mei staat er niet in, behalve als je in een lustrumjaar (de eerstvolgende is 2030) besluit dat het een vrije dag is; pas dan ook `expectedDutch` in die test aan.
  - **Klaar als:** het komende jaar in beide lijsten staat, uiterlijk in het najaar ervoor, en `npm test` slaagt.

- [ ] **Vaste datums bijwerken**
  - **Waarom:** datums worden nooit berekend, omdat dat de pagina's dynamisch zou maken (D35, D53.4).
  - **Waar:** `site.footer.copyright` in `content/site.ts` (elk jaar); `CONTENT_UPDATED` in `lib/seo.ts` (bij elke contentwijziging, voor de sitemap); `UPDATED` in `content/legal.ts` (bij elke wijziging van de juridische teksten).
  - **Klaar als:** de datums kloppen na elke wijziging en elk nieuw jaar.

- [ ] **Controleren na een update van Next.js of React**
  - **Waarom:** drie keuzes hangen af van details van deze versies. `components/layout/InstantReveal.tsx` leunt op een interne variabele van React (`$RT`); `experimental.turbopackChunking` in `next.config.ts` is experimenteel (D53.7); `htmlLimitedBots` in `next.config.ts` moet weg zodra een route metadata streamt (D54.2).
  - **Waar:** `next.config.ts`, `components/layout/InstantReveal.tsx`; de documentatie van de geïnstalleerde versie staat in `node_modules/next/dist/docs/`.
  - **Klaar als:** na elke update `npm run build`, `npm test` en `npm run test:e2e` slagen en Lighthouse mobiel voor `/` en `/products/north-swell` boven de 90 blijft.

- [ ] **Collectierijen controleren bij een andere catalogus**
  - **Waarom:** de breedtes van de brede cards zijn afgestemd op de negen producten van de launch, zodat elke rij vol is (D47).
  - **Waar:** `ITEM_CLASSES` in `app/collections/all/page.tsx`.
  - **Klaar als:** na het toevoegen of weghalen van een product elke rij van de collectie vol is bij 2, 3 en 4 kolommen, in elke sortering.
