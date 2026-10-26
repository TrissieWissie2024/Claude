import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import * as cartModule from "./cart";
import { claims } from "./claims";
import * as faqModule from "./faq";
import * as finderModule from "./finder";
import { home } from "./home";
import * as legalModule from "./legal";
import * as offersModule from "./offers";
import * as pagesModule from "./pages";
import * as pdpModule from "./pdp";
import * as productsModule from "./products";
import * as reviewsModule from "./reviews";
import * as shippingModule from "./shipping";
import * as siteModule from "./site";

/**
 * Content guard (docs/PLAN.md §13, brief §2). Walks every exported value of
 * every module in content/ (except claims.ts, the one place performance claims
 * may live) and fails on banned copy. Functions are called with sample
 * arguments and their output is checked too.
 *
 * Modules are imported explicitly above; any other module in content/ (for
 * example home.ts, pages.ts, legal.ts, assets.ts) is discovered on disk and
 * imported as well, so a new file can never slip past the guard.
 */

type Module = Record<string, unknown>;

interface Rule {
  name: string;
  pattern: RegExp;
  /** Files (as "content/<file>.ts") where this rule does not apply. */
  allowIn?: string[];
}

const HYPE_WORDS = [
  "irresistible",
  "magnetic",
  "addictive",
  "seductive",
  "alluring",
  "sexy",
  "panty[- ]?dropper",
  "game[- ]?changer",
  "revolutionary",
  "miracle",
  "best ever",
  "ultimate",
  "must[- ]?have",
  "insane",
  "obsessed",
];

/**
 * Perfume houses, designer brands and well-known perfumes (brief §2.5: no
 * references to existing perfumes or brands). Not complete: a name that is
 * not here still needs a human read. Payment methods (site.paymentMethods)
 * and service providers named in the legal texts are not perfume brands and
 * are not listed. Written as regex sources, matched on word boundaries.
 */
const PERFUME_BRANDS = [
  "dior",
  "chanel",
  "creed",
  "tom ford",
  "armani",
  "acqua di gi[oò]",
  "versace",
  "ysl",
  "(yves )?saint laurent",
  "hugo boss",
  "boss bottled",
  "paco rabanne",
  "rabanne",
  "jo malone",
  "le labo",
  "byredo",
  "margiela",
  "4711",
  "guerlain",
  "herm[eè]s",
  "givenchy",
  "prada",
  "gucci",
  "burberry",
  "calvin klein",
  "ck one",
  "davidoff",
  "cool water",
  "montblanc",
  "bvlgari",
  "bulgari",
  "lacoste",
  "(jean paul )?gaultier",
  "le male",
  "azzaro",
  "viktor (&|and) rolf",
  "spicebomb",
  "valentino",
  "dolce (&|and) gabbana",
  "d&g",
  "light blue",
  "issey miyake",
  "kenzo",
  "ralph lauren",
  "tommy hilfiger",
  "diptyque",
  "penhaligon'?s?",
  "kilian",
  "amouage",
  "parfums de marly",
  "kurkdjian",
  "baccarat rouge",
  "xerjoff",
  "nishane",
  "initio",
  "mancera",
  "montale",
  "lattafa",
  "armaf",
  "mugler",
  "carolina herrera",
  "narciso rodriguez",
  "lanc[oô]me",
  "est[eé]e lauder",
  "cartier",
  "abercrombie",
  "hollister",
  "old spice",
  "lynx",
  "sauvage",
  "aventus",
  "bleu de",
  "invictus",
  "(one|1) million",
  "dylan blue",
  "eros",
  "fahrenheit",
  "santal 33",
  "black orchid",
  "oud wood",
  "tobacco vanille",
  "jazz club",
  "by the fireplace",
  "molecule 0\\d",
  "escentric",
  "luna rossa",
  "stronger with you",
  "allure homme",
  "[eé]go[iï]ste",
];

/** The banned list. Case-insensitive unless stated. */
const RULES: Rule[] = [
  { name: "exclamation mark", pattern: /!/ },
  // Emoji: any Extended_Pictographic character or an emoji presentation selector.
  // "©" is Extended_Pictographic but renders as plain text; it is the one exception (footer copyright).
  { name: "emoji", pattern: /(?!©)\p{Extended_Pictographic}|\u{FE0F}/u },
  ...HYPE_WORDS.map((word) => ({ name: `hype word "${word}"`, pattern: new RegExp(`\\b${word}\\b`, "i") })),

  // References to other perfumes or brands (brief §2.5): the phrasing, then the names.
  { name: "inspired by", pattern: /inspired by/i },
  { name: "smells like", pattern: /smells? like/i },
  { name: "dupe", pattern: /\bdupes?\b/i },
  { name: "alternative to", pattern: /alternative to/i },
  { name: "for fans of", pattern: /\bfor fans of\b/i },
  { name: "our answer to / take on", pattern: /\bour (answer|take|version|twist) (to|on|of)\b/i },
  { name: "impression of", pattern: /\bimpression of\b/i },
  { name: "reminiscent of", pattern: /\breminiscent of\b/i },
  { name: "similar to", pattern: /\bsimilar to\b/i },
  { name: "version of", pattern: /\bversion of\b/i },
  { name: "clone or replica", pattern: /\b(clones?|replicas?)\b/i },
  { name: "designer or iconic fragrance", pattern: /\b(designer|iconic|luxury|famous) (fragrance|scent|perfume|cologne)s?\b/i },
  { name: "same notes as", pattern: /\bsame (notes|dna|accord) as\b/i },
  { name: "fraction of the price", pattern: /\bfraction of the (price|cost)\b/i },
  ...PERFUME_BRANDS.map((name) => ({ name: `perfume or brand name /${name}/`, pattern: new RegExp(`\\b${name}\\b`, "i") })),

  // Pheromone and attraction claims.
  { name: "pheromone", pattern: /pheromone/i },
  { name: "attract", pattern: /attract/i },
  { name: "seduc", pattern: /seduc/i },
  { name: "compliment", pattern: /compliment/i },
  { name: "women will", pattern: /women will/i },
  { name: "turn heads", pattern: /turns? heads/i },
  { name: "women love", pattern: /\b(women|girls|ladies|she) (love|loves|notice|notices|want|wants)\b/i },
  { name: "she / her / ladies / girls", pattern: /\b(she|her|hers|ladies|girls?|girlfriend|wife)\b/i },
  { name: "date night", pattern: /\bdate[- ]night\b/i },
  { name: "sex appeal", pattern: /\bsex(ual)?\b|\bsex appeal\b/i },
  { name: "get noticed", pattern: /\b(get|be|gets|getting) noticed\b/i },
  { name: "magnet", pattern: /\bmagnet/i },
  { name: "flirt", pattern: /\bflirt/i },

  // Fake scarcity and social proof (brief §2.2, §2.3).
  { name: "only X left", pattern: /\bonly (a few|\S+) (left|remaining)\b/i },
  { name: "left in stock", pattern: /left in stock/i },
  { name: "selling fast", pattern: /selling fast/i },
  { name: "people are viewing", pattern: /people (are )?viewing/i },
  { name: "just bought", pattern: /just bought/i },
  { name: "as seen in", pattern: /as seen (in|on)/i },
  { name: "loved by", pattern: /loved by/i },
  // A review platform may only be named where the privacy text explains it.
  { name: "trustpilot", pattern: /trustpilot/i, allowIn: ["content/legal.ts"] },

  // Performance claims: only in content/claims.ts (brief §2.6).
  { name: "hours", pattern: /\bhours\b/i },
  { name: "all day", pattern: /\ball[- ]day\b/i },
  { name: "lasts", pattern: /\blasts\b/i },
  { name: "long-lasting", pattern: /long[- ]?lasting/i },
  { name: "applications", pattern: /\bapplications\b/i },
  { name: "carry-on", pattern: /carry-on/i },
  { name: "hand luggage", pattern: /hand[- ]luggage/i },
  { name: "TSA", pattern: /\bTSA\b/i },
  { name: "leak-proof", pattern: /leak[- ]?proof/i },
  { name: "won't leak", pattern: /(won['’]t|will not|never) leak/i },
  // Implied performance and travel claims (brief §2.6): the same claims in other words.
  { name: "packs easily", pattern: /\bpacks? (easily|anywhere|flat)\b|\beasy to pack\b/i },
  { name: "travel-friendly", pattern: /\btravel[- ]?(friendly|size[d]?|ready|proof|safe|approved)\b/i },
  { name: "fly / flight", pattern: /\b(fly|flying|flights?)\b/i },
  { name: "liquids bag", pattern: /\bliquids? (bag|rules?|limit)\b/i },
  { name: "airport-safe", pattern: /\b(airport|security)[- ]?(safe|friendly|approved|proof)\b/i },
  { name: "hrs", pattern: /\bhrs?\b/i },
  { name: "N-hour", pattern: /\d+\s*[- ]?\s*hours?\b/i },
  { name: "N uses", pattern: /\b\d+\s*(uses|swipes|wears)\b|\buses per\b/i },
  { name: "lasting", pattern: /\blasting\b|\blast (for|up to|all|through)\b/i },
  { name: "weeks of use", pattern: /\b(days?|weeks?|months?) (of use|of wear|per stick)\b/i },
  { name: "spill-proof", pattern: /\b(spill|mess|leak)[- ]?(proof|free)\b/i },
  { name: "no leaks", pattern: /\bno (leaks?|spills?|mess)\b/i },
  { name: "sweat- or waterproof", pattern: /\b(sweat|water)[- ]?(proof|resistant)\b/i },
  { name: "dermatologically tested", pattern: /dermatolog|hypoallergenic|\bclinically\b/i },
  // The reference's own pill wording (brief §2.1, §6.6): CORVANE says it its own way.
  { name: "reference pill wording", pattern: /\b(pick|choose) a card\b|\bwin a reward\b|\bkies een kaart\b|\bwin een beloning\b/i },
];

/** ClaimId values are keys, not copy: `claim: "carry-on"` on a FAQ item is allowed. */
const CLAIM_IDS = new Set<string>(claims.map((claim) => claim.id));

/** Arguments used to call exported functions: strings first, then numbers. */
const SAMPLE_ARGS: unknown[] = ["€10.00", "North Swell", 1, 2, 3];
const MAX_DEPTH = 12;

interface Finding {
  file: string;
  path: string;
  value: string;
  rule: string;
}

function checkString(file: string, path: string, value: string, findings: Finding[]) {
  if (/\.claim$/.test(path) && CLAIM_IDS.has(value)) return;
  for (const rule of RULES) {
    if (rule.allowIn?.includes(file)) continue;
    if (rule.pattern.test(value)) findings.push({ file, path, value, rule: rule.name });
  }
}

type Visit = (file: string, path: string, value: string, findings: Finding[]) => void;

function walk(
  file: string,
  path: string,
  value: unknown,
  findings: Finding[],
  seen: Set<unknown>,
  depth = 0,
  visit: Visit = checkString,
) {
  if (depth > MAX_DEPTH) return;
  if (typeof value === "string") {
    visit(file, path, value, findings);
    return;
  }
  if (typeof value === "function") {
    const fn = value as (...args: unknown[]) => unknown;
    const arity = Math.max(fn.length, 1);
    let called = false;
    for (const sample of SAMPLE_ARGS) {
      const args = Array.from({ length: arity }, () => sample);
      try {
        const result = fn(...args);
        called = true;
        walk(file, `${path}(${args.map((arg) => JSON.stringify(arg)).join(", ")})`, result, findings, seen, depth + 1, visit);
      } catch {
        // A function may reject one kind of sample (e.g. a string where it expects a number).
      }
    }
    if (!called) findings.push({ file, path, value: "<function>", rule: "could not be called with sample arguments" });
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(file, `${path}[${index}]`, item, findings, seen, depth + 1, visit));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    walk(file, `${path}.${key}`, child, findings, seen, depth + 1, visit);
  }
}

const explicitModules: Record<string, Module> = {
  "content/cart.ts": cartModule,
  "content/faq.ts": faqModule,
  "content/finder.ts": finderModule,
  "content/offers.ts": offersModule,
  "content/pdp.ts": pdpModule,
  "content/products.ts": productsModule,
  "content/reviews.ts": reviewsModule,
  "content/shipping.ts": shippingModule,
  "content/site.ts": siteModule,
};

const EXCLUDED = new Set(["content/claims.ts"]);
const contentDir = fileURLToPath(new URL(".", import.meta.url));

function contentFilesOnDisk(): string[] {
  return readdirSync(contentDir)
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.endsWith(".d.ts"))
    .map((file) => `content/${file}`)
    .filter((file) => !EXCLUDED.has(file))
    .sort();
}

async function loadAllModules(): Promise<Record<string, Module>> {
  const modules: Record<string, Module> = { ...explicitModules };
  for (const file of contentFilesOnDisk()) {
    if (modules[file]) continue;
    modules[file] = (await import(/* @vite-ignore */ join(contentDir, file.replace(/^content\//, "")))) as Module;
  }
  return modules;
}

function formatFindings(findings: Finding[]): string {
  return findings.map((f) => `${f.file} ${f.path}: ${f.rule} in ${JSON.stringify(f.value)}`).join("\n");
}

describe("content guard", () => {
  it("covers every content module except claims.ts", async () => {
    const modules = await loadAllModules();
    expect(Object.keys(modules).sort()).toEqual(contentFilesOnDisk());
    for (const file of Object.keys(explicitModules)) {
      expect(contentFilesOnDisk()).toContain(file);
    }
  });

  it("has no banned copy in any exported value", async () => {
    const modules = await loadAllModules();
    const findings: Finding[] = [];
    for (const [file, exports] of Object.entries(modules)) {
      for (const [name, value] of Object.entries(exports)) {
        walk(file, name, value, findings, new Set());
      }
    }
    expect(findings, `Banned copy found:\n${formatFindings(findings)}`).toEqual([]);
  });

  it("catches what it should (self-test)", () => {
    const samples = [
      "Get it now!",
      "Smells like a classic",
      "Lasts all day",
      "Long-lasting scent",
      "TSA approved",
      "Carry-on friendly",
      "Only 3 left",
      "Only a few remaining",
      "12 people are viewing this",
      "Irresistible",
      "Guaranteed compliments",
      "Fresh \u{1F30A}",
      "Fresh ↔ Warm",
      // Phase 10 audit probes (brief §2.5, §2.6, §2.1).
      "For fans of Aventus.",
      "Our answer to Sauvage.",
      "Bleu de Chanel, but solid.",
      "A clone of a classic.",
      "Reminiscent of a designer fragrance.",
      "Women love it.",
      "She will notice.",
      "Built for date night.",
      "Sex appeal in a stick.",
      "Get noticed.",
      "It packs easily.",
      "Travel-friendly.",
      "Fly with it.",
      "Stays out of the liquids bag.",
      "Airport-safe.",
      "8 hrs on skin.",
      "A 12-hour scent.",
      "Around 150 uses.",
      "Spill-proof.",
      "No leaks, ever.",
      "Pick a card, win a reward",
    ];
    for (const sample of samples) {
      const findings: Finding[] = [];
      checkString("content/sample.ts", "sample", sample, findings);
      expect(findings.length, `expected a finding for ${JSON.stringify(sample)}`).toBeGreaterThan(0);
    }
    const clean: Finding[] = [];
    for (const sample of [
      "© 2026 CORVANE. Twist. Swipe. Go.",
      "Turn a card for 10% off",
      "Check the current rules for your trip.",
      "Travel Pouch",
      "Other scents, here and there.",
    ]) {
      checkString("content/sample.ts", "sample", sample, clean);
    }
    expect(clean).toEqual([]);
    // A FAQ item's link to a claim is a key, not copy; the same word as copy is still caught.
    checkString("content/faq.ts", "faq[0].claim", "carry-on", clean);
    expect(clean).toEqual([]);
    const asCopy: Finding[] = [];
    checkString("content/faq.ts", "faq[0].answer", "carry-on", asCopy);
    expect(asCopy.length).toBeGreaterThan(0);
  });
});

describe("launch guards", () => {
  const { products } = productsModule;

  it("only uses the 'new' badge", () => {
    for (const product of products) {
      const extra = product.badges.filter((badge) => badge !== "new");
      expect(extra, `content/products.ts ${product.slug}: badges ${JSON.stringify(product.badges)}`).toEqual([]);
    }
  });

  it("sets no previousPrice and no prices on products", () => {
    for (const product of products) {
      expect(product.previousPrice, `content/products.ts ${product.slug}: previousPrice`).toBeUndefined();
      expect(Object.keys(product), `content/products.ts ${product.slug}: price field`).not.toContain("price");
    }
  });

  it("has no reviews", () => {
    expect(reviewsModule.reviews, "content/reviews.ts: reviews must be empty at launch").toEqual([]);
  });

  it("puts the exact legal review notice on every legal page and on /shipping-returns (brief §6)", () => {
    const notice = "TODO: laten controleren";
    expect(legalModule.legalReviewNotice).toBe(notice);
    expect(Object.keys(legalModule.legal).sort()).toEqual(Object.keys(legalModule.legalRoutes).sort());
    for (const [id, page] of Object.entries(legalModule.legal)) {
      expect(page.reviewNotice, `content/legal.ts ${id}: reviewNotice`).toBe(notice);
    }
    expect(pagesModule.pages.shippingReturns.showLegalReviewNotice).toBe(true);
    expect(pagesModule.pages.shippingReturns.reviewNotice, "content/pages.ts shippingReturns").toBe(notice);
  });

  it("has no verified claims", () => {
    for (const claim of claims) {
      expect(claim.verified, `content/claims.ts ${claim.id}: verified`).toBe(false);
    }
  });
});

describe("withdrawal and sign-up copy (phase 7 review)", () => {
  /** Where the right of withdrawal is set out in full, with the exception in its own paragraph. */
  const FULL_TEXT_FILES = new Set(["content/legal.ts", "content/pages.ts"]);
  const days = offersModule.offers.withdrawalDays;
  const statesTheRight = new RegExp(`withdraw[\\s\\S]*\\b${days}[- ]days?\\b|\\b${days}[- ]days?\\b[\\s\\S]*withdraw`, "i");

  it("names the sealed-stick exception wherever the withdrawal period is given as information (D28)", async () => {
    const modules = await loadAllModules();
    const findings: Finding[] = [];
    const visit: Visit = (file, path, value, out) => {
      if (statesTheRight.test(value) && !/sealed/i.test(value)) out.push({ file, path, value, rule: "no sealed exception" });
    };
    for (const [file, exports] of Object.entries(modules)) {
      if (FULL_TEXT_FILES.has(file)) continue;
      for (const [name, value] of Object.entries(exports)) walk(file, name, value, findings, new Set(), 0, visit);
    }
    expect(findings, `Withdrawal period without the exception:\n${formatFindings(findings)}`).toEqual([]);
    // The two places the review named.
    expect(faqModule.faq.find((item) => item.id === "right-of-withdrawal")?.answer).toMatch(/sealed/i);
    expect(home.guarantee.points.find((point) => point.id === "rights")?.text).toMatch(/sealed/i);
  });

  it("never claims that a sign-up was saved or that an email was sent while the endpoint is a stub", () => {
    const { site } = siteModule;
    expect(site.emailCapture.submit).not.toMatch(/send|email/i);
    expect(site.newsletter.success).not.toMatch(/on the list|subscribed|welcome aboard/i);
    expect(site.newsletter.demoNote).toMatch(/not saved/i);
    expect(site.emailCapture.demoNote).toMatch(/not saved/i);
  });

  it("marks the placeholder company email like the other company details", () => {
    const { company } = siteModule.site;
    expect(company.emailLabel).toBe(`${company.email} (placeholder)`);
    for (const page of Object.values(legalModule.legal)) {
      const text = JSON.stringify(page);
      expect(text).not.toMatch(new RegExp(`\\(mailto:${company.email.replace(/\./g, "\\.")}\\)(?! \\(placeholder\\))`));
    }
    expect(pagesModule.pages.contact.form.success.body).not.toContain(company.email);
    expect(pagesModule.pages.contact.form.error).not.toContain(company.email);
  });
});

describe("homepage copy added after the phase 5 review", () => {
  it("has an honest reviews empty state: no score, no stars, no count", () => {
    expect(home.reviews.emptyTitle.trim()).not.toBe("");
    expect(home.reviews.emptyTitle).not.toMatch(/\d|star|rating/i);
  });

  it("drops the interim scent finder copy now that the quiz ships (D38, D43.1, D51)", () => {
    expect("interim" in home.scentFinder, "home.scentFinder.interim").toBe(false);
    expect("interimAnswers" in home.faq, "home.faq.interimAnswers").toBe(false);
    expect(home.scentFinder.intro).toMatch(/three questions/i);
    const whichScent = faqModule.faq.find((item) => item.id === "which-scent");
    expect(whichScent?.onHome, "content/faq.ts which-scent: onHome").toBe(true);
    expect(whichScent?.answer).toMatch(/scent finder/i);
    expect(pdpModule.pdp.faq.idsFor["discovery-set"], "pdp.faq.idsFor.discovery-set").toContain("which-scent");
  });

  it("states the guarantee days from offers.ts and keeps the short intros short", () => {
    expect(home.guarantee.title.trim()).not.toBe("");
    expect(home.guarantee.leadShort).toContain(`${offersModule.offers.guaranteeDays} days`);
    expect(home.comparison.introShort.length).toBeLessThan(home.comparison.intro.length);
    expect(home.comparison.introShort).not.toMatch(/in general/i);
  });

  it("gives quick add an accessible name that starts with its visible text", () => {
    expect(home.productGrid.card.addedLabel("North Swell").startsWith("Added")).toBe(true);
  });
});
