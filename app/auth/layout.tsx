// app/auth/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
                <rect x="10" y="2" width="6" height="6" rx="1" fill="white" opacity="0.6"/>
                <rect x="2" y="10" width="6" height="6" rx="1" fill="white" opacity="0.6"/>
                <rect x="10" y="10" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-slate-900">Optikx</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
