"use client"

import type React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { semesterLabel } from "@/lib/semester"

/**
 * Piezas compartidas de las gráficas del panel.
 *
 * Las series usan un orden fijo de color (nunca rotado) tomado de la paleta
 * institucional y validado para daltonismo: en claro
 * #00723F · #B08208 · #C03A78 · #3A5FC4 — peor par adyacente ΔE 11.1 (CVD) y
 * 20.9 (visión normal), todos ≥ 3:1 contra la superficie. En oscuro se usan
 * los pasos equivalentes para fondo oscuro, y el hueco de 2 px entre segmentos
 * apilados aporta la codificación secundaria que ese modo exige.
 */

export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"]

export const STATUS_SERIES: Record<string, string> = {
  aprobado: "var(--state-approved)",
  en_revision: "var(--state-pending)",
  rechazado: "var(--state-rejected)",
}

const AXIS = {
  stroke: "var(--ink-3)",
  fontSize: 11,
  fontFamily: "var(--font-plex-mono)",
}

export function ChartFrame({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`card-uabc flex flex-col p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}

interface TooltipEntry {
  name?: string
  dataKey?: string | number
  value?: number
  color?: string
}

function SemesterTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const rows = payload.filter((entry) => (entry.value ?? 0) !== 0)
  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0)

  return (
    <div className="rounded-md border border-border bg-popover p-2.5 shadow-[var(--shadow-md)]">
      <p className="font-data text-xs font-semibold text-ink">
        {label}
        {label && (
          <span className="ml-1.5 font-sans font-normal text-muted-foreground">
            {semesterLabel(label)}
          </span>
        )}
      </p>
      <ul className="mt-1.5 space-y-1">
        {rows.length === 0 ? (
          <li className="text-xs text-muted-foreground">Sin eventos</li>
        ) : (
          rows.map((entry) => (
            <li key={String(entry.dataKey)} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ background: entry.color }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-data ml-auto font-medium text-ink">{entry.value}</span>
            </li>
          ))
        )}
      </ul>
      {rows.length > 1 && (
        <p className="mt-1.5 flex items-center gap-2 border-t border-border pt-1.5 text-xs">
          <span className="text-muted-foreground">Total</span>
          <span className="font-data ml-auto font-semibold text-ink">{total}</span>
        </p>
      )}
    </div>
  )
}

const legendLabel = (value: string) => (
  <span className="text-xs text-muted-foreground">{value}</span>
)

/**
 * Recharts identifica ejes, leyenda y rejilla por el tipo del hijo directo:
 * envolverlos en otro componente o en un fragmento hace que los ignore en
 * silencio. Por eso van escritos aquí tal cual, aunque se repitan.
 */

/** Barras apiladas por ciclo escolar. El hueco de 2 px separa cada segmento. */
export function StackedSemesterBars({
  data,
  keys,
  colors,
  height = 260,
}: {
  data: Array<Record<string, string | number>>
  keys: string[]
  colors: string[]
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="26%">
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="semester" tickLine={false} axisLine={false} tickMargin={8} tick={AXIS} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={6} width={32} tick={AXIS} />
        <Tooltip content={<SemesterTooltip />} cursor={{ fill: "var(--chart-grid)", opacity: 0.5 }} />
        <Legend
          verticalAlign="bottom"
          height={30}
          iconType="square"
          iconSize={9}
          formatter={legendLabel}
        />
        {keys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            name={key}
            stackId="a"
            fill={colors[i]}
            stroke="var(--chart-surface)"
            strokeWidth={2}
            radius={i === keys.length - 1 ? [4, 4, 0, 0] : undefined}
            maxBarSize={64}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Curva de eventos por ciclo escolar. */
export function SemesterCurve({
  data,
  height = 300,
}: {
  data: Array<Record<string, string | number>>
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="semester" tickLine={false} axisLine={false} tickMargin={8} tick={AXIS} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={6} width={32} tick={AXIS} />
        <Tooltip content={<SemesterTooltip />} cursor={{ stroke: "var(--ink-3)", strokeWidth: 1 }} />
        <Legend
          verticalAlign="bottom"
          height={30}
          iconType="plainline"
          iconSize={14}
          formatter={legendLabel}
        />
        <Line
          type="monotone"
          dataKey="Registrados"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--chart-surface)" }}
        />
        <Line
          type="monotone"
          dataKey="Aprobados"
          stroke="var(--series-4)"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={{ r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--chart-surface)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
