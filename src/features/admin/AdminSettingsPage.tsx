import { useState } from 'react'
import { Settings, Building, CreditCard, Shield, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [bankDetails, setBankDetails] = useState({
    accountName: 'Nityamani Wholesale Traders',
    accountNumber: '50200088991122',
    ifsc: 'HDFC0001234',
    bankName: 'HDFC Bank, Surat Ring Road Branch',
    upiId: 'nityamani@hdfcbank',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Payment instructions & settings saved!')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-brand-blue">System Settings</h1>
        <p className="text-sm text-text-muted">
          Configure default wholesale bank account details and buyer payment instructions
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-surface-border rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 text-brand-blue font-semibold border-b border-surface-border pb-3">
          <CreditCard className="w-5 h-5 text-brand-red" />
          <span>B2B Bank Transfer Details (Shown to Buyers on Orders)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Beneficiary Name</label>
            <input
              type="text"
              value={bankDetails.accountName}
              onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-white text-brand-blue focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Bank Name & Branch</label>
            <input
              type="text"
              value={bankDetails.bankName}
              onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-white text-brand-blue focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Current Account Number</label>
            <input
              type="text"
              value={bankDetails.accountNumber}
              onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-white text-brand-blue focus:ring-1 focus:ring-brand-red font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">IFSC Code</label>
            <input
              type="text"
              value={bankDetails.ifsc}
              onChange={e => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-white text-brand-blue focus:ring-1 focus:ring-brand-red font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted mb-1">Business UPI ID</label>
            <input
              type="text"
              value={bankDetails.upiId}
              onChange={e => setBankDetails({ ...bankDetails, upiId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-white text-brand-blue focus:ring-1 focus:ring-brand-red font-mono"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-surface-border flex justify-end">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Bank Configuration
          </button>
        </div>
      </form>
    </div>
  )
}
