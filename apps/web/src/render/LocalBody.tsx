/**
 * True-scale body-local Moon (no orbital companion motion, no thick atmosphere).
 */

import { TexturedBodySphere } from './TexturedBodySphere';

interface LocalMoonProps {
  radius?: number;
}

export function LocalMoon({ radius = 1 }: LocalMoonProps) {
  return (
    <TexturedBodySphere
      bodyId="moon"
      radius={radius}
      spin={0.006}
      fallbackColor="#a8a29a"
      bumpScale={0.18}
    />
  );
}
