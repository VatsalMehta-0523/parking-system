import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function OverviewPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="overview-container animate-fade-in" style={{
      maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 64, paddingBottom: 64
    }}>
      
      {/* Hero Section */}
      <section style={{ 
        textAlign: 'center', 
        padding: '64px 20px',
        background: isDark ? 'linear-gradient(180deg, rgba(59,130,246,0.1), transparent)' : 'linear-gradient(180deg, rgba(37,99,235,0.05), transparent)',
        borderRadius: 24,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', 
          background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 20, 
          fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          marginBottom: 24
        }}>
          ✨ Next-Gen Parking
        </div>
        <h1 className="font-display" style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20 }}>
          Finding parking should<br />be the easy part.
        </h1>
        <p className="text-secondary" style={{ fontSize: 18, maxWidth: 540, margin: '0 auto', lineHeight: 1.6, marginBottom: 40 }}>
          ParkSmart connects drivers with available parking spaces in real-time. Whether you need a spot right now or want to reserve one for tomorrow, we make it seamless.
        </p>
        <div className="flex items-center justify-center gap-16">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/find-parking')} style={{ padding: '16px 36px', fontSize: 16 }}>
            Browse Locations
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/book')} style={{ padding: '16px 36px', fontSize: 16 }}>
            Book a Spot
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.5px' }}>
          Everything you need in one platform
        </h2>
        <div className="grid-3">
          {[
            {
              icon: '🗺️', title: 'Interactive Discovery', 
              desc: 'Browse locations on a dynamic map with real-time occupancy and color-coded availability markers.'
            },
            {
              icon: '⚡', title: 'Instant & Advance Booking', 
              desc: 'Park right now with a 30-minute reservation TTL, or secure a slot hours in advance.'
            },
            {
              icon: '🎫', title: 'Digital Ticket Sessions', 
              desc: 'Start your session digitally upon arrival. No paper tickets. Your active timer dictates your final payment.'
            },
            {
              icon: '💼', title: 'Provider Dashboard', 
              desc: 'Monetize empty slots. Add your facilities, set your custom pricing, and toggle inactive slots instantly.'
            },
            {
              icon: '📊', title: 'Actionable Analytics', 
              desc: 'Providers get real-time occupancy heatmaps and revenue trends to maximize their lot\'s potential.'
            },
            {
              icon: '🌙', title: 'Premium Aesthetics', 
              desc: 'Engineered with a stunning dark and light mode, responsive layout, and zero-latency micro interactions.'
            }
          ].map((feat, i) => (
            <div key={i} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '1px solid var(--border)' }}>
                {feat.icon}
              </div>
              <h3 className="font-display font-bold" style={{ fontSize: 20, letterSpacing: '-0.3px' }}>{feat.title}</h3>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.6 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Graphic Section */}
      <section className="card" style={{ padding: 64, display: 'flex', alignItems: 'center', gap: 48, background: 'var(--bg-surface)', overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <div className="font-display font-bold text-accent mb-8" style={{ fontSize: 14, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            The Workflow
          </div>
          <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 20 }}>
            From Discovery to<br />Departure in 3 steps
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 32 }}>
            {[
              { n: '01', t: 'Find a Spot', d: 'Search your destination on the map and check real-time pricing and slot availability.' },
              { n: '02', t: 'Reserve Session', d: 'Fill in your details and confirm. Your slot is guaranteed until your arrival window expires.' },
              { n: '03', t: 'Park & Pay', d: 'Activate the session when you park. End it on departure and pay based on your exact duration.' },
            ].map((s) => (
              <div key={s.n} className="flex gap-16 items-start">
                <div style={{ 
                  color: 'var(--text-muted)', fontSize: 16, fontWeight: 700, fontFamily: 'Syne',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)' 
                }}>
                  {s.n}
                </div>
                <div>
                  <div className="font-bold text-lg mb-4">{s.t}</div>
                  <div className="text-sm text-secondary" style={{ lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: '100%', maxWidth: 360, height: 420, borderRadius: 24, 
            background: 'linear-gradient(135deg, var(--bg-surface-2), var(--bg-surface))',
            border: '8px solid var(--bg-elevated)', boxShadow: 'var(--shadow-xl)',
            position: 'relative', overflow: 'hidden', padding: 24
          }}>
            {/* Mock Phone UI graphic */}
            <div className="skeleton" style={{ width: '60%', height: 24, borderRadius: 12, marginBottom: 24 }} />
            <div className="skeleton" style={{ width: '100%', height: 160, borderRadius: 16, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '40%', height: 16, borderRadius: 8, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '80%', height: 16, borderRadius: 8, marginBottom: 24 }} />
            <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 12, marginTop: 'auto' }} />
          </div>
        </div>
      </section>

    </div>
  )
}
