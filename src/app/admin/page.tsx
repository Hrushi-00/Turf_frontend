"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  approveTurf,
  getAllAdminTurfs,
  rejectTurf,
} from "@/src/services/turfService";
import {
  getAllBookings,
  getBookingStats,
} from "@/src/services/bookingService";
import { getCurrentAdmin, isAdminLoggedIn, logout } from "@/src/services/authService";
import { adminApi } from "@/src/services/adminApiService";
import type { ApiRecord } from "@/src/types/apiRecord";

type TurfRecord = {
  id: string;
  name: string;
  city: string;
  price: number;
  approved: boolean;
  featured: boolean;
  trending: boolean;
  sport: string;
  raw: ApiRecord;
};

type BookingRecord = {
  id: string;
  turfName: string;
  sport: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  price: number;
  userName: string;
};

type BookingStats = {
  totalBookings?: number;
  totalRevenue?: number;
  pendingBookings?: number;
  confirmedBookings?: number;
  cancelledBookings?: number;
};

type BusinessReviewRecord = {
  id: string;
  name: string;
  email: string;
  status: string;
};

type TurfFormState = {
  ownerDetails: { name: string; contactNumber: string; email: string };
  turfDetails: { turfName: string; description: string; sportsAvailable: string; surfaceType: string; dimensions: { length: string; width: string; unit: string }; capacity: string };
  location: { address: string; landmark: string; city: string; state: string; zipCode: string; googleMapLink: string };
  pricing: { weekdayRate: string; weekendRate: string; currency: string; minimumBookingHours: string };
  availability: { openingTime: string; closingTime: string; closedDays: string };
  amenities: string;
};

const emptyTurfForm = (): TurfFormState => ({
  ownerDetails: { name: "", contactNumber: "", email: "" },
  turfDetails: { turfName: "", description: "", sportsAvailable: "", surfaceType: "Artificial grass", dimensions: { length: "", width: "", unit: "feet" }, capacity: "", },
  location: { address: "", landmark: "", city: "", state: "", zipCode: "", googleMapLink: "" },
  pricing: { weekdayRate: "", weekendRate: "", currency: "INR", minimumBookingHours: "1" },
  availability: { openingTime: "06:00", closingTime: "23:00", closedDays: "" },
  amenities: "",
});

const asText = (value: unknown) => value === undefined || value === null ? "" : String(value);

const toTurfForm = (raw: ApiRecord): TurfFormState => {
  const defaults = emptyTurfForm();
  const turfDetails = raw.turfDetails || raw;
  const listText = (value: unknown) => Array.isArray(value) ? value.map((item) => typeof item === "string" ? item : item?.name || item?.slug || "").filter(Boolean).join(", ") : asText(value);
  return {
    ownerDetails: { name: asText(raw.ownerDetails?.name), contactNumber: asText(raw.ownerDetails?.contactNumber), email: asText(raw.ownerDetails?.email) },
    turfDetails: {
      turfName: asText(turfDetails.turfName), description: asText(turfDetails.description), sportsAvailable: listText(turfDetails.sportsAvailable),
      surfaceType: asText(turfDetails.surfaceType) || defaults.turfDetails.surfaceType,
      dimensions: { length: asText(turfDetails.dimensions?.length), width: asText(turfDetails.dimensions?.width), unit: asText(turfDetails.dimensions?.unit) || defaults.turfDetails.dimensions.unit },
      capacity: asText(turfDetails.capacity),
    },
    location: { address: asText(raw.location?.address), landmark: asText(raw.location?.landmark), city: asText(raw.location?.city), state: asText(raw.location?.state), zipCode: asText(raw.location?.zipCode), googleMapLink: asText(raw.location?.googleMapLink) },
    pricing: { weekdayRate: asText(raw.pricing?.weekdayRate), weekendRate: asText(raw.pricing?.weekendRate), currency: asText(raw.pricing?.currency) || "INR", minimumBookingHours: asText(raw.pricing?.minimumBookingHours) || "1" },
    availability: { openingTime: asText(raw.availability?.openingTime) || "06:00", closingTime: asText(raw.availability?.closingTime) || "23:00", closedDays: listText(raw.availability?.closedDays) },
    amenities: listText(raw.amenities),
  };
};

const extractBusinessItems = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["businesses", "venues", "documents", "businessDocuments", "items", "results", "records", "docs", "data", "result"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractBusinessItems(value);
      if (nested.length > 0) return nested;
    }
  }
  return [];
};

const extractBookingItems = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["bookings", "items", "results", "records", "docs", "data", "result"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractBookingItems(value);
      if (nested.length > 0) return nested;
    }
  }
  return [];
};

const toBusinessReviewRecords = (payload: unknown): BusinessReviewRecord[] =>
  extractBusinessItems(payload).map((item) => {
    const business = item as {
      _id?: string;
      id?: string;
      businessId?: string;
      legalName?: string;
      displayName?: string;
      name?: string;
      username?: string;
      contactEmail?: string;
      email?: string;
      approvalStatus?: string;
      status?: string;
      profile?: { legalName?: string; displayName?: string };
      businessProfile?: { legalName?: string; displayName?: string };
    };
    return {
      id: business._id || business.id || business.businessId || "",
      name: business.displayName || business.legalName || business.profile?.displayName || business.profile?.legalName || business.businessProfile?.displayName || business.businessProfile?.legalName || business.name || business.username || "Unnamed business",
      email: business.contactEmail || business.email || "",
      status: business.approvalStatus || business.status || "PENDING",
    };
  }).filter((business) => business.id);

const extractTurfItems = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  for (const key of ["turfs", "items", "results", "records", "docs", "data", "result"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractTurfItems(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const appendMultipartFields = (form: FormData, value: Record<string, unknown>, prefix = "") => {
  Object.entries(value).forEach(([key, item]) => {
    const field = prefix ? `${prefix}[${key}]` : key;
    if (item === undefined || item === null) return;
    if (typeof item === "object" && !Array.isArray(item)) appendMultipartFields(form, item as Record<string, unknown>, field);
    else form.append(field, Array.isArray(item) ? JSON.stringify(item) : String(item));
  });
};

const toTurfRecords = (payload: unknown): TurfRecord[] =>
  extractTurfItems(payload).map((item) => {
    const turf = item as {
      _id?: string;
      id?: string;
      turfDetails?: { turfName?: string; sportsAvailable?: string[] };
      location?: { city?: string };
      pricing?: { weekdayRate?: number };
      isApproved?: boolean;
      isFeatured?: boolean;
      isTrending?: boolean;
      metaInfo?: { isApproved?: boolean; isFeatured?: boolean; isTrending?: boolean };
    };

    return {
      id: turf._id || turf.id || "",
      name: turf.turfDetails?.turfName || "Unnamed Turf",
      city: turf.location?.city || "Unknown City",
      price: turf.pricing?.weekdayRate || 0,
      approved: turf.metaInfo?.isApproved ?? turf.isApproved ?? false,
      featured: turf.metaInfo?.isFeatured ?? turf.isFeatured ?? false,
      trending: turf.metaInfo?.isTrending ?? turf.isTrending ?? false,
      sport: turf.turfDetails?.sportsAvailable?.[0] || "Sports",
      raw: turf as ApiRecord,
    };
  });

const toBookingRecords = (items: unknown[]): BookingRecord[] =>
  items.map((item) => {
    const booking = item as {
      _id?: string;
      id?: string;
      date?: string;
      timeSlot?: string;
      bookingStatus?: string;
      paymentStatus?: string;
      price?: number;
      user?: { name?: string; email?: string };
      turf?: { turfDetails?: { turfName?: string; sportsAvailable?: string[] } };
    };

    return {
      id: booking._id || booking.id || "",
      turfName: booking.turf?.turfDetails?.turfName || "Unknown Turf",
      sport: booking.turf?.turfDetails?.sportsAvailable?.[0] || "Sports",
      date: booking.date ? new Date(booking.date).toLocaleDateString() : "N/A",
      time: booking.timeSlot || "N/A",
      status: booking.bookingStatus || "pending",
      paymentStatus: booking.paymentStatus || "pending",
      price: booking.price || 0,
      userName: booking.user?.name || "Unknown User",
    };
  });

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ username?: string; email?: string } | null>(null);
  const [turfs, setTurfs] = useState<TurfRecord[]>([]);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessReviewRecord[]>([]);
  const [businessQueueError, setBusinessQueueError] = useState("");
  const [bookingStats, setBookingStats] = useState<BookingStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, string>>({});
  const [businessStatus, setBusinessStatus] = useState("PENDING");
  const [businessDocuments, setBusinessDocuments] = useState<ApiRecord[]>([]);
  const [turfFormOpen, setTurfFormOpen] = useState(false);
  const [turfDraft, setTurfDraft] = useState<TurfFormState>(emptyTurfForm);
  const [turfMainImage, setTurfMainImage] = useState<File | null>(null);
  const [turfThumbnails, setTurfThumbnails] = useState<File[]>([]);
  const [editTurfId, setEditTurfId] = useState<string | null>(null);

  const readTurfField = (path: string): string => path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as ApiRecord)[key] : undefined, turfDraft) as string || "";
  const updateTurfField = (path: string, value: string) => {
    setTurfDraft((current) => {
      const next = structuredClone(current) as ApiRecord;
      const keys = path.split(".");
      let target = next;
      keys.slice(0, -1).forEach((key) => { target = target[key]; });
      target[keys[keys.length - 1]] = value;
      return next as unknown as TurfFormState;
    });
  };
  const renderTurfInput = (label: string, path: string, options: { type?: string; required?: boolean; min?: string; max?: string; placeholder?: string; pattern?: string } = {}) => (
    <label className="block text-sm font-semibold text-white/75">{label}{options.required && <span className="ml-1 text-red-300">*</span>}
      <input type={options.type || "text"} min={options.min} max={options.max} pattern={options.pattern} required={options.required} value={readTurfField(path)} onChange={(event) => updateTurfField(path, event.target.value)} placeholder={options.placeholder || label} className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-lime-300" />
    </label>
  );

  const loadDashboard = useCallback(async (selectedBusinessStatus = businessStatus) => {
    setLoading(true);
    setError("");

    const [turfsResult, allBookingsResult, statsResult, businessesResult, documentsResult] = await Promise.all([
      getAllAdminTurfs(),
      getAllBookings(),
      getBookingStats(),
      adminApi.businesses({ status: selectedBusinessStatus === "ALL" ? undefined : selectedBusinessStatus, page: 1, limit: 100 }),
      adminApi.businessDocuments({ status: "PENDING_REVIEW", page: 1, limit: 100 }),
    ]);

    if (turfsResult.success) {
      setTurfs(toTurfRecords(turfsResult.data));
    }

    if (allBookingsResult.success) {
      setAllBookings(toBookingRecords(extractBookingItems(allBookingsResult.data)));
    }

    if (statsResult.success && statsResult.data && typeof statsResult.data === "object") {
      setBookingStats(statsResult.data as BookingStats);
    }

    if (businessesResult.success) {
      setBusinesses(toBusinessReviewRecords(businessesResult.data));
      setBusinessQueueError("");
    } else {
      setBusinessQueueError(businessesResult.message || "Unable to load pending business profiles.");
    }

    if (documentsResult.success) setBusinessDocuments(extractBusinessItems(documentsResult.data) as ApiRecord[]);

    const failures = [
      !turfsResult.success ? `Turfs: ${turfsResult.message || "failed to load"}` : "",
      !allBookingsResult.success ? `All bookings: ${allBookingsResult.message || "failed to load"}` : "",
      !statsResult.success ? `Booking stats: ${statsResult.message || "failed to load"}` : "",
      !documentsResult.success ? `Business documents: ${documentsResult.message || "failed to load"}` : "",
    ].filter(Boolean);
    setError(failures.join(" · "));

    setLoading(false);
  }, [businessStatus]);

  useEffect(() => {
    let active = true;
    if (!isAdminLoggedIn()) {
      router.push("/admin/login");
      return;
    }

    queueMicrotask(() => {
      if (!active) return;
      setAdmin(getCurrentAdmin());
      void loadDashboard();
    });
    return () => { active = false; };
  }, [loadDashboard, router]);

  const handleApprove = async (turfId: string) => {
    setActionId(turfId);
    const result = await approveTurf(turfId);
    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to approve turf");
    }
    setActionId(null);
  };

  const handleReject = async (turfId: string) => {
    if (!window.confirm("Reject this turf?")) return;

    setActionId(turfId);
    const result = await rejectTurf(turfId);
    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to reject turf");
    }
    setActionId(null);
  };

  const handleBookingUpdate = async (bookingId: string) => {
    const nextStatus = statusDrafts[bookingId];
    const nextPayment = paymentDrafts[bookingId];
    if (!nextStatus && !nextPayment) {
      return;
    }

    setActionId(bookingId);
    const result = await adminApi.updateBooking(bookingId, {
      ...(nextStatus ? { bookingStatus: nextStatus } : {}),
      ...(nextPayment ? { paymentStatus: nextPayment } : {}),
    });
    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to update booking");
    }
    setActionId(null);
  };

  const saveTurf = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
    const data: Record<string, unknown> = {
      ownerDetails: { ...turfDraft.ownerDetails },
      turfDetails: { ...turfDraft.turfDetails, sportsAvailable: splitList(turfDraft.turfDetails.sportsAvailable), dimensions: { ...turfDraft.turfDetails.dimensions, length: Number(turfDraft.turfDetails.dimensions.length), width: Number(turfDraft.turfDetails.dimensions.width) }, capacity: Number(turfDraft.turfDetails.capacity) },
      location: { ...turfDraft.location },
      pricing: { ...turfDraft.pricing, weekdayRate: Number(turfDraft.pricing.weekdayRate), weekendRate: Number(turfDraft.pricing.weekendRate), minimumBookingHours: Number(turfDraft.pricing.minimumBookingHours) },
      availability: { ...turfDraft.availability, closedDays: splitList(turfDraft.availability.closedDays) },
      amenities: splitList(turfDraft.amenities),
    };
    [data.ownerDetails, data.turfDetails, data.location, data.pricing, data.availability].forEach((section) => {
      Object.keys(section as Record<string, unknown>).forEach((key) => {
        if ((section as Record<string, unknown>)[key] === "") delete (section as Record<string, unknown>)[key];
      });
    });
    if (!editTurfId && !turfMainImage) {
      setError("Choose a main image to create a turf.");
      return;
    }
    const images = [turfMainImage, ...turfThumbnails].filter((file): file is File => Boolean(file));
    if (images.length > 10) {
      setError("Upload no more than 10 images in total.");
      return;
    }
    const invalidImage = images.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalidImage) {
      setError("Images must be JPEG, PNG, or WebP and each file must be 5 MB or smaller.");
      return;
    }
    const form = new FormData();
    appendMultipartFields(form, data);
    if (turfMainImage) form.append("mainImage", turfMainImage);
    turfThumbnails.forEach((file) => form.append("thumbnailImages", file));
    setActionId("turf-form");
    const result = editTurfId ? await adminApi.updateTurf(editTurfId, form) : await adminApi.createTurf(form);
    if (result.success) {
      setTurfFormOpen(false);
      setEditTurfId(null);
      setTurfDraft(emptyTurfForm());
      setTurfMainImage(null);
      setTurfThumbnails([]);
      await loadDashboard();
    } else setError(result.message || "Unable to save turf.");
    setActionId(null);
  };

  const reviewBusiness = async (businessId: string, approvalStatus: string) => {
    const reason = approvalStatus === "APPROVED" ? "" : window.prompt("Enter a reason (required):")?.trim();
    if (approvalStatus !== "APPROVED" && !reason) return;
    setActionId(`business:${businessId}`);
    const result = await adminApi.reviewBusiness(businessId, { approvalStatus, ...(reason ? { reason } : {}) });
    if (result.success) await loadDashboard();
    else setBusinessQueueError(result.message || "Unable to update business approval.");
    setActionId(null);
  };

  const totalRevenue = bookingStats.totalRevenue ?? allBookings.reduce((sum, booking) => sum + booking.price, 0);
  const pendingTurfs = turfs.filter((turf) => !turf.approved);
  const pendingBookings = allBookings.filter((booking) => booking.status === "pending").length;

  return (
    <div className="min-h-screen bg-black text-white pt-8 px-6 pb-20 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_25%)]" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Admin Dashboard</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Manage turfs and bookings</h1>
            <p className="mt-2 text-sm text-white/60">
              {admin?.username || admin?.email || "Admin"} is signed in.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/tools" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white">
              Admin Tools
            </Link>
            <button
              type="button"
              onClick={() => { setEditTurfId(null); setTurfDraft(emptyTurfForm()); setTurfMainImage(null); setTurfThumbnails([]); setTurfFormOpen(true); }}
              className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-black text-black transition hover:bg-lime-200"
            >
              Add turf
            </button>
            <Link href="/" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white">
              Home
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/admin/login");
              }}
              className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-white/90"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
            {error.toLowerCase().includes("business profile must be approved before approving this turf") && (
              <div className="mt-3">
                <Link href="#business-profile-review" className="inline-flex rounded-lg bg-lime-300 px-3 py-2 text-xs font-bold text-black transition hover:bg-lime-200">
                  Review business profile first
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Turfs", value: turfs.length },
            { label: "Pending approvals", value: pendingTurfs.length },
            { label: "Pending bookings", value: pendingBookings },
            { label: "Revenue", value: `Rs ${totalRevenue.toLocaleString()}` },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm text-white/60">{card.label}</p>
              <p className="mt-2 text-3xl font-black">{card.value}</p>
            </div>
          ))}
        </div>

        {turfFormOpen && <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 px-4 py-8 sm:px-6">
        <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#10120e] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs uppercase tracking-[0.3em] text-white/50">Turf management</p><h2 className="mt-2 text-2xl font-black">Create or update turf</h2></div>
            <button type="button" onClick={() => { setTurfFormOpen(false); setEditTurfId(null); }} className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">Close</button>
          </div>
          <form onSubmit={saveTurf} className="mt-6 space-y-7">
            <div className="space-y-3"><h3 className="text-lg font-black">Owner details</h3><div className="grid gap-4 md:grid-cols-2">
              {renderTurfInput("Owner name", "ownerDetails.name", { required: true })}{renderTurfInput("Contact number", "ownerDetails.contactNumber", { type: "tel", required: true, pattern: "\\+?[0-9]{10,15}", placeholder: "+919876543210" })}{renderTurfInput("Owner email", "ownerDetails.email", { type: "email" })}
            </div></div>
            <div className="space-y-3"><h3 className="text-lg font-black">Turf details</h3><div className="grid gap-4 md:grid-cols-2">
              {renderTurfInput("Turf name", "turfDetails.turfName", { required: true })}{renderTurfInput("Sports (comma separated)", "turfDetails.sportsAvailable", { required: true, placeholder: "football, cricket" })}{renderTurfInput("Surface type", "turfDetails.surfaceType", { required: true })}{renderTurfInput("Capacity", "turfDetails.capacity", { type: "number", min: "1", required: true })}{renderTurfInput("Length", "turfDetails.dimensions.length", { type: "number", min: "1", required: true })}{renderTurfInput("Width", "turfDetails.dimensions.width", { type: "number", min: "1", required: true })}
              <label className="block text-sm font-semibold text-white/75">Dimension unit<select value={readTurfField("turfDetails.dimensions.unit")} onChange={(event) => updateTurfField("turfDetails.dimensions.unit", event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white"><option value="feet">Feet</option><option value="meters">Meters</option></select></label>
              <label className="block text-sm font-semibold text-white/75 md:col-span-2">Description<textarea value={readTurfField("turfDetails.description")} onChange={(event) => updateTurfField("turfDetails.description", event.target.value)} required minLength={10} maxLength={500} rows={3} placeholder="Describe this turf (10–500 characters)" className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-lime-300" /></label>
            </div></div>
            <div className="space-y-3"><h3 className="text-lg font-black">Location</h3><div className="grid gap-4 md:grid-cols-2">
              {renderTurfInput("Address", "location.address", { required: true })}{renderTurfInput("Landmark", "location.landmark")}{renderTurfInput("City", "location.city", { required: true })}{renderTurfInput("State", "location.state", { required: true })}{renderTurfInput("ZIP code", "location.zipCode", { required: true, pattern: "[0-9]{5,10}" })}{renderTurfInput("Google Maps link", "location.googleMapLink", { type: "url" })}
            </div></div>
            <div className="space-y-3"><h3 className="text-lg font-black">Pricing and availability</h3><div className="grid gap-4 md:grid-cols-2">
              {renderTurfInput("Weekday rate", "pricing.weekdayRate", { type: "number", min: "0", required: true })}{renderTurfInput("Weekend rate", "pricing.weekendRate", { type: "number", min: "0", required: true })}{renderTurfInput("Minimum booking hours", "pricing.minimumBookingHours", { type: "number", min: "1", required: true })}{renderTurfInput("Currency", "pricing.currency", { required: true })}{renderTurfInput("Opening time", "availability.openingTime", { type: "time", required: true })}{renderTurfInput("Closing time", "availability.closingTime", { type: "time", required: true })}{renderTurfInput("Closed days (comma separated)", "availability.closedDays", { placeholder: "Monday, Tuesday" })}{renderTurfInput("Amenities (comma separated)", "amenities", { placeholder: "Parking, changing room, lights" })}
            </div></div>
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2"><label className="text-sm font-semibold text-white/75">Main image {editTurfId ? "(optional for update)" : "(required)"}<input type="file" accept="image/jpeg,image/png,image/webp" required={!editTurfId} onChange={(event) => setTurfMainImage(event.target.files?.[0] || null)} className="mt-2 block w-full text-sm" /></label>
              <label className="text-sm font-semibold text-white/75">Thumbnail images (up to 9)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setTurfThumbnails(Array.from(event.target.files || []).slice(0, 9))} className="mt-2 block w-full text-sm" /></label></div>
            <button disabled={actionId === "turf-form"} className="rounded-xl bg-lime-300 px-5 py-3 font-black text-black disabled:opacity-60">{actionId === "turf-form" ? "Saving..." : editTurfId ? "Update turf" : "Create turf"}</button>
          </form>
        </section>
        </div>}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5"><p className="text-xs uppercase tracking-[0.3em] text-white/50">All turfs</p><h2 className="mt-2 text-2xl font-black">Manage turf listing and visibility</h2></div>
          <div className="grid gap-4 lg:grid-cols-2">
            {turfs.map((turf) => <article key={turf.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black">{turf.name}</h3><p className="text-sm text-white/60">{turf.city} · {turf.sport} · Rs {turf.price}</p></div><span className="text-xs text-white/60">{turf.approved ? "Approved" : "Pending"}</span></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => { setEditTurfId(turf.id); setTurfDraft(toTurfForm(turf.raw)); setTurfMainImage(null); setTurfThumbnails([]); setTurfFormOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-lg border border-white/15 px-3 py-2 text-sm">Edit</button>
                <button onClick={async () => { setActionId(turf.id); const result = await adminApi.updateTurfMeta(turf.id, { isFeatured: !turf.featured }); if (!result.success) setError(result.message || "Unable to update turf metadata."); else await loadDashboard(); setActionId(null); }} disabled={actionId === turf.id} className="rounded-lg border border-white/15 px-3 py-2 text-sm">{turf.featured ? "Unfeature" : "Feature"}</button>
                <button onClick={async () => { setActionId(turf.id); const result = await adminApi.updateTurfMeta(turf.id, { isTrending: !turf.trending }); if (!result.success) setError(result.message || "Unable to update turf metadata."); else await loadDashboard(); setActionId(null); }} disabled={actionId === turf.id} className="rounded-lg border border-white/15 px-3 py-2 text-sm">{turf.trending ? "Untrend" : "Mark trending"}</button>
                <button onClick={async () => { if (!window.confirm(`Delete ${turf.name}?`)) return; setActionId(turf.id); const result = await adminApi.deleteTurf(turf.id); if (!result.success) setError(result.message || "Unable to delete turf."); else await loadDashboard(); setActionId(null); }} disabled={actionId === turf.id} className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-200">Delete</button>
              </div>
            </article>)}
            {!loading && turfs.length === 0 && <p className="text-sm text-white/60">No turf records.</p>}
          </div>
        </section>

        <section id="business-profile-review" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl scroll-mt-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Business verification</p>
              <h2 className="mt-2 text-2xl font-black">Business profile review</h2>
            </div>
            <div className="flex items-center gap-3">
              <select aria-label="Business approval status" value={businessStatus} onChange={(event) => { setBusinessStatus(event.target.value); void loadDashboard(event.target.value); }} className="rounded-xl border border-white/10 bg-black px-3 py-2 text-sm">
                {["PENDING", "APPROVED", "REJECTED", "REQUIRES_ACTION", "ALL"].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">{businesses.length} profiles</span>
            </div>
          </div>
          {businessQueueError && <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{businessQueueError}</p>}
          {loading ? (
            <p className="text-sm text-white/60">Loading business profiles...</p>
          ) : businesses.length === 0 ? (
            <p className="text-sm text-white/60">No business profiles found for this status.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {businesses.map((business) => {
                const isBusy = actionId === `business:${business.id}`;
                const status = business.status.toUpperCase();
                return (
                  <article key={business.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold">{business.name}</h3>
                      <p className="truncate text-sm text-white/60">{business.email || "No email provided"}</p>
                      <p className={`mt-1 text-xs font-bold uppercase tracking-wide ${status === "APPROVED" ? "text-lime-300" : status === "REJECTED" ? "text-red-300" : "text-amber-200"}`}>{status.replaceAll("_", " ")}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {status !== "APPROVED" && <button onClick={() => void reviewBusiness(business.id, "APPROVED")} disabled={isBusy} className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-black text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60">{isBusy ? "Saving..." : "Approve"}</button>}
                      {status !== "REJECTED" && <button onClick={() => void reviewBusiness(business.id, "REJECTED")} disabled={isBusy} className="rounded-xl border border-red-400/40 px-4 py-2 text-sm text-red-200 disabled:opacity-50">Reject</button>}
                      {status !== "REQUIRES_ACTION" && <button onClick={() => void reviewBusiness(business.id, "REQUIRES_ACTION")} disabled={isBusy} className="rounded-xl border border-amber-400/40 px-4 py-2 text-sm text-amber-100 disabled:opacity-50">Request changes</button>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4"><p className="text-xs uppercase tracking-[0.3em] text-white/50">Business documents</p><h2 className="mt-2 text-2xl font-black">Pending document reviews</h2></div>
            <div className="space-y-3">{businessDocuments.map((doc, index) => {
              const id = String(doc._id || doc.id || doc.documentId || "");
              return <div key={id || index} className="rounded-xl border border-white/10 bg-black/30 p-4"><p className="font-bold">{String(doc.name || doc.documentType || doc.type || "Business document")}</p><p className="text-xs text-white/50">{String(doc.business?.displayName || doc.business?.legalName || doc.businessName || "Business")} · {String(doc.status || "PENDING")}</p><p className="mt-1 truncate font-mono text-xs text-white/40">ID: {id || "Unavailable"}</p><div className="mt-3 flex flex-wrap gap-2"><Link href={`/admin/business-documents/${encodeURIComponent(id)}`} onClick={() => { if (id) sessionStorage.setItem(`admin-business-document:${id}`, JSON.stringify(doc)); }} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-black">Review details</Link><button onClick={async () => { setActionId(`document:${id}`); const result = await adminApi.businessDocumentDownload(id); const data = result.data as Record<string, unknown> | undefined; const url = data?.url || data?.downloadUrl || data?.signedUrl; if (result.success && typeof url === "string") window.open(url, "_blank", "noopener,noreferrer"); else setError(result.message || "Document download URL was not returned."); setActionId(null); }} disabled={!id || actionId === `document:${id}`} className="rounded-lg border border-white/15 px-3 py-2 text-xs">Download</button></div></div>;
            })}{!loading && businessDocuments.length === 0 && <p className="text-sm text-white/60">No pending documents.</p>}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-black">Venue approval disabled</h2>
            <p className="mt-2 text-sm text-white/55">This admin route is disabled for the turf-only flow. Manage listing approvals in Turfs.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Approval queue</p>
              <h2 className="mt-2 text-2xl font-black">Turfs waiting for review</h2>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3" aria-label="Loading turfs">
              {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-white/10" />)}
            </div>
          ) : pendingTurfs.length === 0 ? (
            <p className="text-white/60">No turfs waiting for approval.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {pendingTurfs.map((turf) => (
                <div key={turf.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{turf.name}</h3>
                      <p className="mt-1 text-sm text-white/60">
                        {turf.city} - {turf.sport}
                      </p>
                    </div>
                    <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      Pending
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                    <span>Price: Rs {turf.price}</span>
                    <span>{turf.featured ? "Featured" : "Not featured"}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleApprove(turf.id)}
                      disabled={actionId === turf.id}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-white/90 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(turf.id)}
                      disabled={actionId === turf.id}
                      className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">All bookings</p>
              <h2 className="mt-2 text-2xl font-black">Super-admin booking list</h2>
            </div>
            <button type="button" aria-expanded={bookingsOpen} onClick={() => setBookingsOpen((open) => !open)} className="inline-flex items-center gap-3 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/40">
              {bookingsOpen ? "Hide bookings" : "Show bookings"}<span className="text-white/50">{allBookings.length}</span><span aria-hidden="true">{bookingsOpen ? "−" : "+"}</span>
            </button>
          </div>
          {bookingsOpen && <div className="mt-5 space-y-4">
            {allBookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr_0.9fr_auto] lg:items-center">
                  <div>
                    <h3 className="text-lg font-black">{booking.turfName}</h3>
                    <p className="mt-1 text-sm text-white/60">
                      {booking.userName} - {booking.sport}
                    </p>
                  </div>
                  <div className="text-sm text-white/70">
                    <p>{booking.date}</p>
                    <p>{booking.time}</p>
                  </div>
                  <div className="text-sm text-white/70">
                    <p>Status: {booking.status}</p>
                    <p>Price: Rs {booking.price}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={statusDrafts[booking.id] || booking.status}
                      onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                      className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <select aria-label={`Payment status for ${booking.id}`} value={paymentDrafts[booking.id] || booking.paymentStatus} onChange={(e) => setPaymentDrafts((prev) => ({ ...prev, [booking.id]: e.target.value }))} className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none">
                      {["pending", "paid", "failed", "refunded", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button
                      onClick={() => handleBookingUpdate(booking.id)}
                      disabled={actionId === booking.id}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && allBookings.length === 0 && (
              <p className="text-white/60">No bookings found.</p>
            )}
          </div>}
        </section>
      </div>
    </div>
  );
}
