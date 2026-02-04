import { ReceiptDetailClient } from "./ReceiptDetailClient";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReceiptDetailClient receiptId={id} />;
}
