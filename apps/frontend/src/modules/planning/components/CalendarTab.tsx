import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { useEvents } from '../hooks/useEvents.ts';
import { useUpdateEvent, useDeleteEvent } from '../hooks/useEvents.ts';
import { LoadingScreen } from '../../../components/ui/LoadingScreen.tsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.tsx';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const CalendarTab: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useEvents('agenda');
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const eventMap = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach((event) => {
      const dateKey = event.date.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    return map;
  }, [events]);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const selectedDateStr = selectedDate || '';
  const selectedEvents = eventMap[selectedDateStr] || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const handleToggleStatus = (id: string, status: string) => {
    const nextStatus = status === 'pending' ? 'completed' : 'pending';
    updateEvent.mutate({ id, input: { status: nextStatus } });
  };

  const handleDelete = (id: string) => {
    deleteEvent.mutate(id);
    setDeleteConfirmId(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="lg:w-2/3">
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          {/* Month Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl transition-all cursor-pointer hover:bg-[var(--bg-surface-hover)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
              {MONTHS[month]} {year}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl transition-all cursor-pointer hover:bg-[var(--bg-surface-hover)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-bold uppercase tracking-wide"
                style={{ color: 'var(--text-secondary)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7" style={{ borderTop: '1px solid var(--border-color)' }}>
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[80px] border-r" style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }} />;
              }

              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const dayEvents = eventMap[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className="min-h-[80px] p-1.5 text-left transition-all cursor-pointer"
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    borderRight: '1px solid var(--border-color)',
                    background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                    boxShadow: isSelected ? '0 0 0 2px #8B5CF6 inset' : 'none',
                    zIndex: isSelected ? 1 : 0,
                    position: 'relative' as const,
                  }}
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                      isToday
                        ? 'bg-violet-500 text-white'
                        : ''
                    }`}
                    style={{ color: isToday ? '#FFFFFF' : 'var(--text-primary)' }}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`h-1.5 rounded-full ${
                            event.status === 'completed'
                              ? 'bg-emerald-400'
                              : event.status === 'cancelled'
                              ? 'bg-slate-300 dark:bg-dark-600'
                              : 'bg-violet-400'
                          }`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Events */}
      <div className="lg:w-1/3">
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-sm font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {selectedDate ? formatDate(selectedDate) : 'Selecione um dia'}
          </h3>

          {selectedDate && selectedEvents.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhum evento neste dia.
            </p>
          )}

          {selectedEvents.length > 0 && (
            <div className="flex flex-col gap-2">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    border: '1px solid var(--border-color)',
                    opacity: event.status === 'completed' ? 0.6 : 1,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(event.id, event.status)}
                    className="flex-shrink-0 w-4 h-4 rounded-full border-2 cursor-pointer transition-colors"
                    style={{
                      background: event.status === 'completed' ? '#10B981' : 'transparent',
                      borderColor: event.status === 'completed' ? '#10B981' : 'var(--border-color)',
                    }}
                  />
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate" style={{
                      color: event.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)',
                      textDecoration: event.status === 'completed' ? 'line-through' : 'none',
                    }}>
                      {event.title}
                    </p>
                    {event.time && (
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{event.time}h</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(event.id)}
                    className="p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Excluir evento"
        message="Tem certeza que deseja excluir este evento?"
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
};
