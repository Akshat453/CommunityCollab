import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import TrustBadge from '../components/TrustBadge'

const PLATFORM_META = {
  blinkit:  { label: 'Blinkit',  color: '#F8D000', icon: '⚡' },
  swiggy:   { label: 'Swiggy',   color: '#FF5200', icon: '🍔' },
  zomato:   { label: 'Zomato',   color: '#E23744', icon: '🍽️' },
  amazon:   { label: 'Amazon',   color: '#FF9900', icon: '📦' },
  flipkart: { label: 'Flipkart', color: '#2874F0', icon: '🛍️' },
  dmart:    { label: 'DMart',    color: '#E31E24', icon: '🏬' },
  zepto:    { label: 'Zepto',    color: '#8B3FFF', icon: '🚀' },
  custom:   { label: 'Custom',   color: '#03A6A1', icon: '📋' },
}

const STATUS_STEPS = ['open', 'ordering', 'ordered', 'completed']
const STATUS_LABELS = { open: 'Open', ordering: 'Ordering', ordered: 'Ordered', completed: 'Completed', cancelled: 'Cancelled' }
const ITEM_STATUS_COLORS = {
  pending: '#FFA673', ordered: '#03A6A1', out_of_stock: '#ba1a1a', substituted: '#2874F0', delivered: '#006a67'
}

const PAYMENT_STATUS_STYLES = {
  unpaid: { bg: '#FFF8E1', color: '#F57F17', label: 'Payment Pending' },
  utr_submitted: { bg: '#E3F2FD', color: '#1565C0', label: 'UTR Submitted — Awaiting Confirmation' },
  paid: { bg: '#E8F5E9', color: '#2E7D32', label: 'Payment Confirmed ✓' },
  disputed: { bg: '#FFEBEE', color: '#C62828', label: 'Payment Dispute Flagged' },
  refunded: { bg: '#F3E5F5', color: '#6A1B9A', label: 'Refunded' },
}

export default function PoolDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [pool, setPool] = useState(null)
  const [items, setItems] = useState([])
  const [itemsByUser, setItemsByUser] = useState([])
  const [totalEstimated, setTotalEstimated] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Add item form
  const [productLink, setProductLink] = useState('')
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('piece')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [fetchingMeta, setFetchingMeta] = useState(false)

  // Edit item
  const [editingItem, setEditingItem] = useState(null)

  // Proof submission
  const [proofFile, setProofFile] = useState(null)
  const [proofOrderUrl, setProofOrderUrl] = useState('')
  const [proofOrderId, setProofOrderId] = useState('')
  const [proofNote, setProofNote] = useState('')
  const [proofUpiId, setProofUpiId] = useState('')
  const [proofUpiName, setProofUpiName] = useState('')
  const [submittingProof, setSubmittingProof] = useState(false)

  // UPI payment
  const [utrInput, setUtrInput] = useState('')
  const [submittingUtr, setSubmittingUtr] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(null)

  const fetchPool = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/pools/${id}`)
      setPool(data.data.pool)
      setItems(data.data.items || [])
      setItemsByUser(data.data.items_by_user || [])
      setTotalEstimated(data.data.total_estimated_cost || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pool')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchPool() }, [fetchPool])

  const handleJoin = async () => {
    setJoining(true)
    try {
      await api.post(`/pools/${id}/join`)
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to join') }
    finally { setJoining(false) }
  }

  const handleLeave = async () => {
    if (!window.confirm('Leave this pool? Your items will be removed.')) return
    try {
      await api.post(`/pools/${id}/leave`)
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to leave') }
  }

  const handleLinkBlur = async () => {
    if (!productLink) return
    setFetchingMeta(true)
    try {
      const { data } = await api.post('/pools/fetch-meta', { url: productLink })
      if (data.data.name && !productName) setProductName(data.data.name)
    } catch { /* ignore */ }
    setFetchingMeta(false)
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!productLink || quantity < 1) return
    setAddingItem(true)
    try {
      await api.post(`/pools/${id}/items`, {
        product_link: productLink,
        product_name: productName || undefined,
        quantity: Number(quantity),
        unit,
        estimated_price: estimatedPrice ? Number(estimatedPrice) : undefined,
        notes
      })
      setProductLink(''); setProductName(''); setQuantity(1); setUnit('piece'); setEstimatedPrice(''); setNotes('')
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to add item') }
    finally { setAddingItem(false) }
  }

  const handleEditItem = async (item) => {
    if (editingItem?._id === item._id) {
      // Save
      try {
        await api.patch(`/pools/${id}/items/${item._id}`, {
          product_name: editingItem.product_name,
          quantity: Number(editingItem.quantity),
          unit: editingItem.unit,
          estimated_price: editingItem.estimated_price ? Number(editingItem.estimated_price) : undefined,
          notes: editingItem.notes
        })
        setEditingItem(null)
        fetchPool()
      } catch (err) { alert(err.response?.data?.message || 'Failed to edit') }
    } else {
      setEditingItem({ ...item })
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remove this item?')) return
    try {
      await api.delete(`/pools/${id}/items/${itemId}`)
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to remove') }
  }

  const handleLockPool = async () => {
    if (!window.confirm('Lock this pool? No more participants or items can be added.')) return
    try {
      await api.patch(`/pools/${id}/lock`)
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to lock') }
  }

  const handleSubmitProof = async () => {
    if (!proofFile && !proofOrderUrl && !proofOrderId) {
      alert('Please provide at least one form of proof')
      return
    }
    setSubmittingProof(true)
    try {
      const formData = new FormData()
      if (proofFile) formData.append('screenshot', proofFile)
      if (proofOrderUrl) formData.append('order_url', proofOrderUrl)
      if (proofOrderId) formData.append('order_id_external', proofOrderId)
      if (proofNote) formData.append('note', proofNote)
      if (proofUpiId) formData.append('orderer_upi_id', proofUpiId)
      if (proofUpiName) formData.append('orderer_upi_name', proofUpiName)

      await api.post(`/pools/${id}/submit-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProofFile(null); setProofOrderUrl(''); setProofOrderId(''); setProofNote(''); setProofUpiId(''); setProofUpiName('')
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit proof') }
    finally { setSubmittingProof(false) }
  }

  const handleUpdateItemStatus = async (itemId, status) => {
    try {
      await api.patch(`/pools/${id}/items/${itemId}/status`, { status })
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to update') }
  }

  const handleConfirmDelivery = async () => {
    try {
      await api.post(`/pools/${id}/confirm-delivery`)
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to confirm') }
  }

  const handleDesignateOrderer = async (ordererId) => {
    try {
      await api.patch(`/pools/${id}/designate-orderer`, { orderer_id: ordererId })
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  const handleSubmitUtr = async () => {
    if (!utrInput.trim()) { alert('Please enter a UTR number'); return }
    setSubmittingUtr(true)
    try {
      await api.post(`/pools/${id}/submit-utr`, { utr_number: utrInput.trim() })
      setUtrInput('')
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit UTR') }
    finally { setSubmittingUtr(false) }
  }

  const handleConfirmPayment = async (participantUserId) => {
    setConfirmingPayment(participantUserId)
    try {
      await api.patch(`/pools/${id}/confirm-payment/${participantUserId}`)
      fetchPool()
    } catch (err) { alert(err.response?.data?.message || 'Failed to confirm payment') }
    finally { setConfirmingPayment(null) }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto flex justify-center py-32">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto text-center py-32">
      <span className="material-symbols-outlined text-error text-6xl mb-4">error</span>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-on-surface-variant mb-6">{error}</p>
      <button onClick={() => navigate('/pools')} className="primary-gradient text-white px-6 py-2.5 rounded-xl font-bold shadow-lg">Back to Pools</button>
    </div>
  )

  if (!pool) return null

  const isJoined = pool.participants?.some(p => (p.user?._id || p.user) === user?._id && p.status !== 'cancelled')
  const isCreator = (pool.creator?._id || pool.creator) === user?._id
  const isOrderer = pool.designated_orderer && ((pool.designated_orderer?._id || pool.designated_orderer) === user?._id) || isCreator
  const myParticipantData = pool.participants?.find(p => (p.user?._id || p.user) === user?._id)
  const activeParticipants = pool.active_participants || pool.participants?.filter(p => p.status !== 'cancelled').length || 0
  const pct = (activeParticipants / pool.max_participants) * 100
  const platformMeta = PLATFORM_META[pool.platform] || PLATFORM_META.custom
  const platformLabel = pool.platform === 'custom' ? (pool.platform_custom_name || 'Custom') : platformMeta.label

  const myItems = items.filter(i => (i.added_by?._id || i.added_by) === user?._id)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'items', label: `Items (${items.length})`, icon: 'shopping_cart' },
    { id: 'order', label: 'Order', icon: 'receipt_long' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back button */}
      <button onClick={() => navigate('/pools')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm font-medium mb-6 group">
        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Back to Pools
      </button>

      {/* Warning Banner */}
      <div className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2" style={{ background: '#FFF8E1', border: '1px solid #FFD54F' }}>
        <span className="material-symbols-outlined text-sm" style={{ color: '#F57F17' }}>warning</span>
        <p className="text-xs font-medium" style={{ color: '#F57F17' }}>
          All transactions are logged. Fraudulent activity will result in account suspension and legal action.
        </p>
      </div>

      {/* Header */}
      <div className="bg-surface-container-low rounded-3xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: platformMeta.color, filter: 'blur(60px)' }}></div>
        <div className="flex items-start gap-4 mb-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: `${platformMeta.color}20` }}>
            {platformMeta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full text-white" style={{ background: platformMeta.color }}>
                {platformLabel}
              </span>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full" style={{
                background: pool.status === 'cancelled' ? '#ba1a1a' : pool.status === 'completed' ? '#03A6A1' : pool.status === 'ordered' ? '#2874F0' : pool.status === 'ordering' ? '#FFA673' : '#03A6A1',
                color: pool.status === 'ordering' ? '#4f2000' : '#fff'
              }}>
                {STATUS_LABELS[pool.status]}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tighter">{pool.title}</h1>
          </div>
        </div>

        {/* Status Timeline */}
        {pool.status !== 'cancelled' && (
          <div className="flex items-center gap-0 mt-6 px-2">
            {STATUS_STEPS.map((step, i) => {
              const currentIdx = STATUS_STEPS.indexOf(pool.status)
              const isActive = i <= currentIdx
              const isCurrent = i === currentIdx
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'text-white shadow-lg' : 'bg-outline-variant/20 text-on-surface-variant'}`}
                      style={isActive ? { background: platformMeta.color } : {}}>
                      {isActive ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${isCurrent ? '' : 'text-on-surface-variant'}`}
                      style={isCurrent ? { color: platformMeta.color } : {}}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < currentIdx ? '' : 'bg-outline-variant/20'}`}
                      style={i < currentIdx ? { background: platformMeta.color } : {}}></div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-container rounded-2xl p-1.5">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">

          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <>
              {/* Description */}
              <div className="bg-surface-container-low rounded-3xl p-6">
                <h2 className="font-bold text-lg mb-3">Description</h2>
                <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{pool.description || 'No description provided.'}</p>
              </div>

              {/* Details */}
              <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
                <h2 className="font-bold text-lg mb-1">Details</h2>
                {pool.destination && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-container material-fill">location_on</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{pool.destination}</p>
                      <p className="text-xs text-on-surface-variant">Delivery / Pickup</p>
                    </div>
                  </div>
                )}
                {pool.scheduled_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary material-fill">schedule</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{new Date(pool.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                      <p className="text-xs text-on-surface-variant">{new Date(pool.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${platformMeta.color}15` }}>
                    {platformMeta.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{platformLabel}</p>
                    <p className="text-xs text-on-surface-variant">Platform</p>
                  </div>
                </div>
                {totalEstimated > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-tertiary material-fill">payments</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">~₹{totalEstimated.toFixed(0)} estimated total</p>
                      <p className="text-xs text-on-surface-variant">{items.length} items across {itemsByUser.length} participants</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Participants */}
              {pool.participants?.length > 0 && (
                <div className="bg-surface-container-low rounded-3xl p-6">
                  <h2 className="font-bold text-lg mb-4">Participants ({activeParticipants}/{pool.max_participants})</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {pool.participants.filter(p => p.status !== 'cancelled').map((p, i) => {
                      const isDesignatedOrderer = (pool.designated_orderer?._id || pool.designated_orderer) === (p.user?._id || p.user)
                      const pStatus = PAYMENT_STATUS_STYLES[p.payment_status]
                      return (
                        <div key={i} className="flex flex-col gap-2 bg-surface-container rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <img src={p.user?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-7 h-7 rounded-full" />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-medium truncate block">{p.user?.name || 'User'}</span>
                              {isDesignatedOrderer && <span className="text-[9px] font-bold uppercase" style={{ color: platformMeta.color }}>Orderer</span>}
                            </div>
                            <TrustBadge trust_score={p.user?.trust_score} trust_level={p.user?.trust_level} size="sm" />
                          </div>
                          {p.delivery_confirmed && <span className="text-[10px]" title="Delivery confirmed">✅ Delivered</span>}
                          {/* Orderer: Confirm payment for UTR-submitted participants */}
                          {isOrderer && p.payment_status === 'utr_submitted' && (
                            <div className="mt-1 space-y-1">
                              <p className="text-[10px] text-on-surface-variant">UTR: <strong>{p.utr_number}</strong></p>
                              <button
                                onClick={() => handleConfirmPayment(p.user?._id || p.user)}
                                disabled={confirmingPayment === (p.user?._id || p.user)}
                                className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white active:scale-95 transition-transform disabled:opacity-50"
                                style={{ background: '#03A6A1' }}
                              >
                                {confirmingPayment === (p.user?._id || p.user) ? 'Confirming...' : '✓ Confirm Payment'}
                              </button>
                            </div>
                          )}
                          {p.payment_status && p.payment_status !== 'unpaid' && p.payment_status !== 'utr_submitted' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: pStatus?.bg, color: pStatus?.color }}>
                              {pStatus?.label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {pool.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pool.tags.map((tag, i) => (
                    <span key={i} className="bg-surface-container text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ ITEMS TAB ═══ */}
          {activeTab === 'items' && (
            <>
              {/* Add Item Form — only for participants when pool is open/ordering */}
              {(isJoined || isCreator) && ['open', 'ordering'].includes(pool.status) && (
                <div className="bg-surface-container-low rounded-3xl p-6">
                  <h2 className="font-bold text-lg mb-4">🛒 Add Your Item</h2>
                  <form onSubmit={handleAddItem} className="space-y-3">
                    <div className="relative">
                      <input type="url" placeholder="Product URL (paste link from the platform)" value={productLink} onChange={e => setProductLink(e.target.value)} onBlur={handleLinkBlur} required
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none pr-10" />
                      {fetchingMeta && <span className="absolute right-3 top-3 material-symbols-outlined text-primary text-sm animate-spin">progress_activity</span>}
                    </div>
                    <input type="text" placeholder="Product name (auto-filled or enter manually)" value={productName} onChange={e => setProductName(e.target.value)}
                      className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                    <div className="grid grid-cols-3 gap-3">
                      <input type="number" placeholder="Qty" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" required
                        className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                      <select value={unit} onChange={e => setUnit(e.target.value)}
                        className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
                        <option value="piece">Piece</option>
                        <option value="kg">Kg</option>
                        <option value="litre">Litre</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                        <option value="dozen">Dozen</option>
                      </select>
                      <input type="number" placeholder="Price ₹ (est.)" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)} min="0" step="0.01"
                        className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                    </div>
                    <textarea placeholder="Notes for the orderer (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows="2"
                      className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none" />
                    <button type="submit" disabled={addingItem} className="px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#FF4F0F' }}>
                      {addingItem ? 'Adding...' : '+ Add Item'}
                    </button>
                  </form>
                </div>
              )}

              {/* Items grouped by user */}
              {itemsByUser.length === 0 ? (
                <div className="bg-surface-container-low rounded-3xl p-12 text-center">
                  <span className="material-symbols-outlined text-surface-container-highest text-6xl">shopping_cart</span>
                  <h3 className="font-bold text-lg mt-4">No items yet</h3>
                  <p className="text-on-surface-variant mt-2 text-sm">Join the pool and add your product links!</p>
                </div>
              ) : (
                itemsByUser.map(group => (
                  <div key={group.user._id} className="bg-surface-container-low rounded-3xl p-6">
                    {/* User header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-outline-variant/15">
                      <img src={group.user.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{group.user.name}</span>
                          {group.user.verified && <span className="material-symbols-outlined text-secondary text-sm material-fill">verified</span>}
                        </div>
                        <span className="text-xs text-on-surface-variant">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                      </div>
                      {group.total_estimated > 0 && (
                        <span className="text-sm font-bold" style={{ color: '#FF4F0F' }}>~₹{group.total_estimated.toFixed(0)}</span>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      {group.items.map(item => {
                        const isMyItem = (item.added_by?._id || item.added_by) === user?._id
                        const isEditing = editingItem?._id === item._id

                        return (
                          <div key={item._id} className="bg-surface-container rounded-2xl p-4 flex gap-3">
                            {/* Product image */}
                            {item.product_image && (
                              <img src={item.product_image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input type="text" value={editingItem.product_name} onChange={e => setEditingItem({ ...editingItem, product_name: e.target.value })}
                                    className="w-full bg-surface-container-low rounded-lg px-3 py-1.5 text-sm border-none outline-none" />
                                  <div className="flex gap-2">
                                    <input type="number" value={editingItem.quantity} onChange={e => setEditingItem({ ...editingItem, quantity: e.target.value })} min="1"
                                      className="w-16 bg-surface-container-low rounded-lg px-3 py-1.5 text-sm border-none outline-none" />
                                    <input type="number" value={editingItem.estimated_price || ''} onChange={e => setEditingItem({ ...editingItem, estimated_price: e.target.value })}
                                      placeholder="₹" className="w-20 bg-surface-container-low rounded-lg px-3 py-1.5 text-sm border-none outline-none" />
                                  </div>
                                  <textarea value={editingItem.notes || ''} onChange={e => setEditingItem({ ...editingItem, notes: e.target.value })} placeholder="Notes" rows="1"
                                    className="w-full bg-surface-container-low rounded-lg px-3 py-1.5 text-sm border-none outline-none resize-none" />
                                </div>
                              ) : (
                                <>
                                  <a href={item.product_link} target="_blank" rel="noopener noreferrer"
                                    className="text-sm font-bold hover:underline block truncate" style={{ color: '#FF4F0F' }}>
                                    {item.product_name || item.product_link}
                                  </a>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant flex-wrap">
                                    <span className="font-medium">Qty: {item.quantity} {item.unit}</span>
                                    {item.estimated_price > 0 && <span className="font-bold" style={{ color: '#03A6A1' }}>~₹{(item.estimated_price * item.quantity).toFixed(0)}</span>}
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: ITEM_STATUS_COLORS[item.status] || '#888' }}>
                                      {item.status}
                                    </span>
                                  </div>
                                  {item.notes && <p className="text-xs text-on-surface-variant mt-1.5 bg-surface-container-low rounded-lg px-2 py-1">💬 {item.notes}</p>}
                                  {item.orderer_note && <p className="text-xs mt-1 bg-primary-fixed rounded-lg px-2 py-1">📦 Orderer: {item.orderer_note}</p>}
                                  {item.substitution_name && (
                                    <p className="text-xs mt-1">🔄 Substituted: <a href={item.substitution_link} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline" style={{ color: '#2874F0' }}>{item.substitution_name}</a></p>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Actions */}
                            {isMyItem && ['open', 'ordering'].includes(pool.status) && (
                              <div className="flex flex-col gap-1 shrink-0">
                                <button onClick={() => handleEditItem(item)}
                                  className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-sm">
                                  {isEditing ? '✓' : '✏️'}
                                </button>
                                {!isEditing && (
                                  <button onClick={() => handleDeleteItem(item._id)}
                                    className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-error hover:text-white transition-colors text-sm">
                                    🗑️
                                  </button>
                                )}
                                {isEditing && (
                                  <button onClick={() => setEditingItem(null)}
                                    className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-error hover:text-white transition-colors text-sm">
                                    ✕
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ═══ ORDER TAB ═══ */}
          {activeTab === 'order' && (
            <>
              {/* Order Checklist for orderer */}
              {isOrderer && pool.status === 'ordering' && (
                <div className="bg-surface-container-low rounded-3xl p-6">
                  <h2 className="font-bold text-lg mb-2">📋 Order Checklist</h2>
                  <p className="text-on-surface-variant text-sm mb-4">Click each product link to open on {platformLabel}. Update status as you go.</p>

                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item._id} className="bg-surface-container rounded-2xl p-3 flex items-center gap-3 flex-wrap">
                        <a href={item.product_link} target="_blank" rel="noopener noreferrer"
                          className="font-bold text-sm hover:underline flex-1 min-w-0 truncate" style={{ color: '#FF4F0F' }}>
                          🛒 {item.product_name || 'Open Link'}
                        </a>
                        <span className="text-xs font-medium text-on-surface-variant whitespace-nowrap">× {item.quantity} {item.unit}</span>
                        <span className="text-xs text-on-surface-variant whitespace-nowrap">by {item.added_by?.name}</span>
                        {item.notes && <span className="text-xs text-on-surface-variant">💬 {item.notes}</span>}
                        <select value={item.status} onChange={(e) => handleUpdateItemStatus(item._id, e.target.value)}
                          className="bg-surface-container-high rounded-lg px-2 py-1 text-xs font-bold border-none outline-none">
                          <option value="pending">Pending</option>
                          <option value="ordered">Ordered ✅</option>
                          <option value="out_of_stock">Out of Stock ❌</option>
                          <option value="substituted">Substituted 🔄</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Submit Proof */}
                  <div className="mt-8 pt-6 border-t border-outline-variant/15">
                    <h3 className="font-bold text-base mb-4">📸 Submit Order Proof</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant mb-1 block">Screenshot (optional)</label>
                        <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])}
                          className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm border-none" />
                      </div>
                      <input type="text" placeholder="Order confirmation URL" value={proofOrderUrl} onChange={e => setProofOrderUrl(e.target.value)}
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                      <input type="text" placeholder="Order ID from platform" value={proofOrderId} onChange={e => setProofOrderId(e.target.value)}
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Your UPI ID (e.g. user@paytm)" value={proofUpiId} onChange={e => setProofUpiId(e.target.value)}
                          className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                        <input type="text" placeholder="UPI Name (on account)" value={proofUpiName} onChange={e => setProofUpiName(e.target.value)}
                          className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                      </div>
                      <textarea placeholder="Note to participants (optional)" value={proofNote} onChange={e => setProofNote(e.target.value)} rows="2"
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none" />
                      <button onClick={handleSubmitProof} disabled={submittingProof}
                        className="px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#FF4F0F' }}>
                        {submittingProof ? 'Submitting...' : '✅ Submit Proof & Notify Everyone'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Proof Section — visible when ordered/completed */}
              {['ordered', 'completed'].includes(pool.status) && pool.order_proof?.submitted_at && (
                <div className="rounded-3xl p-6 space-y-4" style={{ background: '#FFE3BB' }}>
                  <h2 className="font-bold text-lg" style={{ color: '#03A6A1' }}>📦 Order Proof</h2>
                  <p className="text-sm text-on-surface-variant">
                    Submitted by <strong>{pool.designated_orderer?.name || 'Orderer'}</strong> on {new Date(pool.order_proof.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>

                  {pool.order_proof.screenshot_url && (
                    <div>
                      <p className="text-xs font-bold mb-2">Screenshot:</p>
                      <img src={pool.order_proof.screenshot_url} alt="Order proof" className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity" style={{ border: '2px solid #03A6A1', maxHeight: '300px', objectFit: 'contain' }}
                        onClick={() => window.open(pool.order_proof.screenshot_url, '_blank')} />
                      <p className="text-[10px] text-on-surface-variant mt-1">Click to view full size</p>
                    </div>
                  )}

                  {pool.order_proof.order_url && (
                    <p className="text-sm">
                      <strong>Order Link: </strong>
                      <a href={pool.order_proof.order_url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline" style={{ color: '#FF4F0F' }}>{pool.order_proof.order_url}</a>
                    </p>
                  )}

                  {pool.order_proof.order_id_external && (
                    <p className="text-sm"><strong>Order ID:</strong> <code className="bg-white/50 px-2 py-0.5 rounded text-xs font-mono">{pool.order_proof.order_id_external}</code></p>
                  )}

                  {pool.order_proof.note && (
                    <p className="text-sm"><strong>Note:</strong> {pool.order_proof.note}</p>
                  )}

                  {/* UPI Info */}
                  {pool.order_proof.orderer_upi_id && (
                    <div className="rounded-xl p-3" style={{ background: '#FFF8E1', border: '1px solid #FFD54F' }}>
                      <p className="text-xs font-bold mb-1" style={{ color: '#F57F17' }}>💳 Pay to UPI</p>
                      <p className="text-sm font-bold">{pool.order_proof.orderer_upi_id}</p>
                      {pool.order_proof.orderer_upi_name && <p className="text-xs text-on-surface-variant">Name: {pool.order_proof.orderer_upi_name}</p>}
                    </div>
                  )}

                  {/* Verified by */}
                  <div className="pt-3 border-t border-black/10">
                    <p className="text-sm font-bold mb-2">
                      Confirmed: {pool.order_proof.verified_by?.length || 0} / {activeParticipants} participants
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pool.order_proof.verified_by?.map(u => (
                        <img key={u._id} src={u.avatar_url} alt={u.name} title={u.name}
                          className="w-8 h-8 rounded-full" style={{ border: '2px solid #03A6A1' }} />
                      ))}
                    </div>
                  </div>

                  {/* Confirm delivery button */}
                  {!myParticipantData?.delivery_confirmed && pool.status === 'ordered' && isJoined && (
                    <button onClick={handleConfirmDelivery}
                      className="px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-transform mt-2" style={{ background: '#03A6A1' }}>
                      ✅ I Received My Items
                    </button>
                  )}

                  {myParticipantData?.delivery_confirmed && (
                    <p className="font-bold text-sm mt-2" style={{ color: '#03A6A1' }}>✅ You confirmed delivery</p>
                  )}
                </div>
              )}

              {/* UPI Payment Section — for participants after delivery confirmed */}
              {myParticipantData?.delivery_confirmed && pool.order_proof?.orderer_upi_id && (
                <div className="bg-surface-container-low rounded-3xl p-6">
                  <h2 className="font-bold text-lg mb-4">💳 Payment</h2>
                  {myParticipantData.payment_status === 'unpaid' && (
                    <div className="space-y-3">
                      <div className="rounded-xl p-4" style={{ background: '#E3F2FD' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#1565C0' }}>Pay the orderer via UPI</p>
                        <p className="text-lg font-bold" style={{ color: '#1565C0' }}>{pool.order_proof.orderer_upi_id}</p>
                        {pool.order_proof.orderer_upi_name && <p className="text-xs text-on-surface-variant">Name: {pool.order_proof.orderer_upi_name}</p>}
                      </div>
                      <input type="text" placeholder="Enter UTR / Transaction Reference Number" value={utrInput} onChange={e => setUtrInput(e.target.value)}
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                      <button onClick={handleSubmitUtr} disabled={submittingUtr}
                        className="px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#03A6A1' }}>
                        {submittingUtr ? 'Submitting...' : 'Submit UTR'}
                      </button>
                    </div>
                  )}
                  {myParticipantData.payment_status === 'utr_submitted' && (
                    <div className="rounded-xl p-4 text-center" style={{ background: '#E3F2FD' }}>
                      <span className="material-symbols-outlined text-3xl mb-2" style={{ color: '#1565C0' }}>hourglass_top</span>
                      <p className="font-bold text-sm" style={{ color: '#1565C0' }}>Awaiting confirmation from orderer</p>
                      <p className="text-xs text-on-surface-variant mt-1">UTR: {myParticipantData.utr_number}</p>
                    </div>
                  )}
                  {myParticipantData.payment_status === 'paid' && (
                    <div className="rounded-xl p-4 text-center" style={{ background: '#E8F5E9' }}>
                      <span className="material-symbols-outlined text-3xl mb-2" style={{ color: '#2E7D32' }}>check_circle</span>
                      <p className="font-bold text-sm" style={{ color: '#2E7D32' }}>Payment Confirmed ✓</p>
                    </div>
                  )}
                  {myParticipantData.payment_status === 'disputed' && (
                    <div className="rounded-xl p-4 text-center" style={{ background: '#FFEBEE' }}>
                      <span className="material-symbols-outlined text-3xl mb-2" style={{ color: '#C62828' }}>error</span>
                      <p className="font-bold text-sm" style={{ color: '#C62828' }}>Payment Dispute Flagged</p>
                      <p className="text-xs text-on-surface-variant mt-1">Contact the orderer or platform admin to resolve.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {pool.status === 'open' && (
                <div className="bg-surface-container-low rounded-3xl p-12 text-center">
                  <span className="material-symbols-outlined text-surface-container-highest text-6xl">receipt_long</span>
                  <h3 className="font-bold text-lg mt-4">Order not started yet</h3>
                  <p className="text-on-surface-variant mt-2 text-sm">The pool creator will lock the pool and place the order once all items are added.</p>
                  {isCreator && items.length > 0 && (
                    <button onClick={handleLockPool} className="mt-4 px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg" style={{ background: '#FF4F0F' }}>
                      🔒 Lock Pool & Start Ordering
                    </button>
                  )}
                </div>
              )}

              {/* All items flat list */}
              {['ordered', 'completed'].includes(pool.status) && items.length > 0 && (
                <div className="bg-surface-container-low rounded-3xl p-6">
                  <h2 className="font-bold text-lg mb-4">📋 All Items</h2>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item._id} className="bg-surface-container rounded-2xl p-3 flex items-center gap-3">
                        <a href={item.product_link} target="_blank" rel="noopener noreferrer"
                          className="font-bold text-sm hover:underline truncate flex-1 min-w-0" style={{ color: '#FF4F0F' }}>
                          {item.product_name || item.product_link}
                        </a>
                        <span className="text-xs text-on-surface-variant whitespace-nowrap">× {item.quantity}</span>
                        <span className="text-xs text-on-surface-variant whitespace-nowrap">{item.added_by?.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: ITEM_STATUS_COLORS[item.status] || '#888' }}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-4">Created by</h3>
            <div className="flex items-center gap-3">
              <img src={pool.creator?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-12 h-12 rounded-2xl border-2 border-outline-variant/20" />
              <div>
                <p className="font-bold">{pool.creator?.name}</p>
                {pool.creator?.verified && <span className="material-symbols-outlined text-secondary text-sm material-fill">verified</span>}
              </div>
            </div>
            <div className="mt-2">
              <TrustBadge trust_score={pool.creator?.trust_score} trust_level={pool.creator?.trust_level} size="md" />
            </div>
          </div>

          {/* Progress */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-4">Pool Progress</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-extrabold">{activeParticipants}</span>
              <span className="text-on-surface-variant text-sm">/ {pool.max_participants}</span>
            </div>
            <div className="h-2 bg-outline-variant/20 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: platformMeta.color }} />
            </div>
            <div className="flex justify-between text-xs text-on-surface-variant mb-4">
              <span>{pool.max_participants - activeParticipants} spots left</span>
              <span className="font-bold">{items.length} items added</span>
            </div>
            {totalEstimated > 0 && (
              <div className="rounded-xl p-3 text-center" style={{ background: `${platformMeta.color}15` }}>
                <span className="text-xs text-on-surface-variant">Estimated Total</span>
                <p className="text-xl font-extrabold" style={{ color: platformMeta.color }}>₹{totalEstimated.toFixed(0)}</p>
              </div>
            )}
          </div>

          {/* Orderer info */}
          {isCreator && pool.status === 'open' && (
            <div className="bg-surface-container-low rounded-3xl p-6">
              <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-4">Designated Orderer</h3>
              <select
                value={(pool.designated_orderer?._id || pool.designated_orderer || '').toString()}
                onChange={e => handleDesignateOrderer(e.target.value)}
                className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
                {pool.participants?.filter(p => p.status !== 'cancelled').map(p => (
                  <option key={p.user?._id || p.user} value={(p.user?._id || p.user).toString()}>
                    {p.user?.name || 'User'}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-on-surface-variant mt-2">This person will place the combined order on {platformLabel}.</p>
            </div>
          )}

          {/* CTA */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            {isCreator ? (
              <div className="space-y-3">
                <div className="text-center py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold">Your Pool</div>
                {pool.status === 'open' && items.length > 0 && (
                  <button onClick={handleLockPool} className="w-full py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: '#FF4F0F' }}>
                    🔒 Lock Pool & Start Ordering
                  </button>
                )}
              </div>
            ) : isJoined ? (
              <div className="space-y-3">
                <div className="text-center py-3 rounded-xl bg-secondary-container text-on-secondary-container font-bold">Joined ✓</div>
                {['open'].includes(pool.status) && (
                  <button onClick={handleLeave} className="w-full py-2.5 rounded-xl border-2 border-error/30 text-error font-bold text-sm hover:bg-error hover:text-white transition-all">Leave Pool</button>
                )}
              </div>
            ) : pool.status === 'open' ? (
              <button onClick={handleJoin} disabled={joining} className="w-full py-3 rounded-xl primary-gradient text-white font-bold text-base shadow-lg active:scale-95 transition-transform disabled:opacity-50">
                {joining ? 'Joining...' : 'Join Pool'}
              </button>
            ) : (
              <div className="text-center py-3 rounded-xl font-bold" style={{
                background: pool.status === 'cancelled' ? '#ffdad6' : '#FFE3BB',
                color: pool.status === 'cancelled' ? '#ba1a1a' : '#4f2000'
              }}>
                Pool is {STATUS_LABELS[pool.status]}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
