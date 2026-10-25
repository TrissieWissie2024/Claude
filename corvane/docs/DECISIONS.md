# Beslissingen en aannames

De brief vraagt om autonoom te werken en aannames hier vast te leggen. Elke beslissing heeft een nummer, zodat code en andere documenten ernaar kunnen verwijzen.

## Werkwijze en omgeving

- **D01. Brief als Markdown.** De brief is aangeleverd als PDF. Ik heb hem ongewijzigd overgezet naar `CORVANE-BRIEF.md` in de hoofdmap van de repository, zoals de brief zelf aangeeft.
- **D02. Mapstructuur.** De repository bestond al (leeg). Het project staat in `corvane/`. `docs/`, `content/`, `lib/` en `reference/` staan binnen `corvane/`, omdat de brief deze paden relatief aan het project noemt.
- **D03. Referentie niet bereikbaar.** penroseskin.com is vanuit de bouwomgeving niet te bereiken (netwerkbeleid en een kapotte WebFetch). `docs/REFERENCE.md` legt uit wat er wel en niet is bekeken. Ik heb niets verzonnen; de structuur volgt §6 van de brief.
- **D04. Stack.** Next.js 16.4.3 (App Router), React 19.3, TypeScript 5.9 in strict mode, Tailwind CSS 4. TypeScript 7 bestaat al, maar Next.js 16 rekent nog op de JavaScript-API van TypeScript 5. Daarom blijft het project op 5.9.
- **D05. Lint.** `next lint` bestaat niet meer in Next.js 16. `npm run lint` draait ESLint 9 met `eslint-config-next`.
