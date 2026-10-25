import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * What crawlers and clients without JavaScript get (D54): product pages have
 * their product in the static HTML, in place, and an unknown slug answers 404
 * to browsers and HTML-limited bots alike (no soft 404).
 */

const BINGBOT = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const TWITTERBOT = "Twitterbot/1.0";

/** Product paths from /sitemap.xml, so the spec follows the catalogue. */
async function productPaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>[^<]*?(\/products\/[^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(paths.length).toBeGreaterThan(0);
  return paths;
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every product page shows its product as the only h1", async ({ page, request }) => {
    for (const path of await productPaths(request)) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      const headings = page.locator("h1");
      await expect(headings, path).toHaveCount(1);
      await expect(headings, path).toBeVisible();
      await expect(page.getByText("Product not found"), path).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Add to cart/ }).first(), path).toBeVisible();
    }
  });
});

test("an unknown product slug is a 404 for browsers and HTML-limited bots", async ({ request }) => {
  for (const userAgent of [undefined, BINGBOT, TWITTERBOT]) {
    const headers = userAgent ? { "user-agent": userAgent } : undefined;
    const response = await request.get(`/products/no-such-scent-${Date.now()}`, { headers });
    expect(response.status(), userAgent ?? "browser").toBe(404);
    expect(await response.text()).toContain('<meta name="robots" content="noindex"/>');
  }
});

test("HTML-limited bots get the same product page as browsers", async ({ request }) => {
  const [path] = await productPaths(request);
  for (const userAgent of [BINGBOT, TWITTERBOT]) {
    const response = await request.get(path, { headers: { "user-agent": userAgent } });
    expect(response.status(), userAgent).toBe(200);
    expect(response.headers()["cache-control"], userAgent).not.toContain("no-store");
  }
});
