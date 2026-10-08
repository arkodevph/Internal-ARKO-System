import type {
  DocumentContent,
  DocumentLineItem,
  DocumentType,
} from "../../lib/documents/schema";
import { formatDocumentAmount } from "../../lib/documents/schema";

type DocumentSheetProps = {
  type: DocumentType;
  title: string;
  invoiceNumber?: string | null;
  issueDate?: Date | string | null;
  dueDate?: Date | string | null;
  projectName?: string | null;
  content: DocumentContent;
  lineItems: DocumentLineItem[];
};

function formatDate(value?: Date | string | null) {
  if (!value) return "Not set";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function Party({
  label,
  party,
}: {
  label: string;
  party?: DocumentContent["from"];
}) {
  if (!party) return null;
  return (
    <div className="document-party">
      <div className="document-label">{label}</div>
      <strong>{party.name || "Not set"}</strong>
      {party.email && <span>{party.email}</span>}
      {party.address && (
        <span className="whitespace-pre-line">{party.address}</span>
      )}
    </div>
  );
}

export default function DocumentSheet({
  type,
  title,
  invoiceNumber,
  issueDate,
  dueDate,
  projectName,
  content,
  lineItems,
}: DocumentSheetProps) {
  const total = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return (
    <article
      className="document-sheet"
      aria-label={`${type.toLowerCase()} document preview`}
    >
      <header className="document-sheet-header document-no-break">
        <div>
          <div className="document-kicker">ARKO / CLIENT DOCUMENT</div>
          <h1>{title || "Untitled document"}</h1>
          <div className="document-meta-line">
            <span>{type}</span>
            {invoiceNumber && <span>{invoiceNumber}</span>}
            {projectName && <span>Project: {projectName}</span>}
          </div>
        </div>
        <dl className="document-dates">
          <div>
            <dt>Issued</dt>
            <dd>{formatDate(issueDate)}</dd>
          </div>
          <div>
            <dt>{type === "INVOICE" ? "Due" : "Valid / target"}</dt>
            <dd>{formatDate(dueDate)}</dd>
          </div>
        </dl>
      </header>

      <section className="document-party-grid document-no-break">
        <Party label="From" party={content.from} />
        <Party label="Prepared for" party={content.billTo} />
      </section>

      {content.legalNotice && (
        <aside
          className="document-legal-notice document-no-break"
          aria-label="Legal notice"
        >
          <strong>Review notice</strong>
          <span>{content.legalNotice}</span>
        </aside>
      )}

      {content.summary && (
        <section className="document-section document-no-break">
          <div className="document-label">Summary</div>
          <p className="whitespace-pre-line">{content.summary}</p>
        </section>
      )}

      {content.timelineEvents && content.timelineEvents.length > 0 && (
        <section className="document-section">
          <div className="document-label">Timeline and milestones</div>
          <ol className="document-timeline">
            {content.timelineEvents.map((event, index) => (
              <li key={`${event.title}-${index}`} className="document-no-break">
                <div className="document-timeline-index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="document-timeline-heading">
                    <strong>{event.title}</strong>
                    <span>{event.status.replaceAll("_", " ")}</span>
                  </div>
                  <div className="document-timeline-date">
                    {event.date || "Date not set"}
                  </div>
                  {event.description && <p>{event.description}</p>}
                  {event.dependency && (
                    <p>
                      <b>Depends on:</b> {event.dependency}
                    </p>
                  )}
                  {event.approval && (
                    <p>
                      <b>Approval:</b> {event.approval}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {lineItems.length > 0 && (
        <section className="document-section">
          <div className="document-label">Line items</div>
          <table className="document-line-items">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={`${item.description}-${index}`}>
                  <td>{item.description || "Untitled item"}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {formatDocumentAmount(item.unitPrice, content.currency)}
                  </td>
                  <td>
                    {formatDocumentAmount(
                      item.quantity * item.unitPrice,
                      content.currency,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={3}>Total</th>
                <td>{formatDocumentAmount(total, content.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      {content.sections?.map((section, index) => (
        <section
          key={`${section.title}-${index}`}
          className="document-section document-no-break"
        >
          <div className="document-label">{section.title}</div>
          <p className="whitespace-pre-line">{section.body}</p>
        </section>
      ))}

      {content.terms && (
        <footer className="document-terms document-no-break">
          <div className="document-label">
            Terms, assumptions, and instructions
          </div>
          <p className="whitespace-pre-line">{content.terms}</p>
        </footer>
      )}
    </article>
  );
}
