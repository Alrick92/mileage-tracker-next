import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (user?.enabled) redirect("/dashboard");
  if (user) redirect("/pending");
  redirect("/login");
}
