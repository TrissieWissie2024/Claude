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

/** The banned list. Case-insensitive unless stated. */
const RULES: Rule[] = [
  { name: "exclamation mark", pattern: /!/ },
  // Emoji: any Extended_Pictographic character or an emoji presentation selector.
  // "©" is Extended_Pictographic but renders as plain text; it is the one exception (footer copyright).
  { name: "emoji", pattern: /(?!©)\p{Extended_Pictographic}|\u{FE0F}/u },
  ...HYPE_WORDS.map((word) => ({ name: `hype word "${word}"`, pattern: new RegExp(`\\b${word}\\b`, "i") })),

  // References to other perfumes or brands (brief §2.5).
  { name: "inspired by", pattern: /inspired by/i },
  { name: "smells like", pattern: /smells? like/i },
  { name: "dupe", pattern: /\bdupes?\b/i },
  { name: "alternative to", pattern: /alternative to/i },

  // Pheromone and attraction claims.
  { name: "pheromone", pattern: /pheromone/i },
  { name: "attract", pattern: /attract/i },
  { name: "seduc", pattern: /seduc/i },
  { name: "compliment", pattern: /compliment/i },
  { name: "women will", pattern: /women will/i },
  { name: "turn heads", pattern: /turns? heads/i },

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
];

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
  for (const rule of RULES) {
    if (rule.allowIn?.includes(file)) continue;
    if (rule.pattern.test(value)) findings.push({ file, path, value, rule: rule.name });
  }
}

function walk(file: string, path: string, value: unknown, findings: Finding[], seen: Set<unknown>, depth = 0) {
  if (depth > MAX_DEPTH) return;
  if (typeof value === "string") {
    checkString(file, path, value, findings);
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
        walk(file, `${path}(${args.map((arg) => JSON.stringify(arg)).join(", ")})`, result, findings, seen, depth + 1);
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
    value.forEach((item, index) => walk(file, `${path}[${index}]`, item, findings, seen, depth + 1));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    walk(file, `${path}.${key}`, child, findings, seen, depth + 1);
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
    ];
    for (const sample of samples) {
      const findings: Finding[] = [];
      checkString("content/sample.ts", "sample", sample, findings);
      expect(findings.length, `expected a finding for ${JSON.stringify(sample)}`).toBeGreaterThan(0);
    }
    const clean: Finding[] = [];
    checkString("content/sample.ts", "sample", "© 2026 CORVANE. Twist. Swipe. Go.", clean);
    expect(clean).toEqual([]);
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
