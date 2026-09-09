import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" && "bg-forest text-white hover:bg-forest-deep",
    variant === "secondary" && "border border-line bg-white text-charcoal hover:bg-cream",
    variant === "ghost" && "text-soft hover:bg-sage-soft hover:text-charcoal",
    variant === "gold" && "bg-gold text-charcoal hover:bg-gold-soft",
    variant === "danger" && "bg-red-50 text-red-700 hover:bg-red-100",
    size === "sm" && "h-8 px-3 text-xs",
    size === "md" && "h-10 px-4 text-sm",
    size === "lg" && "h-12 px-6 text-sm",
    size === "icon" && "h-10 w-10 p-0",
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, className })}>
      {children}
    </Link>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-soft">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-soft">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-charcoal placeholder:text-soft/70 transition-colors hover:border-[#d4d0c8] focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-charcoal placeholder:text-soft/70 transition-colors hover:border-[#d4d0c8] focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
