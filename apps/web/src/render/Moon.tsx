import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, TextureLoader, Texture, RepeatWrapping, Group } from 'three';

interface MoonProps {
  radius?: number;
  orbitDistance?: number;
  orbitSpeed?: number;
}

export function Moon({ 
  radius = 0.27, 
  orbitDistance = 3.5,
  orbitSpeed = 0.001 
}: MoonProps) {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const orbitAngleRef = useRef(0);
  const [moonTexture, setMoonTexture] = useState<Texture | null>(null);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [textureError, setTextureError] = useState(false);

  useEffect(() => {
    const loader = new TextureLoader();
    // Set crossOrigin to allow CORS requests
    loader.crossOrigin = 'anonymous';
    let moonTex: Texture | null = null;
    let cancelled = false;

    const loadTexture = async () => {
      try {
        // Use correct texture file name and multiple reliable sources
        // Primary: jsDelivr GitHub CDN (CORS-friendly)
        const moonUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/moon_1024.jpg';
        
        // Fallback: GitHub raw (may work with crossOrigin)
        const moonUrlFallback = 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/moon_1024.jpg';

        // Load Moon texture with proper configuration
        moonTex = await new Promise<Texture>((resolve, reject) => {
          const tryLoad = (url: string, isFallback = false) => {
            loader.load(
              url,
              (texture) => {
                console.log(`Moon texture loaded successfully from ${isFallback ? 'fallback' : 'primary'} URL`);
                // Configure texture properties
                texture.wrapS = texture.wrapT = RepeatWrapping;
                texture.anisotropy = 16;
                texture.colorSpace = 'srgb';
                resolve(texture);
              },
              undefined,
              (error) => {
                if (!isFallback) {
                  console.warn('Failed to load Moon texture from primary URL, trying fallback:', error);
                  tryLoad(moonUrlFallback, true);
                } else {
                  reject(error);
                }
              }
            );
          };
          tryLoad(moonUrl);
        });

        if (cancelled) return;

        setMoonTexture(moonTex);
        setTexturesLoaded(true);
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load Moon texture, using fallback color:', error);
          setTextureError(true);
          setTexturesLoaded(true); // Mark as loaded so we render fallback
        }
      }
    };

    loadTexture();

    return () => {
      cancelled = true;
      // Cleanup texture if component unmounts
      if (moonTex) moonTex.dispose();
    };
  }, []);

  // Animate Moon orbit around Earth and rotation
  useFrame(() => {
    if (groupRef.current) {
      // Update orbit angle
      orbitAngleRef.current += orbitSpeed;
      
      // Position Moon in orbit around Earth (XZ plane)
      groupRef.current.position.x = Math.cos(orbitAngleRef.current) * orbitDistance;
      groupRef.current.position.z = Math.sin(orbitAngleRef.current) * orbitDistance;
      groupRef.current.position.y = 0;
    }
    
    // Rotate Moon on its own axis
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0003;
    }
  });

  // Use fallback color if texture failed to load
  const useFallback = textureError || (!texturesLoaded && !moonTexture);

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          map={useFallback ? null : moonTexture}
          color={useFallback ? 0x888888 : 0xffffff}
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

