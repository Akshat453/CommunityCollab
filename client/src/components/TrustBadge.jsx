const TRUST_COLORS = {
  new: '#9E9E9E',
  low: '#ba1a1a',
  moderate: '#FF6D00',
  good: '#FFB300',
  trusted: '#03A6A1',
  verified_community_member: '#FFD700'
}

const TRUST_LABELS = {
  new: 'New',
  low: 'Low',
  moderate: 'Moderate',
  good: 'Good',
  trusted: 'Trusted',
  verified_community_member: '★ Verified'
}

export default function TrustBadge({ trust_score, trust_level, size = 'sm' }) {
  const level = trust_level || 'new'
  const score = trust_score ?? 50
  const color = TRUST_COLORS[level] || TRUST_COLORS.new
  const label = TRUST_LABELS[level] || 'New'

  const padding = size === 'lg' ? '4px 12px' : size === 'md' ? '3px 8px' : '2px 6px'
  const fontSize = size === 'lg' ? '13px' : size === 'md' ? '11px' : '10px'

  return (
    <span
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        borderRadius: '9999px',
        padding,
        fontSize,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        lineHeight: 1
      }}
      title={`Trust Score: ${score}`}
    >
      {size === 'lg' ? `${label} · ${score}` : label}
    </span>
  )
}
