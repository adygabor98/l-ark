import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAgendaStore } from '../store';
import { EMPLOYEES } from '../mock-data';
import { snapTime, timeToMinutes } from '../utils';
import type { Employee } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../shared/components/dialog';
import Button from '../../../shared/components/button';

// ── Form shape ──────────────────────────────────────────────
interface AppointmentFormValues {
  name: string;
  description: string;
  employeeIds: string[];
  date: string;
  startTime: string;
  endTime: string;
}

const EMPTY_FORM: AppointmentFormValues = {
  name: '',
  description: '',
  employeeIds: [],
  date: '',
  startTime: '09:00',
  endTime: '10:00',
};

// ── Styled form field wrapper ───────────────────────────────
const FormField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, error, children, className }) => (
  <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
    <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest">
      {label}
    </label>
    {children}
    {error && (
      <p className="text-red-400 text-xs font-[Lato-Regular]">{error}</p>
    )}
  </div>
);

const inputClass =
  'w-full py-2 px-3 text-sm font-[Lato-Regular] border border-border/50 bg-secondary/50 rounded-md shadow-sm transition-all focus:outline-none focus:bg-background focus:border-primary/30';

// ── Modal ───────────────────────────────────────────────────
export const AppointmentModal: React.FC = () => {
  const {
    modalOpen,
    selectedAppointment,
    closeModal,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAgendaStore();

  const isEditing =
    selectedAppointment !== null && selectedAppointment.id !== '';

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    defaultValues: EMPTY_FORM,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (modalOpen) {
      if (selectedAppointment) {
        const { id: _id, ...rest } = selectedAppointment;
        reset(rest);
      } else {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        reset({ ...EMPTY_FORM, date: `${y}-${m}-${d}` });
      }
    }
  }, [modalOpen, selectedAppointment, reset]);

  const onSubmit = (data: AppointmentFormValues) => {
    // Validate employees (not a standard Controller field)
    if (data.employeeIds.length === 0) {
      setError('employeeIds', { message: 'Select at least one employee' });
      return;
    }

    const snapped = {
      ...data,
      startTime: snapTime(data.startTime),
      endTime: snapTime(data.endTime),
    };

    if (isEditing) {
      updateAppointment(selectedAppointment!.id, snapped);
    } else {
      addAppointment(snapped);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (isEditing) {
      deleteAppointment(selectedAppointment!.id);
      closeModal();
    }
  };

  return (
    <Dialog
      open={modalOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent className="max-w-md! p-6!">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Appointment' : 'New Appointment'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 mt-2"
        >
          {/* Name */}
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Name is required' }}
            render={({ field }) => (
              <FormField label="Name" error={errors.name?.message}>
                <input
                  {...field}
                  className={inputClass}
                  placeholder="Meeting name"
                  autoFocus
                />
              </FormField>
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <FormField label="Description">
                <textarea
                  {...field}
                  className={`${inputClass} resize-vertical`}
                  placeholder="Optional description..."
                  rows={2}
                />
              </FormField>
            )}
          />

          {/* Date */}
          <Controller
            name="date"
            control={control}
            rules={{ required: 'Date is required' }}
            render={({ field }) => (
              <FormField label="Date" error={errors.date?.message}>
                <input {...field} type="date" className={inputClass} />
              </FormField>
            )}
          />

          {/* Start + End time */}
          <div className="flex gap-3">
            <Controller
              name="startTime"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <FormField
                  label="Start Time"
                  error={errors.startTime?.message}
                  className="flex-1"
                >
                  <input
                    {...field}
                    type="time"
                    step="900"
                    className={inputClass}
                  />
                </FormField>
              )}
            />
            <Controller
              name="endTime"
              control={control}
              rules={{
                required: 'Required',
                validate: (value) => {
                  const start = watch('startTime');
                  if (start && timeToMinutes(value) <= timeToMinutes(start)) {
                    return 'Must be after start';
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormField
                  label="End Time"
                  error={errors.endTime?.message}
                  className="flex-1"
                >
                  <input
                    {...field}
                    type="time"
                    step="900"
                    className={inputClass}
                  />
                </FormField>
              )}
            />
          </div>

          {/* Employees */}
          <Controller
            name="employeeIds"
            control={control}
            render={({ field }) => {
              const selected = field.value as string[];

              const toggle = (empId: string) => {
                const next = selected.includes(empId)
                  ? selected.filter((id) => id !== empId)
                  : [...selected, empId];
                field.onChange(next);
                if (next.length > 0) clearErrors('employeeIds');
              };

              return (
                <FormField
                  label="Employees"
                  error={errors.employeeIds?.message}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {EMPLOYEES.map((emp: Employee) => {
                      const isSelected = selected.includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => toggle(emp.id)}
                          className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5
                            border rounded-full text-xs font-[Lato-Regular]
                            cursor-pointer transition-all duration-150
                            ${
                              isSelected
                                ? 'border-current shadow-sm'
                                : 'border-border/50 bg-secondary/50 hover:border-black/20'
                            }
                          `}
                          style={
                            isSelected
                              ? {
                                  borderColor: emp.color,
                                  backgroundColor: `${emp.color}14`,
                                  color: emp.color,
                                }
                              : undefined
                          }
                        >
                          <span
                            className="w-[7px] h-[7px] rounded-full shrink-0"
                            style={{ background: emp.color }}
                          />
                          {emp.name}
                        </button>
                      );
                    })}
                  </div>
                </FormField>
              );
            }}
          />

          {/* Actions */}
          <DialogFooter className="pt-3 border-t border-border/30 mt-1 gap-2!">
            {isEditing && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                className="mr-auto!"
              >
                Delete
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" htmlType="submit">
              {isEditing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
