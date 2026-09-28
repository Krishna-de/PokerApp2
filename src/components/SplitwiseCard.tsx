import { fmt } from '../utils/format';
import { SPLITWISE_URL, settleUp, splitwiseText, type SplitwiseRow } from '../utils/splitwise';

type Props = {
  title: string;
  rows: SplitwiseRow[];
  onMessage: (message: string) => void;
};

/** Results-page card: spent / earned / net per player, settle-up list, copy/share for Splitwise. */
export default function SplitwiseCard({ title, rows, onMessage }: Props) {
  const transfers = settleUp(rows);

  async function copy() {
    try {
      await navigator.clipboard.writeText(splitwiseText(title, new Date(), rows));
      onMessage('Copied for Splitwise — paste it into the expense notes.');
    } catch {
      onMessage('Could not copy — long-press the numbers instead.');
    }
  }

  async function share() {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: `Poker: ${title}`, text: splitwiseText(title, new Date(), rows) });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <section className="card">
      <div className="section-title">Splitwise</div>
      <p className="tiny muted splitwise-help">
        Add one expense: <strong>Paid by multiple people</strong> = Earned, <strong>Split unequally</strong> = Spent.
      </p>
      <div className="splitwise-table">
        <div className="splitwise-row head">
          <span>Player</span>
          <span>Spent</span>
          <span>Earned</span>
          <span>Net</span>
        </div>
        {rows.map((r) => (
          <div className="splitwise-row" key={r.id}>
            <span className="splitwise-name">{r.name}</span>
            <span>€{fmt(r.spent)}</span>
            <span>€{fmt(r.earned)}</span>
            <strong className={r.net > 0 ? 'plus' : r.net < 0 ? 'minus' : ''}>
              {r.net > 0 ? '+' : r.net < 0 ? '−' : ''}€{fmt(Math.abs(r.net))}
            </strong>
          </div>
        ))}
      </div>
      {transfers.length > 0 && (
        <div className="splitwise-transfers">
          <div className="tiny muted">Settle up</div>
          {transfers.map((t, i) => (
            <div className="tiny" key={i}>
              {t.from} → {t.to} <strong>€{fmt(t.amount)}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="splitwise-actions">
        <button className="btn btn-dark" onClick={copy}>
          Copy
        </button>
        <button className="btn btn-dark" onClick={share}>
          Share
        </button>
        <a className="btn btn-dark" href={SPLITWISE_URL} target="_blank" rel="noreferrer">
          Open Splitwise
        </a>
      </div>
    </section>
  );
}
