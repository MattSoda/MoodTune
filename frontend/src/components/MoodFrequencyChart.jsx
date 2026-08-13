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
  const words = value.replace(/[_-]+/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function MoodTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-lavender-300/20 bg-zinc-950/95 px-3 py-2 shadow-xl">
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
          <p className="mt-1 text-3xl font-bold tracking-tight text-lavender-200">{totalCheckIns}</p>
        </div>
        {moodFrequency.length > 0 && <p className="text-right text-xs text-zinc-500">All recommendation requests</p>}
      </div>

      {moodFrequency.length === 0 ? (
        <p className="empty-state mt-5">No mood check-ins yet. Request recommendations to start building your insights.</p>
      ) : (
        <div
          aria-label={`Mood frequency chart with ${totalCheckIns} total check-ins`}
          className="mt-5 min-w-0 overflow-hidden rounded-xl bg-black/20 px-1 py-3 sm:px-3"
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
              <Tooltip content={<MoodTooltip />} cursor={{ fill: 'rgba(167,139,250,0.06)' }} />
              <Bar dataKey="count" fill="#8b5cf6" isAnimationActive={false} radius={[0, 7, 7, 0]}>
                <LabelList dataKey="count" fill="#ddd6fe" fontSize={12} fontWeight={700} position="right" />
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
