import { useState, useEffect } from 'react'
import {
  ComposedChart, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import { getRevenueTrend, getOccupancyByHour, getLocationStats, getDashboardStats } from '../../api/api'
import { formatPaise } from '../../components/common/StatusBadge'

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card" style={{ padding: '10px 14px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
      <div className="text-xs text-muted mb-4">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-8" style={{ marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span className="text-xs text-secondary">{p.name}:</span>
          <span className="text-sm font-semibold">{formatter ? formatter(p.value, p.name) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="stat-card">
      <div className="font-display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1.5px', color }}>
        {value}
      </div>
      <div className="text-sm font-semibold text-secondary mt-4">{label}</div>
      {sub && <div className="text-xs text-muted mt-2">{sub}</div>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState([])
  const [occupancy, setOccupancy] = useState([])
  const [locationStats, setLocationStats] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const load = async () => {
    setLoading(true)
    try {
      const [r, o, ls, s] = await Promise.all([
        getRevenueTrend(days),
        getOccupancyByHour(),
        getLocationStats(),
        getDashboardStats(),
      ])
      setRevenue(r)
      setOccupancy(o)
      setLocationStats(ls)
      setStats(s)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [days])

  const totalRevenue = revenue.reduce((acc, r) => acc + r.revenue, 0)
  const totalBookings = revenue.reduce((acc, r) => acc + r.bookings, 0)
  const avgPerBooking = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0
  const peakHour = occupancy.length > 0
    ? occupancy.reduce((a, b) => a.occupancy_rate > b.occupancy_rate ? a : b)
    : null

  const radialData = locationStats.map((ls) => ({
    name: ls.name,
    occupancy: ls.occupancy_rate,
    fill: ls.occupancy_rate > 80 ? '#ef4444' : ls.occupancy_rate > 50 ? '#f59e0b' : '#10b981',
  }))

  if (loading && !stats) {
    return (
      <div>
        <div className="grid-4 mb-24">
          {[1,2,3,4].map(i => <div key={i} className="stat-card"><div className="skeleton" style={{ height: 80 }} /></div>)}
        </div>
        <div className="card" style={{ height: 300 }}><div className="skeleton" style={{ height: '100%' }} /></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep dive into your parking performance</p>
        </div>
        <div className="tabs">
          {[7, 14, 30].map(d => (
            <button key={d} className={`tab ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* ─── Metric Cards ─────────────────────────────────────────────── */}
      <div className="grid-4 mb-24">
        <MetricCard label="Total Revenue" value={formatPaise(totalRevenue)} sub={`Last ${days} days`} color="var(--success)" />
        <MetricCard label="Total Bookings" value={totalBookings} sub={`Last ${days} days`} color="var(--accent)" />
        <MetricCard label="Avg Per Booking" value={formatPaise(avgPerBooking)} sub="Completed sessions" color="var(--warning)" />
        <MetricCard
          label="Peak Hour"
          value={peakHour ? `${peakHour.hour}:00` : '—'}
          sub={peakHour ? `${peakHour.occupancy_rate.toFixed(1)}% occupancy` : ''}
          color="var(--danger)"
        />
      </div>

      {/* ─── Revenue + Bookings Combined ──────────────────────────────── */}
      <div className="card mb-24">
        <div className="font-display font-bold mb-4" style={{ fontSize: 16 }}>Revenue & Bookings Trend</div>
        <div className="text-xs text-muted mb-20">Daily breakdown over the selected period</div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={revenue} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
              interval={Math.floor(revenue.length / 8)} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₹${(v / 100).toFixed(0)}`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false} tickLine={false} />
            <Tooltip content={
              <ChartTooltip formatter={(v, name) => name === 'revenue' ? formatPaise(v) : v} />
            } />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]}
              opacity={0.85} isAnimationActive animationDuration={700} />
            <Line yAxisId="right" type="monotone" dataKey="bookings" name="Bookings"
              stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive animationDuration={800} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Row 2 ─────────────────────────────────────────────────────── */}
      <div className="grid-2 mb-24">
        {/* Hourly Occupancy Full */}
        <div className="card">
          <div className="font-display font-bold mb-4" style={{ fontSize: 16 }}>Hourly Occupancy</div>
          <div className="text-xs text-muted mb-20">Average by hour over last 7 days</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={occupancy} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                tickFormatter={(h) => `${h}h`} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
              <Bar dataKey="occupancy_rate" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={600}>
                {occupancy.map((entry, i) => (
                  <rect key={i} fill={
                    entry.occupancy_rate > 60 ? '#ef4444' :
                    entry.occupancy_rate > 30 ? '#f59e0b' : '#10b981'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Location Performance */}
        <div className="card">
          <div className="font-display font-bold mb-4" style={{ fontSize: 16 }}>Location Performance</div>
          <div className="text-xs text-muted mb-20">Current occupancy per location</div>
          {locationStats.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <p className="text-sm">No location data</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {locationStats.map((loc) => (
                <div key={loc.location_id}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="text-sm font-semibold">{loc.name}</div>
                      <div className="text-xs text-muted">{loc.total_slots} slots · {formatPaise(loc.total_revenue)} total</div>
                    </div>
                    <div className="font-display font-bold" style={{
                      fontSize: 20,
                      color: loc.occupancy_rate > 80 ? 'var(--danger)' :
                             loc.occupancy_rate > 50 ? 'var(--warning)' : 'var(--success)',
                    }}>
                      {loc.occupancy_rate}%
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${loc.occupancy_rate}%`,
                      borderRadius: 4,
                      background: loc.occupancy_rate > 80 ? '#ef4444' : loc.occupancy_rate > 50 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Booking type breakdown table ─────────────────────────────── */}
      {stats && (
        <div className="card">
          <div className="font-display font-bold mb-16" style={{ fontSize: 16 }}>Booking Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              ['Instant Bookings', stats.booking_type_distribution.INSTANT, '#3b82f6'],
              ['Advance Bookings', stats.booking_type_distribution.ADVANCE, '#10b981'],
              ['Active Right Now', stats.active_sessions, '#f59e0b'],
            ].map(([label, val, color]) => (
              <div key={label} style={{
                padding: 20, borderRadius: 12, background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)', textAlign: 'center',
              }}>
                <div className="font-display" style={{ fontSize: 36, fontWeight: 800, color, letterSpacing: '-2px' }}>{val}</div>
                <div className="text-sm text-secondary mt-4">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
