"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { getCurrentBusiness, isBusinessLoggedIn, logout } from "@/src/services/authService";
import {
  createBusinessTurf,
  deleteBusinessTurf,
  getBusinessTurfs,
  updateBusinessTurf,
} from "@/src/services/turfService";
import {
  getBusinessBookingStats,
  getBusinessBookings,
  updateBusinessBookingStatus,
} from "@/src/services/bookingService";

type BusinessTurf = {
  id: string;
  name: string;
  city: string;
  price: number;
  weekendPrice: number;
  approved: boolean;
  sport: string;
  raw: Record<string, any>;
};

type BusinessBooking = {
  id: string;
  turfName: string;
  userName: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  price: number;
};

type BusinessStats = {
  totalBookings?: number;
  totalRevenue?: number;
  pendingBookings?: number;
  confirmedBookings?: number;
};

type UploadedImage = { file: File; previewUrl: string };
type TurfFieldErrors = Record<string, string>;

function readTurfFieldErrors(payload: unknown): TurfFieldErrors {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const list = root.errors;
  if (!Array.isArray(list)) return {};
  const aliases: Record<string, string> = {
    "ownerDetails.contactNumber": "contactNumber",
    "turfDetails.turfName": "turfName",
    "turfDetails.description": "description",
    "turfDetails.surfaceType": "surfaceType",
    "turfDetails.dimensions.length": "length",
    "turfDetails.dimensions.width": "width",
    "turfDetails.dimensions.unit": "dimensionUnit",
    "turfDetails.capacity": "capacity",
    "location.address": "address",
    "location.city": "city",
    "location.state": "state",
    "location.zipCode": "zipCode",
    "pricing.weekdayRate": "weekdayRate",
    "pricing.weekendRate": "weekendRate",
    "availability.openingTime": "openingTime",
    "availability.closingTime": "closingTime",
  };
  const errors: TurfFieldErrors = {};
  list.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const value = entry as Record<string, unknown>;
    if (typeof value.field !== "string" || typeof value.message !== "string") return;
    const field = aliases[value.field];
    if (field) errors[field] = errors[field] ? `${errors[field]} ${value.message}` : value.message;
  });
  return errors;
}

const toBusinessTurfs = (items: unknown[]): BusinessTurf[] =>
  items.map((item) => {
    const turf = item as {
      _id?: string;
      id?: string;
      turfDetails?: { turfName?: string; sportsAvailable?: string[] };
      location?: { city?: string };
      pricing?: { weekdayRate?: number; weekendRate?: number };
      metaInfo?: { isApproved?: boolean };
      isApproved?: boolean;
    };

    return {
      id: turf._id || turf.id || "",
      name: turf.turfDetails?.turfName || "Unnamed Turf",
      city: turf.location?.city || "Unknown City",
      price: turf.pricing?.weekdayRate || 0,
      weekendPrice: turf.pricing?.weekendRate || 0,
      approved: turf.metaInfo?.isApproved ?? turf.isApproved ?? false,
      sport: turf.turfDetails?.sportsAvailable?.[0] || "Sports",
      raw: item as Record<string, any>,
    };
  });

const toBusinessBookings = (items: unknown[]): BusinessBooking[] =>
  items.map((item) => {
    const booking = item as {
      _id?: string;
      id?: string;
      date?: string;
      timeSlot?: string;
      bookingStatus?: string;
      paymentStatus?: string;
      price?: number;
      user?: { name?: string };
      turf?: { turfDetails?: { turfName?: string } };
    };

    return {
      id: booking._id || booking.id || "",
      turfName: booking.turf?.turfDetails?.turfName || "Unknown Turf",
      userName: booking.user?.name || "Unknown User",
      date: booking.date ? new Date(booking.date).toLocaleDateString() : "N/A",
      time: booking.timeSlot || "N/A",
      status: booking.bookingStatus || "pending",
      paymentStatus: booking.paymentStatus || "pending",
      price: booking.price || 0,
    };
  });

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<{ username?: string; email?: string; contactNumber?: string } | null>(null);
  const [turfs, setTurfs] = useState<BusinessTurf[]>([]);
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  const [stats, setStats] = useState<BusinessStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [showBusinessProfilePopup, setShowBusinessProfilePopup] = useState(false);
  const [turfFieldErrors, setTurfFieldErrors] = useState<TurfFieldErrors>({});
  const [mainImage, setMainImage] = useState<UploadedImage | null>(null);
  const [thumbnailImages, setThumbnailImages] = useState<UploadedImage[]>([]);
  const [imageError, setImageError] = useState("");
  const previewUrls = useRef(new Set<string>());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    turfName: "",
    description: "",
    sportsAvailable: "football",
    surfaceType: "synthetic",
    length: "90",
    width: "50",
    dimensionUnit: "meters",
    capacity: "20",
    city: "",
    address: "",
    landmark: "",
    state: "",
    zipCode: "",
    contactNumber: "",
    weekdayRate: "",
    weekendRate: "",
    openingTime: "06:00",
    closingTime: "23:00",
    amenities: "parking, lights",
  });

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const createPreviewUrl = (file: File) => {
    const url = URL.createObjectURL(file);
    previewUrls.current.add(url);
    return url;
  };

  const removePreviewUrl = (url: string) => {
    URL.revokeObjectURL(url);
    previewUrls.current.delete(url);
  };

  const readImageFiles = (files: File[]) => {
    const validFiles: File[] = [];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setImageError("Choose an image file such as JPG, PNG, or WebP.");
        return null;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Each image must be 5 MB or smaller.");
        return null;
      }
      validFiles.push(file);
    }
    setImageError("");
    return validFiles;
  };

  const handleMainImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const valid = readImageFiles([file]);
    if (valid?.[0]) {
      if (mainImage) removePreviewUrl(mainImage.previewUrl);
      setMainImage({ file: valid[0], previewUrl: createPreviewUrl(valid[0]) });
      setError("");
    }
    event.target.value = "";
  };

  const handleThumbnailSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const availableThumbnailSlots = 9 - thumbnailImages.length;
    if (files.length > availableThumbnailSlots) {
      setImageError(`You can upload up to ${availableThumbnailSlots} more gallery image${availableThumbnailSlots === 1 ? "" : "s"}; the total limit is 10 including the main image.`);
      event.target.value = "";
      return;
    }
    const valid = readImageFiles(files);
    if (valid) {
      setThumbnailImages((current) => [...current, ...valid.map((file) => ({ file, previewUrl: createPreviewUrl(file) }))]);
      setError("");
    }
    event.target.value = "";
  };

  const updateTurfField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setTurfFieldErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setError("");
  };

  const validateTurfForm = (): TurfFieldErrors => {
    const errors: TurfFieldErrors = {};
    const required = (key: keyof typeof form, label: string) => {
      if (!form[key].trim()) errors[key] = `${label} is required.`;
    };
    required("contactNumber", "Owner contact number");
    const phoneDigits = form.contactNumber.replace(/\D/g, "");
    if (form.contactNumber && (phoneDigits.length < 10 || phoneDigits.length > 15)) errors.contactNumber = "Contact number must contain 10 to 15 digits.";
    required("turfName", "Turf name");
    if (form.turfName && (form.turfName.trim().length < 3 || form.turfName.trim().length > 100)) errors.turfName = "Turf name must be between 3 and 100 characters.";
    required("description", "Description");
    if (form.description && (form.description.trim().length < 10 || form.description.trim().length > 500)) errors.description = "Description must be between 10 and 500 characters.";
    required("surfaceType", "Surface type");
    for (const key of ["length", "width"] as const) {
      required(key, key === "length" ? "Length" : "Width");
      if (form[key] && (!Number.isFinite(Number(form[key])) || Number(form[key]) <= 0)) errors[key] = `${key === "length" ? "Length" : "Width"} must be a positive number.`;
    }
    required("dimensionUnit", "Dimension unit");
    required("capacity", "Capacity");
    if (form.capacity && (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) <= 0)) errors.capacity = "Capacity must be a positive integer.";
    for (const key of ["address", "city", "state", "zipCode", "weekdayRate", "weekendRate", "openingTime", "closingTime"] as const) {
      const labels: Record<typeof key, string> = {
        address: "Address", city: "City", state: "State", zipCode: "Zip code",
        weekdayRate: "Weekday rate", weekendRate: "Weekend rate", openingTime: "Opening time", closingTime: "Closing time",
      };
      required(key, labels[key]);
    }
    if (form.zipCode && !/^\d{5,10}$/.test(form.zipCode.trim())) errors.zipCode = "Zip code must contain 5 to 10 digits.";
    for (const key of ["weekdayRate", "weekendRate"] as const) {
      if (form[key] && (!Number.isFinite(Number(form[key])) || Number(form[key]) < 0)) errors[key] = "Rate must be a non-negative number.";
    }
    for (const key of ["openingTime", "closingTime"] as const) {
      if (form[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form[key])) errors[key] = "Time must use HH:MM format.";
    }
    return errors;
  };

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const [turfsResult, bookingsResult, statsResult] = await Promise.all([
      getBusinessTurfs(),
      getBusinessBookings(),
      getBusinessBookingStats(),
    ]);

    if (turfsResult.success) {
      setTurfs(toBusinessTurfs(turfsResult.data as unknown[]));
    }

    if (bookingsResult.success) {
      const rawBookings = Array.isArray(bookingsResult.data)
        ? bookingsResult.data
        : (bookingsResult.data as { data?: unknown[]; bookings?: unknown[] }).data ||
          (bookingsResult.data as { data?: unknown[]; bookings?: unknown[] }).bookings ||
          [];
      setBookings(toBusinessBookings(rawBookings));
    }

    if (statsResult.success && statsResult.data && typeof statsResult.data === "object") {
      setStats(statsResult.data as BusinessStats);
    }

    const failures = [
      !turfsResult.success ? `Turfs: ${turfsResult.message || "failed to load"}` : "",
      !bookingsResult.success ? `Bookings: ${bookingsResult.message || "failed to load"}` : "",
      !statsResult.success ? `Booking stats: ${statsResult.message || "failed to load"}` : "",
    ].filter(Boolean);
    setError(failures.join(" · "));

    setLoading(false);
  }

  useEffect(() => {
    if (!isBusinessLoggedIn()) {
      router.push("/business/login");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusiness(getCurrentBusiness());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard();
  }, [router]);

  const handleCreateTurf = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mainImage) {
      setImageError("A main turf image is required.");
      setError("Add a main turf image before creating the turf.");
      document.getElementById("business-main-image")?.focus();
      return;
    }
    const validationErrors = validateTurfForm();
    setTurfFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setError("Please correct the highlighted turf fields.");
      document.getElementById(Object.keys(validationErrors)[0])?.focus();
      return;
    }
    if (imageError) {
      setError(imageError);
      return;
    }
    setSavingId("create");
    const payload = {
      ownerDetails: {
        name: business?.username || "Business Owner",
        contactNumber: form.contactNumber,
        email: business?.email || "",
      },
      turfDetails: {
        turfName: form.turfName,
        description: form.description,
        sportsAvailable: form.sportsAvailable
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        surfaceType: form.surfaceType,
        dimensions: {
          length: Number(form.length),
          width: Number(form.width),
          unit: form.dimensionUnit,
        },
        capacity: Number(form.capacity),
      },
      location: {
        address: form.address,
        landmark: form.landmark,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        googleMapLink: "",
      },
      pricing: {
        weekdayRate: Number(form.weekdayRate),
        weekendRate: Number(form.weekendRate),
        currency: "INR",
        minimumBookingHours: 1,
      },
      availability: {
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        closedDays: [],
        customUnavailableDates: [],
      },
      amenities: form.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      gallery: {},
    };

    const result = await createBusinessTurf(payload, {
      mainImage: mainImage?.file,
      thumbnailImages: thumbnailImages.map((image) => image.file),
    });
    if (result.success) {
      setForm({
        turfName: "",
        description: "",
        sportsAvailable: "football",
        surfaceType: "synthetic",
        length: "90",
        width: "50",
        dimensionUnit: "meters",
        capacity: "20",
        city: "",
        address: "",
        landmark: "",
        state: "",
        zipCode: "",
        contactNumber: "",
        weekdayRate: "",
        weekendRate: "",
        openingTime: "06:00",
        closingTime: "23:00",
        amenities: "parking, lights",
      });
      setMainImage(null);
      if (mainImage) removePreviewUrl(mainImage.previewUrl);
      thumbnailImages.forEach((image) => removePreviewUrl(image.previewUrl));
      setThumbnailImages([]);
      setTurfFieldErrors({});
      await loadDashboard();
    } else {
      const responseCode = result.data?.code || result.data?.errorCode || result.data?.error?.code || result.data?.data?.code;
      const responseMessage = [result.message, result.data?.message, result.data?.error?.message]
        .filter((value): value is string => typeof value === "string")
        .join(" ");
      const businessProfileRequired = responseCode === "BUSINESS_PROFILE_REQUIRED"
        || responseMessage.includes("BUSINESS_PROFILE_REQUIRED")
        || responseMessage.toLowerCase().includes("complete your business profile before adding a turf");
      const subscriptionRequired = responseCode === "SUBSCRIPTION_REQUIRED"
        || result.data?.error === "SUBSCRIPTION_REQUIRED"
        || responseMessage.includes("SUBSCRIPTION_REQUIRED")
        || responseMessage.toLowerCase().includes("activate a subscription before adding another turf");
      if (subscriptionRequired) setShowSubscriptionPopup(true);
      if (businessProfileRequired) setShowBusinessProfilePopup(true);
      const serverErrors = readTurfFieldErrors(result.data);
      setTurfFieldErrors(serverErrors);
      setError(subscriptionRequired || businessProfileRequired ? "" : Object.keys(serverErrors).length
        ? "The server rejected some fields. Review the highlighted values."
        : result.message || "Unable to create turf");
      if (Object.keys(serverErrors).length > 0) document.getElementById(Object.keys(serverErrors)[0])?.focus();
    }
    setSavingId(null);
  };

  const handleEditTurf = async (turf: BusinessTurf) => {
    const nextName = window.prompt("New turf name", turf.name);
    if (!nextName) {
      return;
    }
    const nextRate = window.prompt("New weekday rate", String(turf.price));
    if (!nextRate) {
      return;
    }

    setSavingId(turf.id);
    const current = turf.raw;
    const details = current.turfDetails || {};
    const dimensions = details.dimensions || {};
    const pricing = current.pricing || {};
    const result = await updateBusinessTurf(turf.id, {
      ownerDetails: current.ownerDetails || {},
      turfDetails: {
        ...details,
        turfName: nextName.trim(),
        description: details.description || "",
        surfaceType: details.surfaceType || "",
        dimensions: {
          ...dimensions,
          length: Number(dimensions.length),
          width: Number(dimensions.width),
          unit: dimensions.unit || "",
        },
        capacity: Number(details.capacity),
      },
      pricing: {
        ...pricing,
        weekdayRate: Number(nextRate),
        weekendRate: Number(pricing.weekendRate ?? nextRate),
        currency: pricing.currency || "INR",
      },
      location: current.location || {},
      availability: current.availability || {},
      gallery: current.gallery || {},
      amenities: current.amenities || [],
    });

    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to update turf");
    }
    setSavingId(null);
  };

  const handleDeleteTurf = async (turfId: string) => {
    const confirmed = window.confirm("Delete this turf?");
    if (!confirmed) {
      return;
    }

    setSavingId(turfId);
    const result = await deleteBusinessTurf(turfId);
    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to delete turf");
    }
    setSavingId(null);
  };

  const handleBookingUpdate = async (bookingId: string) => {
    const nextStatus = statusDrafts[bookingId];
    if (!nextStatus) {
      return;
    }

    setSavingId(bookingId);
    const result = await updateBusinessBookingStatus(bookingId, {
      bookingStatus: nextStatus,
      paymentStatus: nextStatus === "confirmed" ? "paid" : undefined,
    });

    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to update booking");
    }
    setSavingId(null);
  };

  const totalRevenue = stats.totalRevenue ?? bookings.reduce((sum, booking) => sum + booking.price, 0);
  const turfFields: Array<{ label: string; key: keyof typeof form; type?: string; min?: string }> = [
    { label: "Turf name", key: "turfName" },
    { label: "Owner contact number", key: "contactNumber", type: "tel" },
    { label: "City", key: "city" },
    { label: "Address", key: "address" },
    { label: "Landmark", key: "landmark" },
    { label: "State", key: "state" },
    { label: "Zip code (5-10 digits)", key: "zipCode" },
    { label: "Sports available", key: "sportsAvailable" },
    { label: "Surface type", key: "surfaceType" },
    { label: "Length", key: "length", type: "number", min: "0.01" },
    { label: "Width", key: "width", type: "number", min: "0.01" },
    { label: "Dimension unit", key: "dimensionUnit" },
    { label: "Capacity", key: "capacity", type: "number", min: "1" },
    { label: "Weekday rate", key: "weekdayRate", type: "number", min: "0" },
    { label: "Weekend rate", key: "weekendRate", type: "number", min: "0" },
    { label: "Opening time", key: "openingTime", type: "time" },
    { label: "Closing time", key: "closingTime", type: "time" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-8 px-6 pb-20 lg:px-16">
      {showBusinessProfilePopup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-5 py-8" onClick={() => setShowBusinessProfilePopup(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="business-profile-required-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10120e] p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()}>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-200">Business profile required</p>
            <h2 id="business-profile-required-title" className="mt-3 text-xl font-black leading-snug">Complete your business profile before adding a turf</h2>
            <p className="mt-2 text-sm text-white/60">Add your business details and address, then return here to submit the turf.</p>
            <Link href="/business/portal?section=profile&edit=1" onClick={() => setShowBusinessProfilePopup(false)} className="mt-6 inline-flex w-full justify-center rounded-lg bg-lime-200 px-5 py-3 text-center font-black text-black transition hover:bg-lime-100">Complete business profile</Link>
          </section>
        </div>
      )}
      {showSubscriptionPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-5 py-8" onClick={() => setShowSubscriptionPopup(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-required-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10120e] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-200">Subscription required</p>
            <h2 id="subscription-required-title" className="mt-3 text-xl font-black leading-snug">
              Complete your business profile and activate a subscription before adding another turf
            </h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/business/portal?section=finance"
                onClick={() => setShowSubscriptionPopup(false)}
                className="flex-1 rounded-lg bg-lime-200 px-5 py-3 text-center font-black text-black transition hover:bg-lime-100"
              >
                View subscription plans
              </Link>
              <button
                type="button"
                autoFocus
                onClick={() => setShowSubscriptionPopup(false)}
                className="rounded-lg border border-white/20 px-5 py-3 font-semibold text-white/80 transition hover:bg-white/5"
              >
                Later
              </button>
            </div>
          </section>
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_25%)]" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Business Dashboard</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{business?.username || "Your business"}</h1>
            <p className="mt-2 text-sm text-white/60">Manage your turfs and bookings</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/business/portal" className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-lime-200">
              Business center
            </Link>
            <Link href="/" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white">
              Home
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/business/login");
              }}
              className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-white/90"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            <p>{error}</p>
            {error.toLowerCase().includes("subscription is required") && (
              <Link href="/business/portal?section=finance" className="mt-3 inline-flex rounded-lg bg-lime-200 px-4 py-2 font-bold text-black hover:bg-lime-100">
                View subscription plans
              </Link>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "My turfs", value: turfs.length },
            { label: "Unapproved", value: turfs.filter((turf) => !turf.approved).length },
            { label: "Bookings", value: bookings.length },
            { label: "Revenue", value: `Rs ${totalRevenue.toLocaleString()}` },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm text-white/60">{card.label}</p>
              <p className="mt-2 text-3xl font-black">{card.value}</p>
            </div>
          ))}
        </div>

        <section className={`rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl ${isCreateFormOpen ? "w-full" : "w-fit max-w-full"}`}>
          <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isCreateFormOpen ? "mb-5" : "mb-0"}`}>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Create turf</p>
              <h2 className="mt-2 text-2xl font-black">Add a new business turf</h2>
            </div>
            <button
              type="button"
              aria-expanded={isCreateFormOpen}
              aria-controls="create-business-turf-form"
              onClick={() => setIsCreateFormOpen((open) => !open)}
              className="rounded-xl border border-lime-300/40 bg-lime-300/10 px-5 py-3 text-sm font-bold text-lime-200 transition hover:bg-lime-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-200"
            >
              {isCreateFormOpen ? "Hide form" : "+ Add turf"}
            </button>
          </div>
          {isCreateFormOpen && <form id="create-business-turf-form" noValidate onSubmit={handleCreateTurf} className="grid gap-4 lg:grid-cols-2">
            {turfFields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-2 block text-sm font-semibold text-white/80">{field.label}</span>
                <input
                  id={field.key}
                  name={field.key}
                  type={field.type || "text"}
                  min={field.min}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => updateTurfField(field.key as keyof typeof form, e.target.value)}
                  aria-invalid={Boolean(turfFieldErrors[field.key])}
                  aria-describedby={turfFieldErrors[field.key] ? `${field.key}-error` : undefined}
                  className={`w-full rounded-xl border bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/40 ${turfFieldErrors[field.key] ? "border-red-400" : "border-white/10"}`}
                  placeholder={field.label}
                />
                {turfFieldErrors[field.key] && <span id={`${field.key}-error`} className="mt-1.5 block text-xs font-medium text-red-300">{turfFieldErrors[field.key]}</span>}
              </label>
            ))}
            <div className="grid gap-5 lg:col-span-2 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80" htmlFor="business-main-image">Main turf image</label>
                <input id="business-main-image" type="file" accept="image/jpeg,image/png,image/webp" required aria-invalid={Boolean(imageError && !mainImage)} aria-describedby={imageError && !mainImage ? "business-image-error" : undefined} onChange={handleMainImageSelect} className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black/40 text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-3 file:font-bold file:text-black hover:file:bg-lime-200" />
                <p className="mt-2 text-xs text-white/45">JPG, PNG, or WebP. Maximum 5 MB.</p>
                {mainImage && <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2"><img src={mainImage.previewUrl} alt="Main turf preview" className="h-16 w-24 rounded-lg object-cover" /><span className="min-w-0 flex-1 truncate text-xs text-white/70">{mainImage.file.name}</span><button type="button" onClick={() => { removePreviewUrl(mainImage.previewUrl); setMainImage(null); }} className="rounded-lg px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-400/10">Remove</button></div>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80" htmlFor="business-thumbnail-images">Gallery images</label>
                <input id="business-thumbnail-images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleThumbnailSelect} className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black/40 text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-3 file:font-bold file:text-black hover:file:bg-lime-200" />
                <p className="mt-2 text-xs text-white/45">Choose up to 9 gallery images (10 total including main), maximum 5 MB each.</p>
                {thumbnailImages.length > 0 && <div className="mt-3 flex flex-wrap gap-3">{thumbnailImages.map((image, index) => <div key={`${image.file.name}-${index}`} className="relative"><img src={image.previewUrl} alt={`Turf gallery preview ${index + 1}`} className="h-16 w-24 rounded-lg object-cover" /><button type="button" aria-label={`Remove ${image.file.name}`} onClick={() => { removePreviewUrl(image.previewUrl); setThumbnailImages((current) => current.filter((_, itemIndex) => itemIndex !== index)); }} className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-black text-white">×</button></div>)}</div>}
              </div>
              {imageError && <p id="business-image-error" role="alert" className="text-sm text-red-300 lg:col-span-2">{imageError}</p>}
            </div>
            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-white/80">Description</span>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={(e) => updateTurfField("description", e.target.value)}
                aria-invalid={Boolean(turfFieldErrors.description)}
                aria-describedby={turfFieldErrors.description ? "description-error" : undefined}
                className={`min-h-32 w-full rounded-xl border bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/40 ${turfFieldErrors.description ? "border-red-400" : "border-white/10"}`}
                placeholder="Describe your turf"
              />
              {turfFieldErrors.description && <span id="description-error" className="mt-1.5 block text-xs font-medium text-red-300">{turfFieldErrors.description}</span>}
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-white/80">Amenities</span>
              <input
                value={form.amenities}
                onChange={(e) => setForm((prev) => ({ ...prev, amenities: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="parking, lights, washroom"
              />
            </label>
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={savingId === "create"}
                className="rounded-xl bg-white px-5 py-3 font-black text-black transition hover:bg-white/90 disabled:opacity-60"
              >
                {savingId === "create" ? "Creating..." : "CREATE TURF"}
              </button>
            </div>
          </form>}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">My turfs</p>
            <h2 className="mt-2 text-2xl font-black">Your venue inventory</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {loading ? (
              <div className="space-y-3" aria-label="Loading turfs">
                {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-white/10" />)}
              </div>
            ) : turfs.length === 0 ? (
              <p className="text-white/60">No turfs added yet.</p>
            ) : (
              turfs.map((turf) => (
                <div key={turf.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{turf.name}</h3>
                      <p className="mt-1 text-sm text-white/60">
                        {turf.city} - {turf.sport}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${turf.approved ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}`}>
                      {turf.approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
                    <div>Weekday: Rs {turf.price}</div>
                    <div>Weekend: Rs {turf.weekendPrice}</div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleEditTurf(turf)}
                      disabled={savingId === turf.id}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-white/90 disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTurf(turf.id)}
                      disabled={savingId === turf.id}
                      className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Bookings</p>
            <h2 className="mt-2 text-2xl font-black">Manage owner bookings</h2>
          </div>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr_0.9fr_auto] lg:items-center">
                  <div>
                    <h3 className="text-lg font-black">{booking.turfName}</h3>
                    <p className="mt-1 text-sm text-white/60">{booking.userName}</p>
                  </div>
                  <div className="text-sm text-white/70">
                    <p>{booking.date}</p>
                    <p>{booking.time}</p>
                  </div>
                  <div className="text-sm text-white/70">
                    <p>Status: {booking.status}</p>
                    <p>Payment: {booking.paymentStatus}</p>
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
                    <button
                      onClick={() => handleBookingUpdate(booking.id)}
                      disabled={savingId === booking.id}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && bookings.length === 0 && (
              <p className="text-white/60">No bookings found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
