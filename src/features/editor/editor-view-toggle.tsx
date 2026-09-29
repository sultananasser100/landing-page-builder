import { cn } from "@/lib/utils";

export type EditorView = "edit" | "preview";

const VIEWS: { value: EditorView; label: string }[] = [
  { value: "edit", label: "Edit" },
  { value: "preview", label: "Preview" },
];

/** Switches between editing and preview below the `lg` breakpoint. */
export function EditorViewToggle({
  view,
  onChange,
}: {
  view: EditorView;
  onChange: (view: EditorView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Editor view"
      className="flex gap-1 border-b bg-background p-2 lg:hidden"
    >
      {VIEWS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            view === value ? "bg-primary text-primary-foreground" : "hover:bg-accent",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
