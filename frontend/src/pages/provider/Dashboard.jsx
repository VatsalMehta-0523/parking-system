import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { getDashboardStats, getRevenueTrend, getOccupancyByHour, getLocationStats } from '../../api/api'
import { StatusBadge, formatPaise } from '../../components/common/StatusBadge'
import { format } from 'date-fns'

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="stat-icon-wrap" style={{ background: color + '18' }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="font-display" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-sm font-semibold" style={{ marginTop: 2, color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-xs text-muted" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card" style={{ padding: '10px 14px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', minWidth: 140 }}>
      <div className="text-xs text-muted mb-4">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-8" style={{ marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span className="text-sm font-semibold">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

const DONUT_COLORS = ['#3b82f6', '#10b981']
const OCCUPANCY_GRADIENT = [
  { offset: '0%', color: '#3b82f6', opacity: 0.25 },
  { offset: '100%', color: '#3b82f6', opacity: 0.02 },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [occupancy, setOccupancy] = useState([])
  const [locationStats, setLocationStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [revDays, setRevDays] = useState(14)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, r, o, ls] = await Promise.all([
        getDashboardStats(),
        getRevenueTrend(revDays),
        getOccupancyByHour(),
        getLocationStats(),
      ])
      setStats(s)
      setRevenue(r)
      setOccupancy(o)
      setLocationStats(ls)
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [revDays])

  if (loading && !stats) {
    return (
      <div>
        <div className="grid-4 mb-20">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ height: 44, width: 44, borderRadius: 12, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 32, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '80%' }} />
            </div>
          ))}
        </div>
        <div className="grid-2">
          {[1,2].map(i => (
            <div key={i} className="card" style={{ height: 300 }}>
              <div className="skeleton" style={{ height: '100%', borderRadius: 8 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const donutData = stats ? [
    { name: 'Instant', value: stats.booking_type_distribution.INSTANT || 0 },
    { name: 'Advance', value: stats.booking_type_distribution.ADVANCE || 0 },
  ] : []

  const occupancyRate = stats && stats.active_slots > 0
    ? Math.round((stats.current_occupancy / stats.active_slots) * 100)
    : 0

  return (
    <div>
      {/* ─── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid-4 mb-24">
        <StatCard icon="🏢" label="Active Locations" value={stats?.active_locations ?? '—'}
          sub={`${stats?.total_locations ?? 0} total`} color="#3b82f6" />
        <StatCard icon="🚗" label="Active Sessions" value={stats?.active_sessions ?? '—'}
          sub={`${occupancyRate}% occupancy`} color="#10b981" />
        <StatCard icon="💰" label="Revenue Today" value={stats ? formatPaise(stats.revenue_today) : '—'}
          sub="Completed sessions" color="#f59e0b" />
        <StatCard icon="📋" label="Bookings Today" value={stats?.total_bookings_today ?? '—'}
          sub={`${formatPaise(stats?.revenue_this_month ?? 0)} this month`} color="#8b5cf6" />
      </div>

      {/* ─── Charts Row 1 ────────────────────────────────────────────── */}
      <div className="grid-2 mb-24">
        {/* Revenue Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-20">
            <div>
              <div className="font-display font-bold" style={{ fontSize: 16 }}>Revenue Trend</div>
              <div className="text-xs text-muted">Completed session earnings</div>
            </div>
            <div className="tabs">
              {[7, 14, 30].map(d => (
                <button key={d} className={`tab ${revDays === d ? 'active' : ''}`}
                  onClick={() => setRevDays(d)}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 100).toFixed(0)}`} />
              <Tooltip content={<ChartTooltip formatter={(v) => formatPaise(v)} />} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#revGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Distribution */}
        <div className="card">
          <div className="font-display font-bold mb-4" style={{ fontSize: 16 }}>Booking Types</div>
          <div className="text-xs text-muted mb-20">Instant vs Advance distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {donutData.map((d, i) => (
                <div key={d.name} style={{ marginBottom: 16 }}>
                  <div className="flex items-center gap-8 mb-4">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: DONUT_COLORS[i] }} />
                    <span className="text-sm font-semibold">{d.name}</span>
                  </div>
                  <div className="font-display" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>{d.value}</div>
                  <div className="text-xs text-muted">bookings</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2 ────────────────────────────────────────────── */}
      <div className="grid-2 mb-24">
        {/* Hourly Occupancy */}
        <div className="card">
          <div className="font-display font-bold mb-4" style={{ fontSize: 16 }}>Peak Hours</div>
          <div className="text-xs text-muted mb-20">Avg occupancy rate by hour (last 7 days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={occupancy.filter((_, i) => i % 2 === 0)}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickFormatter={(h) => `${h}h`}
                axisLine={false} tickLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
              <Bar dataKey="occupancy_rate" fill="#10b981" radius={[4, 4, 0, 0]}
                isAnimationActive={true} animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Location Overview Table */}
        <div className="card">
          <div className="font-display font-bold mb-4" style={{ fontSize: 16 }}>Location Overview</div>
          <div className="text-xs text-muted mb-16">Real-time occupancy across locations</div>
          {locationStats.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <p className="text-sm">No locations yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {locationStats.map((loc) => (
                <div key={loc.location_id}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-sm font-semibold">{loc.name}</div>
                      <div className="text-xs text-muted">{loc.area}</div>
                    </div>
                    <span className="font-display font-bold" style={{ fontSize: 16 }}>
                      {loc.occupancy_rate}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${loc.occupancy_rate}%`,
                      borderRadius: 4,
                      background: loc.occupancy_rate > 80 ? '#ef4444' : loc.occupancy_rate > 50 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <div className="text-xs text-muted mt-4">
                    {loc.occupied_slots}/{loc.total_slots} slots · {formatPaise(loc.total_revenue)} earned
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Recent Bookings ──────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-20">
          <div>
            <div className="font-display font-bold" style={{ fontSize: 16 }}>Recent Bookings</div>
            <div className="text-xs text-muted">Latest activity across all locations</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}>
            Refresh
          </button>
        </div>
        {stats?.recent_bookings?.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <p className="text-sm">No bookings yet</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Location</th>
                  <th>Slot</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_bookings?.map((b) => (
                  <tr key={b.booking_id}>
                    <td>
                      <div className="font-semibold text-sm">{b.user_name || '—'}</div>
                      <div className="text-xs text-muted">{b.user_phone}</div>
                    </td>
                    <td className="text-sm">{b.location_name || '—'}</td>
                    <td>
                      <span className="badge badge-accent" style={{ fontSize: 11 }}>
                        {b.slot_name || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${b.booking_type === 'INSTANT' ? 'badge-info' : 'badge-accent'}`} style={{ fontSize: 11 }}>
                        {b.booking_type === 'INSTANT' ? '⚡' : '📅'} {b.booking_type}
                      </span>
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="font-semibold text-sm">
                      {b.total_price != null ? formatPaise(b.total_price) : '—'}
                    </td>
                    <td className="text-xs text-muted">
                      {format(new Date(b.created_at), 'dd MMM, h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
