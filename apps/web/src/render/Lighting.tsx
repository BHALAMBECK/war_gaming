export function Lighting() {
  return (
    <>
      {/* Ambient light for overall scene illumination */}
      <ambientLight intensity={0.3} />
      
      {/* Directional light simulating sun */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={1.5}
        castShadow={false}
      />
      
      {/* Additional fill light */}
      <directionalLight
        position={[-5, -3, -5]}
        intensity={0.3}
        castShadow={false}
      />
    </>
  );
}

