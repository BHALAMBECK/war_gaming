import { quoteLineItems, formatUsd, type ProgramQuote } from '@/scenario/design/pricing';
import { designerHint } from './designerStyles';

interface QuoteSummaryProps {
  quote: ProgramQuote;
  title?: string;
  compact?: boolean;
}

export function QuoteSummary({ quote, title, compact }: QuoteSummaryProps) {
  const lines = quoteLineItems(quote);

  return (
    <div
      style={{
        border: '1px solid var(--ops-border)',
        padding: compact ? 6 : 8,
        marginTop: compact ? 6 : 10,
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {title && (
        <div className="ops-section-title" style={{ marginTop: 0 }}>
          {title}
        </div>
      )}
      <div className="ops-stat-row">
        <span className="k">Satellites</span>
        <span className="v">{quote.satelliteCount}</span>
      </div>
      {lines.map((line) => (
        <div className="ops-stat-row" key={line.label}>
          <span className="k" title={line.detail}>
            {line.label}
          </span>
          <span className="v">{formatUsd(line.amountUsd)}</span>
        </div>
      ))}
      {!compact && (
        <p style={{ ...designerHint, marginTop: 6, marginBottom: 0 }}>
          Launch via {quote.launch.vehicleLabel}. {quote.launch.note}. Illustrative
          pricing for trade studies — not a binding quote.
        </p>
      )}
    </div>
  );
}
