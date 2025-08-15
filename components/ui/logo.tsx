export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="text-2xl font-bold text-primary-foreground">
        FMP <span className="text-primary-foreground/80">•</span> UABC
      </div>
    </div>
  )
}
