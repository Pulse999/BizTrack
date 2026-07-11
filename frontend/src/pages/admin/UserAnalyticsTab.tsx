// src/pages/admin/UserAnalyticsTab.tsx
import { useEffect, useState } from "react";
import PieChart from "@/components/PieChart";
import { apiGet } from "@/services/api";

type Props = {
  dateRange: "30" | "7" | "1" | "all";
  setDateRange: (v: "30" | "7" | "1" | "all") => void;
};

const UserAnalyticsTab = ({ dateRange, setDateRange }: Props) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/admin/analytics?date_range=${dateRange}`);
      if (res.success) {
        setAnalytics(res.analyticsLive || res.analytics || null);
      }
    } catch (err) {
      console.error("Analytics load failed", err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  return (
    <div className="space-y-4">
      {/* DATE RANGE SELECTOR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Date range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="border rounded px-2 py-1"
          >
            <option value="30">Last 30 days</option>
            <option value="7">Last 7 days</option>
            <option value="1">Today</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={loading ? "—" : (analytics?.totalUsers ?? 0)}
        />
        <StatCard
          label="Enrolled Users"
          value={loading ? "—" : (analytics?.enrolledUsers ?? 0)}
        />
        <StatCard
          label="Average Score"
          value={loading ? "—" : `${analytics?.averageScore ?? 0}%`}
        />
        <StatCard
          label="Locked Out"
          value={
            loading
              ? "—"
              : (analytics?.courseCompletionBreakdown?.locked_out ?? 0)
          }
        />
      </div>

      {/* PIE CHART */}
      <div className="mt-4 bg-white border rounded p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-3">Course Completion Overview</h3>

        {loading ? (
          <div>Loading...</div>
        ) : analytics ? (
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <PieChart
              data={[
                {
                  label: "Passed",
                  value: analytics.courseCompletionBreakdown?.passed || 0,
                },
                {
                  label: "Failed",
                  value: analytics.courseCompletionBreakdown?.failed || 0,
                },
                {
                  label: "Locked Out",
                  value: analytics.courseCompletionBreakdown?.locked_out || 0,
                },
                {
                  label: "Not Started",
                  value: analytics.courseCompletionBreakdown?.not_started || 0,
                },
              ]}
              size={240}
            />

            <Legend />
          </div>
        ) : (
          <div>No analytics available</div>
        )}
      </div>
    </div>
  );
};

// Small internal stat card component
const StatCard = ({ label, value }: { label: string; value: any }) => (
  <div className="border rounded p-4 bg-white shadow-sm">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const Legend = () => (
  <div className="mt-4 md:mt-0">
    <div className="grid grid-cols-2 gap-2 text-sm">
      <LegendItem color="bg-emerald-500" label="Passed" />
      <LegendItem color="bg-orange-400" label="Failed" />
      <LegendItem color="bg-red-400" label="Locked Out" />
      <LegendItem color="bg-blue-500" label="Not Started" />
    </div>
  </div>
);

const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    <span className={`w-3 h-3 rounded ${color}`} /> {label}
  </div>
);

export default UserAnalyticsTab;
