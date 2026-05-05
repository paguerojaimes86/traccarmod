import { useState, useEffect, useRef, type CSSProperties, type FormEvent } from 'react';
import { useCreateCalendar } from '@features/calendars/hooks/useCreateCalendar';
import { useUpdateCalendar } from '@features/calendars/hooks/useUpdateCalendar';
import { IconClose, IconCheck, IconUpload } from '@shared/ui/icons';
import { generateIcsBase64, type RecurrenceFreq } from '@shared/lib/ical';
import type { Calendar } from '@shared/api/types.models';

interface CalendarFormProps {
  open: boolean;
  calendar?: Calendar | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type CalendarMode = 'simple' | 'custom';

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(4px)',
};

const cardStyle: CSSProperties = {
  width: '540px',
  maxWidth: '90vw',
  maxHeight: '85vh',
  overflowY: 'auto',
  borderRadius: '1.25rem',
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
  padding: '2rem',
};

const fieldStyle: CSSProperties = {
  marginBottom: '1rem',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.375rem',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.625rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--border-strong)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: 'var(--font-family-base)',
  boxSizing: 'border-box',
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

const modeBtnStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '0.625rem 1rem',
  borderRadius: '0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 700,
  fontFamily: 'Outfit, system-ui, sans-serif',
  cursor: 'pointer',
  border: active ? '2px solid #6366f1' : '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: active ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.04)',
  color: active ? '#6366f1' : '#64748b',
  transition: 'all 0.2s',
  textAlign: 'center',
});

const dropzoneStyle: CSSProperties = {
  border: '2px dashed rgba(99, 102, 241, 0.3)',
  borderRadius: '0.75rem',
  padding: '2rem 1rem',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: 'rgba(99, 102, 241, 0.03)',
};

const recurrenceOptions = [
  { value: '', label: 'No repetir' },
  { value: 'DAILY', label: 'Diario' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'YEARLY', label: 'Anual' },
];

export function CalendarForm({ open, calendar, onClose, onSuccess }: CalendarFormProps) {
  const createCalendar = useCreateCalendar();
  const updateCalendar = useUpdateCalendar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!calendar?.id;
  const isPending = createCalendar.isPending || updateCalendar.isPending;

  const [mode, setMode] = useState<CalendarMode>('simple');
  const [name, setName] = useState('');
  // Simple mode fields
  const [dtStart, setDtStart] = useState('');
  const [dtEnd, setDtEnd] = useState('');
  const [freq, setFreq] = useState('');
  // Custom mode fields
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');
  const [dragOver, setDragOver] = useState(false);
  // Shared
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (calendar) {
        setName(calendar.name ?? '');
        // If editing, default to custom mode with existing data
        setMode('custom');
        setFileData(calendar.data ?? '');
        setFileName(calendar.data ? 'calendario.ics' : '');
        setDtStart('');
        setDtEnd('');
        setFreq('');
      } else {
        setName('');
        setMode('simple');
        setDtStart('');
        setDtEnd('');
        setFreq('');
        setFileData('');
        setFileName('');
      }
      setErrors({});
    }
  }, [open, calendar]);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.ics') && file.type !== 'text/calendar') {
      setErrors((prev) => ({ ...prev, file: 'Solo se aceptan archivos .ics (iCalendar)' }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFileData(base64);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'El nombre es obligatorio';

    if (mode === 'simple') {
      if (!dtStart) next.dtStart = 'La fecha de inicio es obligatoria';
      if (!dtEnd) next.dtEnd = 'La fecha de fin es obligatoria';
      if (dtStart && dtEnd && new Date(dtEnd) <= new Date(dtStart)) {
        next.dtEnd = 'La fecha de fin debe ser posterior al inicio';
      }
    } else {
      if (!isEdit && !fileData) next.file = 'Debe seleccionar un archivo .ics';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      let data: string;

      if (mode === 'simple') {
        data = generateIcsBase64({
          summary: name.trim(),
          dtStart,
          dtEnd,
          freq: (freq || undefined) as RecurrenceFreq | undefined,
        });
      } else {
        data = fileData || calendar?.data || '';
      }

      if (isEdit) {
        await updateCalendar.mutateAsync({
          id: calendar!.id!,
          name: name.trim(),
          data,
        });
      } else {
        await createCalendar.mutateAsync({ name: name.trim(), data });
      }
      onSuccess?.();
      onClose();
    } catch {}
  };

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isEdit ? 'Editar Calendario' : 'Nuevo Calendario'}
          </h2>
          <button onClick={onClose}
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        {!isEdit && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button type="button" style={modeBtnStyle(mode === 'simple')} onClick={() => setMode('simple')}>
              Simple
            </button>
            <button type="button" style={modeBtnStyle(mode === 'custom')} onClick={() => setMode('custom')}>
              Personalizado
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldStyle}>
            <label htmlFor="cal-name" style={labelStyle}>Nombre *</label>
            <input id="cal-name" type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Ej: Horario laboral, Festivos..."
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.name && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.name}</div>}
          </div>

          {mode === 'simple' ? (
            <>
              <div style={rowStyle}>
                <div style={{ ...fieldStyle, flex: 1 }}>
                  <label htmlFor="cal-dtstart" style={labelStyle}>Desde *</label>
                  <input id="cal-dtstart" type="datetime-local" value={dtStart} onChange={(e) => setDtStart(e.target.value)} style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
                  />
                  {errors.dtStart && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.dtStart}</div>}
                </div>
                <div style={{ ...fieldStyle, flex: 1 }}>
                  <label htmlFor="cal-dtend" style={labelStyle}>Hasta *</label>
                  <input id="cal-dtend" type="datetime-local" value={dtEnd} onChange={(e) => setDtEnd(e.target.value)} style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
                  />
                  {errors.dtEnd && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.dtEnd}</div>}
                </div>
              </div>

              <div style={fieldStyle}>
                <label htmlFor="cal-freq" style={labelStyle}>Recurrente</label>
                <select id="cal-freq" value={freq} onChange={(e) => setFreq(e.target.value)} style={selectStyle}>
                  {recurrenceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div style={fieldStyle}>
              <label style={labelStyle}>Archivo .ics {isEdit ? '(dejar vacío para mantener el actual)' : '*'}</label>

              <input ref={fileInputRef} type="file" accept=".ics,text/calendar" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: 'none' }} />

              {!fileName ? (
                <div style={dragOver ? { ...dropzoneStyle, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.08)' } : dropzoneStyle}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onMouseEnter={(e) => { if (!dragOver) e.currentTarget.style.borderColor = '#6366f1'; }}
                  onMouseLeave={(e) => { if (!dragOver) e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'; }}
                >
                  <IconUpload size={28} color="#6366f1" />
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
                    Arrastrá un <strong style={{ color: '#0f172a' }}>.ics</strong> o hacé clic para seleccionar
                  </div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.6875rem', color: '#94a3b8' }}>
                    Exportado de Google Calendar, Outlook, etc.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Archivo</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>{fileName}</div>
                  </div>
                  <button type="button" onClick={() => { setFileData(''); setFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    style={{ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.06)', color: '#ef4444', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Quitar
                  </button>
                </div>
              )}

              {errors.file && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.file}</div>}
            </div>
          )}

          {(createCalendar.error || updateCalendar.error) && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
              {(createCalendar.error as Error)?.message ?? (updateCalendar.error as Error)?.message ?? 'Error al guardar'}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '0.625rem 1.25rem', borderRadius: '0.875rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-family-base)', cursor: 'pointer', backgroundColor: 'rgba(15, 23, 42, 0.04)', color: '#64748b', border: '1px solid rgba(15, 23, 42, 0.08)' }}
            >
              CANCELAR
            </button>
            <button type="submit" disabled={isPending}
              style={{ padding: '0.625rem 1.25rem', borderRadius: '0.875rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-family-base)', cursor: 'pointer', backgroundColor: '#6366f1', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <IconCheck size={14} />
              {isPending ? 'Guardando...' : 'GUARDAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
