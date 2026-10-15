import { redirect } from "next/navigation";

// Legacy venue links now lead to the supported turf-only booking catalog.
export default function LegacyVenueBookingPage() {
  redirect("/dashboard/booking/turfs");
}
