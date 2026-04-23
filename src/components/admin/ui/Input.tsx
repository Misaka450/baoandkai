import { InputHTMLAttributes, forwardRef } from 'react'
import { DESIGN_TOKENS } from '../../../constants/styles'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = '', ...props }, ref) => {
    // 统一圆角
    const baseStyles = `w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[${DESIGN_TOKENS.borderRadius.input}] text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:bg-slate-100`

    const iconStyles = icon ? 'pl-11' : ''
    const errorStyles = error ? 'border-red-300 focus:ring-red/20 focus:border-red' : ''

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
              {/* Icon component will be rendered by parent */}
            </div>
          )}
          <input
            ref={ref}
            className={`${baseStyles} ${iconStyles} ${errorStyles} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 ml-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
