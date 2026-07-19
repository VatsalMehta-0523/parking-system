import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

function AnimatedVisual() {
  return (
    <div style={{
      flex: 1,
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f36 50%, #0a1628 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      {[
        { size: 320, opacity: 0.04, top: -80, right: -80 },
        { size: 200, opacity: 0.06, bottom: 40, left: -60 },
        { size: 120, opacity: 0.08, top: '40%', left: '20%' },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: c.size, height: c.size,
          borderRadius: '50%',
          border: `1px solid rgba(59,130,246,${c.opacity * 5})`,
          background: `rgba(59,130,246,${c.opacity})`,
          top: c.top, right: c.right, bottom: c.bottom, left: c.left,
        }} />
      ))}

      {/* Parking grid SVG */}
      <svg width="280" height="200" viewBox="0 0 280 200" style={{ marginBottom: 32, position: 'relative' }}>
        {/* Grid lines */}
        {[0,1,2,3].map(i => (
          <rect key={`h${i}`} x={20 + i*60} y={20} width={52} height={160}
            rx={8} fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth={1} />
        ))}
        {/* Cars (animated) */}
        {[
          { x: 28, y: 40, color: '#3b82f6', delay: 0 },
          { x: 88, y: 40, color: '#10b981', delay: 0.3 },
          { x: 148, y: 40, color: '#3b82f6', delay: 0.6 },
          { x: 28, y: 100, color: '#f59e0b', delay: 0.2 },
          { x: 208, y: 100, color: '#3b82f6', delay: 0.5 },
        ].map((car, i) => (
          <g key={i} style={{ animation: `fadeIn 0.6s ease ${car.delay}s both` }}>
            <rect x={car.x} y={car.y} width={36} height={20} rx={4}
              fill={car.color} opacity={0.85} />
            <rect x={car.x + 4} y={car.y - 8} width={28} height={12} rx={3}
              fill={car.color} opacity={0.6} />
            <circle cx={car.x + 7} cy={car.y + 20} r={4} fill="#1e3a5f" />
            <circle cx={car.x + 29} cy={car.y + 20} r={4} fill="#1e3a5f" />
          </g>
        ))}
        {/* Available slot indicator */}
        <g>
          <rect x={148} y={100} width={36} height={20} rx={4}
            fill="none" stroke="rgba(16,185,129,0.5)" strokeWidth={1.5} strokeDasharray="4 2" />
          <text x={166} y={113} textAnchor="middle" fill="rgba(16,185,129,0.7)"
            fontSize={10} fontFamily="Inter, sans-serif" fontWeight={600}>FREE</text>
        </g>
      </svg>

      <h2 style={{
        fontFamily: 'Inter, sans-serif', fontWeight: 600,
        fontSize: 28, color: '#ffffff',
        textAlign: 'center', letterSpacing: '-0.5px',
        position: 'relative', marginBottom: 12,
      }}>
        Smart Parking<br />
        <span style={{ color: '#3b82f6' }}>Made Simple</span>
      </h2>
      <p style={{
        color: 'rgba(255,255,255,0.45)', fontSize: 14,
        textAlign: 'center', position: 'relative', lineHeight: 1.6,
      }}>
        Manage your locations, monitor<br />occupancy, and grow revenue.
      </p>

      <div style={{ display: 'flex', gap: 32, marginTop: 36, position: 'relative' }}>
        {[['Real-time', 'Monitoring'], ['Dynamic', 'Pricing'], ['Instant', 'Bookings']].map(([a, b]) => (
          <div key={a} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>{a}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(59,130,246,0.8)', letterSpacing: '0.05em' }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const { login, register, loading, error } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({ name: form.name, email: form.email, password: form.password, phone: form.phone })
      }
      navigate('/provider/dashboard')
    } catch {}
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Visual — hide on mobile */}
      <div style={{ display: 'flex', flex: 1, '@media(max-width:768px)': { display: 'none' } }}>
        <AnimatedVisual />
      </div>

      {/* Right Form */}
      <div style={{
        width: 440,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 40px',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        position: 'relative',
      }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          style={{ position: 'absolute', top: 20, right: 20 }}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <div className="font-display" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Park<span style={{ color: 'var(--accent)' }}>Smart</span>
          </div>
          <div className="text-sm text-muted" style={{ marginTop: 4 }}>Provider Console</div>
        </div>

        {/* Heading */}
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-sm text-secondary" style={{ marginBottom: 28 }}>
          {mode === 'login'
            ? 'Sign in to manage your parking locations'
            : 'Join ParkSmart and start managing your spaces'}
        </p>

        {/* Tabs */}
        <div className="tabs mb-24">
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
          <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Register</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" className="form-input" placeholder="Your name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input name="phone" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input name="email" type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                placeholder="••••••••" 
                value={form.password} 
                onChange={handleChange} 
                required 
                style={{ paddingRight: 40 }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? (
              <span className="flex items-center gap-8">
                <span className="spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/find-parking" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to customer app
          </a>
        </div>
      </div>
    </div>
  )
}
