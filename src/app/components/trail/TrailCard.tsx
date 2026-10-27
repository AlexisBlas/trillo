import { Link } from 'react-router';
import { TrailReportWithDetails } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useLang } from '../../contexts/LangContext';
import { StatusWithHazards } from './StatusWithHazards';

interface TrailCardProps {
  report: TrailReportWithDetails;
}

export function TrailCard({ report }: TrailCardProps) {
  const { t } = useLang();
  const { trails, status, conditions, created_at } = report;

  const surfaceCondition = (conditions || []).find((c) => c.startsWith('surface:'))?.replace('surface:', '');
  const surfaceLabelMap: Record<string, string> = {
    dry: t('surface_dry'),
    damp: t('surface_damp'),
    muddy: t('surface_muddy'),
  };

  const badge = (() => {
    switch (status) {
      case 'green': return { label: t('reports_filter_good'), text: '#63B882' };
      case 'yellow': return { label: t('reports_filter_caution'), text: '#C9A84A' };
      case 'red': return { label: t('reports_filter_closed'), text: '#C97A7A' };
      default: return { label: t('reports_filter_good'), text: '#63B882' };
    }
  })();

  return (
    <Link to={`/trails/${trails.id}`}>
      <div className="bg-[#151C18] rounded-[16px] border-[1.5px] border-[#24302A] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] hover:border-[#63B882] transition-colors">
        <div className="p-[15.5px] flex items-center gap-3.5">
          <StatusWithHazards status={status} reported conditions={conditions} />

          <div className="flex-1 min-w-0">
            <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-[#E6EBE6] truncate mb-0.5">
              {trails.name}
            </h3>
            <p className="text-[13px] text-[#9AA39C] truncate mb-0.5">
              {trails.location || 'Trail location'}
            </p>
            <p className="text-[12px] text-[#8B958C]">
              Updated {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[12px] font-bold" style={{ color: badge.text }}>
              {badge.label}
            </span>
            {surfaceCondition && surfaceLabelMap[surfaceCondition] && (
              <span className="text-[10px] font-bold tracking-[0.5px] text-[#8B958C]">
                {surfaceLabelMap[surfaceCondition]}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
