import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Mesh,
  TextureLoader,
  Texture,
  RepeatWrapping,
  BackSide,
  AdditiveBlending,
} from 'three';

interface EarthProps {
  radius?: number;
}

export function Earth({ radius = 1 }: EarthProps) {
  const meshRef = useRef<Mesh>(null);
  const [dayTexture, setDayTexture] = useState<Texture | null>(null);
  const [nightTexture, setNightTexture] = useState<Texture | null>(null);
  const [normalTexture, setNormalTexture] = useState<Texture | null>(null);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [textureError, setTextureError] = useState(false);

  useEffect(() => {
    const loader = new TextureLoader();
    // Set crossOrigin to allow CORS requests
    loader.crossOrigin = 'anonymous';
    let dayTex: Texture | null = null;
    let nightTex: Texture | null = null;
    let normalTex: Texture | null = null;
    let cancelled = false;

    const loadTextures = async () => {
      try {
        // Use correct texture file names and multiple reliable sources
        // Primary: jsDelivr GitHub CDN (CORS-friendly)
        const dayUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg';
        const nightUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_night_2048.jpg';
        
        // Fallback: GitHub raw (may work with crossOrigin)
        const dayUrlFallback = 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/earth_atmos_2048.jpg';
        const nightUrlFallback = 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/earth_night_2048.jpg';

        dayTex = await new Promise<Texture>((resolve, reject) => {
          const tryLoad = (url: string, isFallback = false) => {
            loader.load(
              url,
              (texture) => {
                texture.wrapS = texture.wrapT = RepeatWrapping;
                texture.anisotropy = 16;
                texture.colorSpace = 'srgb';
                resolve(texture);
              },
              undefined,
              (error) => {
                if (!isFallback) {
                  tryLoad(dayUrlFallback, true);
                } else {
                  reject(error);
                }
              }
            );
          };
          tryLoad(dayUrl);
        });

        if (cancelled) return;

        // Load night texture with proper configuration (optional - Earth will still render without it)
        try {
          nightTex = await new Promise<Texture | null>((resolve) => {
            const tryLoad = (url: string, isFallback = false) => {
              loader.load(
                url,
                (texture) => {
                  texture.wrapS = texture.wrapT = RepeatWrapping;
                  texture.anisotropy = 16;
                  texture.colorSpace = 'srgb';
                  resolve(texture);
                },
                undefined,
                () => {
                  if (!isFallback) tryLoad(nightUrlFallback, true);
                  else resolve(null);
                }
              );
            };
            tryLoad(nightUrl);
          });
        } catch {
          nightTex = null;
        }

        if (cancelled) return;

        const normalUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_normal_2048.jpg';
        const normalUrlFallback = 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/earth_normal_2048.jpg';
        try {
          normalTex = await new Promise<Texture | null>((resolve) => {
            const tryLoad = (url: string, isFallback = false) => {
              loader.load(
                url,
                (texture) => {
                  texture.wrapS = texture.wrapT = RepeatWrapping;
                  texture.anisotropy = 16;
                  resolve(texture);
                },
                undefined,
                () => {
                  if (!isFallback) tryLoad(normalUrlFallback, true);
                  else resolve(null);
                }
              );
            };
            tryLoad(normalUrl);
          });
        } catch {
          normalTex = null;
        }

        if (cancelled) return;

        setDayTexture(dayTex);
        setNightTexture(nightTex);
        setNormalTexture(normalTex);
        setTexturesLoaded(true);
      } catch (error) {
        if (!cancelled) {
          setTextureError(true);
          setTexturesLoaded(true);
        }
      }
    };

    loadTextures();

    return () => {
      cancelled = true;
      // Cleanup textures if component unmounts
      if (dayTex) dayTex.dispose();
      if (nightTex) nightTex.dispose();
      if (normalTex) normalTex.dispose();
    };
  }, []);

  // Rotate Earth slowly for visual interest
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
    }
  });

  // Use fallback colors if textures failed to load
  const useFallback = textureError || (!texturesLoaded && !dayTexture && !nightTexture);

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          key={`earth-material-${texturesLoaded ? 'loaded' : 'fallback'}-${dayTexture ? 'tex' : 'no-tex'}`}
          map={dayTexture}
          normalMap={normalTexture}
          emissiveMap={nightTexture}
          color={useFallback ? 0x4a90e2 : 0xffffff}
          emissive={useFallback ? 0x1a3a5a : 0x111122}
          emissiveIntensity={useFallback ? 0.35 : 0.72}
          roughness={0.78}
          metalness={0.02}
        />
      </mesh>
      <mesh scale={1.018} renderOrder={2}>
        <sphereGeometry args={[radius, 96, 96]} />
        <meshBasicMaterial
          color="#6eb5ff"
          transparent
          opacity={0.22}
          side={BackSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh scale={1.045} renderOrder={1}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          color="#1a4a8a"
          transparent
          opacity={0.06}
          side={BackSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

