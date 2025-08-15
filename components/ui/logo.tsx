export function Logo({ 
  className = "",
  textColor = "text-primary-foreground",
  dotColor = "text-primary-foreground/80"
}: { 
  className?: string, 
  textColor?: string, 
  dotColor?: string 
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`text-2xl font-bold ${textColor}`}>
        FMP <span className={dotColor}>•</span> UABC
      </div>
    </div>
  )
}
