// ════════════════════════════════════════════════════════════════════════════
// MODERN PROFESSIONAL UI COMPONENTS FOR AGROVAULT
// Built with modern design principles: spacing, hierarchy, accessibility
// ════════════════════════════════════════════════════════════════════════════

import { AlertCircle, CheckCircle, ChevronDown, X, Loader2 } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// LOADING SPINNER
// ════════════════════════════════════════════════════════════════════════════
export function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="relative w-16 h-16">
        <Loader2 className="w-full h-full text-blue-600 animate-spin" strokeWidth={1.5} />
      </div>
      <p className="mt-6 text-neutral-600 font-medium text-center text-lg">{label}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ALERTS
// ════════════════════════════════════════════════════════════════════════════
export function ErrorAlert({ message, onClose, title = "Error" }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-4">
      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-red-900 mb-1">{title}</h3>
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 hover:bg-red-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export function SuccessAlert({ message, onClose, title = "Success" }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-4">
      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-green-900 mb-1">{title}</h3>
        <p className="text-sm text-green-700">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-green-500 hover:text-green-700 flex-shrink-0 p-1 hover:bg-green-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export function InfoAlert({ message, title = "Information" }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-4">
      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">{title}</h3>
        <p className="text-sm text-blue-700">{message}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FORM INPUTS
// ════════════════════════════════════════════════════════════════════════════
export function TextInput({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  type = "text",
  disabled = false,
  hint,
  icon: Icon,
}) {
  return (
    <div className="mb-6">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-neutral-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {hint && <span className="text-xs text-neutral-500">{hint}</span>}
        </div>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`w-full px-4 py-3 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2 ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
              : 'border-neutral-200 bg-white focus:ring-blue-200 focus:border-blue-400'
          } ${disabled ? 'bg-neutral-50 cursor-not-allowed text-neutral-500' : ''}`}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  );
}

export function NumberInput({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  min = 0,
  step = 1,
  hint,
  icon: Icon,
}) {
  return (
    <div className="mb-6">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-neutral-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {hint && <span className="text-xs text-neutral-500">{hint}</span>}
        </div>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <input
          type="number"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          min={min}
          step={step}
          className={`w-full px-4 py-3 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2 ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
              : 'border-neutral-200 bg-white focus:ring-blue-200 focus:border-blue-400'
          } ${disabled ? 'bg-neutral-50 cursor-not-allowed text-neutral-500' : ''}`}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  );
}

export function Select({
  label,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder = "Select an option",
  hint,
  icon: Icon,
}) {
  return (
    <div className="mb-6">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-neutral-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {hint && <span className="text-xs text-neutral-500">{hint}</span>}
        </div>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <select
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`w-full px-4 py-3 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
              : 'border-neutral-200 bg-white focus:ring-blue-200 focus:border-blue-400'
          } ${disabled ? 'bg-neutral-50 cursor-not-allowed text-neutral-500' : ''}`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value || opt.id} value={opt.value || opt.id}>
              {opt.label || opt.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none"
          strokeWidth={2}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BUTTONS
// ════════════════════════════════════════════════════════════════════════════
export function BigButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  fullWidth = false,
  icon: Icon,
}) {
  const baseClass = "inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-base";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg",
    secondary: "bg-neutral-200 hover:bg-neutral-300 text-neutral-900 shadow-sm",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg",
    ghost: "bg-transparent hover:bg-neutral-100 text-neutral-900 border border-neutral-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClass} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {Icon && !loading && <Icon size={18} strokeWidth={2} />}
      {children}
    </button>
  );
}

export function SmallButton({
  children,
  onClick,
  disabled = false,
  variant = "secondary",
  icon: Icon,
}) {
  const baseClass = "inline-flex items-center justify-center gap-1.5 px-4 py-2 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-neutral-200 hover:bg-neutral-300 text-neutral-900",
    danger: "bg-red-100 hover:bg-red-200 text-red-700",
    ghost: "hover:bg-neutral-100 text-neutral-900",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variants[variant]}`}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CARDS & DISPLAY
// ════════════════════════════════════════════════════════════════════════════
export function Card({ children, className = "", hover = true }) {
  return (
    <div className={`card p-6 ${hover ? 'hover:shadow-lg' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function InfoCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "blue",
  action,
}) {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
    red: "bg-red-50 border-red-200 text-red-600",
  };

  return (
    <Card className={`border-2 ${colorMap[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600`}>
          {Icon && <Icon size={24} strokeWidth={2} />}
        </div>
        {action && <div>{action}</div>}
      </div>
      <p className="text-neutral-600 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-neutral-900 mb-1">{value}</h3>
      {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
    </Card>
  );
}

export function ListItem({
  title,
  description,
  icon: Icon,
  action,
  onClick,
  highlight = false,
  status,
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-4 border rounded-lg transition-all cursor-pointer ${
        highlight
          ? 'bg-blue-50 border-blue-200 hover:border-blue-300'
          : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {Icon && (
          <div className="text-neutral-400 flex-shrink-0">
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 text-sm truncate">{title}</p>
          {description && <p className="text-xs text-neutral-500 mt-1 truncate">{description}</p>}
        </div>
      </div>
      {status && <div className="ml-4 flex-shrink-0">{status}</div>}
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title = "No data",
  description = "Get started by adding your first item",
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="mb-4 p-4 bg-neutral-100 rounded-full text-neutral-400">
          <Icon size={32} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-xs mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════════════════════════════════════
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-8 py-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-neutral-600"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-8 py-4 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE HEADER
// ════════════════════════════════════════════════════════════════════════════
export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
  stats,
}) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Icon size={28} strokeWidth={2} />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
            {description && (
              <p className="text-neutral-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="text-center">
              <p className="text-neutral-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
              {stat.change && (
                <p className={`text-xs mt-2 ${
                  stat.change.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change.positive ? '↑' : '↓'} {stat.change.text}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DATA TABLE
// ════════════════════════════════════════════════════════════════════════════
export function DataTable({
  columns,
  data,
  onRowClick,
  loading,
  empty,
}) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={empty?.title} description={empty?.description} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-neutral-900">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
