import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Building2, Phone, Mail, MapPin, ShieldCheck, LogOut, FileText, Edit2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function CustomerProfilePage() {
  const { profile, businessProfile, signOut, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    business_name: businessProfile?.business_name ?? '',
    gst_number: businessProfile?.gst_number ?? '',
    billing_address: businessProfile?.billing_address ?? '',
    city: businessProfile?.city ?? '',
    state: businessProfile?.state ?? '',
    pin_code: businessProfile?.pin_code ?? '',
  })

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)
    try {
      // Update profile
      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', profile.id)
      
      if (pErr) throw pErr

      // Update business profile
      if (businessProfile) {
        const { error: bErr } = await supabase
          .from('business_profiles')
          .update({
            business_name: formData.business_name,
            gst_number: formData.gst_number,
            billing_address: formData.billing_address,
            city: formData.city,
            state: formData.state,
            pin_code: formData.pin_code,
          })
          .eq('profile_id', profile.id)
        
        if (bErr) throw bErr
      }

      await refreshProfile()
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (err: any) {
      toast.error('Failed to update profile: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = () => {
    setFormData({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      business_name: businessProfile?.business_name ?? '',
      gst_number: businessProfile?.gst_number ?? '',
      billing_address: businessProfile?.billing_address ?? '',
      city: businessProfile?.city ?? '',
      state: businessProfile?.state ?? '',
      pin_code: businessProfile?.pin_code ?? '',
    })
    setIsEditing(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-main">Wholesale Account</h1>
          <p className="text-sm text-text-muted">Your registered buyer details & tax verification</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-secondary btn-sm flex gap-2">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        )}
      </div>



      {/* Account Overview Card */}
      <div className="card p-6 bg-white space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-white font-bold text-xl shadow-brand-yellow">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              {isEditing ? (
                <input 
                  value={formData.full_name} 
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                  className="field-input py-1 px-2 text-lg font-bold" 
                  placeholder="Full Name" 
                />
              ) : (
                <h2 className="text-lg font-bold text-text-main">{profile?.full_name}</h2>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('badge text-xs flex items-center gap-1', profile?.status === 'active' ? 'badge-green' : 'badge-gray')}>
                  <ShieldCheck className="w-3.5 h-3.5" /> 
                  {profile?.status === 'active' ? 'Active Wholesale Partner' : 'Account Pending Review'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-bg/70 border border-surface-border opacity-70">
            <Mail className="w-4 h-4 text-brand-red shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-text-light">Email Address (Read-only)</p>
              <p className="text-sm font-medium text-text-main truncate">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-bg/70 border border-surface-border">
            <Phone className="w-4 h-4 text-brand-red shrink-0" />
            <div className="min-w-0 w-full">
              <p className="text-xs text-text-light">Mobile Phone</p>
              {isEditing ? (
                <input 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  className="field-input py-1 px-2 text-sm w-full" 
                  placeholder="Phone" 
                />
              ) : (
                <p className="text-sm font-medium text-text-main">{profile?.phone || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Business Profile Details */}
      <div className="card p-6 bg-white space-y-4">
        <div className="flex items-center gap-2 text-text-main font-semibold border-b border-surface-border pb-3">
          <Building2 className="w-5 h-5 text-brand-red" />
          <span>Business & Billing Information</span>
        </div>

        <div className="space-y-4 pt-1">
          <div>
            <p className="text-xs text-text-light mb-1">Business / Firm Name</p>
            {isEditing ? (
              <input 
                value={formData.business_name} 
                onChange={e => setFormData({ ...formData, business_name: e.target.value })} 
                className="field-input w-full" 
              />
            ) : (
              <p className="text-sm font-semibold text-text-main">{businessProfile?.business_name || 'N/A'}</p>
            )}
          </div>

          <div>
            <p className="text-xs text-text-light mb-1">GSTIN / Tax ID</p>
            {isEditing ? (
              <input 
                value={formData.gst_number} 
                onChange={e => setFormData({ ...formData, gst_number: e.target.value })} 
                className="field-input w-full" 
                placeholder="Optional"
              />
            ) : (
              <p className="text-sm font-mono font-medium text-text-main">
                {businessProfile?.gst_number || 'Unregistered / Under Evaluation'}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-text-light mb-1">Registered Billing Address</p>
            {isEditing ? (
              <div className="space-y-2">
                <input 
                  value={formData.billing_address} 
                  onChange={e => setFormData({ ...formData, billing_address: e.target.value })} 
                  className="field-input w-full" 
                  placeholder="Street Address"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    value={formData.city} 
                    onChange={e => setFormData({ ...formData, city: e.target.value })} 
                    className="field-input w-full" 
                    placeholder="City"
                  />
                  <input 
                    value={formData.pin_code} 
                    onChange={e => setFormData({ ...formData, pin_code: e.target.value })} 
                    className="field-input w-full" 
                    placeholder="PIN Code"
                  />
                </div>
                <input 
                  value={formData.state} 
                  onChange={e => setFormData({ ...formData, state: e.target.value })} 
                  className="field-input w-full" 
                  placeholder="State"
                />
              </div>
            ) : (
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="w-4 h-4 text-text-light shrink-0 mt-0.5" />
                <p className="text-sm text-text-main leading-relaxed">
                  {businessProfile?.billing_address}
                  <br />
                  {businessProfile?.city}, {businessProfile?.state} — {businessProfile?.pin_code}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="flex gap-3">
          <button onClick={cancelEdit} className="btn-outline flex-1 justify-center py-3" disabled={isSaving}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1 justify-center py-3" disabled={isSaving}>
            {isSaving ? <span className="nm-spinner" /> : <><Check className="w-4 h-4 mr-2" /> Save Profile</>}
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noreferrer"
            className="btn-outline flex-1 justify-center py-3 bg-white"
          >
            <FileText className="w-4 h-4 mr-2" /> Contact Wholesale Support
          </a>
          <button
            onClick={signOut}
            className="btn-ghost flex-1 justify-center py-3 text-red-600 border border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
