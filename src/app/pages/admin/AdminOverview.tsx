import { Trees, Map, FileText, Users, Activity } from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdminData';

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-[#1a1a1a]">Overview</h1>
        <p className="text-[14px] text-[#687588] mt-1">Trillo admin dashboard</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
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
        </div>
      )}
    </div>
  );
}
