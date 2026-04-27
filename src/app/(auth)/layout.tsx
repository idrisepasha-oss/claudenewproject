import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="mb-8">
        <span className="text-lg font-semibold tracking-tight text-white">YourApp</span>
      </div>
      {children}
    </div>
  )
}
