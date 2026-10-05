import type {
  DocumentContent,
  DocumentLineItem,
} from "../../lib/documents/schema";
import { formatDocumentAmount } from "../../lib/documents/schema";
import {
  BILLING_NOTICE,
  calculateBillingAmounts,
  getBillingStatement,
} from "../../lib/documents/billing";

function dateLabel(value?: Date | string | null) {
  if (!value) return "Not set";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
}

function Notes({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <ul className="billing-notes">
      {lines.map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </ul>
  );
}

export default function BillingStatementSheet({
  invoiceNumber,
  issueDate,
  dueDate,
  projectName,
  content,
  lineItems,
}: {
  invoiceNumber?: string | null;
  issueDate?: Date | string | null;
  dueDate?: Date | string | null;
  projectName?: string | null;
  content: DocumentContent;
  lineItems: DocumentLineItem[];
}) {
  const billing = getBillingStatement(content, projectName);
  const { total, amounts, paid, amountDue, remaining } =
    calculateBillingAmounts(billing, lineItems);
  const current = billing.milestones[billing.currentMilestone];
  const money = (amount: number) =>
    formatDocumentAmount(amount, content.currency);
  const milestoneLabel = current
    ? `${current.percentage}% ${current.title}`
    : "Payment";
  const reference =
    billing.paymentReference || `${billing.projectName} — ${milestoneLabel}`;

  return (
    <article
      className="document-sheet billing-statement"
      aria-label="Billing statement document preview"
    >
      <table className="billing-page-frame">
        <thead>
          <tr>
            <td>
              <header className="billing-brand document-no-break">
                {/* A normal image also prints directly without an image optimizer request. */}
                <img
                  src="/brand/arko-logo-navbar.webp"
                  width={34}
                  height={34}
                  alt=""
                />
                <span>ARKO DEV</span>
              </header>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className="document-no-break">
                <h1>BILLING STATEMENT / PAYMENT REQUEST</h1>
                <table className="billing-table billing-metadata">
                  <tbody>
                    <tr>
                      <th scope="row">Billing Statement No.</th>
                      <td>{invoiceNumber || "Draft — number not assigned"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Date Issued</th>
                      <td>{dateLabel(issueDate)}</td>
                    </tr>
                    {dueDate && (
                      <tr>
                        <th scope="row">Due Date</th>
                        <td>{dateLabel(dueDate)}</td>
                      </tr>
                    )}
                    <tr>
                      <th scope="row">Project</th>
                      <td>{billing.projectName || projectName || "Not set"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Development Team</th>
                      <td>{billing.developmentTeam}</td>
                    </tr>
                    <tr>
                      <th scope="row">Status</th>
                      <td>{billing.status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <section className="billing-section document-no-break">
                <h2>BILL TO</h2>
                <p>
                  <strong>Client: {content.billTo?.name || "Not set"}</strong>
                </p>
                {billing.contactPerson && (
                  <p>Contact Person: {billing.contactPerson}</p>
                )}
                {content.billTo?.email && <p>Email: {content.billTo.email}</p>}
                {content.billTo?.address && (
                  <p className="whitespace-pre-line">
                    {content.billTo.address}
                  </p>
                )}
              </section>

              <section className="billing-section">
                <h2>PROJECT BILLING</h2>
                {content.summary && (
                  <p className="billing-summary-text whitespace-pre-line">
                    {content.summary}
                  </p>
                )}
                <table className="billing-table billing-project-table">
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.description || "Untitled item"}
                          {item.quantity !== 1 &&
                            ` (${item.quantity} × ${money(item.unitPrice)})`}
                        </td>
                        <td>{money(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                    {lineItems.length > 1 && (
                      <tr>
                        <td>
                          <strong>Total Agreed Development Fee</strong>
                        </td>
                        <td>
                          <strong>{money(total)}</strong>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td>{milestoneLabel}</td>
                      <td>{money(amountDue)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="billing-amount-due">
                  <strong>
                    AMOUNT DUE: {money(amountDue)} {content.currency}
                  </strong>
                </p>
              </section>

              <section className="billing-section document-no-break">
                <h2>PAYMENT MILESTONE</h2>
                <p>
                  <strong>
                    Milestone {billing.currentMilestone + 1} — {milestoneLabel}
                  </strong>
                </p>
                <p>
                  The {money(amountDue)} payment represents{" "}
                  {current?.percentage || 0}% of the total {money(total)} agreed
                  development fee for {billing.projectName}.
                </p>
                {billing.milestoneDescription && (
                  <p className="whitespace-pre-line">
                    {billing.milestoneDescription}
                  </p>
                )}
                <Notes text={billing.allocationNotes} />
              </section>

              <section className="billing-section document-no-break">
                <h2>PAYMENT SCHEDULE</h2>
                <table className="billing-table billing-schedule">
                  <thead>
                    <tr>
                      <th scope="col">Milestone</th>
                      <th scope="col">Percentage</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.milestones.map((item, index) => (
                      <tr key={index}>
                        <td>{item.title}</td>
                        <td>{item.percentage}%</td>
                        <td>{money(amounts[index])}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  <strong>Total Project Fee: {money(total)}</strong>
                </p>
              </section>

              <section className="billing-section document-no-break">
                <h2>PAYMENT DETAILS</h2>
                <p>Payment Method: {billing.paymentMethod || "Not set"}</p>
                <p>
                  <strong>
                    Account Name: {billing.accountName || "Not set"}
                  </strong>
                </p>
                <p>
                  <strong>
                    Account Number: {billing.accountNumber || "Not set"}
                  </strong>
                </p>
                <p>Payment Reference:</p>
                <p>
                  <strong>{reference}</strong>
                </p>
                {billing.confirmationEmail && (
                  <p>
                    <a href={`mailto:${billing.confirmationEmail}`}>
                      Please send confirmation or proof of payment to{" "}
                      {billing.confirmationEmail}
                    </a>
                  </p>
                )}
              </section>

              <section className="billing-section document-no-break">
                <h2>BILLING NOTES</h2>
                <Notes
                  text={`This billing statement covers the ${milestoneLabel.toLowerCase()} of ${money(amountDue)}.\nThe total agreed development fee is ${money(total)} ${content.currency || ""}.\n${billing.billingNotes}\nRemaining balance after this payment: ${money(remaining)} based on agreed milestones.`}
                />
                {content.terms && (
                  <p className="whitespace-pre-line">{content.terms}</p>
                )}
              </section>

              <section className="billing-section document-no-break">
                <h2>BILLING SUMMARY</h2>
                <p>Total Project Cost: {money(total)}</p>
                {paid > 0 && <p>Previously Paid: {money(paid)}</p>}
                <p>Current Amount Due: {money(amountDue)}</p>
                <p>
                  Remaining Project Balance After Payment: {money(remaining)}
                </p>
              </section>

              {content.sections?.map((section, index) => (
                <section
                  key={index}
                  className="billing-section document-no-break"
                >
                  <h2>{section.title}</h2>
                  <p className="whitespace-pre-line">{section.body}</p>
                </section>
              ))}

              <footer className="billing-section document-no-break">
                <h2>ISSUED BY</h2>
                <p>
                  <strong>{billing.issuerName}</strong>
                </p>
                <p>{billing.issuerDescription}</p>
                {billing.issuerRepresentative && (
                  <p>Representative: {billing.issuerRepresentative}</p>
                )}
                {billing.issuerContact && (
                  <p className="billing-contact">
                    Contact: {billing.issuerContact}
                  </p>
                )}
                {content.from?.address && (
                  <p className="whitespace-pre-line">{content.from.address}</p>
                )}
                <p className="billing-disclaimer">
                  {content.legalNotice || BILLING_NOTICE}
                </p>
              </footer>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
