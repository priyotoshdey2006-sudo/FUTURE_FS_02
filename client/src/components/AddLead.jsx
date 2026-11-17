
import { useState } from 'react'
import { UserPlus, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import api from '../api/axios'

function AddLead({ onLeadAdded, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    source: 'website',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await api.post('/leads', form)

      setSuccess(true)
      setForm({
        name: '',
        email: '',
        phone: '',
        message: '',
        source: 'website',
      })

      if (onLeadAdded) {
        await onLeadAdded()
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to create lead. Please check your information.'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0b0e17] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60'

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={onCancel}
        className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={17} />
        Back to dashboard
      </button>

      <div className="rounded-2xl border border-white/[0.07] bg-[#10131e] p-6 sm:p-8">
        <div className="mb-7 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <UserPlus size={23} />
          </div>

          <div>
            <h2 className="text-xl font-bold">Add New Lead</h2>
            <p className="mt-1 text-sm text-slate-400">
              Enter the details of your new prospect.
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 size={19} />
            Lead successfully added to your CRM!
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-300">
              Full Name *
            </label>
            <input
              className={inputClass}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              maxLength={100}
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300">
                Email Address *
              </label>
              <input
                className={inputClass}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                maxLength={200}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">
                Phone Number
              </label>
              <input
                className={inputClass}
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                maxLength={30}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">
              Lead Source
            </label>
            <select
              className={inputClass}
              name="source"
              value={form.source}
              onChange={handleChange}
            >
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social">Social Media</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">
              Message
            </label>
            <textarea
              className={inputClass}
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Write the lead's message..."
              rows={4}
              maxLength={3000}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-white/[0.08] px-5 py-3 text-sm text-slate-300 hover:bg-white/[0.04]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Create Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddLead
