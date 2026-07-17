import { Trees, Map, FileText, Users, Activity, Bell } from 'lucide-react';
import { Link } from 'react-router';
import { useAdminStats, usePlaceRequests } from '../../hooks/useAdminData';

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-[16px] border border-[#e5e0d5] p-5 flex items-start gap-4">
      <div
        className="size-10 rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: accent + '1a' }}
      >
        <Icon className="size-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[28px] font-bold text-[#1a1a1a] leading-none">{value}</p>
        <p className="text-[12px] text-[#687588] mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

export function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: requests } = usePlaceRequests();
  const openRequests = (requests ?? []).filter((r) => r.status === 'open');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-[#1a1a1a]">Overview</h1>
        <p className="text-[14px] text-[#687588] mt-1">Trillo admin dashboard</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-[16px] border border-[#e5e0d5] p-5 h-[90px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard label="Total Trails" value={stats?.trails ?? 0} icon={Trees} accent="#2c4a1e" />
          <StatCard label="Parks" value={stats?.parks ?? 0} icon={Map} accent="#065F46" />
          <StatCard label="Total Reports" value={stats?.reports ?? 0} icon={FileText} accent="#b45309" />
          <StatCard label="Active Reports" value={stats?.activeReports ?? 0} icon={Activity} accent="#16a34a" />
          <StatCard label="Registered Users" value={stats?.users ?? 0} icon={Users} accent="#6366f1" />
          <StatCard label="Open Requests" value={openRequests.length} icon={Bell} accent="#ef4444" />
        </div>
      )}

      {openRequests.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-[#1a1a1a]">New place requests</h2>
            <Link to="/admin/requests" className="text-[13px] font-bold text-[#2c4a1e]">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {openRequests.slice(0, 5).map((req) => (
              <Link
                key={req.id}
                to="/admin/requests"
                className="bg-white rounded-[14px] border border-[#e5e0d5] px-4 py-3.5 flex items-center gap-3 hover:border-[#2c4a1e]/40 transition-colors"
              >
                <span className="size-2 rounded-full bg-[#ef4444] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-[#1a1a1a] truncate">{req.name}</p>
                  <p className="text-[12px] text-[#687588] capitalize">{req.kind} request</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
