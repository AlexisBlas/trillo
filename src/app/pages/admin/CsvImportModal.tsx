import { useState, useRef, useCallback } from 'react';
import { X, Upload, ChevronRight, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../components/ui/utils';

// ─── CSV parser (handles quoted fields with commas/newlines inside) ───────────
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      if (cur.trim()) lines.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) lines.push(cur);

  const splitRow = (line: string) => {
    const cells: string[] = [];
    let cell = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cell += '"'; i++; }
        else q = !q;
      } else if (ch === ',' && !q) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitRow(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cells = splitRow(l);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  });
  return { headers, rows };
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'upload' | 'map' | 'preview' | 'result';

interface Mapping {
  name: string;
  location: string;
  qr_code: string;
}

interface ImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ColumnSelect({
  label,
  required,
  headers,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  headers: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-[#9AA39C] mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#24302A] rounded-[10px] px-3 h-9 text-[13px] text-[#9AA39C] bg-[#151C18] focus:outline-none"
      >
        <option value="">— skip —</option>
        {headers.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export function CsvImportModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Mapping>({ name: '', location: '', qr_code: '' });
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const setMap = (key: keyof Mapping) => (v: string) => setMapping((m) => ({ ...m, [key]: v }));

  const loadFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please upload a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsv(text);
      setHeaders(headers);
      setRows(rows);
      // Auto-map obvious column names
      const find = (...candidates: string[]) =>
        headers.find((h) => candidates.some((c) => h.toLowerCase().includes(c))) ?? '';
      setMapping({
        name: find('title', 'name', 'trail'),
        location: find('region', 'area', 'location', 'park', 'forest'),
        qr_code: find('qr', 'code', 'slug', 'id'),
      });
      setStep('map');
    };
    reader.readAsText(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const previewRows = rows.slice(0, 5);

  const mappedRows = rows
    .map((r) => ({
      name: mapping.name ? r[mapping.name]?.trim() : '',
      location: mapping.location ? r[mapping.location]?.trim() || null : null,
      description: null as string | null,
      qr_code: mapping.qr_code ? r[mapping.qr_code]?.trim() || null : null,
    }))
    .filter((r) => r.name);

  const handleImport = async () => {
    setImporting(true);
    const errors: string[] = [];
    let inserted = 0;
    let skipped = 0;

    // Batch insert in chunks of 50
    const CHUNK = 50;
    for (let i = 0; i < mappedRows.length; i += CHUNK) {
      const chunk = mappedRows.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from('trails')
        .upsert(chunk, { onConflict: 'name', ignoreDuplicates: true })
        .select('id');
      if (error) {
        errors.push(error.message);
      } else {
        inserted += data?.length ?? 0;
        skipped += chunk.length - (data?.length ?? 0);
      }
    }

    qc.invalidateQueries({ queryKey: ['admin-trails'] });
    qc.invalidateQueries({ queryKey: ['trails'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
    setResult({ inserted, skipped, errors });
    setImporting(false);
    setStep('result');
  };

  const stepLabels: Record<Step, string> = {
    upload: 'Upload CSV',
    map: 'Map Columns',
    preview: 'Preview',
    result: 'Done',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-[#151C18] rounded-[20px] w-full max-w-xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#24302A] shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-[#F2F5F2]">Import from CSV</h2>
            <p className="text-[12px] text-[#8B958C] mt-0.5">{stepLabels[step]}</p>
          </div>
          <button onClick={onClose} className="size-7 flex items-center justify-center rounded-full hover:bg-[#24302A]">
            <X className="size-4 text-[#8B958C]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step: upload */}
          {step === 'upload' && (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-[16px] p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors',
                  dragOver ? 'border-[#5EE08A] bg-[#24302A]' : 'border-[#24302A] hover:border-[#5EE08A] hover:bg-[#1A221C]'
                )}
              >
                <div className="size-12 rounded-full bg-[#24302A] flex items-center justify-center">
                  <Upload className="size-5 text-[#5EE08A]" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-[#F2F5F2]">Drop your CSV here</p>
                  <p className="text-[12px] text-[#8B958C] mt-1">or click to browse</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
              </div>
              <div className="mt-5 bg-[#1A221C] rounded-[12px] border border-[#24302A] p-4">
                <p className="text-[12px] font-bold text-[#9AA39C] mb-2 flex items-center gap-1.5">
                  <FileText className="size-3.5" /> Trailforks export tip
                </p>
                <p className="text-[12px] text-[#8B958C] leading-relaxed">
                  On any Trailforks region page, scroll to the trail list and use the export button (CSV).
                  You'll get columns like <strong>Title</strong> and <strong>Region</strong> — Trillo will auto-map these.
                </p>
              </div>
            </div>
          )}

          {/* Step: map */}
          {step === 'map' && (
            <div>
              <p className="text-[13px] text-[#8B958C] mb-4">
                {rows.length} rows found. Map your CSV columns to Trillo trail fields.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ColumnSelect label="Trail Name" required headers={headers} value={mapping.name} onChange={setMap('name')} />
                <ColumnSelect label="Park / Location" headers={headers} value={mapping.location} onChange={setMap('location')} />
                <ColumnSelect label="QR Code" headers={headers} value={mapping.qr_code} onChange={setMap('qr_code')} />
              </div>
              <p className="text-[11px] text-[#8B958C] mt-4">
                {mappedRows.length} trails will be imported ({rows.length - mappedRows.length} rows skipped — missing name).
              </p>
            </div>
          )}

          {/* Step: preview */}
          {step === 'preview' && (
            <div>
              <p className="text-[13px] text-[#8B958C] mb-3">
                Showing first {previewRows.length} of {mappedRows.length} trails. Existing trails with the same name will be skipped.
              </p>
              <div className="rounded-[12px] border border-[#24302A] overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr] px-4 py-2.5 bg-[#1A221C] border-b border-[#24302A]">
                  <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C]">Name</p>
                  <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C]">Park</p>
                </div>
                {previewRows.map((r, i) => {
                  const row = mappedRows[i];
                  return (
                    <div key={i} className={cn('grid grid-cols-[1fr_1fr] px-4 py-2.5', i < previewRows.length - 1 && 'border-b border-[#24302A]')}>
                      <p className="text-[13px] font-medium text-[#F2F5F2] truncate pr-3">{row?.name || '—'}</p>
                      <p className="text-[13px] text-[#8B958C] truncate">{row?.location || '—'}</p>
                    </div>
                  );
                })}
              </div>
              {mappedRows.length > 5 && (
                <p className="text-[11px] text-[#8B958C] mt-2 text-center">…and {mappedRows.length - 5} more</p>
              )}
            </div>
          )}

          {/* Step: result */}
          {step === 'result' && result && (
            <div className="text-center py-4">
              <div className={cn('size-14 rounded-full flex items-center justify-center mx-auto mb-4', result.errors.length ? 'bg-amber-50' : 'bg-green-50')}>
                {result.errors.length
                  ? <AlertCircle className="size-7 text-amber-500" />
                  : <CheckCircle className="size-7 text-green-500" />}
              </div>
              <p className="text-[18px] font-bold text-[#F2F5F2]">
                {result.inserted} trail{result.inserted !== 1 ? 's' : ''} imported
              </p>
              {result.skipped > 0 && (
                <p className="text-[13px] text-[#8B958C] mt-1">{result.skipped} skipped (already exist)</p>
              )}
              {result.errors.length > 0 && (
                <div className="mt-3 text-left bg-red-50 rounded-[10px] p-3">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-[11px] text-red-600">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-4 border-t border-[#24302A] flex gap-2 shrink-0">
          {step === 'map' && (
            <>
              <button onClick={() => setStep('upload')} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
                Back
              </button>
              <button
                onClick={() => setStep('preview')}
                disabled={!mapping.name}
                className="flex-1 h-10 rounded-[10px] bg-[#5EE08A] text-[#0E1510] text-[13px] font-bold hover:bg-[#4ADE80] disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                Preview <ChevronRight className="size-4" />
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('map')} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 h-10 rounded-[10px] bg-[#5EE08A] text-[#0E1510] text-[13px] font-bold hover:bg-[#4ADE80] disabled:opacity-50"
              >
                {importing ? 'Importing…' : `Import ${mappedRows.length} trails`}
              </button>
            </>
          )}
          {step === 'result' && (
            <button onClick={onClose} className="flex-1 h-10 rounded-[10px] bg-[#5EE08A] text-[#0E1510] text-[13px] font-bold hover:bg-[#4ADE80]">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
