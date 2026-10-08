import type {
  DocumentContent,
  ServiceAgreement,
} from "../../lib/documents/schema";
import {
  formatAgreementDate,
  getServiceAgreement,
} from "../../lib/documents/agreement";

function Paragraphs({ text }: { text?: string }) {
  return text
    ?.split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph, index) => (
      <p key={index} className="whitespace-pre-line">
        {paragraph}
      </p>
    ));
}

function SignatureValue({ value }: { value?: string }) {
  return value ? (
    <span>{value}</span>
  ) : (
    <span
      className="agreement-signature-line"
      aria-label="Blank signature field"
    />
  );
}

function Signatures({ agreement }: { agreement: ServiceAgreement }) {
  return (
    <table
      className="billing-table agreement-signatures"
      aria-label="Agreement signatures"
    >
      <tbody>
        <tr>
          <th scope="row">Client Signature</th>
          <td>
            <SignatureValue value={agreement.clientSignature} />
          </td>
        </tr>
        <tr>
          <th scope="row">Date</th>
          <td>
            <SignatureValue
              value={formatAgreementDate(agreement.clientSignedDate)}
            />
          </td>
        </tr>
        <tr>
          <th scope="row">Arko Dev Representative</th>
          <td>
            <SignatureValue value={agreement.representativeName} />
          </td>
        </tr>
        <tr>
          <th scope="row">Date</th>
          <td>
            <SignatureValue
              value={formatAgreementDate(agreement.representativeSignedDate)}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function ServiceAgreementSheet({
  invoiceNumber,
  issueDate,
  projectName,
  content,
}: {
  invoiceNumber?: string | null;
  issueDate?: Date | string | null;
  projectName?: string | null;
  content: DocumentContent;
}) {
  const agreement = getServiceAgreement(content, projectName);
  const sections = content.sections || [];
  const scopeIndex = sections.findIndex((section) =>
    /scope/i.test(section.title),
  );
  const hasSummary = content.summary?.trim();
  const summaryInSections =
    hasSummary && sections.some((section) => section.body.includes(hasSummary));
  const hasSignatures = sections.some((section) =>
    /\bsignatures?\b/i.test(section.title),
  );

  return (
    <article
      className="document-sheet billing-statement agreement-sheet"
      aria-label="Client service agreement document preview"
    >
      <header className="agreement-header document-no-break">
        <div className="billing-brand agreement-brand">
          <img
            src="/brand/arko-logo-navbar.webp"
            width={34}
            height={34}
            alt=""
          />
          <span>ARKO DEV</span>
        </div>
        <h1>CLIENT SERVICE AGREEMENT</h1>
        <table
          className="billing-table billing-metadata"
          aria-label="Agreement details"
        >
          <tbody>
            <tr>
              <th scope="row">Agreement No.</th>
              <td>{invoiceNumber || "Draft — number not assigned"}</td>
            </tr>
            <tr>
              <th scope="row">Client</th>
              <td>
                {content.billTo?.name || content.billTo?.email || "Not set"}
              </td>
            </tr>
            <tr>
              <th scope="row">Project</th>
              <td>{agreement.projectName || "Not set"}</td>
            </tr>
            <tr>
              <th scope="row">Agreement Date</th>
              <td>{formatAgreementDate(issueDate) || "Not set"}</td>
            </tr>
            <tr>
              <th scope="row">Development Team</th>
              <td>{agreement.developmentTeam || "Not set"}</td>
            </tr>
          </tbody>
        </table>
      </header>

      {hasSummary && !summaryInSections && scopeIndex === -1 && (
        <div className="billing-section">
          <Paragraphs text={content.summary} />
        </div>
      )}

      {sections.map((section, index) => {
        const isSignatureSection = /\bsignatures?\b/i.test(section.title);
        return (
          <section
            key={index}
            className={`billing-section agreement-section${isSignatureSection ? " document-no-break" : ""}`}
          >
            <h2>{section.title}</h2>
            {index === scopeIndex && hasSummary && !summaryInSections && (
              <Paragraphs text={content.summary} />
            )}
            <Paragraphs text={section.body} />
            {isSignatureSection && <Signatures agreement={agreement} />}
          </section>
        );
      })}

      {content.terms?.trim() && (
        <section className="billing-section agreement-section">
          <h2>Additional terms</h2>
          <Paragraphs text={content.terms} />
        </section>
      )}

      {!hasSignatures && (
        <section className="billing-section agreement-section document-no-break">
          <h2>{sections.length + 1}. Signatures</h2>
          <Signatures agreement={agreement} />
        </section>
      )}

      {content.legalNotice?.trim() && (
        <footer className="agreement-footer document-no-break">
          <Paragraphs text={content.legalNotice} />
        </footer>
      )}
    </article>
  );
}
