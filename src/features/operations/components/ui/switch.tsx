import * as SwitchPrimitive from "@radix-ui/react-switch";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
}

export function Switch({ checked, onCheckedChange, label, description, id }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-text cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-text-muted leading-snug">{description}</span>
          )}
        </div>
      )}
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 ${checked ? "bg-gradient-to-r from-primary-600 to-primary-500" : "bg-slate-200"}`}
      >
        <SwitchPrimitive.Thumb
          className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}`}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
