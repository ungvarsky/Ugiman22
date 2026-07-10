"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveInvoiceStep, rejectInvoiceStep } from "@/lib/actions/invoices";

export function ApprovalActions({ invoiceId }: { invoiceId: string }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handle(action: "approve" | "reject") {
    setError(undefined);
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveInvoiceStep(invoiceId, comment)
          : await rejectInvoiceStep(invoiceId, comment);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment (required if rejecting)"
        rows={2}
        className="input"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={() => handle("approve")}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          disabled={isPending}
          onClick={() => handle("reject")}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
