import { prisma } from "@/lib/db";

export function slugFromStageName(stageName: string): string {
  return stageName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function ensureUniqueProducerSlug(
  baseSlug: string,
  excludeProducerId?: string
): Promise<string> {
  let slug = baseSlug || "producer";
  let n = 1;
  for (;;) {
    const existing = await prisma.producer.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeProducerId) return slug;
    slug = `${baseSlug}-${++n}`;
  }
}
