export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.12} />
      <hemisphereLight
        color="#b8d4ff"
        groundColor="#050508"
        intensity={0.35}
      />
      <directionalLight
        position={[8, 4, 6]}
        intensity={2.4}
        color="#fff8ee"
        castShadow={false}
      />
      <directionalLight
        position={[-6, -2, -4]}
        intensity={0.18}
        color="#4466aa"
        castShadow={false}
      />
    </>
  );
}
