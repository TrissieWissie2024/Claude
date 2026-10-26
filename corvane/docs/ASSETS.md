# Beeld: shotlist voor foto's en video's

Dit document hoort bij brief §5 en PLAN §14. De site heeft nog geen foto's of video's. Elke beeldplek staat met een vaste sleutel, een vast pad, een verhouding en een pixelmaat in `content/assets.ts`. Dit document is uit dat bestand afgeleid. Lever je precies wat hier staat, dan vervang je elke placeholder één op één.

Wat er nodig is:

- 31 fotoplekken: 9 packshots, 8 schaalfoto's in de hand, 8 lifestylefoto's per product, 4 lifestylescènes, 1 groepsfoto voor de hero en 1 foto voor het merkverhaal;
- 1 extra desktopuitsnede van de hero, die de huidige layout niet gebruikt (D39);
- 4 video's in 9:16, elk met een posterbeeld.

Zolang een plek leeg is (`src: null`), toont de site de SVG-render van het product of een placeholder in dezelfde verhouding met het label "PHOTO: …" of "VIDEO: …" (D21, D41).

## 1. Zo vervang je een placeholder

1. Exporteer het bestand volgens §2 op de pixelmaat uit de tabel.
2. Zet het in `public/` op het pad uit de tabel. Het pad `/images/hero/group.webp` is dus het bestand `public/images/hero/group.webp`. De mappen `public/images/` en `public/videos/` bestaan nog niet; maak ze aan.
3. Voeg in `content/assets.ts` de sleutel van de plek toe aan `SUPPLIED` (zie hieronder). Bij `hero.group`, `hero.group.desktop` en `story.coast` zet je `src` zelf op hetzelfde pad.
4. Klopt de foto niet meer met de alt-tekst, pas dan `alt` aan in `content/assets.ts`. Alt-teksten zijn Engels, net als de rest van de sitecopy.
5. Draai `npm test`, `npm run lint` en `npm run typecheck`. De content guard (`content/content-guard.test.ts`) leest ook `content/assets.ts`, dus een alt-tekst met een uitroepteken of een prestatieclaim laat de test falen.

Verder verandert er niets. De componenten kiezen zelf:

| Component | Plekken | Zonder `src` | Met `src` |
| --- | --- | --- | --- |
| `ProductMedia` (`components/media/ProductMedia.tsx`) | `products.<slug>.*`: galerij op de productpagina, productcards op home, collectie en cross-sell | packshot: SVG-render; in de hand en lifestyle: placeholder | `next/image` |
| `PhotoSlot` (`components/media/PhotoSlot.tsx`) | `hero.group`, `story.coast`, en op About `story.coast` en `products.north-swell.inHand` | hero: `GroupRender`; andere: placeholder | `next/image` |
| `VideoSlot` (`components/media/VideoSlot.tsx`) | `ugc.1` tot `ugc.4` (rij "From CORVANE" op home) | placeholder | `<video>` met bediening, `muted`, `playsInline`, `preload="none"` en poster. Speelt nooit vanzelf af |

**Waar `src` staat.** Bij `hero.group`, de desktopuitsnede `hero.group.desktop` en `story.coast` staat `src: null` letterlijk in het manifest; daar vul je het pad in. De andere plekken (alle productfoto's, de vier scènes en de vier video's) maakt een hulpfunctie. Die kijkt in de lijst `SUPPLIED` bovenaan die functies: staat de sleutel van een plek erin, dan krijgt die plek zijn `path` als `src` (en bij video ook zijn poster). Een foto aanleveren is dus: bestand op `path` zetten en de sleutel toevoegen, bijvoorbeeld:

```ts
const SUPPLIED: ReadonlySet<string> = new Set<string>(["products.north-swell.packshot", "ugc.1"]);
```

Zet `src` pas als het bestand er echt staat. Een pad zonder bestand geeft een kapotte afbeelding.

**Wat SVG blijft.** Een foto vervangt de render alleen op de plekken in de tabel hierboven. Deze onderdelen tekenen bewust altijd de SVG-render: de regels en de lege staat in de cart drawer, het resultaat van de scent finder, How it works, de band met zes geuren op About, de Discovery Set-kaart in het mobiele menu en de OG-beelden.

**Beeld van een CDN.** `src` mag ook een volledige URL zijn. Voor foto's moet het domein dan in `images.remotePatterns` in `next.config.ts` staan; dat staat er nu niet. Video's hebben die instelling niet nodig.

## 2. Bestandsformaten en export

### Foto's

| Eigenschap | Waarde |
| --- | --- |
| Formaat | WebP |
| Maat | Precies de maat uit de tabel: 1600 × 2000 px (4:5). Desktopuitsnede hero: 2560 × 1600 px (16:10) |
| Kleur | sRGB. Zet het beeld eerst om naar sRGB en exporteer dan |
| Kwaliteit | Ongeveer 80 |
| Bestandsgrootte | Onder ongeveer 400 KB |
| Metadata | Haal locatiegegevens (GPS) uit het bestand |
| Tekst | Geen tekst in het beeld. Tekst staat in de HTML |

`next/image` maakt zelf kleinere versies voor telefoons. Lever daarom één bestand op volle maat, nooit kleiner en niet opgeschaald. Bewaar de originelen (RAW of TIFF) buiten de repository.

De hero-foto en de packshot op de productpagina worden vooraf geladen. Ze tellen mee voor de laadtijd die Lighthouse meet (Largest Contentful Paint, het moment waarop het grootste element in beeld staat). Houd die twee dus zeker onder 400 KB en meet na het vervangen opnieuw met Lighthouse (brief §7: mobiel 90+ voor home en productpagina).

### Video's

| Eigenschap | Waarde |
| --- | --- |
| Container en codec | MP4, H.264, pixelformaat yuv420p |
| Maat | 1080 × 1920 px (9:16, staand) |
| Beeldsnelheid | 30 fps |
| Lengte | 10 tot 15 seconden, maximaal 15 |
| Geluid | Niet nodig. De site start de video zonder geluid (`muted`). Lever bij voorkeur zonder geluidsspoor; anders AAC |
| Bestandsgrootte (advies) | Onder ongeveer 5 MB, met `+faststart` zodat afspelen direct begint |
| Tekst en stem | Liever geen. Een video met gesproken tekst heeft ondertiteling nodig (WCAG 1.2.2), en `VideoSlot` heeft nog geen `<track>` |

Een voorbeeld met ffmpeg (geen geluid, constante kwaliteit):

```sh
ffmpeg -i master.mov -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -maxrate 3M -bufsize 6M \
  -movflags +faststart -an public/videos/ugc-01.mp4
```

### Posters

Elke video heeft een posterbeeld: WebP, 1080 × 1920 px, sRGB, kwaliteit ongeveer 80, bij voorkeur onder 200 KB (advies). Bezoekers zien de poster vóór ze op afspelen drukken. Kies dus een beeld waarop de stick goed te zien is.

```sh
ffmpeg -ss 1 -i public/videos/ugc-01.mp4 -frames:v 1 -c:v libwebp -quality 80 public/videos/ugc-01-poster.webp
```

## 3. Vaste beeldregie

Alle foto's en video's horen bij elkaar. Houd dit overal aan:

- **Het product.** Mat zwarte aluminium huls met het gegraveerde windvaan-icoon. De gekleurde ring onderaan is altijd zichtbaar: hij zegt welke geur het is. Hulzen schoon, zonder vingerafdrukken.
- **Licht.** Noordzeelicht: zacht, koel daglicht, vaak bewolkt. Avondscènes in laag, warm licht. Geen harde flits en geen glansstrepen op de matte huls.
- **Kleur.** De achtergronden sluiten aan op de huisstijl: sand (#EEE6D8) voor packshots, deep (#0F2733) voor de hero. Geen goud of bruin als stijlkleur (brief §5).
- **Mensen.** Vooral hand, pols en nek, of iemand van opzij of van achteren. Een gezicht is nergens nodig. Geen ringen, tatoeages of zichtbare logo's op kleding.
- **Geen andere merken.** Geen logo's, etiketten of teksten van andere merken in beeld: geen laptoplogo, geen merk op een waterfles, tas, kopje, sportapparaat of in een trein. Dek ze af of kies iets zonder merk.
- **Geen claims in beeld.** Geen scènes die aantrekkingskracht suggereren (iemand die reageert op de geur, flirten) en niemand die iets over de geur belooft (regel 5). Geen tekst of stem over hoe lang de geur blijft of over handbagage (regel 6).
- **Rust.** Weinig props, veel ruimte rond het product, dezelfde opstelling per reeks.

## 4. Shotlist

Alle foto's hieronder zijn 4:5, 1600 × 2000 px, tenzij anders vermeld. De alt-teksten staan letterlijk zoals in `content/assets.ts`.

### 4.1 Packshots (9)

Opstelling voor alle packshots: naadloze achtergrond in sand (#EEE6D8). Product in het midden, ongeveer 80% van de beeldhoogte. Camera iets boven het product. Zacht daglicht van links en een zachte schaduw op de vloer. Geen props, geen tekst. Dezelfde opstelling voor elk product, zodat het productgrid één geheel blijft.

Let op bij het kader:

- Op de productcards staat rechtsonder het label met familie en noten op een vlak in fog, en rechtsboven de badge (D40). Controleer na het vervangen dat het label het product niet bedekt.
- De Discovery Set staat in een brede card. Daar wordt de foto bijgesneden tot ongeveer 8:5, en op de homepage tussen `md` en `xl` tot ongeveer 12:5. Ook de Travel Pouch en de cadeaukaart staan in de collectie vanaf `xl` in een brede card (ongeveer 8:5). Houd bij deze drie het product in de middelste horizontale band, ongeveer 40% van de beeldhoogte.

| Sleutel | Bestand | In beeld | Alt-tekst |
| --- | --- | --- | --- |
| `products.north-swell.packshot` | `public/images/products/north-swell/packshot.webp` | Stick rechtop, dop erop, vaan en zeeblauwe ring (#6FA8C7) naar de camera | North Swell solid cologne: a matte black 15 g twist-up stick with an engraved vane and a sea blue ring at the base |
| `products.drift-and-ember.packshot` | `public/images/products/drift-and-ember/packshot.webp` | Idem, ring in burnt orange (#C26A3D) | Drift & Ember solid cologne: a matte black 15 g twist-up stick with an engraved vane and a burnt orange ring at the base |
| `products.lantern-smoke.packshot` | `public/images/products/lantern-smoke/packshot.webp` | Idem, ring in diep rood (#8B2E2E) | Lantern Smoke solid cologne: a matte black 15 g twist-up stick with an engraved vane and a deep red ring at the base |
| `products.iron-coast.packshot` | `public/images/products/iron-coast/packshot.webp` | Idem, ring in staalgrijs (#8C9399) | Iron Coast solid cologne: a matte black 15 g twist-up stick with an engraved vane and a steel grey ring at the base |
| `products.dune-fig.packshot` | `public/images/products/dune-fig/packshot.webp` | Idem, ring in saliegroen (#7E9A5B) | Dune Fig solid cologne: a matte black 15 g twist-up stick with an engraved vane and a sage green ring at the base |
| `products.harbour-tea.packshot` | `public/images/products/harbour-tea/packshot.webp` | Idem, ring in theekleur (#A9844F) | Harbour Tea solid cologne: a matte black 15 g twist-up stick with an engraved vane and a tea-coloured ring at the base |
| `products.discovery-set.packshot` | `public/images/products/discovery-set/packshot.webp` | Open doos van bovenaf: zes ministicks in de tray, ringkleuren in catalogusvolgorde (North Swell, Drift & Ember, Lantern Smoke, Iron Coast, Dune Fig, Harbour Tea; D22), deksel ernaast | The Discovery Set: six 3 g mini sticks in a tray, each with the ring colour of its scent, with the lid beside it |
| `products.travel-pouch.packshot` | `public/images/products/travel-pouch/packshot.webp` | Canvas pouch rechtop, drie sticks steken eruit, het vaanlabel zichtbaar | The CORVANE Travel Pouch: a stitched canvas pouch with a kelp green hem and a small vane tab, shown holding three sticks (sold separately) |
| `products.e-gift-card.packshot` | `public/images/products/e-gift-card/packshot.webp` | Geen foto: de cadeaukaart is digitaal. Alleen nodig als de SVG-render (`GiftCardRender`) wordt vervangen; lever dan een render van de kaart op sand. Advies: laat de SVG-render staan | The CORVANE e-gift card: a deep blue card with the vane icon and the wordmark |

### 4.2 Schaalfoto in de hand (8)

Opstelling: de hand houdt het product op borsthoogte tegen effen kleding in een neutrale tint. Alleen hand en product: geen gezicht, geen ringen, geen zichtbare logo's of tatoeages. Zacht daglicht. De foto laat de echte maat zien. De cadeaukaart heeft geen schaalfoto (D50.6).

| Sleutel | Bestand | In beeld | Alt-tekst |
| --- | --- | --- | --- |
| `products.north-swell.inHand` | `public/images/products/north-swell/in-hand.webp` | North Swell, dop eraf, cologne een paar millimeter omhoog gedraaid | A hand holding the North Swell stick with the cap off and the cologne twisted up |
| `products.drift-and-ember.inHand` | `public/images/products/drift-and-ember/in-hand.webp` | Idem met Drift & Ember | A hand holding the Drift & Ember stick with the cap off and the cologne twisted up |
| `products.lantern-smoke.inHand` | `public/images/products/lantern-smoke/in-hand.webp` | Idem met Lantern Smoke | A hand holding the Lantern Smoke stick with the cap off and the cologne twisted up |
| `products.iron-coast.inHand` | `public/images/products/iron-coast/in-hand.webp` | Idem met Iron Coast | A hand holding the Iron Coast stick with the cap off and the cologne twisted up |
| `products.dune-fig.inHand` | `public/images/products/dune-fig/in-hand.webp` | Idem met Dune Fig | A hand holding the Dune Fig stick with the cap off and the cologne twisted up |
| `products.harbour-tea.inHand` | `public/images/products/harbour-tea/in-hand.webp` | Idem met Harbour Tea | A hand holding the Harbour Tea stick with the cap off and the cologne twisted up |
| `products.discovery-set.inHand` | `public/images/products/discovery-set/in-hand.webp` | Eén ministick tussen duim en vinger, de open doos onscherp erachter | A hand holding one 3 g mini stick from the Discovery Set |
| `products.travel-pouch.inHand` | `public/images/products/travel-pouch/in-hand.webp` | Pouch vastgehouden aan de bovenzoom, sticks zichtbaar | A hand holding the canvas Travel Pouch with three sticks inside (sticks sold separately) |

De schaalfoto van North Swell staat ook op About, in een kader van 4:5, 5:4 en 16:10 (`app/about/page.tsx`). Houd stick en hand dus in het midden van het beeld.

### 4.3 Lifestyle per product (8)

Het laatste beeld in de galerij van de productpagina. Het label (tweede kolom) staat in de placeholder zolang de foto ontbreekt.

| Sleutel | Label | In beeld | Alt-tekst |
| --- | --- | --- | --- |
| `products.north-swell.lifestyle` | North Swell: early gym session | Kleedkamer van een gym, vroege ochtend, koel daglicht. Stick op een bank naast een handdoek en een waterfles zonder merk | The North Swell stick on a wooden bench in a gym changing room, next to a folded towel |
| `products.drift-and-ember.lifestyle` | Drift & Ember: evening at home | Avond, laag warm licht. Stick op een donkere houten tafel, naast een jas die wordt aangetrokken voor een etentje | The Drift & Ember stick on a dark wooden table in warm evening light |
| `products.lantern-smoke.lifestyle` | Lantern Smoke: night out | Nacht, licht van stad of haven onscherp op de achtergrond. Stick glijdt in de binnenzak van een donkere jas | The Lantern Smoke stick in the inside pocket of a dark jacket at night |
| `products.iron-coast.lifestyle` | Iron Coast: work desk | Opgeruimd bureau in daglicht. Stick naast een dichte laptop (zonder zichtbaar logo) en een notitieboek, net uit de tas voor een meeting | The Iron Coast stick on a desk next to a laptop and a notebook |
| `products.dune-fig.lifestyle` | Dune Fig: weekend in the dunes | Duinen aan de Noordzee, helder bewolkt licht. Stick omhooggehouden tegen helmgras, alleen de hand | The Dune Fig stick held up against dune grass on a bright day |
| `products.harbour-tea.lifestyle` | Harbour Tea: slow morning | Ochtendlicht door een raam, haven of water onscherp. Stick naast een kop zwarte thee op de vensterbank | The Harbour Tea stick beside a cup of black tea on a windowsill overlooking a harbour |
| `products.discovery-set.lifestyle` | Discovery Set: one a day | Badkamerplank in daglicht. De zes ministicks op een rij, één iets naar voren, alsof je de geur van de dag kiest | The six Discovery Set mini sticks lined up on a bathroom shelf |
| `products.travel-pouch.lifestyle` | Travel Pouch: in the bag | Open weekendtas van bovenaf, daglicht. De pouch tussen opgevouwen kleren en een toilettas | The Travel Pouch in an open weekend bag between folded clothes and a washbag |

De bestanden heten `public/images/products/<slug>/lifestyle.webp`.

### 4.4 Lifestylescènes (4)

Vier algemene scènes: gym, werk, reizen en uitgaan (brief §3 en §5). Ze staan in het manifest, maar **geen component toont ze nu**. Ze verschijnen pas als een sectie ze gebruikt met `<PhotoSlot assetKey="lifestyle.gym" … />`. Schiet ze wel mee; ze zijn ook bruikbaar voor social.

| Sleutel | Bestand | In beeld | Alt-tekst |
| --- | --- | --- | --- |
| `lifestyle.gym` | `public/images/lifestyle/gym.webp` | Kleedkamer na de training, daglicht. Stick omhooggedraaid, twee halen over de pols. Gezicht mag buiten beeld | A man swiping a CORVANE stick across his wrist in a gym changing room |
| `lifestyle.work` | `public/images/lifestyle/work.webp` | Kantoor- of studiobureau, daglicht. Een hand haalt de stick uit een jaszak voor een meeting | A CORVANE stick taken out of a jacket pocket at a desk |
| `lifestyle.travel` | `public/images/lifestyle/travel.webp` | Trein of veerboot, raamlicht. Stick in het zijvak van een rugzak op de stoel, landschap onscherp | A CORVANE stick in the side pocket of a backpack on a train |
| `lifestyle.night` | `public/images/lifestyle/night.webp` | Avond, laag warm licht, lichten onscherp. Stick rechtop op een bar of op een tafel bij het raam | A CORVANE stick on a bar counter at night, city lights out of focus behind |

### 4.5 Hero: groepsfoto (1, plus een desktopuitsnede)

| Sleutel | Bestand | Maat | Gebruik |
| --- | --- | --- | --- |
| `hero.group` | `public/images/hero/group.webp` | 4:5, 1600 × 2000 | Hero op de homepage, op elke breedte (D39). Vervangt `GroupRender` en wordt vooraf geladen |
| `hero.group.desktop` | `public/images/hero/group-desktop.webp` | 16:10, 2560 × 1600 | Staat in het manifest voor een latere, bredere layout. De huidige layout gebruikt hem niet (D39) |

In beeld: van links naar rechts North Swell, Drift & Ember en Lantern Smoke op een achtergrond in deep (#0F2733), licht verspringend. Drift & Ember staat vooraan, dop eraf, cologne omhoog gedraaid. Strijklicht van achteren, zodat de matte zwarte hulzen loskomen van de donkere achtergrond (D21). De ringkleuren zijn duidelijk zichtbaar. Houd de producten in de middelste 60% van het beeld, zodat ook de 16:10-uitsnede werkt.

Alt-tekst: Three CORVANE solid cologne sticks, North Swell, Drift & Ember and Lantern Smoke, the middle one with the cap off

### 4.6 Merkverhaal: de kust (1)

| Sleutel | Bestand | Maat | Gebruik |
| --- | --- | --- | --- |
| `story.coast` | `public/images/story/coast.webp` | 4:5, 1600 × 2000 | Merkverhaal op de homepage (`StoryTeaser`) en bovenaan About (D41) |

In beeld: de Noordzeekust met duinen en helmgras onder een wijde lucht, bewolkt daglicht of late middag. Op de voorgrond een eenvoudige windvaan op een houten paal, iets uit het midden. Geen mensen, geen producten, geen andere merken of borden.

De foto wordt op meer manieren bijgesneden: op telefoons op de homepage tot 5:4 (D43.6), op About tot 5:4 en op tablets tot 16:10. Houd windvaan en horizon in de middelste band van het beeld.

Alt-tekst: Dunes on the North Sea coast under a wide grey sky, with a weather vane on a post in the foreground

### 4.7 Video's (4, 9:16)

De rij heet "From CORVANE": eigen merkcontent, nooit gepresenteerd als klantvideo of review (PLAN §14, regel 2). De sleutels heten `ugc`, maar het zijn video's die CORVANE zelf maakt. Elke video is 9:16, 1080 × 1920 px, H.264, 10 tot 15 seconden.

| Sleutel | Video | Poster | Titel | Wat, kader, licht en props |
| --- | --- | --- | --- | --- |
| `ugc.1` | `public/videos/ugc-01.mp4` | `public/videos/ugc-01-poster.webp` | Gym bag | Sporttas op een bank na de training. Een hand pakt de Travel Pouch en een stick, draait hem omhoog, twee halen over de pols, terug in de tas. Close-up op handen en tas, koel daglicht, tas en handdoek zonder merk |
| `ugc.2` | `public/videos/ugc-02.mp4` | `public/videos/ugc-02-poster.webp` | Desk drawer | Bureau in daglicht. De la gaat open, stick eruit, dop eraf, een haal over pols en nek, dop erop, la dicht. Camera op bureauhoogte, alleen handen en nek, geen laptoplogo in beeld |
| `ugc.3` | `public/videos/ugc-03.mp4` | `public/videos/ugc-03-poster.webp` | Weekend bag | Van bovenaf, daglicht. Een weekendtas inpakken: kleren, toilettas, de pouch met sticks; de rits gaat dicht. Vaste camera recht boven de tas |
| `ugc.4` | `public/videos/ugc-04.mp4` | `public/videos/ugc-04-poster.webp` | Night out | Avond, laag warm licht. Jas aan, stick uit de binnenzak, twee halen in de nek, de deur uit. Figuur van opzij of van achteren, geen gezicht nodig, niemand anders in beeld |

Toegankelijke namen (`alt` in `content/assets.ts`, als `aria-label` op de video):

| Sleutel | Naam |
| --- | --- |
| `ugc.1` | Video: a CORVANE stick taken out of a gym bag after training and swiped across the wrist |
| `ugc.2` | Video: a CORVANE stick taken from a desk drawer before a meeting |
| `ugc.3` | Video: packing the Travel Pouch with CORVANE sticks into a weekend bag |
| `ugc.4` | Video: a CORVANE stick taken from a jacket pocket before a night out |

## 5. Regels

- **Alleen eigen beeld.** Elke foto en video is voor CORVANE gemaakt. Geen stockbeeld, geen beeld van derden en geen beeld van andere merken (brief §5: "geen foto's van anderen").
- **Niets van de referentie.** Geen beeld, logo, icoon, uitsnede of bewerking van penroseskin.com, ook niet als voorbeeld in een moodboard dat in de repository komt (brief §2.1). Schermafdrukken van de referentie staan alleen in `reference/` en nooit in `public/` (brief §8).
- **Rechten op papier.** Een schriftelijke licentie van de fotograaf of videomaker voor web, social en advertenties, zonder einddatum, met het recht om bij te snijden. Een modelrelease van iedereen die herkenbaar in beeld is, en toestemming van de locatie (gym, bar, trein). Bewaar die documenten buiten de repository.
- **Geen muziek van anderen.** Lever video's zonder geluid of met muziek waarvoor een licentie is.
- **Echte klantcontent later.** Komt er ooit content van klanten, dan alleen met schriftelijke toestemming, als zodanig gemarkeerd, en nooit nagespeeld of bedacht (regel 2).
- **Copyregels gelden ook voor beeld.** Tekst in beeld, ondertitels en voice-over volgen de copyregels: geen uitroeptekens, geen hypewoorden, geen verwijzingen naar andere merken of parfums, geen aantrekkingsclaims, geen prestatieclaims (regels 5 en 6; zie `docs/COMPLIANCE.md`).

## 6. Checklist per bestand

- [ ] Eigen opname. Licentie, modelrelease en locatietoestemming zijn er.
- [ ] Geen ander merk, logo of tekst in beeld. Niets van de referentie.
- [ ] Mat zwarte huls; de ringkleur van de juiste geur is zichtbaar.
- [ ] Opstelling volgens de shotlist (dop erop of eraf, achtergrond, licht).
- [ ] Exacte maat en verhouding: 1600 × 2000 (4:5), 2560 × 1600 (16:10) of 1080 × 1920 (9:16).
- [ ] Foto: WebP, sRGB, kwaliteit ongeveer 80, onder ongeveer 400 KB, zonder GPS-gegevens.
- [ ] Video: MP4, H.264, yuv420p, 30 fps, hoogstens 15 seconden, `+faststart`, met een poster in WebP.
- [ ] Bestand staat in `public/` op het pad uit de tabel, met precies die naam.
- [ ] `src` staat in `content/assets.ts` (bij video ook `poster`), pas nadat het bestand er staat.
- [ ] De alt-tekst klopt met het beeld.
- [ ] `npm test`, `npm run lint` en `npm run typecheck` slagen.
- [ ] Bekeken op 390 en 1440 px: productcards, galerij, hero, merkverhaal en About. Niets belangrijks valt weg in een uitsnede.
- [ ] Na de hero-foto of een packshot: Lighthouse mobiel voor `/` en `/products/north-swell` blijft 90 of hoger.
