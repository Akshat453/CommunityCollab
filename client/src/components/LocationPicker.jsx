import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * LocationPicker
 * Props:
 *   value        — current address string shown in input
 *   onChange     — called with { address, city, lat, lng } when a suggestion is picked
 *   placeholder  — input placeholder text
 *   label        — optional label above input
 */
export default function LocationPicker({ value, onChange, placeholder = 'Enter address or area…', label }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q) => {
    if (q.length < 3) { setSuggestions([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setSuggestions(data)
      setOpen(true)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  const handleSelect = (item) => {
    const address = item.display_name
    const city = item.address?.city || item.address?.town || item.address?.village || item.address?.county || item.address?.state || ''
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)
    setQuery(address)
    setOpen(false)
    setSuggestions([])
    onChange?.({ address, city, lat, lng })
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported by your browser.')
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        const city = data.address?.city || data.address?.town || data.address?.village || ''
        setQuery(address)
        onChange?.({ address, city, lat, lng })
      } catch {
        onChange?.({ address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: '', lat, lng })
      }
    }, () => alert('Could not get your location. Please allow location access.'))
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && <label className="text-xs font-bold text-on-surface-variant mb-1 block">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-surface-container rounded-xl px-4 py-3 pr-24 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        />
        <button
          type="button"
          onClick={handleUseMyLocation}
          title="Use my current location"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg text-primary bg-primary-fixed hover:bg-primary hover:text-white transition-all"
        >
          {loading
            ? <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
            : <span className="material-symbols-outlined text-xs">my_location</span>}
          Me
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              onMouseDown={() => handleSelect(item)}
              className="px-4 py-3 text-sm cursor-pointer hover:bg-surface-container transition-colors border-b border-outline-variant/10 last:border-0"
            >
              <span className="material-symbols-outlined text-xs text-on-surface-variant mr-1.5 align-middle">location_on</span>
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
