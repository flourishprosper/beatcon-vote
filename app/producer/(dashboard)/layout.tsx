import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProducerNav } from "./ProducerNav";

export default async function ProducerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "producer" || !session.user.producerId) {
    redirect("/producer/login");
  }

  const producer = await prisma.producer.findUnique({
    where: { id: session.user.producerId },
    select: { slug: true },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <ProducerNav
        email={session.user.email ?? ""}
        profileSlug={producer?.slug ?? null}
      />
      {children}
    </div>
  );
}
