import { Link } from 'react-router';
import { Mountain, Snowflake, Droplet } from 'lucide-react';
import { TrailReportWithDetails } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useLang } from '../../contexts/LangContext';

interface TrailCardProps {
  report: TrailReportWithDetails;
}

const getTrailIcon = (status: string, conditions?: string[] | null) => {
  if (conditions?.includes('snow')) {
    return { Icon: Snowflake, color: '#2563eb', bg: '#2563eb' };
  }
  if (conditions?.includes('muddy') || conditions?.includes('wet')) {
    return { Icon: Droplet, color: '#8b6914', bg: '#8b6914' };
  }
  return { Icon: Mountain, color: 'white', bg: '#3a6b35' };
};

export function TrailCard({ report }: TrailCardProps) {
  const { t } = useLang();
  const { trails, status, conditions, created_at } = report;
  const { Icon, bg: iconBg } = getTrailIcon(status, conditions);

  const surfaceCondition = (conditions || []).find((c) => c.startsWith('surface:'))?.replace('surface:', '');
  const surfaceLabelMap: Record<string, string> = {
    dry: t('surface_dry'),
    damp: t('surface_damp'),
    muddy: t('surface_muddy'),
  };

  const badge = (() => {
    switch (status) {
      case 'green': return { label: t('reports_filter_good'), bg: '#d1fae5', text: '#065f46' };
      case 'yellow': return { label: t('reports_filter_caution'), bg: '#fef3c7', text: '#92400e' };
      case 'red': return { label: t('reports_filter_closed'), bg: '#fee2e2', text: '#991b1b' };
      default: return { label: t('reports_filter_good'), bg: '#d1fae5', text: '#065f46' };
    }
  })();

  return (
    <Link to={`/trails/${trails.id}`}>
      <div className="bg-white rounded-[16px] border-[1.5px] border-[#f0ede6] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] hover:border-[#2c4a1e] transition-colors">
        <div className="p-[15.5px] flex items-center gap-3.5">
          {/* Trail Icon */}
          <div
            className="size-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            <Icon className="size-6 text-white opacity-85" />
          </div>

          {/* Trail Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-[#1a1a1a] truncate mb-0.5">
              {trails.name}
            </h3>
            <p className="text-[13px] text-[#374151] truncate mb-0.5">
              {trails.location || 'Trail location'}
            </p>
            <p className="text-[12px] text-[#4b5563]">
              Updated {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </p>
          </div>

          {/* Status + surface badges */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div
              className="h-6 px-2.5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: badge.bg }}
            >
              <span className="text-[11px] font-bold tracking-[0.8px]" style={{ color: badge.text }}>
                {badge.label.toUpperCase()}
              </span>
            </div>
            {surfaceCondition && surfaceLabelMap[surfaceCondition] && (
              <div className="h-5 px-2 rounded-full flex items-center justify-center bg-[#f0ede6]">
                <span className="text-[10px] font-bold tracking-[0.5px] text-[#687588]">
                  {surfaceLabelMap[surfaceCondition].toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
