"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { adminApi } from "@/src/services/adminApiService";
import { changeAdminPassword, getAdminProfile, isAdminLoggedIn, logout, updateAdminProfile } from "@/src/services/authService";

type ToolTab = "overview" | "finance" | "catalog" | "plans" | "support" | "account";
type ApiResult = { success: boolean; data?: any; message?: string };
type DataSets = Record<string, any[]>;

const listFrom = (payload: any, keys: string[] = []) : any[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of [...keys, "data", "items", "results", "records", "docs"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = listFrom(value, keys);
      if (nested.length) return nested;
    }
  }
  return [];
};

const getId = (item: any) => String(item?._id || item?.id || item?.paymentId || item?.ticketId || item?.businessId || "");
const displayName = (item: any) => String(item?.name || item?.title || item?.subject || item?.businessName || item?.username || item?.email || item?.reference || getId(item) || "Record");
const pretty = (value: unknown) => JSON.stringify(value, null, 2);
const inputClass = "mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-lime-300";
const buttonClass = "rounded-xl bg-white px-4 py-2.5 text-sm font-black text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass = "rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 hover:border-white/50 disabled:opacity-50";

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-6"><div className="mb-5"><h2 className="text-xl font-black">{title}</h2>{description && <p className="mt-1 text-sm text-white/50">{description}</p>}</div>{children}</section>;
}

function RecordList({ title, records, empty = "No records found.", actions }: { title?: string; records: any[]; empty?: string; actions?: (record: any) => ReactNode }) {
  if (records.some((record) => record && typeof record === "object" && "monthlyPricePaise" in record && record.limits)) {
    return <SubscriptionPlanList records={records} actions={actions} />;
  }
  return <div className="space-y-3">{title && <h3 className="text-sm font-bold text-white/70">{title} · {records.length}</h3>}{records.length ? records.map((record, index) => <article key={getId(record) || index} className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h4 className="break-words font-bold">{displayName(record)}</h4><p className="mt-1 break-all font-mono text-xs text-white/40">{getId(record)}</p></div>{actions?.(record)}</div><details className="mt-3"><summary className="cursor-pointer text-xs text-white/50">View full record</summary><pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-black/60 p-3 text-xs text-white/70">{pretty(record)}</pre></details></article>) : <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/45">{empty}</p>}</div>;
}

function LedgerList({ records }: { records: any[] }) {
  const money = (paise: unknown, currency = "INR") => new Intl.NumberFormat("en-IN", {
    style: "currency", currency, maximumFractionDigits: 2,
  }).format(Number(paise || 0) / 100);
  const dateTime = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  if (!records.length) return <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/45">No ledger entries.</p>;

  return <div className="space-y-3">
    {records.map((entry, index) => {
      const id = getId(entry);
      const type = String(entry.entryType || "Ledger entry").replaceAll("_", " ");
      const business = entry.business?.displayName || entry.business?.legalName || entry.business?.name || "Business unavailable";
      const currency = entry.currency || entry.payment?.currency || "INR";
      const status = entry.payment?.status || entry.status;
      return <article key={id || index} className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-bold">{type}</h4>
            <p className="mt-1 text-sm text-white/60">{business}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-white/35">Entry ID: {id || "Unavailable"}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-lime-200">{money(entry.grossPaise, currency)}</p>
            {status && <span className="mt-1 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/65">{String(status).replaceAll("_", " ")}</span>}
          </div>
        </div>
        <dl className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-xs text-white/40">Booking</dt><dd className="mt-1 text-sm text-white/80">{dateTime(entry.booking?.date)}{entry.booking?.timeSlot ? ` · ${entry.booking.timeSlot}` : ""}</dd></div>
          <div><dt className="text-xs text-white/40">Commission</dt><dd className="mt-1 text-sm font-semibold text-white/80">{money(entry.commissionPaise, currency)}</dd></div>
          <div><dt className="text-xs text-white/40">Business payable</dt><dd className="mt-1 text-sm font-semibold text-white/80">{money(entry.businessPayablePaise, currency)}</dd></div>
          <div><dt className="text-xs text-white/40">Recorded</dt><dd className="mt-1 text-sm text-white/80">{dateTime(entry.createdAt)}</dd></div>
        </dl>
      </article>;
    })}
  </div>;
}

function SubscriptionPlanList({ records, actions }: { records: any[]; actions?: (record: any) => ReactNode }) {
  const money = (paise: unknown, currency = "INR") => new Intl.NumberFormat("en-IN", {
    style: "currency", currency, maximumFractionDigits: 2,
  }).format(Number(paise || 0) / 100);

  if (!records.length) return <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/45">No subscription plans found.</p>;

  return <div className="grid gap-3 lg:grid-cols-2">
    {records.map((plan, index) => {
      const id = getId(plan);
      const limits = plan.limits || {};
      const features = Array.isArray(plan.features) ? plan.features : [];
      const status = String(plan.status || "UNKNOWN").toUpperCase();
      const currency = plan.currency || "INR";
      return <article key={id || index} className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="text-lg font-black">{plan.name || plan.slug || "Subscription plan"}</h3><p className="mt-1 text-sm text-white/55">{plan.description || "No plan description"}</p><p className="mt-2 break-all font-mono text-[11px] text-white/35">Plan ID: {id || "Unavailable"}</p></div>
          <div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status === "ACTIVE" ? "bg-lime-300/10 text-lime-200" : "bg-white/10 text-white/60"}`}>{status}</span>{actions?.(plan)}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[["Monthly", plan.monthlyPricePaise], ["Quarterly", plan.quarterlyPricePaise], ["Yearly", plan.yearlyPricePaise]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><p className="text-xs text-white/45">{label}</p><p className="mt-1 font-bold">{money(value, currency)}</p></div>)}
          <div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><p className="text-xs text-white/45">Free trial</p><p className="mt-1 font-bold">{Number(plan.trialDays || 0)} days</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><p className="text-xs text-white/45">Venue limit</p><p className="mt-1 font-bold">{limits.maxVenues ?? limits.maxTurfs ?? "Unlimited"}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><p className="text-xs text-white/45">Facilities per venue</p><p className="mt-1 font-bold">{limits.maxFacilitiesPerVenue ?? "Unlimited"}</p></div>
        </div>
        <div className="mt-4"><p className="text-xs font-semibold text-white/45">Features</p>{features.length ? <div className="mt-2 flex flex-wrap gap-2">{features.map((feature: any, featureIndex: number) => <span key={featureIndex} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/70">{typeof feature === "string" ? feature : feature.name || feature.label || String(feature)}</span>)}</div> : <p className="mt-1 text-sm text-white/60">No features listed</p>}</div>
      </article>;
    })}
  </div>;
}

function SubscriptionList({ records }: { records: any[] }) {
  if (!records.length) return <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/45">No subscriptions found.</p>;

  return <div className="space-y-3">
    <p className="text-sm font-bold text-white/70">{records.length} subscriptions</p>
    {records.map((subscription, index) => {
      const id = getId(subscription);
      const business = subscription.business || {};
      const plan = subscription.plan || {};
      const title = business.displayName || business.legalName || subscription.businessName || plan.name || "Business subscription";
      const status = String(subscription.status || subscription.subscriptionStatus || "UNKNOWN").toUpperCase();
      const periodEnd = subscription.currentPeriodEnd || subscription.endsAt || subscription.expiresAt;
      const amountPaise = subscription.amountPaise ?? subscription.pricePaise;

      return <article key={id || index} className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate font-bold">{title}</h4>
            <p className="mt-1 text-sm text-white/60">Plan: {plan.name || plan.slug || "—"}</p>
            <p className="mt-1 break-all font-mono text-xs text-white/40">Subscription ID: {id || "Unavailable"}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${status === "ACTIVE" ? "bg-lime-300/10 text-lime-200" : "bg-white/10 text-white/70"}`}>{status.replaceAll("_", " ")}</span>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-white/60 sm:grid-cols-2">
          {(business.legalName || business.displayName) && <p>Business: {business.legalName || business.displayName}</p>}
          {business._id && <p className="break-all">Business ID: {business._id}</p>}
          {amountPaise !== undefined && <p>Amount: ₹{(Number(amountPaise) / 100).toLocaleString("en-IN")}</p>}
          {periodEnd && <p>Current period ends: {String(periodEnd).slice(0, 10)}</p>}
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-white/50">View API details</summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-black/60 p-3 text-xs text-white/70">{pretty(subscription)}</pre>
        </details>
      </article>;
    })}
  </div>;
}

function AnalyticsSummary({ data }: { data: any }) {
  if (!data || typeof data !== "object") return <p className="mt-4 text-sm text-white/50">Analytics have not loaded yet.</p>;

  const money = (paise: unknown) => `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const metrics = [
    ["Users", data.users ?? 0],
    ["Businesses", data.businesses ?? 0],
    ["Pending businesses", data.pendingBusinesses ?? 0],
    ["Payments", data.payments?.count ?? 0],
    ["Payment GMV", money(data.payments?.gmvPaise)],
    ["Booking GMV", money(data.bookingFinancials?.bookingGmvPaise)],
    ["Commission", money(data.bookingFinancials?.commissionPaise)],
    ["Payouts paid", money(data.payouts?.paidPaise)],
  ];

  return <div className="mt-4 space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-xs font-semibold text-white/50">{label}</p>
        <p className="mt-2 text-2xl font-black">{value}</p>
      </article>)}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <h3 className="font-bold">Business subscriptions</h3>
        <div className="mt-3 space-y-2">
          {Array.isArray(data.subscriptions) && data.subscriptions.length ? data.subscriptions.map((item: any, index: number) => <div key={item._id || index} className="flex justify-between gap-3 text-sm"><span className="text-white/60">{String(item._id || "Unknown").replaceAll("_", " ")}</span><span className="font-bold">{item.count ?? 0}</span></div>) : <p className="text-sm text-white/45">No subscription status totals.</p>}
        </div>
        <p className="mt-3 text-sm text-white/60">Subscription revenue: {money(data.subscriptionRevenue?.revenuePaise)} ({data.subscriptionRevenue?.count ?? 0} payments)</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <h3 className="font-bold">Popular sports</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.isArray(data.popularSports) && data.popularSports.length ? data.popularSports.map((sport: any, index: number) => <span key={sport._id || sport.name || index} className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/70">{sport.name || sport._id || String(sport)}</span>) : <p className="text-sm text-white/45">No popular sports data.</p>}
        </div>
      </div>
    </div>
  </div>;
}

export default function AdminToolsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ToolTab>("overview");
  const [sets, setSets] = useState<DataSets>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [financialRules, setFinancialRules] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [filters, setFilters] = useState({ auditEntityId: "", auditAction: "", auditEntityType: "", reviewStatus: "PENDING", ticketStatus: "", ticketPriority: "", settlementStatus: "", ledgerType: "", financeBusinessId: "" });
  const [forms, setForms] = useState<Record<string, string>>({ commission: "", businessId: "", settlementId: "", settlementStatus: "PROCESSING", settlementReference: "", settlementFailure: "", userId: "", walletAmount: "", walletReason: "", sportName: "", sportSlug: "", sportDescription: "", sportIcon: "", reviewReason: "", ticketId: "", ticketReply: "", ticketStatus: "IN_PROGRESS", ticketPriority: "MEDIUM", planId: "", planName: "", planSlug: "", planDescription: "", monthly: "", quarterly: "", yearly: "", trialDays: "14", planStatus: "ACTIVE", membershipId: "", membershipName: "", membershipDescription: "", membershipPrice: "", membershipDuration: "365", membershipDiscount: "0", membershipFeatures: "", membershipStatus: "ACTIVE", auditActorId: "", auditEntityType: "" });
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const put = (key: string, value: string) => setForms((current) => ({ ...current, [key]: value }));
  const report = (result: ApiResult, successText: string) => {
    if (result.success) { setError(""); setNotice(successText); return true; }
    setNotice(""); setError(result.message || "The request failed."); return false;
  };

  const loadTab = useCallback(async (target: ToolTab = tab) => {
    setLoading(true);
    setError("");
    const requests: Record<ToolTab, Array<[string, Promise<ApiResult>]>> = {
      overview: [["auditLogs", adminApi.auditLogs({ page: 1, limit: 100, actorId: forms.auditActorId, entityId: filters.auditEntityId, action: filters.auditAction, entityType: filters.auditEntityType })]],
      finance: [
        ["financialRules", adminApi.financialRules()],
        ["ledger", adminApi.ledger({ page: 1, limit: 100, entryType: filters.ledgerType, businessId: filters.financeBusinessId })],
        ["payouts", adminApi.payouts({ page: 1, limit: 100, businessId: filters.financeBusinessId })],
        ["settlements", adminApi.settlements({ page: 1, limit: 100, status: filters.settlementStatus, businessId: filters.financeBusinessId })],
        ["refunds", adminApi.refundsRequired({ page: 1, limit: 100 })],
      ],
      catalog: [["sports", adminApi.sports()], ["reviews", adminApi.reviews({ status: filters.reviewStatus, page: 1, limit: 100 })]],
      plans: [["membershipPlans", adminApi.membershipPlans()], ["subscriptionPlans", adminApi.subscriptionPlans()], ["subscriptions", adminApi.subscriptions({ page: 1, limit: 100 })]],
      support: [["tickets", adminApi.supportTickets({ status: filters.ticketStatus, priority: filters.ticketPriority, page: 1, limit: 100 })]],
      account: [],
    };
    const entries = await Promise.all(requests[target].map(async ([key, request]) => [key, await request] as const));
    const failed: string[] = [];
    for (const [key, result] of entries) {
      if (!result.success) { failed.push(`${key}: ${result.message || "failed to load"}`); continue; }
      if (key === "financialRules") setFinancialRules(result.data?.data || result.data);
      else if (key === "analytics") setAnalytics(result.data?.data || result.data);
      else setSets((current) => ({ ...current, [key]: listFrom(result.data, [key, key === "refunds" ? "payments" : "", key === "tickets" ? "tickets" : "", key === "reviews" ? "reviews" : "", key === "sports" ? "sports" : "", key === "membershipPlans" || key === "subscriptionPlans" ? "plans" : "", key === "subscriptions" ? "subscriptions" : "", key === "settlements" ? "settlements" : "", key === "ledger" ? "entries" : "", key === "payouts" ? "payouts" : ""].filter(Boolean)) }));
    }
    if (target === "overview") {
      const result = await adminApi.analytics();
      if (result.success) setAnalytics(result.data?.data || result.data);
      else failed.push(`analytics: ${result.message || "failed to load"}`);
    }
    if (target === "account") {
      const result = await getAdminProfile();
      if (result.success) setProfile(result.data?.admin || result.data?.user || result.data);
      else failed.push(`profile: ${result.message || "failed to load"}`);
    }
    setError(failed.join(" · "));
    setLoading(false);
  }, [tab, filters, forms.auditActorId]);

  useEffect(() => {
    if (!isAdminLoggedIn()) { router.replace("/admin/login"); return; }
    void loadTab("overview");
    // This is the initial authenticated load; subsequent reloads are user-triggered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const switchTab = (value: ToolTab) => { setTab(value); setNotice(""); void loadTab(value); };
  const act = async (key: string, request: () => Promise<ApiResult>, successText: string, reload = true) => {
    setBusy(key); setNotice(""); setError("");
    const result = await request();
    if (report(result, successText) && reload) await loadTab();
    setBusy("");
    return result;
  };

  const submit = (handler: () => Promise<unknown>) => (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void handler(); };
  const records = (key: string) => sets[key] || [];

  return (
    <main className="min-h-screen bg-black px-5 pb-20 pt-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-white/10 bg-white/[.04] p-6">
          <div><p className="text-xs uppercase tracking-[0.3em] text-white/50">Admin console</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Platform operations</h1><p className="mt-2 text-sm text-white/50">Analytics, finance, catalog, plans, support and admin account.</p></div>
          <div className="flex gap-2"><Link href="/admin" className={secondaryButtonClass}>Dashboard</Link><button onClick={() => { logout(); router.push("/admin/login"); }} className={buttonClass}>Logout</button></div>
        </header>

        <nav className="flex flex-wrap gap-2" aria-label="Admin tool sections">
          {([["overview", "Overview"], ["finance", "Finance"], ["catalog", "Catalog & reviews"], ["plans", "Plans & subscriptions"], ["support", "Support"], ["account", "Admin account"]] as [ToolTab, string][]).map(([value, label]) => <button key={value} onClick={() => switchTab(value)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${tab === value ? "bg-lime-300 text-black" : "border border-white/10 text-white/70 hover:border-white/30"}`}>{label}</button>)}
          <button onClick={() => void loadTab()} className={secondaryButtonClass}>Refresh section</button>
        </nav>
        {error && <div role="alert" className="whitespace-pre-line rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-lime-300/30 bg-lime-300/10 p-4 text-sm text-lime-100">{notice}</div>}
        {loading && <p className="text-sm text-white/50">Loading section data…</p>}

        {tab === "overview" && <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Platform analytics" description="Live summary from GET /api/analytics/admin"><button onClick={() => void act("analytics", () => adminApi.analytics(), "Analytics refreshed.", false).then((result: any) => result.success && setAnalytics(result.data?.data || result.data))} disabled={busy === "analytics"} className={secondaryButtonClass}>{busy === "analytics" ? "Refreshing..." : "Refresh analytics"}</button><AnalyticsSummary data={analytics} /></Panel>
          <Panel title="Audit log" description="Filter and inspect recent admin actions"><form onSubmit={submit(async () => { await act("audit", () => adminApi.auditLogs({ page: 1, limit: 100, actorId: forms.auditActorId, entityId: filters.auditEntityId, action: filters.auditAction, entityType: filters.auditEntityType }), "Audit log refreshed.", false); })} className="mb-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-white/60">Actor ID<input value={forms.auditActorId} onChange={(e) => put("auditActorId", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Entity ID<input value={filters.auditEntityId} onChange={(e) => setFilters((current) => ({ ...current, auditEntityId: e.target.value }))} className={inputClass} /></label><label className="text-xs text-white/60">Action<input value={filters.auditAction} onChange={(e) => setFilters((current) => ({ ...current, auditAction: e.target.value }))} className={inputClass} /></label><label className="text-xs text-white/60">Entity type<input value={filters.auditEntityType} onChange={(e) => setFilters((current) => ({ ...current, auditEntityType: e.target.value }))} className={inputClass} /></label><button disabled={busy === "audit"} className={`${buttonClass} sm:col-span-2`}>Apply audit filters</button></form><RecordList records={records("auditLogs")} empty="No audit events found." /></Panel>
        </div>}

        {tab === "finance" && <div className="space-y-6">
          <Panel title="Financial rules" description="Commission is configured in basis points (0–10000)"><form onSubmit={submit(async () => { const result = await act("rules", () => adminApi.updateFinancialRules({ bookingCommissionBps: Number(forms.commission) }), "Financial rules saved.", false); if (result.success) setFinancialRules(result.data?.data || result.data); })} className="flex flex-wrap items-end gap-3"><label className="w-full max-w-xs text-sm text-white/60">Booking commission (BPS)<input type="number" min="0" max="10000" required value={forms.commission || financialRules?.bookingCommissionBps || ""} onChange={(e) => put("commission", e.target.value)} className={inputClass} /></label><button disabled={busy === "rules"} className={buttonClass}>Save rules</button><button type="button" onClick={() => void act("rules-load", () => adminApi.financialRules(), "Rules loaded.", false).then((result: any) => result.success && setFinancialRules(result.data?.data || result.data))} className={secondaryButtonClass}>Reload</button></form>{financialRules && <pre className="mt-4 overflow-auto rounded-xl bg-black/50 p-4 text-xs text-white/60">{pretty(financialRules)}</pre>}</Panel>
          <Panel title="Finance filters" description="These filters reload the ledger, payouts and settlements"><div className="grid gap-3 sm:grid-cols-3"><label className="text-xs text-white/60">Business ID<input value={filters.financeBusinessId} onChange={(e) => setFilters((current) => ({ ...current, financeBusinessId: e.target.value }))} className={inputClass} /></label><label className="text-xs text-white/60">Settlement status<select value={filters.settlementStatus} onChange={(e) => setFilters((current) => ({ ...current, settlementStatus: e.target.value }))} className={inputClass}><option value="">All statuses</option>{["PENDING", "PROCESSING", "PROCESSED", "FAILED", "HELD"].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs text-white/60">Ledger entry type<select value={filters.ledgerType} onChange={(e) => setFilters((current) => ({ ...current, ledgerType: e.target.value }))} className={inputClass}><option value="">All types</option>{["BOOKING_CAPTURE", "BOOKING_REFUND", "PAYOUT", "ADJUSTMENT"].map((v) => <option key={v}>{v}</option>)}</select></label></div><button onClick={() => void loadTab("finance")} className={`${buttonClass} mt-4`}>Apply finance filters</button></Panel>
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Ledger entries"><LedgerList records={records("ledger")} /></Panel>
            <Panel title="Payouts"><RecordList records={records("payouts")} empty="No payouts." /></Panel>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Settlements"><form onSubmit={submit(async () => { const result = await act("settlement-create", () => adminApi.createSettlement(forms.businessId), "Settlement created."); if (result.success) put("businessId", ""); })} className="mb-5 flex flex-wrap items-end gap-3"><label className="min-w-56 flex-1 text-xs text-white/60">Business ID<input required value={forms.businessId} onChange={(e) => put("businessId", e.target.value)} className={inputClass} /></label><button disabled={busy === "settlement-create"} className={buttonClass}>Create settlement</button></form><form onSubmit={submit(async () => { const result = await act("settlement-update", () => adminApi.transitionSettlement(forms.settlementId, { status: forms.settlementStatus, ...(forms.settlementReference ? { externalReference: forms.settlementReference } : {}), ...(forms.settlementFailure ? { failureReason: forms.settlementFailure } : {}) }), "Settlement updated."); if (result.success) put("settlementId", ""); })} className="mb-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-white/60">Settlement ID<input required value={forms.settlementId} onChange={(e) => put("settlementId", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Status<select value={forms.settlementStatus} onChange={(e) => put("settlementStatus", e.target.value)} className={inputClass}>{["PROCESSING", "PROCESSED", "FAILED", "HELD"].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs text-white/60">External reference<input value={forms.settlementReference} onChange={(e) => put("settlementReference", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Failure reason<input value={forms.settlementFailure} onChange={(e) => put("settlementFailure", e.target.value)} className={inputClass} /></label><button disabled={busy === "settlement-update"} className={`${buttonClass} sm:col-span-2`}>Update settlement</button></form><RecordList records={records("settlements")} empty="No settlements." /></Panel>
            <Panel title="Refunds required"><RecordList records={records("refunds")} empty="No refunds currently required." actions={(payment) => <button onClick={() => { const id = getId(payment); if (id && window.confirm("Submit a refund request for this payment?")) void act(`refund:${id}`, () => adminApi.refund(id), "Refund request submitted."); }} disabled={busy.startsWith("refund:")} className={buttonClass}>Request refund</button>} /></Panel>
          </div>
          <Panel title="Wallet adjustment" description="Amount is entered in paise. Every adjustment is sent with an idempotency key."><form onSubmit={submit(async () => { const result = await act("wallet", () => adminApi.adjustWallet(forms.userId, { direction: forms.walletDirection || "CREDIT", amountPaise: Number(forms.walletAmount), reason: forms.walletReason }), "Wallet adjustment submitted.", false); if (result.success) { put("walletAmount", ""); put("walletReason", ""); } })} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="text-xs text-white/60">User ID<input required value={forms.userId} onChange={(e) => put("userId", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Direction<select value={forms.walletDirection || "CREDIT"} onChange={(e) => put("walletDirection", e.target.value)} className={inputClass}><option>CREDIT</option><option>DEBIT</option></select></label><label className="text-xs text-white/60">Amount (paise)<input required type="number" min="1" step="1" value={forms.walletAmount} onChange={(e) => put("walletAmount", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Reason<input required value={forms.walletReason} onChange={(e) => put("walletReason", e.target.value)} className={inputClass} /></label><button disabled={busy === "wallet"} className={`${buttonClass} md:col-span-2 xl:col-span-4`}>Submit wallet adjustment</button></form></Panel>
        </div>}

        {tab === "catalog" && <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Sports catalog" description="Create sports and activate/deactivate existing sports"><form onSubmit={submit(async () => { const result = await act("sport-create", () => adminApi.createSport({ name: forms.sportName, slug: forms.sportSlug, ...(forms.sportDescription ? { description: forms.sportDescription } : {}), ...(forms.sportIcon ? { iconUrl: forms.sportIcon } : {}) }), "Sport created."); if (result.success) { put("sportName", ""); put("sportSlug", ""); put("sportDescription", ""); put("sportIcon", ""); } })} className="mb-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-white/60">Name<input required value={forms.sportName} onChange={(e) => put("sportName", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Slug<input required pattern="[a-z0-9-]{2,60}" value={forms.sportSlug} onChange={(e) => put("sportSlug", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Description<input value={forms.sportDescription} onChange={(e) => put("sportDescription", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Icon URL<input type="url" value={forms.sportIcon} onChange={(e) => put("sportIcon", e.target.value)} className={inputClass} /></label><button disabled={busy === "sport-create"} className={`${buttonClass} sm:col-span-2`}>Add sport</button></form><RecordList records={records("sports")} actions={(sport) => <button onClick={() => { const id = getId(sport); if (id) void act(`sport:${id}`, () => adminApi.updateSport(id, { status: sport.status === "INACTIVE" ? "ACTIVE" : "INACTIVE" }), "Sport status updated."); }} className={secondaryButtonClass}>{sport.status === "INACTIVE" ? "Activate" : "Deactivate"}</button>} /></Panel>
          <Panel title="Review moderation" description="Publish or hide user reviews"><label className="mb-4 block max-w-xs text-xs text-white/60">Review status<select value={filters.reviewStatus} onChange={(e) => setFilters((current) => ({ ...current, reviewStatus: e.target.value }))} className={inputClass}>{["PENDING", "PUBLISHED", "HIDDEN", "ALL"].map((v) => <option key={v}>{v}</option>)}</select></label><RecordList records={records("reviews")} actions={(review) => <div className="flex gap-2"><button onClick={() => { const id = getId(review); if (id) void act(`review:${id}`, () => adminApi.moderateReview(id, { status: "PUBLISHED" }), "Review published."); }} className="rounded-lg bg-lime-300 px-3 py-2 text-xs font-bold text-black">Publish</button><button onClick={() => { const id = getId(review); const reason = window.prompt("Reason for hiding this review:")?.trim(); if (id && reason) void act(`review:${id}`, () => adminApi.moderateReview(id, { status: "HIDDEN", reason }), "Review hidden."); }} className="rounded-lg border border-red-400/40 px-3 py-2 text-xs text-red-200">Hide</button></div>} /></Panel>
        </div>}

        {tab === "plans" && <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Business subscription plans"><form onSubmit={submit(async () => { const body = { name: forms.planName, slug: forms.planSlug, ...(forms.planDescription ? { description: forms.planDescription } : {}), monthlyPricePaise: Number(forms.monthly), quarterlyPricePaise: Number(forms.quarterly), yearlyPricePaise: Number(forms.yearly), trialDays: Number(forms.trialDays), status: forms.planStatus || "ACTIVE" }; const result = await act("plan-save", () => forms.planId ? adminApi.updateSubscriptionPlan(forms.planId, body) : adminApi.createSubscriptionPlan(body), forms.planId ? "Subscription plan updated." : "Subscription plan created."); if (result.success) { put("planId", ""); put("planName", ""); put("planSlug", ""); put("planDescription", ""); put("monthly", ""); put("quarterly", ""); put("yearly", ""); } })} className="mb-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-white/60">Plan name<input required value={forms.planName} onChange={(e) => put("planName", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Slug<input required pattern="[a-z0-9-]+" value={forms.planSlug} onChange={(e) => put("planSlug", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60 sm:col-span-2">Description<input value={forms.planDescription} onChange={(e) => put("planDescription", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Monthly price (paise)<input type="number" min="100" required value={forms.monthly} onChange={(e) => put("monthly", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Quarterly price (paise)<input type="number" min="100" required value={forms.quarterly} onChange={(e) => put("quarterly", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Yearly price (paise)<input type="number" min="100" required value={forms.yearly} onChange={(e) => put("yearly", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Trial days<input type="number" min="0" max="90" value={forms.trialDays} onChange={(e) => put("trialDays", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Plan status<select value={forms.planStatus || "ACTIVE"} onChange={(e) => put("planStatus", e.target.value)} className={inputClass}><option>ACTIVE</option><option>INACTIVE</option></select></label><button disabled={busy === "plan-save"} className={`${buttonClass} sm:col-span-2`}>{forms.planId ? "Update plan" : "Create plan"}</button></form><RecordList records={records("subscriptionPlans")} actions={(plan) => <button onClick={() => { put("planId", getId(plan)); put("planName", plan.name || ""); put("planSlug", plan.slug || ""); put("planDescription", plan.description || ""); put("monthly", String(plan.monthlyPricePaise ?? "")); put("quarterly", String(plan.quarterlyPricePaise ?? "")); put("yearly", String(plan.yearlyPricePaise ?? "")); put("planStatus", plan.status || "ACTIVE"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={secondaryButtonClass}>Edit</button>} /></Panel>
            <Panel title="Membership plans"><form onSubmit={submit(async () => { const planFields = { name: forms.membershipName, description: forms.membershipDescription, pricePaise: Number(forms.membershipPrice), durationDays: Number(forms.membershipDuration), discountBps: Number(forms.membershipDiscount), priorityBooking: Boolean(forms.priorityBooking === "true"), features: forms.membershipFeatures.split(",").map((item) => item.trim()).filter(Boolean) }; const body = forms.membershipId ? { ...planFields, status: forms.membershipStatus || "ACTIVE" } : planFields; const result = await act("membership-save", () => forms.membershipId ? adminApi.updateMembershipPlan(forms.membershipId, body) : adminApi.createMembershipPlan(body), forms.membershipId ? "Membership plan updated." : "Membership plan created."); if (result.success) { put("membershipId", ""); put("membershipName", ""); put("membershipDescription", ""); put("membershipPrice", ""); put("membershipFeatures", ""); } })} className="mb-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-white/60">Name<input required value={forms.membershipName} onChange={(e) => put("membershipName", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Price (paise)<input required type="number" min="1" value={forms.membershipPrice} onChange={(e) => put("membershipPrice", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Duration (days)<input required type="number" min="1" value={forms.membershipDuration} onChange={(e) => put("membershipDuration", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Discount (BPS)<input type="number" min="0" max="10000" value={forms.membershipDiscount} onChange={(e) => put("membershipDiscount", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Priority booking<select value={forms.priorityBooking || "false"} onChange={(e) => put("priorityBooking", e.target.value)} className={inputClass}><option value="false">No</option><option value="true">Yes</option></select></label><label className="text-xs text-white/60">Status<select value={forms.membershipStatus || "ACTIVE"} onChange={(e) => put("membershipStatus", e.target.value)} className={inputClass} disabled={!forms.membershipId}><option>ACTIVE</option><option>INACTIVE</option></select></label><label className="text-xs text-white/60">Features (comma separated)<input value={forms.membershipFeatures} onChange={(e) => put("membershipFeatures", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60 sm:col-span-2">Description<input value={forms.membershipDescription} onChange={(e) => put("membershipDescription", e.target.value)} className={inputClass} /></label><button disabled={busy === "membership-save"} className={`${buttonClass} sm:col-span-2`}>{forms.membershipId ? "Update plan" : "Create plan"}</button></form><RecordList records={records("membershipPlans")} actions={(plan) => <div className="flex gap-2"><button onClick={() => { put("membershipId", getId(plan)); put("membershipName", plan.name || ""); put("membershipDescription", plan.description || ""); put("membershipPrice", String(plan.pricePaise ?? "")); put("membershipDuration", String(plan.durationDays ?? "365")); put("membershipDiscount", String(plan.discountBps ?? "0")); put("membershipFeatures", (plan.features || []).join(", ")); put("priorityBooking", String(Boolean(plan.priorityBooking))); put("membershipStatus", plan.status || "ACTIVE"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={secondaryButtonClass}>Edit</button><button onClick={() => { const id = getId(plan); if (id) void act(`membership-status:${id}`, () => adminApi.updateMembershipPlan(id, { status: plan.status === "INACTIVE" ? "ACTIVE" : "INACTIVE" }), "Membership plan status updated."); }} className={secondaryButtonClass}>{plan.status === "INACTIVE" ? "Activate" : "Deactivate"}</button></div>} /></Panel>
          </div>
          <Panel title="Business subscriptions" description="Subscription details returned by the admin subscriptions API"><SubscriptionList records={records("subscriptions")} /></Panel>
        </div>}

        {tab === "support" && <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Support tickets"><div className="mb-4 grid max-w-xl gap-3 sm:grid-cols-2"><label className="text-xs text-white/60">Status filter<select value={filters.ticketStatus} onChange={(e) => setFilters((current) => ({ ...current, ticketStatus: e.target.value }))} className={inputClass}><option value="">All statuses</option>{["IN_PROGRESS", "WAITING_FOR_USER", "WAITING_FOR_BUSINESS", "RESOLVED", "CLOSED"].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs text-white/60">Priority filter<select value={filters.ticketPriority} onChange={(e) => setFilters((current) => ({ ...current, ticketPriority: e.target.value }))} className={inputClass}><option value="">All priorities</option>{["LOW", "MEDIUM", "HIGH", "URGENT"].map((v) => <option key={v}>{v}</option>)}</select></label></div><button onClick={() => void loadTab("support")} className={`${secondaryButtonClass} mb-4`}>Apply ticket filters</button><RecordList records={records("tickets")} actions={(ticket) => <button onClick={async () => { const id = getId(ticket); if (!id) return; const result = await act(`ticket-detail:${id}`, () => adminApi.supportTicket(id), "Ticket loaded.", false); if (result.success) { const value = result.data?.data || result.data; setSelectedTicket(value); put("ticketId", id); } }} className={secondaryButtonClass}>Open ticket</button>} /></Panel>
          <Panel title="Ticket actions" description="Load a ticket, reply, or update status/priority">{selectedTicket && <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-3"><p className="font-bold">{displayName(selectedTicket)}</p><pre className="mt-2 max-h-48 overflow-auto text-xs text-white/60">{pretty(selectedTicket)}</pre></div>}<form onSubmit={submit(async () => { const id = forms.ticketId; if (!id) return; const result = await act(`ticket-update:${id}`, () => adminApi.updateSupportTicket(id, { status: forms.ticketStatus, priority: forms.ticketPriority }), "Ticket updated.", false); if (result.success) { const detail = await adminApi.supportTicket(id); if (detail.success) setSelectedTicket(detail.data?.data || detail.data); } })} className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-white/60 sm:col-span-2">Ticket ID<input required value={forms.ticketId} onChange={(e) => put("ticketId", e.target.value)} className={inputClass} /></label><label className="text-xs text-white/60">Status<select value={forms.ticketStatus} onChange={(e) => put("ticketStatus", e.target.value)} className={inputClass}>{["IN_PROGRESS", "WAITING_FOR_USER", "WAITING_FOR_BUSINESS", "RESOLVED", "CLOSED"].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs text-white/60">Priority<select value={forms.ticketPriority} onChange={(e) => put("ticketPriority", e.target.value)} className={inputClass}>{["LOW", "MEDIUM", "HIGH", "URGENT"].map((v) => <option key={v}>{v}</option>)}</select></label><button disabled={busy.startsWith("ticket-update:")} className={`${buttonClass} sm:col-span-2`}>Update ticket</button></form><form onSubmit={submit(async () => { const id = forms.ticketId; if (!id) return; const result = await act(`ticket-reply:${id}`, () => adminApi.replyToSupportTicket(id, { message: forms.ticketReply }), "Reply sent.", false); if (result.success) { put("ticketReply", ""); const detail = await adminApi.supportTicket(id); if (detail.success) setSelectedTicket(detail.data?.data || detail.data); } })} className="mt-5 space-y-3"><label className="block text-xs text-white/60">Reply<textarea required minLength={1} value={forms.ticketReply} onChange={(e) => put("ticketReply", e.target.value)} rows={4} className={inputClass} /></label><button disabled={busy.startsWith("ticket-reply:")} className={buttonClass}>Send reply</button></form></Panel>
        </div>}

        {tab === "account" && <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Admin profile"><form onSubmit={submit(async () => { const result = await act("profile-save", () => updateAdminProfile({ username: forms.profileUsername, email: forms.profileEmail }), "Profile updated.", false); if (result.success) { const profileResult = await getAdminProfile(); if (profileResult.success) setProfile(profileResult.data?.admin || profileResult.data?.user || profileResult.data); } })} className="space-y-3"><label className="block text-xs text-white/60">Username<input required minLength={3} maxLength={30} value={forms.profileUsername ?? profile?.username ?? ""} onChange={(e) => put("profileUsername", e.target.value)} className={inputClass} /></label><label className="block text-xs text-white/60">Email<input required type="email" value={forms.profileEmail ?? profile?.email ?? ""} onChange={(e) => put("profileEmail", e.target.value)} className={inputClass} /></label><button disabled={busy === "profile-save"} className={buttonClass}>Save profile</button></form><div className="mt-4 flex gap-3"><button onClick={() => void act("profile-load", () => getAdminProfile(), "Profile refreshed.", false).then((result: any) => result.success && setProfile(result.data?.admin || result.data?.user || result.data))} className={secondaryButtonClass}>Reload profile</button></div></Panel>
          <Panel title="Change password"><form onSubmit={submit(async (event?: any) => { void event; await act("password", () => changeAdminPassword(forms.currentPassword, forms.newPassword), "Password changed.", false); put("currentPassword", ""); put("newPassword", ""); })} className="space-y-3"><label className="block text-xs text-white/60">Current password<input required type="password" value={forms.currentPassword || ""} onChange={(e) => put("currentPassword", e.target.value)} className={inputClass} /></label><label className="block text-xs text-white/60">New password<input required type="password" minLength={6} value={forms.newPassword || ""} onChange={(e) => put("newPassword", e.target.value)} className={inputClass} /></label><button disabled={busy === "password"} className={buttonClass}>Change password</button></form></Panel>
        </div>}
      </div>
    </main>
  );
}
