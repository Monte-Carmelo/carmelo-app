import { MeetingSummaryCard } from '@/components/dashboard/MeetingSummaryCard';
import { AttendanceTrend } from '@/components/dashboard/AttendanceTrend';
import { ConversionBanner } from '@/components/dashboard/conversion-banner';
import type { LeaderDashboardData } from '@/lib/dashboard/queries';

interface LeaderDashboardOverviewProps {
  data: LeaderDashboardData;
}

export function LeaderDashboardOverview({ data }: LeaderDashboardOverviewProps) {
  const { groups, upcomingMeetings, metrics } = data;

  const activeMembers = groups.reduce((total, group) => total + group.memberCount, 0);
  const activeVisitors = groups.reduce((total, group) => total + group.visitorCount, 0);
  const nextMeeting = upcomingMeetings[0];

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-text-dark md:text-xl">Resumo do líder</h2>
      <ConversionBanner
        meetingsCurrentMonth={metrics.meetingsCurrentMonth}
        averageAttendance={metrics.averageAttendance}
        conversions30d={metrics.conversions30d}
        conversionRatePct={metrics.conversionRatePct}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MeetingSummaryCard
          lessonTitle={nextMeeting?.lessonTitle}
          gcName={nextMeeting?.gcName}
          datetime={nextMeeting?.datetime}
        />
        <AttendanceTrend
          activeMembers={activeMembers}
          activeVisitors={activeVisitors}
          groupCount={groups.length}
        />
      </div>
    </section>
  );
}
