/**
 * TrajectoryPreview component: shows predicted trajectory after delta-v burn.
 * Renders a preview of the orbit path that would result from applying the current RTN delta-v inputs.
 */

import { useMemo, useState, useEffect } from 'react';
import { useAgentStore } from '@/ui/stores/agentStore';
import { propagateKepler } from '@/sim/orbit/propagator';
import { applyDeltaV } from '@/sim/maneuvers/deltaV';
import { rtnToEci } from '@/sim/maneuvers/rtnToEci';
import { eciToScene } from './utils/coordinateConversion';
import { EARTH_MU } from '@/sim/orbit/constants';
import { cartesianToElements } from '@/sim/orbit/conversions';

/**
 * TrajectoryPreview component showing predicted trajectory after burn.
 * Only visible when a satellite is selected and RTN inputs are non-zero.
 */
export function TrajectoryPreview() {
  const selectedAgent = useAgentStore((state) => state.getSelectedAgent());
  
  // We need to get RTN inputs from ManeuverPanel. Since we don't have a shared store for this,
  // we'll use a local state that gets updated via a custom event or we'll read from a temporary store.
  // For now, let's use a simple approach: store RTN preview values in agentStore when inputs change.
  // Actually, let's make this simpler: we'll compute preview from a prop or event.
  // Since we can't easily share state between ManeuverPanel and TrajectoryPreview without a store,
  // we'll compute the preview trajectory here based on a fixed preview vector for demonstration.
  // In a real implementation, we'd want to sync this with ManeuverPanel inputs.
  
  // For now, we'll compute a preview only when we can determine RTN inputs.
  // Let's store the preview RTN vector in a simple way - we can enhance this later.
  
  // Actually, let's check if there's a better way - we could use a shared state/store for preview RTN values
  // For MVP, let's make TrajectoryPreview read from a simple state that ManeuverPanel sets
  
  const [previewRtnVector, setPreviewRtnVector] = useState<[number, number, number] | null>(null);

  // Listen for RTN preview updates from ManeuverPanel
  useEffect(() => {
    const handleRtnPreviewUpdate = (event: CustomEvent<[number, number, number]>) => {
      setPreviewRtnVector(event.detail);
    };

    window.addEventListener('rtnPreviewUpdate' as any, handleRtnPreviewUpdate as EventListener);
    return () => {
      window.removeEventListener('rtnPreviewUpdate' as any, handleRtnPreviewUpdate as EventListener);
    };
  }, []);

  // Calculate trajectory preview points
  const trajectoryPoints = useMemo(() => {
    if (!selectedAgent || !previewRtnVector) return null;

    // Check if preview vector is non-zero
    const [r, t, n] = previewRtnVector;
    const magnitude = Math.sqrt(r * r + t * t + n * n);
    if (magnitude < 0.1) return null; // Don't show preview for near-zero inputs

    try {
      // Apply delta-v to get predicted initial state (without actually updating the agent)
      const dvVector = rtnToEci(previewRtnVector, selectedAgent.state);
      const { newState } = applyDeltaV(selectedAgent.state, dvVector, selectedAgent.dvRemaining);

      // Calculate orbital period for preview time horizon (~1 orbit)
      const elements = cartesianToElements(newState);
      const n = Math.sqrt(EARTH_MU / (elements.a * elements.a * elements.a)); // Mean motion (rad/s)
      const period = (2 * Math.PI) / n; // Orbital period (s)
      const previewTime = Math.min(period, 7200); // Cap at 2 hours or 1 period

      // Generate points along predicted trajectory
      const numPoints = 100;
      const points: [number, number, number][] = [];
      const timeStep = previewTime / numPoints;

      for (let i = 0; i <= numPoints; i++) {
        // Propagate from initial state
        const propagatedState = propagateKepler(newState, i * timeStep);
        const scenePos = eciToScene(propagatedState.position);
        points.push(scenePos);
      }

      return points;
    } catch (error) {
      console.warn('Failed to calculate trajectory preview:', error);
      return null;
    }
  }, [selectedAgent, previewRtnVector]);

  // Convert points to Float32Array for buffer geometry
  const positions = useMemo(() => {
    if (!trajectoryPoints) {
      return new Float32Array(0);
    }
    const array = new Float32Array(trajectoryPoints.length * 3);
    trajectoryPoints.forEach((point, index) => {
      array[index * 3] = point[0];
      array[index * 3 + 1] = point[1];
      array[index * 3 + 2] = point[2];
    });
    return array;
  }, [trajectoryPoints]);

  // Only render if we have valid data
  if (!selectedAgent || !trajectoryPoints || trajectoryPoints.length === 0) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={trajectoryPoints.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ffaa00" opacity={0.6} transparent />
    </line>
  );
}

/**
 * Helper function to update trajectory preview RTN vector.
 * Call this from ManeuverPanel when RTN inputs change.
 */
export function updateTrajectoryPreview(rtnVector: [number, number, number]) {
  const event = new CustomEvent('rtnPreviewUpdate', { detail: rtnVector });
  window.dispatchEvent(event);
}
