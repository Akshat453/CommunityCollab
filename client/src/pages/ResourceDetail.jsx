import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import TrustBadge from '../components/TrustBadge'

const typeIcons = { tool: 'build', workspace: 'meeting_room', vehicle: 'directions_car', meal: 'restaurant', groceries: 'shopping_cart', other: 'category' }

const REQUEST_STATUS_STYLES = {
  pending: { bg: '#FFF8E1', color: '#F57F17', label: 'Pending' },
  approved: { bg: '#E3F2FD', color: '#1565C0', label: 'Approved' },
  rejected: { bg: '#FFEBEE', color: '#C62828', label: 'Rejected' },
  returned: { bg: '#E8F5E9', color: '#2E7D32', label: 'Returned' },
  utr_submitted: { bg: '#E3F2FD', color: '#1565C0', label: 'UTR Submitted' },
  payment_confirmed: { bg: '#E8F5E9', color: '#2E7D32', label: 'Payment Confirmed ✓' },
}

export default function ResourceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requesting, setRequesting] = useState(false)
  const [requestForm, setRequestForm] = useState({ message: '', start_date: '', end_date: '' })
  const [showRequestForm, setShowRequestForm] = useState(false)

  // Actions state
  const [actionLoading, setActionLoading] = useState(null)
  const [utrInputs, setUtrInputs] = useState({})
  const [approveUpi, setApproveUpi] = useState({ upi_id: '', upi_name: '' })

  const fetchResource = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/resources/${id}`)
      setResource(data.data)
    } catch (err) { setError(err.response?.data?.message || 'Failed to load resource') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchResource() }, [id])

  const handleRequest = async (e) => {
    e.preventDefault()
    setRequesting(true)
    try {
      await api.post(`/resources/${id}/request`, requestForm)
      setShowRequestForm(false)
      fetchResource()
      alert('Request sent!')
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    finally { setRequesting(false) }
  }

  const handleApprove = async (requestId) => {
    setActionLoading(`approve-${requestId}`)
    try {
      const payload = {}
      if (approveUpi.upi_id) payload.owner_upi_id = approveUpi.upi_id
      if (approveUpi.upi_name) payload.owner_upi_name = approveUpi.upi_name
      await api.patch(`/resources/${id}/requests/${requestId}/approve`, payload)
      setApproveUpi({ upi_id: '', upi_name: '' })
      fetchResource()
    } catch (err) { alert(err.response?.data?.message || 'Failed to approve') }
    finally { setActionLoading(null) }
  }

  const handleReject = async (requestId) => {
    setActionLoading(`reject-${requestId}`)
    try {
      await api.patch(`/resources/${id}/requests/${requestId}/reject`)
      fetchResource()
    } catch (err) { alert(err.response?.data?.message || 'Failed to reject') }
    finally { setActionLoading(null) }
  }

  const handleReturn = async (requestId) => {
    setActionLoading(`return-${requestId}`)
    try {
      await api.post(`/resources/${id}/requests/${requestId}/return`)
      fetchResource()
    } catch (err) { alert(err.response?.data?.message || 'Failed to return') }
    finally { setActionLoading(null) }
  }

  const handleSubmitUtr = async (requestId) => {
    const utr = utrInputs[requestId]
    if (!utr?.trim()) { alert('Please enter a UTR number'); return }
    setActionLoading(`utr-${requestId}`)
    try {
      await api.post(`/resources/${id}/requests/${requestId}/submit-utr`, { utr_number: utr.trim() })
      setUtrInputs(prev => ({ ...prev, [requestId]: '' }))
      fetchResource()
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit UTR') }
    finally { setActionLoading(null) }
  }

  const handleConfirmPayment = async (requestId) => {
    setActionLoading(`confirm-${requestId}`)
    try {
      await api.patch(`/resources/${id}/requests/${requestId}/confirm-payment`)
      fetchResource()
    } catch (err) { alert(err.response?.data?.message || 'Failed to confirm payment') }
    finally { setActionLoading(null) }
  }

  if (loading) return <div className="max-w-4xl mx-auto flex justify-center py-32"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>
  if (error) return <div className="max-w-4xl mx-auto text-center py-32"><span className="material-symbols-outlined text-error text-6xl mb-4">error</span><h2 className="text-xl font-bold mb-2">Error</h2><p className="text-on-surface-variant mb-6">{error}</p><button onClick={() => navigate('/resources')} className="primary-gradient text-white px-6 py-2.5 rounded-xl font-bold shadow-lg">Back</button></div>
  if (!resource) return null

  const isOwner = (resource.owner?._id || resource.owner) === user?._id

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/resources')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm font-medium mb-6 group">
        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span> Back to Resources
      </button>

      {/* Warning Banner */}
      <div className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2" style={{ background: '#FFF8E1', border: '1px solid #FFD54F' }}>
        <span className="material-symbols-outlined text-sm" style={{ color: '#F57F17' }}>warning</span>
        <p className="text-xs font-medium" style={{ color: '#F57F17' }}>
          All transactions are logged. Fraudulent activity will result in account suspension and legal action.
        </p>
      </div>

      <div className="bg-surface-container-low rounded-3xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-on-secondary-container material-fill text-3xl">{typeIcons[resource.type] || 'category'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">{resource.type}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${resource.status === 'available' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>{resource.status}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tighter">{resource.title}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h2 className="font-bold text-lg mb-3">Description</h2>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{resource.description || 'No description provided.'}</p>
          </div>
          <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
            <h2 className="font-bold text-lg mb-1">Details</h2>
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-primary material-fill">sell</span></div><div><p className="text-sm font-bold">{resource.is_free ? 'Free to borrow' : `₹${resource.price_per_day}/day`}</p><p className="text-xs text-on-surface-variant">Pricing</p></div></div>
            {resource.condition && <div className="flex items-center gap-3"><div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-on-secondary-container material-fill">verified</span></div><div><p className="text-sm font-bold capitalize">{resource.condition}</p><p className="text-xs text-on-surface-variant">Condition</p></div></div>}
            {resource.location?.city && <div className="flex items-center gap-3"><div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-tertiary material-fill">location_on</span></div><div><p className="text-sm font-bold">{resource.location.city}</p><p className="text-xs text-on-surface-variant">Location</p></div></div>}
          </div>

          {/* Borrow Requests */}
          {resource.requests?.length > 0 && (
            <div className="bg-surface-container-low rounded-3xl p-6">
              <h2 className="font-bold text-lg mb-4">Borrow Requests ({resource.requests.length})</h2>
              <div className="space-y-4">
                {resource.requests.map((r, i) => {
                  const isMyRequest = (r.requester?._id || r.requester) === user?._id
                  const statusStyle = REQUEST_STATUS_STYLES[r.status] || REQUEST_STATUS_STYLES.pending
                  return (
                    <div key={r._id || i} className="bg-surface-container rounded-xl p-4 space-y-3">
                      {/* Request header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={r.requester?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="text-sm font-bold">{r.requester?.name || 'User'}</p>
                            <p className="text-xs text-on-surface-variant">{r.message}</p>
                          </div>
                          <TrustBadge trust_score={r.requester?.trust_score} trust_level={r.requester?.trust_level} size="sm" />
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
                      </div>

                      {/* Owner actions for pending requests */}
                      {isOwner && r.status === 'pending' && (
                        <div className="space-y-2 pt-2 border-t border-outline-variant/10">
                          {!resource.is_free && (
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="Your UPI ID (optional)" value={approveUpi.upi_id} onChange={e => setApproveUpi({ ...approveUpi, upi_id: e.target.value })}
                                className="bg-surface-container-low rounded-lg px-3 py-2 text-xs border-none outline-none" />
                              <input type="text" placeholder="UPI Name" value={approveUpi.upi_name} onChange={e => setApproveUpi({ ...approveUpi, upi_name: e.target.value })}
                                className="bg-surface-container-low rounded-lg px-3 py-2 text-xs border-none outline-none" />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(r._id)} disabled={actionLoading === `approve-${r._id}`}
                              className="flex-1 py-2 rounded-lg font-bold text-white text-xs active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#03A6A1' }}>
                              {actionLoading === `approve-${r._id}` ? 'Approving...' : '✓ Approve'}
                            </button>
                            <button onClick={() => handleReject(r._id)} disabled={actionLoading === `reject-${r._id}`}
                              className="flex-1 py-2 rounded-lg font-bold text-white text-xs active:scale-95 transition-transform disabled:opacity-50 bg-error">
                              {actionLoading === `reject-${r._id}` ? 'Rejecting...' : '✕ Reject'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Borrower: Mark as returned */}
                      {isMyRequest && r.status === 'approved' && (
                        <div className="pt-2 border-t border-outline-variant/10">
                          <button onClick={() => handleReturn(r._id)} disabled={actionLoading === `return-${r._id}`}
                            className="w-full py-2.5 rounded-xl font-bold text-white text-sm active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#03A6A1' }}>
                            {actionLoading === `return-${r._id}` ? 'Returning...' : '📦 Mark as Returned'}
                          </button>
                        </div>
                      )}

                      {/* Borrower: Submit UTR after return (paid resources) */}
                      {isMyRequest && r.status === 'returned' && !resource.is_free && (
                        <div className="pt-2 border-t border-outline-variant/10 space-y-2">
                          {r.owner_upi_id && (
                            <div className="rounded-lg p-3" style={{ background: '#E3F2FD' }}>
                              <p className="text-xs font-bold" style={{ color: '#1565C0' }}>Pay owner via UPI</p>
                              <p className="text-sm font-bold mt-1" style={{ color: '#1565C0' }}>{r.owner_upi_id}</p>
                              {r.owner_upi_name && <p className="text-xs text-on-surface-variant">Name: {r.owner_upi_name}</p>}
                            </div>
                          )}
                          <input type="text" placeholder="Enter UTR / Transaction ID" value={utrInputs[r._id] || ''} onChange={e => setUtrInputs({ ...utrInputs, [r._id]: e.target.value })}
                            className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm border-none outline-none" />
                          <button onClick={() => handleSubmitUtr(r._id)} disabled={actionLoading === `utr-${r._id}`}
                            className="w-full py-2.5 rounded-xl font-bold text-white text-sm active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#03A6A1' }}>
                            {actionLoading === `utr-${r._id}` ? 'Submitting...' : 'Submit UTR'}
                          </button>
                        </div>
                      )}

                      {/* Borrower: UTR pending */}
                      {isMyRequest && r.status === 'utr_submitted' && (
                        <div className="rounded-lg p-3 text-center" style={{ background: '#E3F2FD' }}>
                          <p className="text-xs font-bold" style={{ color: '#1565C0' }}>Awaiting payment confirmation from owner</p>
                          <p className="text-[10px] text-on-surface-variant mt-1">UTR: {r.utr_number}</p>
                        </div>
                      )}

                      {/* Owner: Confirm payment */}
                      {isOwner && r.status === 'utr_submitted' && (
                        <div className="pt-2 border-t border-outline-variant/10 space-y-2">
                          <div className="rounded-lg p-3" style={{ background: '#E3F2FD' }}>
                            <p className="text-xs font-bold" style={{ color: '#1565C0' }}>UTR received</p>
                            <p className="text-sm font-bold mt-1">{r.utr_number}</p>
                          </div>
                          <button onClick={() => handleConfirmPayment(r._id)} disabled={actionLoading === `confirm-${r._id}`}
                            className="w-full py-2.5 rounded-xl font-bold text-white text-sm active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#03A6A1' }}>
                            {actionLoading === `confirm-${r._id}` ? 'Confirming...' : '✓ Confirm Payment Received'}
                          </button>
                        </div>
                      )}

                      {/* Payment confirmed */}
                      {r.status === 'payment_confirmed' && (
                        <div className="rounded-lg p-3 text-center" style={{ background: '#E8F5E9' }}>
                          <span className="material-symbols-outlined text-xl" style={{ color: '#2E7D32' }}>check_circle</span>
                          <p className="text-xs font-bold mt-1" style={{ color: '#2E7D32' }}>Payment Confirmed ✓</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-4">Shared by</h3>
            <div className="flex items-center gap-3">
              <img src={resource.owner?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-12 h-12 rounded-2xl border-2 border-outline-variant/20" />
              <div><p className="font-bold">{resource.owner?.name}</p>{resource.owner?.verified && <span className="material-symbols-outlined text-secondary text-sm material-fill">verified</span>}</div>
            </div>
            <div className="mt-2">
              <TrustBadge trust_score={resource.owner?.trust_score} trust_level={resource.owner?.trust_level} size="md" />
            </div>
            {resource.owner?.bio && <p className="text-xs text-on-surface-variant line-clamp-3 mt-3">{resource.owner.bio}</p>}
          </div>
          <div className="bg-surface-container-low rounded-3xl p-6">
            {isOwner ? <div className="text-center py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold">Your Resource</div>
            : resource.status !== 'available' ? <div className="text-center py-3 rounded-xl bg-error-container text-on-error-container font-bold">Unavailable</div>
            : !showRequestForm ? <button onClick={() => setShowRequestForm(true)} className="w-full py-3 rounded-xl primary-gradient text-white font-bold text-base shadow-lg active:scale-95 transition-transform">Request Access</button>
            : <form onSubmit={handleRequest} className="space-y-3">
                <input type="date" value={requestForm.start_date} onChange={e => setRequestForm({...requestForm, start_date: e.target.value})} required className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                <input type="date" value={requestForm.end_date} onChange={e => setRequestForm({...requestForm, end_date: e.target.value})} required className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                <textarea value={requestForm.message} onChange={e => setRequestForm({...requestForm, message: e.target.value})} placeholder="Message to owner..." className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none h-20" />
                <button type="submit" disabled={requesting} className="w-full py-2.5 rounded-xl primary-gradient text-white font-bold text-sm shadow-lg disabled:opacity-50">{requesting ? 'Sending...' : 'Send Request'}</button>
                <button type="button" onClick={() => setShowRequestForm(false)} className="w-full py-2 rounded-xl bg-surface-container text-on-surface-variant font-bold text-sm">Cancel</button>
              </form>}
          </div>
        </div>
      </div>
    </div>
  )
}
