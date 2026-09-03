import { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function Button({ children, ...props }: ButtonProps) {
  return (
    <button
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: 'none',
        backgroundColor: '#0284c7',
        color: '#ffffff',
        cursor: 'pointer',
      }}
      {...props}
    >
      {children}
    </button>
  )
}
