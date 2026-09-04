import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import LocationPicker from './LocationPicker'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ROUTE_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']

function makePin(color, label) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};color:white;
      padding:4px 8px;border-radius:999px;
      font-size:10px;font-weight:700;
      white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.2);
      border:2px solid white;
    ">${label}</div>`,
    iconAnchor: [0, 0],
    popupAnchor: [0, -10],
  })
}

function userPin() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:#3B82F6;border:3px solid white;
      box-shadow:0 0 0 4px rgba(59,130,246,.3)">
    </div>`,
    iconSize: [14, 14], iconAnchor: [7, 7],
  })
}

function RecenterMap({ bounds }) {
  const map = useMap()
  useEffect(() => { if (bounds?.length) { try { map.fitBounds(bounds, { padding: [40, 40] }) } catch { /* ignore invalid map bounds */ } } }, [bounds, map])
  return null
}

/**
 * CarpoolMap
 * Props:
 *   onBook — called with carpoolId when user clicks Book
 */
export default function CarpoolMap({ onBook }) {
  const [dest, setDest] = useState({ address: '', lat: null, lng: null })
  const [origin, setOrigin] = useState({ address: '', lat: null, lng: null })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [userLoc, setUserLoc] = useState(null)
  const [destRadius, setDestRadius] = useState(5)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }, [])

  const handleSearch = async () => {
    if (!dest.lat || !dest.lng) return alert('Please enter your destination first.')
    setLoading(true)
    try {
      const params = new URLSearchParams({
        dest_lat: dest.lat,
        dest_lng: dest.lng,
        dest_radius_km: destRadius,
        ...(origin.lat && origin.lng ? { origin_lat: origin.lat, origin_lng: origin.lng } : userLoc ? { origin_lat: userLoc.lat, origin_lng: userLoc.lng } : {}),
      })
      const { data } = await api.get(`/map/carpools?${params}`)
      setResults(data.data || [])
      setSearched(true)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Compute map bounds from all route coords
  const allPoints = []
  if (userLoc) allPoints.push([userLoc.lat, userLoc.lng])
  if (dest.lat) allPoints.push([dest.lat, dest.lng])
  results.forEach(r => {
    if (r.origin_coords?.lat) allPoints.push([r.origin_coords.lat, r.origin_coords.lng])
    if (r.destination_coords?.lat) allPoints.push([r.destination_coords.lat, r.destination_coords.lng])
  })
  const bounds = allPoints.length > 1 ? allPoints : null

  const defaultCenter = dest.lat ? [dest.lat, dest.lng]
    : userLoc ? [userLoc.lat, userLoc.lng]
    : [20.5937, 78.9629]

  return (
    <div className="space-y-4">
      {/* Search panel */}
      <div className="bg-surface-container-low rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🚗</span>
          <div>
            <h3 className="font-bold">Find a Ride</h3>
            <p className="text-xs text-on-surface-variant">Enter where you want to go — we'll find carpools heading that way</p>
          </div>
        </div>

        <LocationPicker
          label="🏁 Where do you want to go? (destination)"
          placeholder="E.g. Connaught Place, Delhi..."
          value={dest.address}
          onChange={(loc) => setDest(loc)}
        />
        <LocationPicker
          label="📍 Your pickup point (optional — uses your location if blank)"
          placeholder="E.g. Sector 62, Noida..."
          value={origin.address}
          onChange={(loc) => setOrigin(loc)}
        />

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Match radius (destination):</label>
          <input type="range" min="1" max="20" value={destRadius}
            onChange={e => setDestRadius(Number(e.target.value))}
            className="flex-1 accent-indigo-500" />
          <span className="text-xs font-bold text-indigo-600">{destRadius} km</span>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !dest.lat}
          className="w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}
        >
          {loading ? '⏳ Searching...' : '🔍 Find Carpools Going There'}
        </button>
      </div>

      {/* Results summary */}
      {searched && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-bold">
            {results.length === 0 ? '😔 No carpools found going there' : `✅ ${results.length} carpool${results.length > 1 ? 's' : ''} found`}
          </p>
          {results.length > 0 && <p className="text-xs text-on-surface-variant">Sorted by closest destination match</p>}
        </div>
      )}

      {/* Map */}
      <div className="rounded-3xl overflow-hidden border border-outline-variant/20 shadow-sm" style={{ height: '480px' }}>
        <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          {bounds && <RecenterMap bounds={bounds} />}

          {/* User current location */}
          {userLoc && (
            <Marker position={[userLoc.lat, userLoc.lng]} icon={userPin()}>
              <Popup><strong>You are here</strong></Popup>
            </Marker>
          )}

          {/* Destination search pin */}
          {dest.lat && dest.lng && (
            <Marker
              position={[dest.lat, dest.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="background:#10B981;color:white;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:700;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.2)">🏁 Your Destination</div>`,
                iconAnchor: [0, 0], popupAnchor: [0, -10],
              })}
            >
              <Popup>Your destination: <strong>{dest.address?.slice(0, 60)}</strong></Popup>
            </Marker>
          )}

          {/* Carpool routes */}
          {results.map((r, i) => {
            if (!r.origin_coords?.lat || !r.destination_coords?.lat) return null
            const color = ROUTE_COLORS[i % ROUTE_COLORS.length]
            const selected = selectedId === r.id.toString()
            const routeLine = [
              [r.origin_coords.lat, r.origin_coords.lng],
              [r.destination_coords.lat, r.destination_coords.lng],
            ]
            return (
              <div key={r.id}>
                {/* Route polyline */}
                <Polyline
                  positions={routeLine}
                  pathOptions={{
                    color, weight: selected ? 5 : 3,
                    opacity: selected ? 1 : 0.7,
                    dashArray: selected ? null : '8',
                  }}
                  eventHandlers={{ click: () => setSelectedId(r.id.toString()) }}
                />
                {/* Origin pin */}
                <Marker
                  position={[r.origin_coords.lat, r.origin_coords.lng]}
                  icon={makePin(color, `🚩 ${r.origin?.slice(0, 20) || 'Origin'}`)}
                >
                  <Popup maxWidth={220}>
                    <div className="text-sm space-y-1">
                      <p className="font-bold">{r.title}</p>
                      <p className="text-xs">🚩 {r.origin}</p>
                      <p className="text-xs">🏁 {r.destination}</p>
                      {r.fare_per_seat > 0 && <p className="text-xs font-bold text-indigo-600">₹{r.fare_per_seat} / seat</p>}
                      <p className="text-xs text-gray-500">{r.seats_left} seat{r.seats_left !== 1 ? 's' : ''} left</p>
                      {r.departure_time && <p className="text-xs">{new Date(r.departure_time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                      <p className="text-[10px] text-gray-400">Destination {r.dest_distance_km} km from yours</p>
                      <button
                        onClick={() => onBook?.(r.id)}
                        className="mt-1 text-[11px] font-bold px-3 py-1 rounded-full text-white w-full"
                        style={{ background: color }}
                      >Book Seat →</button>
                    </div>
                  </Popup>
                </Marker>
                {/* Destination pin */}
                <Marker
                  position={[r.destination_coords.lat, r.destination_coords.lng]}
                  icon={makePin(color, `🏁 ${r.destination?.slice(0, 20) || 'Dest'}`)}
                >
                  <Popup>
                    <p className="font-bold text-sm">{r.title}</p>
                    <p className="text-xs">Destination: {r.destination}</p>
                  </Popup>
                </Marker>
              </div>
            )
          })}
        </MapContainer>
      </div>

      {/* Carpool result cards */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => {
            const color = ROUTE_COLORS[i % ROUTE_COLORS.length]
            const selected = selectedId === r.id.toString()
            return (
              <div
                key={r.id}
                onClick={() => setSelectedId(selected ? null : r.id.toString())}
                className="bg-surface-container-low rounded-2xl p-4 cursor-pointer transition-all"
                style={{ border: `2px solid ${selected ? color : 'transparent'}` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${color}20` }}>🚗</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{r.title}</p>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                      <span>🚩 {r.origin}</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      <span>🏁 {r.destination}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs">
                      {r.fare_per_seat > 0 && <span className="font-bold" style={{ color }}>₹{r.fare_per_seat}/seat</span>}
                      <span className="text-on-surface-variant">💺 {r.seats_left} left</span>
                      {r.departure_time && <span className="text-on-surface-variant">🕐 {new Date(r.departure_time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                      <span className="text-on-surface-variant">{r.dest_distance_km} km from your dest</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onBook?.(r.id) }}
                    className="shrink-0 px-4 py-2 rounded-xl font-bold text-white text-xs shadow"
                    style={{ background: color }}
                  >Book</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
