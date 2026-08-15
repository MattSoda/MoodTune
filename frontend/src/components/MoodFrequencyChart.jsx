import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatMood(value) {
  const words = String(value || 'Unknown').replace(/[_-]+/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function MoodTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="pointer-events-none rounded-xl border border-white/10 bg-[#111015]/95 px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,.55)]">
      <p className="text-xs font-medium capitalize text-zinc-300">{formatMood(label)}</p>
      <p className="mt-0.5 text-sm font-bold text-lavender-200">{payload[0].value} check-ins</p>
    </div>
  )
}

export default function MoodFrequencyChart({ moodFrequency, totalCheckIns }) {
  const chartHeight = Math.max(220, moodFrequency.length * 54 + 44)

  return (
    <div className="mt-5">
      <div className="flex items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Total check-ins</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-white">{totalCheckIns}</p>
        </div>
        {moodFrequency.length > 0 && <p className="text-right text-xs text-zinc-500">All recommendation requests</p>}
      </div>

      {moodFrequency.length === 0 ? (
        <p className="empty-state mt-5">No mood check-ins yet. Request recommendations to start building your insights.</p>
      ) : (
        <div
          aria-label={`Mood frequency chart with ${totalCheckIns} total check-ins`}
          className="relative mt-5 min-w-0 select-none overflow-hidden rounded-2xl border border-white/[0.06] bg-[radial-gradient(circle_at_100%_0%,rgba(139,92,246,.12),transparent_40%),linear-gradient(160deg,rgba(255,255,255,.025),rgba(0,0,0,.18))] px-1 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] sm:px-3"
          data-testid="mood-frequency-chart"
          role="img"
          style={{ height: chartHeight }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 480, height: chartHeight }}
            minWidth={0}
          >
            <BarChart
              accessibilityLayer
              data={moodFrequency}
              layout="vertical"
              margin={{ top: 4, right: 42, bottom: 10, left: 0 }}
            >
              <defs>
                <linearGradient id="mood-bar-gradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#6d4bd1" />
                  <stop offset="52%" stopColor="#9f7aea" />
                  <stop offset="100%" stopColor="#d8b4fe" />
                </linearGradient>
                <filter id="mood-bar-glow" x="-15%" y="-80%" width="140%" height="260%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8b5cf6" floodOpacity="0.2" />
                </filter>
              </defs>
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.07)" />
              <XAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={false}
                type="number"
              />
              <YAxis
                axisLine={false}
                dataKey="mood"
                tick={{ fill: '#d4d4d8', fontSize: 12 }}
                tickFormatter={formatMood}
                tickLine={false}
                type="category"
                width={82}
              />
              <Tooltip content={<MoodTooltip />} cursor={false} wrapperStyle={{ outline: 'none' }} />
              <Bar
                activeBar={false}
                background={{ fill: 'rgba(255,255,255,.035)', radius: 9 }}
                dataKey="count"
                fill="url(#mood-bar-gradient)"
                filter="url(#mood-bar-glow)"
                isAnimationActive={false}
                radius={[0, 9, 9, 0]}
              >
                <LabelList dataKey="count" fill="#e4e4e7" fontSize={12} fontWeight={700} position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ul className="sr-only">
            {moodFrequency.map(({ mood, count }) => (
              <li key={mood}>{formatMood(mood)}: {count} check-ins</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
