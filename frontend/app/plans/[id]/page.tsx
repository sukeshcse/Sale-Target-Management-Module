import { PlanDetailClient } from '@/components/plan-detail-client';

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlanDetailClient planId={id} />;
}
