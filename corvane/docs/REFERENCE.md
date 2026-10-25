# Referentie: penroseskin.com

> Fase 1 van de brief (§8). Dit document beschrijft alleen structuur, volgorde, interacties en conversiemechanieken, in eigen woorden. Er staat geen tekst, beeld, code of kleur van de referentie in.

## Status: de referentie kon niet worden bekeken

De brief vraagt om de homepage, de collectie, één productpagina en de cart drawer van penroseskin.com zelf te bekijken, eerst met WebFetch en anders met Playwright (390×844). Dat is in deze bouwomgeving niet gelukt:

| Poging | Resultaat (25 oktober 2026) |
| --- | --- |
| Playwright of curl naar `https://penroseskin.com` en `https://www.penroseskin.com` | De uitgaande proxy van de omgeving weigert de verbinding (HTTP 403 op `CONNECT`). Het domein valt buiten het netwerkbeleid van deze sessie. |
| WebFetch naar beide adressen | `getaddrinfo ENOTFOUND`. WebFetch faalt in deze sessie op elk domein, ook op `nextjs.org`, dus dit zegt niets over de site zelf. |
| Archiefkopie via `web.archive.org` / `archive.org` | Ook geblokkeerd door het netwerkbeleid. |

Er zijn dus **geen eigen observaties en geen screenshots** gemaakt. De map `reference/` staat klaar (en in `.gitignore`), maar is leeg. Ik heb bewust geen observaties verzonnen.

## Waar de bouw dan op steunt

Paragraaf 6 van de brief beschrijft per onderdeel wat de referentie doet (links van elke pijl) en wat CORVANE ervan maakt (rechts). Die beschrijving is het enige referentiemateriaal en geldt hieronder als **tweedehands bron: niet zelf geverifieerd**. Waar de brief over de referentie zwijgt, staat erbij welke keuze ik zelf heb gemaakt en waarom.

### Homepage, bovenste deel (volgens de brief)

1. **Promobalk** helemaal bovenaan: seizoensactie en bundelaanbod, met een live afteltimer. Mechaniek: urgentie plus prijsanker.
2. **Header**: hamburgermenu links, logo gecentreerd, account en winkelwagen met teller rechts. Op mobiel en desktop dezelfde opbouw.
3. **Hero** op donkere achtergrond: groepsfoto van drie producten, een regel met beoordelingen, grote kop, subregel en twee pills met USP's. Mechaniek: direct social proof en een productbeeld boven de vouw.
4. **Leverbalk** onder de hero: verzenddag, landvlag en de grens voor gratis verzending. Mechaniek: drempel om meer te kopen en zekerheid over levertijd.
5. **Productgrid** met een sectielabel en een sorteerdropdown. Cards met badge, beeld met tekst eroverheen, sterren met aantal reviews. Mechaniek: snel kiezen vanaf de homepage.
6. **Zwevende pill** ("kies een kaart, win een beloning") die een spelletje met kaarten opent in ruil voor een e-mailadres. Mechaniek: gamified leadcapture.

### Homepage, lager

De brief vraagt de volgorde van de referentie over te nemen waar dat logisch is, maar noemt die volgorde niet. Omdat ik die niet kon zien, heb ik de onderdelen die de brief verplicht stelt in een volgorde gezet die de klantreis van een DTC-merk volgt: eerst begrijpen wat het product is, dan twijfel wegnemen, dan kiezen, dan zekerheid.

| # | Sectie | Waarom op deze plek |
| --- | --- | --- |
| 7 | How it works (drie stappen) | Een solid cologne is voor veel mensen nieuw. Eerst uitleggen hoe het werkt. |
| 8 | Solid vs spray | Neemt de belangrijkste twijfel weg: waarom geen gewone spray. |
| 9 | Scent finder (quiz) | Na het "waarom" volgt het "welke": helpt kiezen uit zes geuren. |
| 10 | Reviews en rij met 9:16-video's | Social proof na de keuze. Toont alleen echte data, dus bij launch een nette lege staat. |
| 11 | Garantie, FAQ, merkverhaal | Laatste bezwaren wegnemen, dan het merk. |
| 12 | Footer met nieuwsbrief | Vangnet voor wie nog niet koopt. |

### Productpagina (volgens de brief)

De referentie werkt met geurvarianten, bundels, abonnementen en cadeaukaarten. De brief noemt verder geen volgorde. Ik volg het gangbare patroon: galerij links of boven, daarna titel en prijs, varianten, bundelkeuze, aankooptype, knop, leverbelofte en vertrouwen, daarna accordions en cross-sell.

### Collectie en cart drawer

De brief beschrijft voor de collectie en de cart drawer alleen wat CORVANE moet doen, niet wat de referentie doet. Die onderdelen zijn dus volledig gebouwd vanuit §6 van de brief.

## Wat nog moet

Deze stap moet opnieuw gebeuren zodra er netwerktoegang tot penroseskin.com is (zie `docs/TODO-LAUNCH.md`). Bekijk dan in elk geval:

- de echte volgorde van de secties lager op de homepage, en of de volgorde hierboven moet schuiven;
- de volgorde van blokken op de productpagina;
- het gedrag van de cart drawer (wanneer hij opent, wat er in de upsellrij staat);
- de filters en sorteeropties van de collectie.

Schrijf observaties dan in eigen woorden in dit bestand, en zet screenshots alleen in `reference/`.
