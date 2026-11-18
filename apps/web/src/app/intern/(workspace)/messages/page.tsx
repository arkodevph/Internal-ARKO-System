"use client";

import { MessagesWorkspace } from "../../../dashboard/messages/messages-workspace";
import { PageHeading } from "../_components/common";

export default function InternMessages() {
  return (
    <>
      <PageHeading title="Messages">
        Ask a question, share a blocker or check in with your ARKO team.
      </PageHeading>
      <MessagesWorkspace internMode />
    </>
  );
}
