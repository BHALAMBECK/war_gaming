import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useTaskStore } from '@/ui/stores/taskStore';
import { propagateKeplerBatch } from '@/sim/orbit/propagator';
import { eciToScene } from './utils/coordinateConversion';
import { computeSwarmForces, enforceMinimumSeparation, DEFAULT_BEHAVIOR_PARAMS } from '@/sim/swarm';
import { allocateTasks, updateObjectiveState } from '@/sim/tasks/allocation';
import { computeObjectiveSteeringBatch } from '@/sim/tasks/steering';
import { DEFAULT_OBJECTIVE_STEERING_PARAMS } from '@/sim/tasks/types';
import { ObjectiveType } from '@/sim/tasks/types';

const tempObject = new Object3D();
const tempColor = new Color();

/**
 * Agents component using InstancedMesh for high-performance rendering.
 * Handles orbit propagation, selection, and hover highlighting.
 */
export function Agents() {
  const instancedMeshRef = useRef<InstancedMesh>(null);
  const { raycaster, camera, pointer, gl } = useThree();
  const { agents, updateAgentsBatch, selectAgent, hoverAgent, clearSelection } = useAgentStore();
  const { clockInstance, paused } = useSimClockStore();
  const { objectives, updateObjective, completeObjective, updateTimer, timerRunning } = useTaskStore();

  // Track last sim time to calculate delta
  const lastSimTimeRef = useRef<number | null>(null);

  // Initialize last sim time when clock instance changes
  useEffect(() => {
    if (clockInstance) {
      lastSimTimeRef.current = clockInstance.getTime();
    } else {
      lastSimTimeRef.current = null;
    }
  }, [clockInstance]);

  // Propagate orbits in render loop
  useFrame(() => {
    if (!instancedMeshRef.current || agents.length === 0) return;

    // Propagate orbits if simulation is running
    if (clockInstance && !paused) {
      const currentSimTime = clockInstance.getTime();
      
      // Initialize lastSimTime if not set
      if (lastSimTimeRef.current === null) {
        lastSimTimeRef.current = currentSimTime;
        return;
      }
      
      const simDelta = currentSimTime - lastSimTimeRef.current;
      
      if (simDelta > 0) {
        // Identify player-controlled agents (selected agents skip auto-navigation)
        const playerControlledIds = new Set(
          agents.filter((a) => a.selected).map((a) => a.id)
        );
        
        // Separate agents into player-controlled and auto-navigated
        const playerControlledAgents = agents.filter((a) => playerControlledIds.has(a.id));
        const autoAgents = agents.filter((a) => !playerControlledIds.has(a.id));
        
        // Propagate player-controlled agents with pure Kepler (no steering)
        const playerStates = playerControlledAgents.map((agent) => agent.state);
        const propagatedPlayerStates = propagateKeplerBatch(playerStates, simDelta);
        const playerUpdates = playerControlledAgents.map((agent, index) => ({
          id: agent.id,
          state: propagatedPlayerStates[index]!,
        }));
        
        // Task allocation and objective steering for auto-navigated agents (if objectives exist)
        if (objectives.length > 0 && autoAgents.length > 0) {
          // Create a mutable copy of objectives for allocation
          const objectivesCopy = objectives.map((obj) => ({ ...obj }));
          
          // Allocate tasks to auto-navigated agents only
          allocateTasks(autoAgents, objectivesCopy);
          
          // Update objectives in store with new assignments
          for (const obj of objectivesCopy) {
            if (obj.type === 'relay_node' && 'assignedAgentId' in obj) {
              const currentObj = objectives.find((o) => o.id === obj.id);
              if (currentObj && 'assignedAgentId' in currentObj && currentObj.assignedAgentId !== obj.assignedAgentId) {
                updateObjective(obj.id, { assignedAgentId: obj.assignedAgentId });
              }
            } else if (obj.type === 'hold_formation_zone' && 'assignedAgentIds' in obj) {
              const currentObj = objectives.find((o) => o.id === obj.id);
              if (currentObj && 'assignedAgentIds' in currentObj) {
                // Only update if changed
                const currentIds = JSON.stringify(currentObj.assignedAgentIds.sort());
                const newIds = JSON.stringify(obj.assignedAgentIds.sort());
                if (currentIds !== newIds) {
                  updateObjective(obj.id, { assignedAgentIds: obj.assignedAgentIds });
                }
              }
            }
          }
          
          // Get auto agent states
          const autoStates = autoAgents.map((agent) => agent.state);
          
          // Compute objective steering velocity adjustments (only for auto agents)
          const objectiveAdjustments = computeObjectiveSteeringBatch(
            autoAgents,
            objectives,
            DEFAULT_OBJECTIVE_STEERING_PARAMS
          );
          
          // Compute swarm behavior velocity adjustments (only for auto agents)
          const swarmAdjustments = computeSwarmForces(autoAgents, DEFAULT_BEHAVIOR_PARAMS, simDelta);
          
          // Combine objective and swarm adjustments
          const velocityAdjustments = swarmAdjustments.map((swarmAdj, index) => {
            const objAdj = objectiveAdjustments[index]!;
            return {
              delta: [
                swarmAdj.delta[0] + objAdj.delta[0],
                swarmAdj.delta[1] + objAdj.delta[1],
                swarmAdj.delta[2] + objAdj.delta[2],
              ] as [number, number, number],
            };
          });
          
          // Enforce minimum separation (basic collision avoidance)
          enforceMinimumSeparation(agents, velocityAdjustments, DEFAULT_BEHAVIOR_PARAMS);
          
          // Apply velocity adjustments to auto agent states before propagation
          const adjustedStates = autoStates.map((state, index) => {
            const adjustment = velocityAdjustments[index]!;
            const [vx, vy, vz] = state.velocity;
            const [dvx, dvy, dvz] = adjustment.delta;
            
            return {
              position: state.position,
              velocity: [
                vx + dvx * simDelta,
                vy + dvy * simDelta,
                vz + dvz * simDelta,
              ] as [number, number, number],
            };
          });
          
          // Propagate auto agents in batch with adjusted velocities
          const propagatedAutoStates = propagateKeplerBatch(adjustedStates, simDelta);
          
          // Combine player-controlled and auto agent updates
          const autoUpdates = autoAgents.map((agent, index) => ({
            id: agent.id,
            state: propagatedAutoStates[index]!,
          }));
          const allUpdates = [...playerUpdates, ...autoUpdates];
          updateAgentsBatch(allUpdates);
          
          // Update objective states and check for completion (check all agents, including player-controlled)
          const objectivesCopyForUpdate = objectives.map((obj) => ({ ...obj }));
          // Combine propagated states for completion checking
          const allPropagatedStates = [
            ...propagatedPlayerStates,
            ...propagatedAutoStates,
          ];
          const allAgentsForCompletion = [
            ...playerControlledAgents,
            ...autoAgents,
          ];
          const newlyCompleted = updateObjectiveState(
            objectivesCopyForUpdate,
            allAgentsForCompletion.map((agent, idx) => ({
              ...agent,
              state: allPropagatedStates[idx]!,
            })),
            currentSimTime
          );
          
          // Update objectives in store (including completion status and startTime for relay nodes)
          for (const obj of objectivesCopyForUpdate) {
            const currentObj = objectives.find((o) => o.id === obj.id);
            if (!currentObj) continue;
            
            const updates: any = {};
            if (obj.completed !== currentObj.completed) {
              updates.completed = obj.completed;
            }
            if (obj.type === ObjectiveType.RELAY_NODE && currentObj.type === ObjectiveType.RELAY_NODE) {
              const relayObj = obj as any;
              const currentRelay = currentObj as any;
              if (relayObj.startTime !== currentRelay.startTime) {
                updates.startTime = relayObj.startTime;
              }
            }
            if (Object.keys(updates).length > 0) {
              updateObjective(obj.id, updates);
            }
          }
          
          // Award points for newly completed objectives
          for (const id of newlyCompleted) {
            completeObjective(id);
          }
          
          // Update game timer
          if (timerRunning) {
            updateTimer(simDelta);
          }
        } else {
          // No objectives, just use swarm behaviors for auto agents
          if (autoAgents.length > 0) {
            const autoStates = autoAgents.map((agent) => agent.state);
            const velocityAdjustments = computeSwarmForces(autoAgents, DEFAULT_BEHAVIOR_PARAMS, simDelta);
            
            // Enforce minimum separation (basic collision avoidance)
            enforceMinimumSeparation(autoAgents, velocityAdjustments, DEFAULT_BEHAVIOR_PARAMS);
            
            // Apply velocity adjustments to auto agent states before propagation
            const adjustedStates = autoStates.map((state, index) => {
              const adjustment = velocityAdjustments[index]!;
              const [vx, vy, vz] = state.velocity;
              const [dvx, dvy, dvz] = adjustment.delta;
              
              return {
                position: state.position,
                velocity: [
                  vx + dvx * simDelta,
                  vy + dvy * simDelta,
                  vz + dvz * simDelta,
                ] as [number, number, number],
              };
            });
            
            // Propagate auto agents in batch with adjusted velocities
            const propagatedAutoStates = propagateKeplerBatch(adjustedStates, simDelta);
            
            // Combine player-controlled and auto agent updates
            const autoUpdates = autoAgents.map((agent, index) => ({
              id: agent.id,
              state: propagatedAutoStates[index]!,
            }));
            const allUpdates = [...playerUpdates, ...autoUpdates];
            updateAgentsBatch(allUpdates);
          } else {
            // Only player-controlled agents, just update them
            updateAgentsBatch(playerUpdates);
          }
        }
        
        lastSimTimeRef.current = currentSimTime;
      }
    }

    // Update instance matrices (positions) and colors
    agents.forEach((agent, index) => {
      const scenePos = eciToScene(agent.state.position);
      
      // Set position
      tempObject.position.set(scenePos[0], scenePos[1], scenePos[2]);
      
      // Scale based on selection/hover state
      const scale = agent.selected ? 1.5 : agent.hovered ? 1.2 : 1.0;
      tempObject.scale.set(scale, scale, scale);
      
      // Update matrix
      tempObject.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(index, tempObject.matrix);
      
      // Set color based on team, with hover/selected highlighting
      if (agent.selected) {
        tempColor.set('#ffff00'); // Yellow for selected
      } else if (agent.hovered) {
        tempColor.set('#00ffff'); // Cyan for hovered
      } else {
        // Base color based on team
        tempColor.set(agent.team === 'friendly' ? '#39ff14' : '#ff4444'); // Neon green for friendly, red for enemy
      }
      instancedMeshRef.current!.setColorAt(index, tempColor);
    });
    
    instancedMeshRef.current!.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current!.instanceColor) {
      instancedMeshRef.current!.instanceColor.needsUpdate = true;
    }
  });

  // Handle click selection
  useEffect(() => {
    const handleClick = () => {
      if (!instancedMeshRef.current) return;

      // Update raycaster with current pointer position
      raycaster.setFromCamera(pointer, camera);

      // Check intersection with instanced mesh
      const intersects = raycaster.intersectObject(instancedMeshRef.current);
      
      if (intersects.length > 0) {
        const intersection = intersects[0]!;
        if (intersection.instanceId !== undefined) {
          const agentId = agents[intersection.instanceId]?.id;
          if (agentId) {
            selectAgent(agentId);
          }
        }
      } else {
        // Click outside agents - clear selection
        clearSelection();
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [agents, raycaster, camera, pointer, gl, selectAgent, clearSelection]);

  // Handle hover
  useFrame(() => {
    if (!instancedMeshRef.current || agents.length === 0) return;

    // Update raycaster with current pointer position
    raycaster.setFromCamera(pointer, camera);

    // Check intersection with instanced mesh
    const intersects = raycaster.intersectObject(instancedMeshRef.current);
    
    if (intersects.length > 0) {
      const intersection = intersects[0]!;
      if (intersection.instanceId !== undefined) {
        const agentId = agents[intersection.instanceId]?.id;
        if (agentId) {
          hoverAgent(agentId);
        }
      }
    } else {
      hoverAgent(null);
    }
  });

  // Update instance count when agents change
  useEffect(() => {
    if (instancedMeshRef.current && agents.length > 0) {
      instancedMeshRef.current.count = agents.length;
    }
  }, [agents.length]);

  if (agents.length === 0) return null;

  return (
    <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, agents.length]}>
      <boxGeometry args={[0.02, 0.02, 0.02]} />
      <meshStandardMaterial 
        vertexColors={true}
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
}
