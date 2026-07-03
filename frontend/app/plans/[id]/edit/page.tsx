import { PlanEditClient } from '@/components/plan-edit-client';

export default async function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlanEditClient planId={id} />;
}
