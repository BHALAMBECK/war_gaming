import { useState } from 'react';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useOpsStore } from '@/ui/stores/opsStore';
import { ScenarioDesigner } from './ScenarioDesigner';
import { ConstellationDesigner } from './ConstellationDesigner';
import { SatelliteDesigner } from './SatelliteDesigner';
import { AnalysisHubPage } from './AnalysisHubPage';
import { ScenarioSection } from '@/ui/ScenarioSection';
import { PhaseNav } from './PhaseNav';
import { SegmentedControl } from './SegmentedControl';
import { StageBeams } from './StageBeams';
import { MovingBorder } from './MovingBorder';

const STUDIO_TABS = [
  { value: 'scenario', label: 'Scenario' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'constellation', label: 'Constellation' },
  { value: 'load', label: 'Load / save' },
  { value: 'analysis', label: 'Analysis' },
] as const;

type StudioTab = (typeof STUDIO_TABS)[number]['value'];

/**
 * Design / analyze / build screen (no live ops globe).
 */
export function StudioShell() {
  const setAppPhase = useOpsStore((s) => s.setAppPhase);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const agents = useAgentStore((s) => s.agents);
  const [tab, setTab] = useState<StudioTab>('scenario');

  return (
    <div className="ops-stage">
      <StageBeams />
      <header className="ops-stage-header studio">
        <div className="ops-brand">
          OSWV <span>Studio</span>
        </div>
        <div className="ops-stage-subtitle ops-mono">
          {scenarioName || 'Untitled'} · {agents.length} sats
        </div>
        <PhaseNav current="studio" />
        <MovingBorder
          className="ops-cta-moving-border"
          onClick={() => setAppPhase('ops')}
        >
          Run live ops
        </MovingBorder>
      </header>

      <div className="ops-studio-layout">
        <aside className="ops-studio-nav">
          <p className="ops-eyebrow">Workspace</p>
          <SegmentedControl
            layout="vertical"
            fullWidth
            aria-label="Studio workspace"
            value={tab}
            onChange={(v) => setTab(v as StudioTab)}
            options={STUDIO_TABS.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
          />
        </aside>

        <main className="ops-studio-main">
          <div key={tab} className="ops-studio-pane">
            {tab === 'scenario' && <ScenarioDesigner />}
            {tab === 'satellite' && <SatelliteDesigner />}
            {tab === 'constellation' && <ConstellationDesigner />}
            {tab === 'load' && <ScenarioSection isExpanded />}
            {tab === 'analysis' && <AnalysisHubPage />}
          </div>
        </main>
      </div>
    </div>
  );
}
