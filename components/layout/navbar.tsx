"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Logo } from "@/components/ui/logo"
import { ProcessGuideDialog } from "@/components/workflow/process-guide"
import { LogOut, Shield, User, HelpCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthUser, signOut } from "@/lib/supabase-auth"
import type { AuthUser } from "@/lib/supabase-auth"
import { cn } from "@/lib/utils"

interface NavbarProps {
  showAdminToggle?: boolean
}

interface NavLink {
  href: string
  label: string
}

const USER_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Mis eventos" },
  { href: "/events/new", label: "Registrar evento" },
]

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin/review", label: "Revisión" },
  { href: "/admin/analytics", label: "Analíticas" },
]

export function Navbar({ showAdminToggle = false }: NavbarProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const isAdminArea = pathname?.startsWith("/admin") ?? false

  useEffect(() => {
    let mounted = true
    getAuthUser().then((authUser) => {
      if (mounted) setUser(authUser)
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Sesión cerrada",
        description: "Cerraste sesión correctamente.",
      })
      router.push("/login")
    } catch {
      toast({
        title: "No se pudo cerrar la sesión",
        description: "Vuelve a intentarlo en un momento.",
        variant: "destructive",
      })
    }
  }

  const toggleAdminMode = () => {
    router.push(isAdminArea ? "/dashboard" : "/admin/review")
  }

  if (!user) return null

  const links = isAdminArea ? ADMIN_LINKS : USER_LINKS
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <nav className="no-print sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href={isAdminArea ? "/admin/review" : "/dashboard"}
          className="shrink-0 rounded-sm py-3"
        >
          <Logo />
        </Link>

        <div className="hidden h-12 items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname?.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/12 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                {link.label}
                {active && (
                  <span
                    className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-[var(--uabc-ocre)]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {!isAdminArea && (
            <ProcessGuideDialog
              open={guideOpen}
              onOpenChange={setGuideOpen}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <HelpCircle className="h-4 w-4 sm:mr-1.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Guía del proceso</span>
                  <span className="sr-only sm:hidden">Guía del proceso</span>
                </Button>
              }
            />
          )}

          {showAdminToggle && user.role === "admin" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAdminMode}
              className="text-white/90 hover:bg-white/10 hover:text-white"
            >
              <Shield className="h-4 w-4 sm:mr-1.5" aria-hidden="true" />
              <span className="hidden sm:inline">
                {isAdminArea ? "Vista de usuario" : "Vista de administración"}
              </span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0 hover:bg-white/10"
                aria-label="Menú de la cuenta"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium text-ink">{user.name}</p>
                <p className="font-data mt-0.5 truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-[0.6875rem] font-medium text-muted-foreground">
                  {user.role === "admin" ? (
                    <Shield className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <User className="h-3 w-3" aria-hidden="true" />
                  )}
                  {user.role === "admin" ? "Administración" : "Organizador"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Enlaces de navegación en pantallas angostas. */}
      <div className="flex gap-1 overflow-x-auto border-t border-white/15 px-4 pb-2 pt-1.5 md:hidden">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname?.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10",
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
