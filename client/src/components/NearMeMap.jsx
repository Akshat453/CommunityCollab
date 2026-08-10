import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'

// Fix leaflet default icon paths broken by Vite bundler
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PIN_CONFIG = {
  event:      { color: '#FF5200', emoji: '🎪', label: 'Event' },
  pool:       { color: '#03A6A1', emoji: '🛒', label: 'Pool' },
  skill:      { color: '#2874F0', emoji: '🎓', label: 'Skill' },
  resource:   { color: '#8B3FFF', emoji: '🔧', label: 'Resource' },
  assistance: { color: '#E23744', emoji: '🤝', label: 'Assistance' },
}

const ROUTE_MAP = {
  event:      '/events',
  pool:       '/pools',
  skill:      '/skills',
  resource:   '/resources',
  assistance: '/assistance',
}

function makeIcon(color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:36px;height:36px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  })
}

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => { if (lat && lng) map.setView([lat, lng], map.getZoom()) }, [lat, lng])
  return null
}

/**
 * NearMeMap
 * Props:
 *   types    — csv of feature types to show (default: all)
 *   height   — css height string (default '420px')
 *   onNavigate — called with (route) when user clicks "View" on a pin
 */
export default function NearMeMap({ types = 'events,pools,skills,resources,assistance', height = '420px', onNavigate }) {
  const [userLoc, setUserLoc] = useState(null)
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(false)
  const [radiusKm, setRadiusKm] = useState(5)
  const [activeTypes, setActiveTypes] = useState(types.split(','))
  const [locError, setLocError] = useState(false)

  const fetchPins = async (lat, lng, radius, typesList) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ types: typesList.join(','), lat, lng, radius_km: radius })
      const { data } = await api.get(`/map/pins?${params}`)
      setPins(data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLoc(loc)
        fetchPins(loc.lat, loc.lng, radiusKm, activeTypes)
      },
      () => setLocError(true)
    )
  }, [])

  useEffect(() => {
    if (userLoc) fetchPins(userLoc.lat, userLoc.lng, radiusKm, activeTypes)
  }, [radiusKm, activeTypes])

  const toggleType = (t) =>
    setActiveTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const defaultCenter = userLoc ? [userLoc.lat, userLoc.lng] : [20.5937, 78.9629] // India fallback

  return (
    <div className="rounded-3xl overflow-hidden border border-outline-variant/20 shadow-sm">
      {/* Controls bar */}
      <div className="bg-surface-container-low px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Type toggles */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(PIN_CONFIG).map(([type, cfg]) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className="px-3 py-1 rounded-full text-[11px] font-bold border-2 transition-all"
              style={{
                borderColor: cfg.color,
                background: activeTypes.includes(type) ? cfg.color : 'transparent',
                color: activeTypes.includes(type) ? '#fff' : cfg.color,
              }}
            >
              {cfg.emoji} {cfg.label}s
            </button>
          ))}
        </div>

        {/* Radius slider */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">radar</span>
          <input
            type="range" min="1" max="25" value={radiusKm}
            onChange={e => setRadiusKm(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">{radiusKm} km</span>
        </div>

        {loading && (
          <span className="material-symbols-outlined text-primary text-sm animate-spin">progress_activity</span>
        )}
      </div>

      {locError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-700 font-medium">
          📍 Location access denied — showing all items. Allow location to see what's near you.
        </div>
      )}

      {/* Map */}
      <div style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          {userLoc && <RecenterMap lat={userLoc.lat} lng={userLoc.lng} />}

          {/* User location marker */}
          {userLoc && (
            <>
              <Marker
                position={[userLoc.lat, userLoc.lng]}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="
                    width:16px;height:16px;border-radius:50%;
                    background:#3B82F6;border:3px solid white;
                    box-shadow:0 0 0 4px rgba(59,130,246,.3)">
                  </div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                })}
              >
                <Popup><strong>You are here</strong></Popup>
              </Marker>
              <Circle
                center={[userLoc.lat, userLoc.lng]}
                radius={radiusKm * 1000}
                pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.06, weight: 1.5, dashArray: '6' }}
              />
            </>
          )}

          {/* Feature pins */}
          {pins.map((pin, i) => {
            const cfg = PIN_CONFIG[pin.type] || PIN_CONFIG.event
            const route = `${ROUTE_MAP[pin.type]}/${pin.id}`
            return (
              <Marker
                key={i}
                position={[pin.lat, pin.lng]}
                icon={makeIcon(cfg.color, cfg.emoji)}
              >
                <Popup maxWidth={240}>
                  <div className="text-sm">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white inline-block mb-1" style={{ background: cfg.color }}>
                      {cfg.label}
                    </span>
                    <p className="font-bold mt-1 leading-snug">{pin.title}</p>
                    {pin.meta?.category && <p className="text-xs text-gray-500 mt-0.5 capitalize">{pin.meta.category}</p>}
                    {pin.meta?.starts_at && <p className="text-xs text-gray-500">{new Date(pin.meta.starts_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                    {pin.meta?.is_free === true && <span className="text-[10px] font-bold text-green-600">Free</span>}
                    {pin.meta?.price_per_day > 0 && <span className="text-[10px] font-bold text-purple-600">₹{pin.meta.price_per_day}/day</span>}
                    <br />
                    <button
                      onClick={() => onNavigate?.(route)}
                      className="mt-2 text-[11px] font-bold px-3 py-1 rounded-full text-white"
                      style={{ background: cfg.color }}
                    >
                      View →
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* Stats footer */}
      <div className="bg-surface-container-low px-4 py-2 flex gap-4 text-xs text-on-surface-variant">
        <span>{pins.length} item{pins.length !== 1 ? 's' : ''} within {radiusKm} km</span>
        {Object.entries(PIN_CONFIG).map(([type, cfg]) => {
          const count = pins.filter(p => p.type === type).length
          if (count === 0) return null
          return <span key={type} style={{ color: cfg.color }}>{cfg.emoji} {count}</span>
        })}
      </div>
    </div>
  )
}
