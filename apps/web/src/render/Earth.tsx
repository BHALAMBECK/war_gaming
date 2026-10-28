import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, TextureLoader, Texture, RepeatWrapping } from 'three';

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

        console.log('Loading Earth textures from:', dayUrl);

        // Load day texture with proper configuration
        dayTex = await new Promise<Texture>((resolve, reject) => {
          const tryLoad = (url: string, isFallback = false) => {
            loader.load(
              url,
              (texture) => {
                console.log(`Earth day texture loaded successfully from ${isFallback ? 'fallback' : 'primary'} URL`);
                // Configure texture properties for realistic Earth appearance
                texture.wrapS = texture.wrapT = RepeatWrapping;
                texture.anisotropy = 16; // High quality filtering
                texture.colorSpace = 'srgb';
                resolve(texture);
              },
              (progress) => {
                if (progress.lengthComputable) {
                  const percentComplete = (progress.loaded / progress.total) * 100;
                  console.log(`Earth texture loading (${isFallback ? 'fallback' : 'primary'}):`, percentComplete.toFixed(0) + '%');
                }
              },
              (error) => {
                if (!isFallback) {
                  console.warn('Failed to load Earth day texture from primary URL, trying fallback:', error);
                  tryLoad(dayUrlFallback, true);
                } else {
                  console.error('Failed to load Earth day texture from both URLs:', error);
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
                  console.log(`Earth night texture loaded successfully from ${isFallback ? 'fallback' : 'primary'} URL`);
                  // Configure texture properties
                  texture.wrapS = texture.wrapT = RepeatWrapping;
                  texture.anisotropy = 16;
                  texture.colorSpace = 'srgb';
                  resolve(texture);
                },
                undefined,
                (error) => {
                  if (!isFallback) {
                    console.warn('Failed to load Earth night texture from primary URL, trying fallback:', error);
                    tryLoad(nightUrlFallback, true);
                  } else {
                    console.warn('Failed to load Earth night texture from both URLs, continuing without night texture:', error);
                    resolve(null); // Resolve with null instead of rejecting - night texture is optional
                  }
                }
              );
            };
            tryLoad(nightUrl);
          });
        } catch (error) {
          console.warn('Night texture loading failed, continuing without it:', error);
          nightTex = null; // Night texture is optional
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
          console.error('Failed to load Earth textures, using fallback colors:', error);
          setTextureError(true);
          setTexturesLoaded(true); // Mark as loaded so we render fallback
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

  // Debug logging
  useEffect(() => {
    if (dayTexture) {
      console.log('Earth day texture is set:', dayTexture);
    }
    if (textureError) {
      console.warn('Earth texture error - using fallback blue color');
    }
  }, [dayTexture, textureError]);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 128, 128]} />
      <meshStandardMaterial
        key={`earth-material-${texturesLoaded ? 'loaded' : 'fallback'}-${dayTexture ? 'tex' : 'no-tex'}`}
        map={dayTexture}
        normalMap={normalTexture}
        emissiveMap={nightTexture}
        color={useFallback ? 0x4a90e2 : 0xffffff}
        emissive={useFallback ? 0x1a3a5a : 0x222222}
        emissiveIntensity={useFallback ? 0.3 : 0.6}
        roughness={0.85}
        metalness={0.05}
        envMapIntensity={1.0}
      />
    </mesh>
  );
}

