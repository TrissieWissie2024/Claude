# Beslissingen en aannames

De brief vraagt om autonoom te werken en aannames hier vast te leggen. Elke beslissing heeft een nummer, zodat code en andere documenten ernaar kunnen verwijzen.

## Werkwijze en omgeving

- **D01. Brief als Markdown.** De brief is aangeleverd als PDF. Ik heb hem ongewijzigd overgezet naar `CORVANE-BRIEF.md` in de hoofdmap van de repository, zoals de brief zelf aangeeft.
- **D02. Mapstructuur.** De repository bestond al (leeg). Het project staat in `corvane/`. `docs/`, `content/`, `lib/` en `reference/` staan binnen `corvane/`, omdat de brief deze paden relatief aan het project noemt.
- **D03. Referentie niet bereikbaar.** penroseskin.com is vanuit de bouwomgeving niet te bereiken (netwerkbeleid en een kapotte WebFetch). `docs/REFERENCE.md` legt uit wat er wel en niet is bekeken. Ik heb niets verzonnen; de structuur volgt §6 van de brief.
- **D04. Stack.** Next.js 16.4.3 (App Router), React 19.3, TypeScript 5.9 in strict mode, Tailwind CSS 4. TypeScript 7 bestaat al, maar Next.js 16 rekent nog op de JavaScript-API van TypeScript 5. Daarom blijft het project op 5.9.
- **D05. Lint.** `next lint` bestaat niet meer in Next.js 16. `npm run lint` draait ESLint 9 met `eslint-config-next`.
- **D06. Fase 1 zonder screenshots.** Omdat de referentie niet bereikbaar was (D03), staat `reference/` leeg. Het opnieuw bekijken van de referentie staat op `docs/TODO-LAUNCH.md`.

## Prijzen en aanbod

- **D07. Bedragen in centen.** Alle prijzen staan als hele centen in `content/offers.ts`, ook die van de Discovery Set (2995), de Travel Pouch (995) en de cadeaukaarten (2500, 5000, 10000). Productdata bevat geen prijzen. Weergave in Engelse notatie (`€24.95`), omdat de sitecopy Engels is.
- **D08. Launch-campagne.** De demo-campagne heet "Launch week": 15% korting met code `LAUNCH15`, van 25 oktober 2026 tot en met 1 november 2026 23:59 (Amsterdamse tijd, `+01:00` omdat de wintertijd op 25 oktober ingaat). De einddatum staat als vaste tekst in `offers.ts` en wordt nooit berekend, zodat de timer niet bij elk bezoek of elke deploy opnieuw begint. De balk noemt alleen de code die echt afloopt, niet de vaste bundel-, pouch- of verzendaanbiedingen.
- **D09. Eén code per bestelling.** `WELCOME10` (popup) en `LAUNCH15` (campagne) stapelen niet. Codes werken niet op cadeaukaarten en worden hoofdletterongevoelig vergeleken. De welkomstcode is "for your first order", maar dat controleert de demo niet; de echte e-mailtool of Shopify moet dat afdwingen.
- **D10. Groeperen per aankooptype.** De brief zegt "Groepering geldt per aankooptype". Eenmalig en abonnement zijn twee groepen. Abonnementssticks met verschillende intervallen tellen samen. Bij de echte koppeling (Shopify selling plans) moet worden gecontroleerd of dat zo kan blijven; het staat op `TODO-LAUNCH.md`.
- **D11. Eén gratis Travel Pouch per bestelling.** "Gratis vanaf 3 sticks" lees ik als een drempel per bestelling, niet per drie sticks. Tegels en cart zeggen "one per order", zodat niemand er twee verwacht.
- **D12. Abonnementskorting per bundel afgerond.** 15% gaat van elke bundelprijs af en wordt per bundel afgerond (3 → €50,96, 2 → €38,21, 1 → €21,21). Zo is de cart altijd gelijk aan de som van de tegels op de productpagina.
- **D13. Toewijzing aan regels naar tegelprijs.** Als sticks uit verschillende regels samen een bundel vormen, wordt de bundelprijs over de regels verdeeld naar rato van hun eigen tegelprijs. Een regel komt daardoor nooit hoger uit dan de productpagina beloofde.
- **D14. Gratis verzending vóór de kortingscode.** De grens van €50 geldt voor verzendbare producten na bundel- en abonnementsprijs maar vóór de kortingscode. Zo klopt "Free shipping from €50" letterlijk, ook met `WELCOME10`. Cadeaukaarten tellen niet mee en hebben geen verzending.
- **D15. Levertijden en feestdagen.** Verzending vanuit Nederland. Verzenddagen ma–vr behalve Nederlandse feestdagen; levering in werkdagen zonder de feestdagen van het bestemmingsland. NL 1 werkdag, BE 1–2 werkdagen. Feestdagen 2026 en 2027 staan in `content/shipping.ts`. 5 mei staat er niet in, omdat het alleen in lustrumjaren een vrije dag is. De leverbalk toont geen afteltimer naar 15:00, want zo'n timer begint elke dag opnieuw (regel 3).

## Bouw

- **D16. Volgorde van de fases.** Fase 3 bevat naast scaffold, tokens, logo, favicon en renders ook de prijslogica, de cart, de commerce-laag, de UI-primitives en de content. De layout uit fase 4 heeft die nodig. Elke fase eindigt nog steeds met een eigen commit.
- **D17. Kleuren.** Naast de zes merkkleuren zijn er twee afgeleide neutrale tinten: `ink-soft` (#4A5259) voor secundaire tekst op licht en `mist` (#B9C4C9) op donker. Ze vallen binnen de huisstijl (geen goud of bruin) en halen AA. Primaire knoppen worden bij hover lichter (#E86A43), niet donkerder. Swatches in ringkleur krijgen een rand in `ink-soft`, omdat North Swell, Dune Fig en Iron Coast op fog anders geen 3:1 halen. De ringkleuren van de geuren worden alleen bij het product gebruikt.
