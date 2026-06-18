"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { API_BASE_URL } from "@/lib/constants";
import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConsentStatusCard } from "./_components/consent-status-card";
import { DeleteCard } from "./_components/delete-card";
import { ExportCard } from "./_components/export-card";

type ConsentStatus = "loading" | "granted" | "denied" | "error";

const ConsentPage = () => {
  const t = useTranslations("consent-page");
  const searchParams = useSearchParams();
  const deviceId = useMemo(() => searchParams.get("deviceId")?.trim() ?? "", [searchParams]);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("loading");

  useEffect(() => {
    if (!deviceId) {
      setConsentStatus("error");
      return;
    }

    fetch(`${API_BASE_URL}/analytics/device/${encodeURIComponent(deviceId)}/export`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Device not found");
        return res.json();
      })
      .then((data) => {
        setConsentStatus(data.device?.analyticsConsent ? "granted" : "denied");
      })
      .catch(() => setConsentStatus("error"));
  }, [deviceId]);

  return (
    <PageLayout>
      <main className="mx-auto w-full max-w-3xl min-w-0 px-6 py-24">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-[2rem] font-extrabold tracking-tight md:text-[2.25rem]">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-xl text-balance text-muted-foreground">
            {t("intro")}
          </p>
        </div>

        {!deviceId ? (
          <section className="rounded-lg border border-border bg-card p-6 text-center">
            <TriangleAlert className="mx-auto mb-3 h-8 w-8 text-warning" />
            <p className="text-sm text-muted-foreground">{t("no-device")}</p>
          </section>
        ) : (
          <div className="grid gap-4">
            <ConsentStatusCard consentStatus={consentStatus} deviceId={deviceId} />
            <ExportCard deviceId={deviceId} />
            <DeleteCard deviceId={deviceId} onDeleted={() => setConsentStatus("denied")} />
          </div>
        )}
      </main>
    </PageLayout>
  );
};

export default ConsentPage;
