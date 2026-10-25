/**
 * Asset manifest: every photo and video slot on the site (docs/PLAN.md §14).
 *
 * Each slot has a fixed key, file path, aspect ratio and pixel size, so real
 * photography can replace the SVG renders and placeholders one to one.
 * docs/ASSETS.md (the shot list) is generated from this file.
 *
 * How it works
 * - `path` is where the file goes, relative to public/ (so "/images/x.webp" is
 *   public/images/x.webp). It never changes.
 * - `src: null` means "not supplied yet". The site then shows the SVG product
 *   render (packshots) or a placeholder in the same aspect ratio with the label
 *   "PHOTO: ..." or "VIDEO: ...".
 * - To supply a file: export it at the listed size, put it at `path` and set
 *   `src` to the same string (or to a full CDN URL). Videos also need `poster`.
 *   Nothing else changes: PhotoSlot, VideoSlot and ProductMedia pick it up.
 * - Formats: photos as WebP (quality about 80, sRGB, under about 400 KB);
 *   videos as MP4 (H.264, yuv420p, 30 fps, AAC audio or none) with a WebP
 *   poster frame at the same size.
 * - Alt text describes what the finished photo shows. Update it if the shot
 *   turns out differently.
 * - Only our own photography and video. No images of other brands or people
 *   who have not signed a release (brief §5: "geen foto's van anderen").
 * - UGC slots are CORVANE's own content ("From CORVANE"), never presented as
 *   customer reviews (docs/PLAN.md §14).
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Aspect ratios used by the site, as width:height. */
export type MediaAspect = "4:5" | "16:10" | "9:16";

/** Product slugs with photo slots. Must match content/products.ts. */
export const ASSET_PRODUCT_SLUGS = [
  "north-swell",
  "drift-and-ember",
  "lantern-smoke",
  "iron-coast",
  "dune-fig",
  "harbour-tea",
  "discovery-set",
  "travel-pouch",
  "e-gift-card",
] as const;

export type AssetProductSlug = (typeof ASSET_PRODUCT_SLUGS)[number];

/** The three photo slots of every product page gallery. */
export type ProductShot = "packshot" | "inHand" | "lifestyle";

export const LIFESTYLE_SCENES = ["gym", "work", "travel", "night"] as const;
export type LifestyleScene = (typeof LIFESTYLE_SCENES)[number];

export type ImageAssetKey =
  | `products.${AssetProductSlug}.${ProductShot}`
  | `lifestyle.${LifestyleScene}`
  | "hero.group"
  | "story.coast";

export type VideoAssetKey = `ugc.${1 | 2 | 3 | 4}`;

/** File id of a video slot; matches the ids in content/home.ts (videoRow.slots). */
export type VideoAssetId = `ugc-0${1 | 2 | 3 | 4}`;

export type AssetKey = ImageAssetKey | VideoAssetKey;

/** Placeholder prefixes ("PHOTO: <label>", "VIDEO: <label>") while a file is not supplied. */
export const placeholderCopy = {
  photoPrefix: "PHOTO:",
  videoPrefix: "VIDEO:",
};

export interface ImageVariant {
  /** Target location under public/. */
  path: string;
  /** null = not supplied yet. Set to `path` (or a CDN URL) once the file exists. */
  src: string | null;
  aspect: MediaAspect;
  /** Export size in pixels. */
  width: number;
  height: number;
}

export interface ImageAsset extends ImageVariant {
  kind: "image";
  key: ImageAssetKey;
  /** Short name used in placeholders ("PHOTO: <label>") and the shot list. */
  label: string;
  /** Alt text for the finished photo. */
  alt: string;
  /** Brief for the photographer: what is in frame, background, light. */
  shot: string;
  /** Optional wide crop for desktop (art direction), same subject. */
  desktop?: ImageVariant;
}

export interface VideoAsset {
  kind: "video";
  key: VideoAssetKey;
  /** File id, "ugc-01" ... "ugc-04" (also accepted by getVideoAsset). */
  id: VideoAssetId;
  /** File number, 1 to 4. */
  index: 1 | 2 | 3 | 4;
  label: string;
  /** Accessible name of the video element. */
  alt: string;
  /** Target location of the MP4 under public/. */
  path: string;
  /** null = not supplied yet. */
  src: string | null;
  /** Target location of the WebP poster frame under public/. */
  posterPath: string;
  /** null = not supplied yet. */
  poster: string | null;
  aspect: "9:16";
  width: 1080;
  height: 1920;
  codec: "H.264";
  /** Suggested running time. */
  duration: string;
  /** Brief for the shoot. */
  shot: string;
}

/* ------------------------------------------------------------------ */
/* Shared specs                                                        */
/* ------------------------------------------------------------------ */

/** Every product and lifestyle photo: 4:5 portrait, 1600 x 2000 px. */
const PORTRAIT = { aspect: "4:5", width: 1600, height: 2000 } as const;

/** Every video: 9:16 vertical, 1080 x 1920 px, H.264. */
const VERTICAL = { aspect: "9:16", width: 1080, height: 1920, codec: "H.264" } as const;

const PACKSHOT_BRIEF =
  "Seamless sand backdrop (#EEE6D8). Product centred, filling about 80% of the frame height, camera slightly above, " +
  "soft daylight from the left, soft floor shadow. No props, no text. Same set-up for every product so the grid stays consistent.";

const IN_HAND_BRIEF =
  "Held at chest height against plain clothing in a neutral tone; hand and product only, no face, no rings, " +
  "no visible logos or tattoos. Soft daylight. Shows the real size of the product.";

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

interface ProductBriefs {
  name: string;
  packshot: { alt: string; shot: string };
  inHand: { alt: string; shot: string };
  lifestyle: { alt: string; shot: string; label: string };
}

function stickBriefs(name: string, ring: string, scene: { label: string; alt: string; shot: string }): ProductBriefs {
  return {
    name,
    packshot: {
      alt: `${name} solid cologne: a matte black 15 g twist-up stick with an engraved vane and a ${ring} ring at the base`,
      shot: `${name} stick upright, cap on, engraved vane and ${ring} ring facing the camera. ${PACKSHOT_BRIEF}`,
    },
    inHand: {
      alt: `A hand holding the ${name} stick with the cap off and the cologne twisted up`,
      shot: `${name} stick, cap off, cologne twisted up a few millimetres. ${IN_HAND_BRIEF}`,
    },
    lifestyle: { label: `${name}: ${scene.label}`, alt: scene.alt, shot: scene.shot },
  };
}

const productBriefs: Record<AssetProductSlug, ProductBriefs> = {
  "north-swell": stickBriefs("North Swell", "light blue", {
    label: "early gym session",
    alt: "The North Swell stick on a wooden bench in a gym changing room, next to a folded towel",
    shot: "Early morning gym changing room, cool daylight. Stick on a bench beside a towel and a water bottle without branding.",
  }),
  "drift-and-ember": stickBriefs("Drift & Ember", "burnt orange", {
    label: "evening at home",
    alt: "The Drift & Ember stick on a dark wooden table in warm evening light",
    shot: "Evening, warm low light. Stick on a dark wooden table next to a jacket being put on, before going out for dinner.",
  }),
  "lantern-smoke": stickBriefs("Lantern Smoke", "deep red", {
    label: "night out",
    alt: "The Lantern Smoke stick in the inside pocket of a dark jacket at night",
    shot: "Night, city or harbour lights out of focus behind. Stick sliding into the inside pocket of a dark jacket.",
  }),
  "iron-coast": stickBriefs("Iron Coast", "steel grey", {
    label: "work desk",
    alt: "The Iron Coast stick on a desk next to a laptop and a notebook",
    shot: "Clean desk in daylight. Stick next to a closed laptop and a notebook, as if taken out of a bag before a meeting.",
  }),
  "dune-fig": stickBriefs("Dune Fig", "sage green", {
    label: "weekend in the dunes",
    alt: "The Dune Fig stick held up against dune grass on a bright day",
    shot: "Dunes on the North Sea coast, bright overcast light. Stick held up against dune grass, hand only.",
  }),
  "harbour-tea": stickBriefs("Harbour Tea", "tea-coloured", {
    label: "slow morning",
    alt: "The Harbour Tea stick beside a cup of black tea on a windowsill overlooking a harbour",
    shot: "Morning light through a window, harbour or water out of focus. Stick beside a cup of black tea on the sill.",
  }),
  "discovery-set": {
    name: "Discovery Set",
    packshot: {
      alt: "The Discovery Set: six 3 g mini sticks in a tray, each with the ring colour of its scent, with the lid beside it",
      shot: `Open box from above: six mini sticks in the tray, ring colours in catalogue order, lid beside it. ${PACKSHOT_BRIEF}`,
    },
    inHand: {
      alt: "A hand holding one 3 g mini stick from the Discovery Set",
      shot: `One mini stick between thumb and finger, the open box out of focus behind. ${IN_HAND_BRIEF}`,
    },
    lifestyle: {
      label: "Discovery Set: one a day",
      alt: "The six Discovery Set mini sticks lined up on a bathroom shelf",
      shot: "Bathroom shelf in daylight. The six minis lined up in a row, one slightly forward, as if picking the scent of the day.",
    },
  },
  "travel-pouch": {
    name: "Travel Pouch",
    packshot: {
      alt: "The CORVANE Travel Pouch: a stitched canvas pouch with a kelp green hem and a small vane tab, shown holding three sticks (sold separately)",
      shot: `Pouch standing, three sticks peeking out of the top, vane tab visible. ${PACKSHOT_BRIEF}`,
    },
    inHand: {
      alt: "A hand holding the canvas Travel Pouch with three sticks inside (sticks sold separately)",
      shot: `Pouch held by its top hem, sticks visible. ${IN_HAND_BRIEF}`,
    },
    lifestyle: {
      label: "Travel Pouch: in the bag",
      alt: "The Travel Pouch in an open weekend bag between folded clothes",
      shot: "Open weekend bag from above, daylight. The pouch tucked between folded clothes and a washbag.",
    },
  },
  "e-gift-card": {
    name: "E-gift card",
    packshot: {
      alt: "The CORVANE e-gift card: a deep blue card with the vane icon and the wordmark",
      shot: "Not a photo: the e-gift card is digital. Supply a 1600 x 2000 rendering of the card on sand if the SVG render is replaced.",
    },
    inHand: {
      alt: "A phone in a hand showing the CORVANE e-gift card email",
      shot: `Phone held in one hand, screen showing the gift card email (use a mock-up, no real names or codes). ${IN_HAND_BRIEF}`,
    },
    lifestyle: {
      label: "E-gift card: sent",
      alt: "A phone on a table showing the CORVANE e-gift card, next to a coffee cup",
      shot: "Table in daylight, phone face up showing the gift card email (mock-up), a cup of coffee beside it.",
    },
  },
};

function productImage(slug: AssetProductSlug, shot: ProductShot, file: string, label: string, alt: string, brief: string): ImageAsset {
  const path = `/images/products/${slug}/${file}.webp`;
  return { kind: "image", key: `products.${slug}.${shot}`, path, src: null, ...PORTRAIT, label, alt, shot: brief };
}

function productImages(slug: AssetProductSlug): Record<ProductShot, ImageAsset> {
  const b = productBriefs[slug];
  return {
    packshot: productImage(slug, "packshot", "packshot", `${b.name} packshot`, b.packshot.alt, b.packshot.shot),
    inHand: productImage(slug, "inHand", "in-hand", `${b.name} in hand`, b.inHand.alt, b.inHand.shot),
    lifestyle: productImage(slug, "lifestyle", "lifestyle", b.lifestyle.label, b.lifestyle.alt, b.lifestyle.shot),
  };
}

/* ------------------------------------------------------------------ */
/* Lifestyle and hero                                                  */
/* ------------------------------------------------------------------ */

function lifestyleImage(scene: LifestyleScene, label: string, alt: string, shot: string): ImageAsset {
  return { kind: "image", key: `lifestyle.${scene}`, path: `/images/lifestyle/${scene}.webp`, src: null, ...PORTRAIT, label, alt, shot };
}

/* ------------------------------------------------------------------ */
/* Videos                                                              */
/* ------------------------------------------------------------------ */

function ugcVideo(index: 1 | 2 | 3 | 4, label: string, alt: string, duration: string, shot: string): VideoAsset {
  const file: VideoAssetId = `ugc-0${index}`;
  return {
    kind: "video",
    key: `ugc.${index}`,
    id: file,
    index,
    label,
    alt,
    path: `/videos/${file}.mp4`,
    src: null,
    posterPath: `/videos/${file}-poster.webp`,
    poster: null,
    ...VERTICAL,
    duration,
    shot,
  };
}

/* ------------------------------------------------------------------ */
/* The manifest                                                        */
/* ------------------------------------------------------------------ */

export const assets = {
  /** Product page gallery and product cards: packshot, in-hand scale shot, lifestyle. */
  products: Object.fromEntries(ASSET_PRODUCT_SLUGS.map((slug) => [slug, productImages(slug)])) as Record<
    AssetProductSlug,
    Record<ProductShot, ImageAsset>
  >,

  /** Lifestyle scenes for the homepage and the About page. */
  lifestyle: {
    gym: lifestyleImage(
      "gym",
      "Gym",
      "A man swiping a CORVANE stick across his wrist in a gym changing room",
      "Changing room after training, daylight. Stick twisted up, two swipes across the wrist. Face may be out of frame.",
    ),
    work: lifestyleImage(
      "work",
      "Work",
      "A CORVANE stick taken out of a jacket pocket at a desk",
      "Office or studio desk, daylight. Hand taking the stick out of a jacket pocket before a meeting.",
    ),
    travel: lifestyleImage(
      "travel",
      "Travel",
      "A CORVANE stick in the side pocket of a backpack on a train",
      "Train or ferry, window light. Stick in the side pocket of a backpack on the seat, landscape out of focus.",
    ),
    night: lifestyleImage(
      "night",
      "Night",
      "A CORVANE stick on a bar counter at night, city lights out of focus behind",
      "Evening, low warm light, lights out of focus. Stick standing on a bar counter or a table by the window.",
    ),
  } satisfies Record<LifestyleScene, ImageAsset>,

  /** Homepage hero. The SVG GroupRender shows until this is supplied. */
  hero: {
    group: {
      kind: "image",
      key: "hero.group",
      path: "/images/hero/group.webp",
      src: null,
      ...PORTRAIT,
      label: "Three sticks",
      alt: "Three CORVANE solid cologne sticks, North Swell, Drift & Ember and Lantern Smoke, the middle one with the cap off",
      shot:
        "Left to right: North Swell, Drift & Ember (in front, cap off, twisted up) and Lantern Smoke on a deep backdrop (#0F2733), slightly staggered. " +
        "Rim light behind so the matte black tubes separate from the dark background; ring colours clearly visible. " +
        "Mobile crop 4:5; keep the products in the middle 60% so the desktop crop works too.",
      desktop: {
        path: "/images/hero/group-desktop.webp",
        src: null,
        aspect: "16:10",
        width: 2560,
        height: 1600,
      },
    },
  } satisfies Record<"group", ImageAsset>,

  /** Brand story teaser on the homepage (and the About page). A PhotoSlot placeholder shows until this is supplied. */
  story: {
    coast: {
      kind: "image",
      key: "story.coast",
      path: "/images/story/coast.webp",
      src: null,
      ...PORTRAIT,
      label: "North Sea coast",
      alt: "Dunes on the North Sea coast under a wide grey sky, with a weather vane on a post in the foreground",
      shot:
        "North Sea coast, dunes and dune grass, wide sky, overcast daylight or late afternoon. A simple weather vane on a wooden post " +
        "in the foreground, slightly off centre. No people, no products, no other brands or signs. Portrait 4:5.",
    },
  } satisfies Record<"coast", ImageAsset>,

  /**
   * "From CORVANE" video row on the homepage: our own 9:16 films, never presented
   * as customer content or reviews. Titles match content/home.ts (videoRow.slots).
   */
  ugc: [
    ugcVideo(
      1,
      "Gym bag",
      "Video: a CORVANE stick taken out of a gym bag after training and swiped across the wrist",
      "10 to 15 s",
      "Gym bag on a bench after training. Hand takes out the Travel Pouch and a stick, twists it up, two swipes over the wrist, back in the bag.",
    ),
    ugcVideo(
      2,
      "Desk drawer",
      "Video: a CORVANE stick taken from a desk drawer before a meeting",
      "10 to 15 s",
      "Desk in daylight. Drawer opens, stick out, cap off, a swipe on the wrist and neck, cap on, drawer closes.",
    ),
    ugcVideo(
      3,
      "Weekend bag",
      "Video: packing the Travel Pouch with CORVANE sticks into a weekend bag",
      "10 to 15 s",
      "Top-down, daylight. Packing a weekend bag: clothes, washbag, the pouch with sticks; the zip closes.",
    ),
    ugcVideo(
      4,
      "Night out",
      "Video: a CORVANE stick taken from a jacket pocket before a night out",
      "10 to 15 s",
      "Evening, warm low light. Jacket on, stick from the inside pocket, two swipes on the neck, out the door.",
    ),
  ] satisfies VideoAsset[],
};

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

const imageIndex = new Map<string, ImageAsset>();
for (const shots of Object.values(assets.products)) {
  for (const asset of Object.values(shots)) imageIndex.set(asset.key, asset);
}
for (const asset of Object.values(assets.lifestyle)) imageIndex.set(asset.key, asset);
imageIndex.set(assets.hero.group.key, assets.hero.group);
imageIndex.set(assets.story.coast.key, assets.story.coast);

const videoIndex = new Map<string, VideoAsset>(assets.ugc.map((asset) => [asset.key, asset]));
const videoById = new Map<string, VideoAsset>(assets.ugc.map((asset) => [asset.id, asset]));

/** The image slot for a key, or null for an unknown key. */
export function getImageAsset(key: string): ImageAsset | null {
  return imageIndex.get(String(key)) ?? null;
}

/** The video slot for a key ("ugc.1" ... "ugc.4") or a file id ("ugc-01" ... "ugc-04"); null when unknown. */
export function getVideoAsset(key: string): VideoAsset | null {
  return videoIndex.get(String(key)) ?? videoById.get(String(key)) ?? null;
}

/** The photo slot of a product, or null when the slug has no slots. */
export function getProductImage(slug: string, shot: ProductShot): ImageAsset | null {
  return getImageAsset(`products.${slug}.${shot}`);
}

/** All image slots, in manifest order (for docs/ASSETS.md). */
export function listImageAssets(): ImageAsset[] {
  return [...imageIndex.values()];
}

/** All video slots, in manifest order (for docs/ASSETS.md). */
export function listVideoAssets(): VideoAsset[] {
  return [...videoIndex.values()];
}

/** "4:5" -> "4 / 5", for the CSS aspect-ratio property. */
export function aspectToCss(aspect: MediaAspect): string {
  const [w, h] = String(aspect).split(":");
  return `${w} / ${h}`;
}
