import { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      className={`cursor-pointer rounded-md border-0 bg-sky-600 px-4 py-2 text-white ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  )
}
