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
      <div className="ops-panel-body">
        <div className="ops-btn-group" style={{ marginBottom: 8 }}>
          {(['all', 'friendly', 'enemy'] as TeamFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`ops-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          className="ops-mono"
          style={{
            width: '100%',
            marginBottom: 8,
            padding: '6px 8px',
            background: 'var(--ops-panel-2)',
            border: '1px solid var(--ops-border)',
            color: 'var(--ops-text)',
            fontSize: 12,
          }}
          placeholder="Filter by id…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
              <div>
                <div className="ops-mono">{agent.id}</div>
                <div className={`ops-hp ${pct < 35 ? 'low' : ''}`}>
                  <i style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="ops-mono" style={{ color: 'var(--ops-muted)' }}>
                {pct}%
              </span>
            </div>
          );
        })}
        {agents.length > 200 && (
          <div style={{ fontSize: 11, color: 'var(--ops-muted)', marginTop: 8 }}>
            Showing 200 of {agents.length} tracks
          </div>
        )}
      </div>
    </>
  );
}
