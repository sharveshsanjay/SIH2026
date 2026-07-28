import { PageTransition } from "@/components/shared/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { TimelineManagement } from "@/components/timeline/TimelineManagement";

export default function TimelinePage() {
  return (
    <PageTransition>
      <PageHeader title="Project Timeline" description="Create, manage, and track project milestones dynamically" />
      <TimelineManagement />
    </PageTransition>
  );
}
