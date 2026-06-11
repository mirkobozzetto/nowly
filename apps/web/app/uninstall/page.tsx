"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { API_BASE_URL, PROJECT_NAME } from "@/lib/constants";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

const UninstallPage = () => {
  const searchParams = useSearchParams();
  const deviceId = useMemo(() => searchParams.get("deviceId")?.trim() ?? "", [searchParams]);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!deviceId || status !== "idle") return;

    setStatus("loading");
    void fetch(`${API_BASE_URL}/presences/active/${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
      cache: "no-store",
    })
      .then((response) => {
        setStatus(response.ok ? "done" : "error");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [deviceId, status]);

  return (
    <PageLayout>
      <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
          {status === "done" ? (
            <Check className="h-6 w-6 text-emerald-500" />
          ) : status === "error" ? (
            <TriangleAlert className="h-6 w-6 text-warning" />
          ) : (
            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>

        <h1 className="text-2xl font-semibold text-foreground">
          {status === "done" ? "Cleanup completed" : `Uninstalling ${PROJECT_NAME}`}
        </h1>

        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          {status === "done"
            ? "Your device has been removed from the active presence counters."
            : status === "error"
              ? "The cleanup request failed. You can safely close this page; the counters will expire automatically."
              : "Removing your device from active counters..."}
        </p>
      </main>
    </PageLayout>
  );
};

export default UninstallPage;