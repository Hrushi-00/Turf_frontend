"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/src/services/adminApiService";
import { isAdminLoggedIn } from "@/src/services/authService";
import type { ApiRecord } from "@/src/types/apiRecord";

type DocumentRecord = ApiRecord;

const findDocuments = (value: unknown): DocumentRecord[] => {
  if (Array.isArray(value)) return value.filter((item): item is DocumentRecord => Boolean(item) && typeof item === "object");
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["documents", "businessDocuments", "items", "results", "records", "docs", "data", "result"]) {
    const nested = record[key];
    if (Array.isArray(nested)) return findDocuments(nested);
    if (nested && typeof nested === "object") {
      const documents = findDocuments(nested);
      if (documents.length) return documents;
    }
  }
  return [];
};

const documentId = (document: DocumentRecord) => String(document._id || document.id || document.documentId || "");

const detailRows = (value: unknown, prefix = ""): Array<[string, string]> => {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return [[prefix, value.map((item) => typeof item === "object" ? JSON.stringify(item) : String(item)).join(", ")]];
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
      if (["__v", "_id", "id"].includes(key)) return [];
      const label = prefix ? `${prefix} / ${key}` : key;
      return detailRows(item, label);
    });
  }
  return [[prefix, String(value)]];
};

export default function BusinessDocumentReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(params.id);
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }

    let active = true;
    let cached: DocumentRecord | null = null;
    try {
      const raw = sessionStorage.getItem(`admin-business-document:${id}`);
      if (raw) cached = JSON.parse(raw) as DocumentRecord;
    } catch {
      sessionStorage.removeItem(`admin-business-document:${id}`);
    }
    if (cached && documentId(cached) === id) {
      queueMicrotask(() => {
        if (active) setDocument(cached);
      });
    }

    void adminApi.businessDocuments({ status: "PENDING_REVIEW", page: 1, limit: 100 }).then((result) => {
      if (!active) return;
      if (result.success) {
        const fresh = findDocuments(result.data).find((item) => documentId(item) === id);
        if (fresh) {
          setDocument(fresh);
          sessionStorage.setItem(`admin-business-document:${id}`, JSON.stringify(fresh));
        } else if (!cached) {
          setError("This document was not returned by the pending documents list. Ask the backend team for a GET /admin/business-documents/:id endpoint, or return to the pending review list.");
        }
      } else if (!cached) setError(result.message || "Could not load business documents.");
      setLoading(false);
    }).catch((requestError) => {
      if (!active) return;
      if (!cached) setError(requestError instanceof Error ? requestError.message : "Could not load this document.");
      setLoading(false);
    });

    return () => { active = false; };
  }, [id, router]);

  const downloadDocument = async () => {
    setBusy(true);
    setError("");
    const result = await adminApi.businessDocumentDownload(id);
    const data = result.data as Record<string, unknown> | undefined;
    const url = data?.url || data?.downloadUrl || data?.signedUrl;
    if (result.success && typeof url === "string") window.open(url, "_blank", "noopener,noreferrer");
    else setError(result.message || "The server did not return a document download URL.");
    setBusy(false);
  };

  const review = async (status: "APPROVED" | "REJECTED") => {
    const rejectionReason = status === "REJECTED" ? window.prompt("Enter the rejection reason:")?.trim() : "";
    if (status === "REJECTED" && !rejectionReason) return;
    setBusy(true);
    setError("");
    setMessage("");
    const result = await adminApi.reviewBusinessDocument(id, { status, ...(rejectionReason ? { rejectionReason } : {}) });
    if (result.success) {
      const updated = { ...(document || {}), status, ...(rejectionReason ? { rejectionReason } : {}) };
      setDocument(updated);
      sessionStorage.setItem(`admin-business-document:${id}`, JSON.stringify(updated));
      setMessage(`Document ${status.toLowerCase()} successfully.`);
    } else setError(result.message || "Could not update document review.");
    setBusy(false);
  };

  const rows = document ? detailRows(document) : [];
  const status = String(document?.status || "PENDING").toUpperCase();

  return (
    <main className="min-h-screen bg-black px-5 pb-16 pt-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/admin" className="inline-flex rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-white">← Back to admin</Link>
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Business document review</p>
          <h1 className="mt-2 break-all text-2xl font-black sm:text-3xl">Document {id}</h1>
          {document && <p className="mt-2 text-sm text-white/60">{String(document.documentType || document.type || document.name || "Business document")} · {status}</p>}
        </header>

        {error && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-lime-300/30 bg-lime-300/10 p-4 text-sm text-lime-100">{message}</p>}
        {loading && <p className="text-sm text-white/60">Loading document details…</p>}

        {document && <>
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs uppercase tracking-[0.3em] text-white/50">Submitted information</p><h2 className="mt-2 text-xl font-black">Document details</h2></div>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs">{status}</span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {rows.map(([label, value], index) => <div key={`${label}-${index}`} className="min-w-0 rounded-xl border border-white/10 bg-black/30 p-4">
                <dt className="break-words text-xs capitalize text-white/50">{label.replace(/[./_-]/g, " ")}</dt>
                <dd className="mt-1 break-words text-sm text-white">{value}</dd>
              </div>)}
            </dl>
            {rows.length === 0 && <p className="text-sm text-white/60">No document metadata was included in the response.</p>}
          </section>

          <section className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-white/5 p-6">
            <button onClick={() => void downloadDocument()} disabled={busy} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold disabled:opacity-50">{busy ? "Please wait…" : "Open / download file"}</button>
            <button onClick={() => void review("APPROVED")} disabled={busy || status === "APPROVED"} className="rounded-xl bg-lime-300 px-5 py-3 text-sm font-black text-black disabled:opacity-50">Approve document</button>
            <button onClick={() => void review("REJECTED")} disabled={busy || status === "REJECTED"} className="rounded-xl border border-red-400/50 px-5 py-3 text-sm font-bold text-red-200 disabled:opacity-50">Reject document</button>
          </section>
        </>}
      </div>
    </main>
  );
}
