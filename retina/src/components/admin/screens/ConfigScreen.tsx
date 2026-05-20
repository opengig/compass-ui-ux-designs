import React from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { MOCK_PARAMS, type SysParam } from '../data/adminMockData';
import { AdminPageHeader, AdminToast } from '../components/AdminPageHeader';

export function ConfigScreen() {
  const [params, setParams] = React.useState<SysParam[]>(MOCK_PARAMS);
  const [toast, setToast] = React.useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const onSave = (key: string, data: { paramValue?: string; description?: string }) => {
    setParams((prev) => prev.map((p) => (p.paramKey === key ? { ...p, ...data } : p)));
    setToast({ message: 'Config updated', variant: 'success' });
  };

  const flags = params.filter((p) => p.paramValue === 'true' || p.paramValue === 'false');
  const others = params.filter((p) => p.paramValue !== 'true' && p.paramValue !== 'false');

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <AdminPageHeader title="Configuration" subtitle="System parameters & feature flags" />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {flags.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            <div className="border-b border-border px-4 py-3">
              <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">
                Feature Flags
              </p>
            </div>
            {flags.map((p) => (
              <ParamRow key={p.paramKey} param={p} onSave={onSave} />
            ))}
          </div>
        )}

        {others.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            <div className="border-b border-border px-4 py-3">
              <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Parameters</p>
            </div>
            {others.map((p) => (
              <ParamRow key={p.paramKey} param={p} onSave={onSave} />
            ))}
          </div>
        )}

        {params.length === 0 && (
          <p className="py-12 text-center text-[13px] text-muted-foreground">No configuration parameters found</p>
        )}
      </div>

      {toast && <AdminToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function ParamRow({
  param,
  onSave,
}: {
  param: SysParam;
  onSave: (key: string, data: { paramValue?: string; description?: string }) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(param.paramValue ?? '');
  const [desc, setDesc] = React.useState(param.description ?? '');

  const isBoolFlag = value === 'true' || value === 'false';

  const cancel = () => {
    setEditing(false);
    setValue(param.paramValue ?? '');
    setDesc(param.description ?? '');
  };
  const save = () => {
    onSave(param.paramKey, { paramValue: value, description: desc });
    setEditing(false);
  };

  return (
    <div className="border-b border-border/60 px-4 py-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11.5px] font-medium text-foreground">{param.paramKey}</p>
          {editing ? (
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Add description…"
              className="mt-1.5 h-7 w-full rounded-md border border-border bg-card px-2 text-[11.5px] text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {param.description || <span className="italic">No description</span>}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {editing ? (
            isBoolFlag ? (
              <button
                onClick={() => setValue(value === 'true' ? 'false' : 'true')}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  value === 'true' ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                aria-pressed={value === 'true'}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    value === 'true' ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            ) : (
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-7 w-28 rounded-md border border-border bg-card px-2 text-right text-[11.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            )
          ) : isBoolFlag ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                value === 'true' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
              }`}
            >
              {value === 'true' ? 'ON' : 'OFF'}
            </span>
          ) : (
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-[11.5px] text-foreground">
              {param.paramValue ?? '—'}
            </span>
          )}

          {editing ? (
            <div className="flex gap-1">
              <button
                onClick={cancel}
                aria-label="Cancel"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:bg-muted/40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={save}
                aria-label="Save"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              aria-label="Edit"
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
