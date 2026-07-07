"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteApprovalThreshold } from "@/lib/actions/admin";

export function DeleteThresholdButton({ id }: { id: string }) {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="text-right">
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteApprovalThreshold(id);
            if (result?.error) setError(result.error);
            else router.refresh();
          })
        }
        className="text-xs text-red-600 hover:underline disabled:opacity-50"
      >
        Delete
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
