/**
 * Shared planet/moon texture URLs (CORS-friendly CDNs) + cached helpers.
 */

import {
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  type Texture as ThreeTexture,
} from 'three';

const THREE_PLANETS =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets';
const THREE_PLANETS_RAW =
  'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets';
const THREE_ORG = 'https://threejs.org/examples/textures/planets';
const THREEX =
  'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images';
const THREEX_RAW =
  'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images';

export type BodyTextureKind = 'map' | 'bump' | 'normal';

export interface BodyTextureSet {
  map?: ThreeTexture;
  bump?: ThreeTexture;
  normal?: ThreeTexture;
}

/** Primary + fallbacks per kind (tried in order). */
export const BODY_TEXTURE_URLS: Record<
  string,
  Partial<Record<BodyTextureKind, string[]>>
> = {
  earth: {
    map: [
      `${THREE_PLANETS}/earth_atmos_2048.jpg`,
      `${THREE_ORG}/earth_atmos_2048.jpg`,
      `${THREE_PLANETS_RAW}/earth_atmos_2048.jpg`,
    ],
    normal: [
      `${THREE_PLANETS}/earth_normal_2048.jpg`,
      `${THREE_ORG}/earth_normal_2048.jpg`,
      `${THREE_PLANETS_RAW}/earth_normal_2048.jpg`,
    ],
  },
  moon: {
    map: [
      `${THREE_PLANETS}/moon_1024.jpg`,
      `${THREE_ORG}/moon_1024.jpg`,
      `${THREE_PLANETS_RAW}/moon_1024.jpg`,
    ],
    bump: [
      `${THREE_PLANETS}/moon_1024.jpg`,
      `${THREE_ORG}/moon_1024.jpg`,
      `${THREE_PLANETS_RAW}/moon_1024.jpg`,
    ],
  },
  mars: {
    map: [`${THREEX}/marsmap1k.jpg`, `${THREEX_RAW}/marsmap1k.jpg`],
    bump: [`${THREEX}/marsbump1k.jpg`, `${THREEX_RAW}/marsbump1k.jpg`],
  },
  mercury: {
    map: [`${THREEX}/mercurymap.jpg`, `${THREEX_RAW}/mercurymap.jpg`],
    bump: [`${THREEX}/mercurybump.jpg`, `${THREEX_RAW}/mercurybump.jpg`],
  },
  venus: {
    map: [`${THREEX}/venusmap.jpg`, `${THREEX_RAW}/venusmap.jpg`],
    bump: [`${THREEX}/venusbump.jpg`, `${THREEX_RAW}/venusbump.jpg`],
  },
  jupiter: {
    map: [`${THREEX}/jupitermap.jpg`, `${THREEX_RAW}/jupitermap.jpg`],
  },
  saturn: {
    map: [`${THREEX}/saturnmap.jpg`, `${THREEX_RAW}/saturnmap.jpg`],
  },
  uranus: {
    map: [`${THREEX}/uranusmap.jpg`, `${THREEX_RAW}/uranusmap.jpg`],
  },
  neptune: {
    map: [`${THREEX}/neptunemap.jpg`, `${THREEX_RAW}/neptunemap.jpg`],
  },
};

const loader = new TextureLoader();
loader.crossOrigin = 'anonymous';

/** In-flight / resolved cache so Strict Mode remounts share one load. */
const cache = new Map<string, Promise<BodyTextureSet>>();
const retainCount = new Map<string, number>();

function configureTexture(texture: Texture, asColor: boolean): Texture {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  if (asColor) {
    texture.colorSpace = SRGBColorSpace;
  }
  return texture;
}

function loadOne(urls: string[], asColor: boolean): Promise<Texture | null> {
  return new Promise((resolve) => {
    let i = 0;
    const tryNext = () => {
      if (i >= urls.length) {
        resolve(null);
        return;
      }
      const url = urls[i++]!;
      loader.load(
        url,
        (tex) => resolve(configureTexture(tex, asColor)),
        undefined,
        () => tryNext()
      );
    };
    tryNext();
  });
}

async function fetchBodyTextures(bodyId: string): Promise<BodyTextureSet> {
  const spec = BODY_TEXTURE_URLS[bodyId];
  if (!spec) return {};

  const out: BodyTextureSet = {};

  if (spec.map?.length) {
    const map = await loadOne(spec.map, true);
    if (map) out.map = map;
  }
  if (spec.bump?.length) {
    const bump = await loadOne(spec.bump, false);
    if (bump) out.bump = bump;
  }
  if (spec.normal?.length) {
    const normal = await loadOne(spec.normal, false);
    if (normal) out.normal = normal;
  }

  // If bump failed but map exists, reuse albedo for relief
  if (!out.bump && out.map) {
    out.bump = out.map;
  }

  return out;
}

/**
 * Load map/bump/normal for a body id (cached). Call releaseBodyTextures on unmount.
 */
export function loadBodyTextures(bodyId: string): Promise<BodyTextureSet> {
  retainCount.set(bodyId, (retainCount.get(bodyId) ?? 0) + 1);

  let pending = cache.get(bodyId);
  if (!pending) {
    pending = fetchBodyTextures(bodyId).catch((err) => {
      cache.delete(bodyId);
      throw err;
    });
    cache.set(bodyId, pending);
  }
  return pending;
}

/**
 * Drop a retain on cached body textures.
 * Textures stay cached for the session so React Strict Mode remounts
 * (and Overview ↔ body-local switches) cannot dispose maps mid-frame.
 */
export function releaseBodyTextures(bodyId: string): void {
  const n = (retainCount.get(bodyId) ?? 1) - 1;
  if (n <= 0) retainCount.delete(bodyId);
  else retainCount.set(bodyId, n);
}

/** @deprecated Prefer releaseBodyTextures(bodyId) for shared cache. */
export function disposeBodyTextures(set: BodyTextureSet) {
  const seen = new Set<ThreeTexture>();
  for (const tex of [set.map, set.bump, set.normal]) {
    if (tex && !seen.has(tex)) {
      seen.add(tex);
      tex.dispose();
    }
  }
}
