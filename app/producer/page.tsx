import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProducerDashboard } from "./ProducerDashboard";

export default async function ProducerPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "producer" || !session.user.producerId) {
    redirect("/producer/login");
  }
  return <ProducerDashboard />;
}
