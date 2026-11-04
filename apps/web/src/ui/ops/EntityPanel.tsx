import { useMemo, useState } from 'react';
import { useAgentStore } from '@/ui/stores/agentStore';

type TeamFilter = 'all' | 'friendly' | 'enemy';

export function EntityPanel() {
  const agents = useAgentStore((s) => s.agents);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const selectAgent = useAgentStore((s) => s.selectAgent);
  const [filter, setFilter] = useState<TeamFilter>('all');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    return agents
      .filter((a) => (filter === 'all' ? true : a.team === filter))
      .filter((a) =>
        query.trim() === ''
          ? true
          : a.id.toLowerCase().includes(query.trim().toLowerCase())
      )
      .slice(0, 200);
  }, [agents, filter, query]);

  const friendly = agents.filter((a) => a.team === 'friendly').length;
  const enemy = agents.length - friendly;

  return (
    <>
      <div className="ops-panel-header">
        <span>Tracks</span>
        <span className="ops-mono">
          {friendly}F / {enemy}E
        </span>
      </div>
      <div className="ops-panel-body ops-tracks-body">
        <div className="ops-btn-group ops-tracks-filters">
          {(['all', 'friendly', 'enemy'] as TeamFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`ops-btn ops-btn-compact ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          className="ops-mono ops-tracks-filter"
          placeholder="Filter by id…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="ops-tracks-list">
          {list.map((agent) => {
            const hp = agent.systems?.hp ?? 100;
            const maxHp = agent.systems?.maxHp ?? 100;
            const pct = Math.round((hp / maxHp) * 100);
            return (
              <div
                key={agent.id}
                className={`ops-entity ${
                  selectedAgentId === agent.id ? 'selected' : ''
                }`}
                onClick={() => selectAgent(agent.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') selectAgent(agent.id);
                }}
              >
                <span className={`ops-dot ${agent.team}`} />
                <span className="ops-mono ops-entity-id">{agent.id}</span>
                <div className={`ops-hp ${pct < 35 ? 'low' : ''}`}>
                  <i style={{ width: `${pct}%` }} />
                </div>
                <span className="ops-mono ops-entity-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
        {agents.length > 200 && (
          <div className="ops-tracks-overflow">
            Showing 200 of {agents.length} tracks
          </div>
        )}
      </div>
    </>
  );
}
