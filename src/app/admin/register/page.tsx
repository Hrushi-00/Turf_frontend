import { redirect } from "next/navigation";

export default function AdminRegisterPage() {
  redirect("/auth/login");
}
