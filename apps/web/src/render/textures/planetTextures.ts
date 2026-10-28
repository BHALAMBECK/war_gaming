/**
 * Shared planet/moon texture URLs (CORS-friendly CDNs) + helpers.
 */

import {
  RepeatWrapping,
  Texture,
  TextureLoader,
  type Texture as ThreeTexture,
} from 'three';

const THREE_PLANETS =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets';
const THREE_PLANETS_RAW =
  'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets';
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

export const BODY_TEXTURE_URLS: Record<
  string,
  Partial<Record<BodyTextureKind, [string, string]>>
> = {
  earth: {
    map: [
      `${THREE_PLANETS}/earth_atmos_2048.jpg`,
      `${THREE_PLANETS_RAW}/earth_atmos_2048.jpg`,
    ],
    normal: [
      `${THREE_PLANETS}/earth_normal_2048.jpg`,
      `${THREE_PLANETS_RAW}/earth_normal_2048.jpg`,
    ],
  },
  moon: {
    map: [
      `${THREE_PLANETS}/moon_1024.jpg`,
      `${THREE_PLANETS_RAW}/moon_1024.jpg`,
    ],
    // Reuse albedo as bump for crater relief when no dedicated bump is available
    bump: [
      `${THREE_PLANETS}/moon_1024.jpg`,
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

function configureTexture(texture: Texture, asColor: boolean): Texture {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  if (asColor) {
    texture.colorSpace = 'srgb';
  }
  return texture;
}

function loadOne(
  loader: TextureLoader,
  primary: string,
  fallback: string,
  asColor: boolean
): Promise<Texture | null> {
  return new Promise((resolve) => {
    const tryUrl = (url: string, isFallback: boolean) => {
      loader.load(
        url,
        (tex) => resolve(configureTexture(tex, asColor)),
        undefined,
        () => {
          if (!isFallback) tryUrl(fallback, true);
          else resolve(null);
        }
      );
    };
    tryUrl(primary, false);
  });
}

/**
 * Load map/bump/normal for a body id. Missing kinds are omitted.
 */
export async function loadBodyTextures(
  bodyId: string
): Promise<BodyTextureSet> {
  const spec = BODY_TEXTURE_URLS[bodyId];
  if (!spec) return {};

  const loader = new TextureLoader();
  loader.crossOrigin = 'anonymous';
  const out: BodyTextureSet = {};

  if (spec.map) {
    const map = await loadOne(loader, spec.map[0]!, spec.map[1]!, true);
    if (map) out.map = map;
  }
  if (spec.bump) {
    const bump = await loadOne(loader, spec.bump[0]!, spec.bump[1]!, false);
    if (bump) out.bump = bump;
  }
  if (spec.normal) {
    const normal = await loadOne(
      loader,
      spec.normal[0]!,
      spec.normal[1]!,
      false
    );
    if (normal) out.normal = normal;
  }

  return out;
}

export function disposeBodyTextures(set: BodyTextureSet) {
  set.map?.dispose();
  set.bump?.dispose();
  set.normal?.dispose();
}
