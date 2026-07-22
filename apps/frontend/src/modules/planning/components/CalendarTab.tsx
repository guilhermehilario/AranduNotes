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
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl overflow-hidden">
          {/* Month Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-dark-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 text-slate-500 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-xl transition-all cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-dark-100">
              {MONTHS[month]} {year}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 text-slate-500 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-xl transition-all cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 border-t border-slate-100 dark:border-dark-800">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-slate-50 dark:border-dark-800/40" />;
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
                  className={`min-h-[80px] p-1.5 border-b border-r border-slate-50 dark:border-dark-800/40 text-left transition-all cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-950/10 ${
                    isSelected ? 'bg-violet-50 dark:bg-violet-950/20 ring-2 ring-violet-500/30 z-10 relative' : ''
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                      isToday
                        ? 'bg-violet-500 text-white'
                        : 'text-slate-700 dark:text-dark-200'
                    }`}
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
                        <span className="text-[10px] text-slate-400 dark:text-dark-400 font-semibold">
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
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-4">
          <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-dark-100 mb-3">
            {selectedDate ? formatDate(selectedDate) : 'Selecione um dia'}
          </h3>

          {selectedDate && selectedEvents.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-dark-400">
              Nenhum evento neste dia.
            </p>
          )}

          {selectedEvents.length > 0 && (
            <div className="flex flex-col gap-2">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    event.status === 'completed'
                      ? 'border-slate-100 dark:border-dark-800/60 opacity-60'
                      : 'border-slate-100 dark:border-dark-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(event.id, event.status)}
                    className={`flex-shrink-0 w-4 h-4 rounded-full border-2 cursor-pointer transition-colors ${
                      event.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 dark:border-dark-500 hover:border-violet-400'
                    }`}
                  />
                  <div className="flex-grow min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      event.status === 'completed'
                        ? 'text-slate-400 dark:text-dark-400 line-through'
                        : 'text-slate-800 dark:text-dark-100'
                    }`}>
                      {event.title}
                    </p>
                    {event.time && (
                      <p className="text-xs text-slate-400 dark:text-dark-400">{event.time}h</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(event.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
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
