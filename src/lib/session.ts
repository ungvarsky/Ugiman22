import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}
