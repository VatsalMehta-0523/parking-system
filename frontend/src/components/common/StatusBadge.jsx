export function StatusBadge({ status }) {
  const map = {
    RESERVED:        { cls: 'badge-accent',   label: 'Reserved'   },
    ACTIVE:          { cls: 'badge-success',  label: 'Active'     },
    COMPLETED:       { cls: 'badge-neutral',  label: 'Completed'  },
    OVERSTAY:        { cls: 'badge-danger',   label: 'Overstay'   },
    CANCELLED:       { cls: 'badge-warning',  label: 'Cancelled'  },
    EXPIRED:         { cls: 'badge-danger',   label: 'Expired'    },
    PENDING:         { cls: 'badge-warning',  label: 'Pending'    },
    PAID_OFFLINE:    { cls: 'badge-success',  label: 'Paid'       },
  }
  const { cls, label } = map[status] || { cls: 'badge-neutral', label: status }
  return <span className={`badge ${cls}`}>{label}</span>
}

export function AvailabilityDot({ available, total }) {
  const ratio = total > 0 ? available / total : 0
  const cls = ratio > 0.5 ? 'high' : ratio > 0.2 ? 'medium' : 'low'
  return <span className={`avail-dot ${cls}`} />
}

export function formatPaise(paise) {
  if (paise == null) return '—'
  const rupees = paise / 100
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatDuration(start, end) {
  if (!start || !end) return '—'
  const diff = new Date(end) - new Date(start)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
