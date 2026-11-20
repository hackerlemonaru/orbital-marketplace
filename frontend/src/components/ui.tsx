import type React from 'react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  Check,
  ChevronDown,
  Command,
  Copy,
  Info,
  Search,
} from 'lucide-react';
import { copyText } from '../lib/format';
import type { HealthState } from '../hooks/useAppState';

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary' | 'quiet' | 'outline';
  size?: 'default' | 'compact';
  icon?: ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  href,
  variant = 'primary',
  size = 'default',
  icon,
  className,
  ...rest
}: ButtonProps) {
  const classes = clsx('button', `button-${variant}`, `button-${size}`, className);
  const content = <>{children}{icon && <span className="button-icon" aria-hidden="true">{icon}</span>}</>;
  if (href) {
    const anchorProps = rest as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return <a href={href} className={classes} {...anchorProps}>{content}</a>;
  }
  return <button type={rest.type || 'button'} className={classes} {...rest}>{content}</button>;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a className="brand" href="#top" aria-label="ORBITAL home">
      <svg className="brand-mark" viewBox="0 0 28 28" aria-hidden="true">
        <rect x="7.2" y="2.7" width="13.6" height="22.6" rx="1.4" transform="rotate(13 14 14)" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9.9 23.2 18.7 4.2" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".62" />
        <path d="M18.7 4.2 20.6 23" fill="none" stroke="#5B9BFF" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {!compact && <span className="brand-word">ORBITAL</span>}
    </a>
  );
}

export function StatusDot({ state, label }: { state: HealthState; label?: string }) {
  const text = state === 'live' ? (label || 'API live') : state === 'checking' ? 'Checking API' : 'Status unavailable';
  return (
    <span className={clsx('status-dot-wrap', `is-${state}`)} aria-live="polite">
      <span className="status-dot" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <span className="kbd"><Command size={12.5} aria-hidden="true" />{children}</span>;
}

export function Checkbox({
  checked,
  onChange,
  label,
  count,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  count?: number;
  disabled?: boolean;
}) {
  return (
    <label className={clsx('custom-check', disabled && 'is-disabled')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="check-box" aria-hidden="true"><Check size={13} /></span>
      <span className="check-label">{label}</span>
      {typeof count === 'number' && <span className="check-count">{count.toLocaleString('en-US')}</span>}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="custom-toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        {description && <div className="toggle-description">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={clsx('custom-toggle', checked && 'is-on')}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  );
}

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="custom-select">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  display: string;
}) {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <label className="custom-slider">
      <span className="slider-head">
        <span>{label}</span>
        <span className="mono slider-value">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--slider-fill': `${percent}%` } as React.CSSProperties}
      />
      <span className="slider-scale" aria-hidden="true"><span>{display}</span><span>max</span></span>
    </label>
  );
}

export function CopyButton({ text, label = 'Copy', compact = false }: { text: string; label?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const onCopy = async () => {
    try {
      await copyText(text);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className={clsx('copy-button', compact && 'is-compact')} onClick={onCopy} aria-live="polite">
      {copied ? <Check size={15} /> : <Copy size={15} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className="info-tip">
      <button type="button" className="info-trigger" aria-describedby={id} aria-label={label}>
        <Info size={14} aria-hidden="true" />
      </button>
      <span className="info-bubble" role="tooltip" id={id}>{children}</span>
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  aside,
  light = false,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  aside?: ReactNode;
  light?: boolean;
}) {
  return (
    <div className={clsx('section-heading', light && 'is-light')}>
      <div className="section-heading-main">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {body && <p>{body}</p>}
      </div>
      {aside && <div className="section-heading-aside">{aside}</div>}
    </div>
  );
}

export function SearchGlyph({ size = 16 }: { size?: number }) {
  return <Search size={size} aria-hidden="true" />;
}
