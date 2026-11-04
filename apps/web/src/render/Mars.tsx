/**
 * Mars body for true-scale body-local view (origin = Mars center, radius = 1).
 */

import { TexturedBodySphere } from './TexturedBodySphere';

interface MarsProps {
  radius?: number;
}

export function Mars({ radius = 1 }: MarsProps) {
  return (
    <TexturedBodySphere
      bodyId="mars"
      radius={radius}
      spin={0.01}
      fallbackColor="#c1440e"
      bumpScale={0.14}
      haze={{ color: '#e8a070', opacity: 0.14, scale: 1.02 }}
    />
  );
}
