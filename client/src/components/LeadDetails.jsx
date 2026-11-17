
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Trash2,
  Plus,
  LoaderCircle,
  User,
  Globe,
  AlertCircle,
} from 'lucide-react'
import api from '../api/axios'

function formatDate(date) {
  if (!date) return 'Not set'

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getDateInputValue(date) {
  if (!date) return ''

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return ''

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function LeadDetails({
  leadId,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [savingDate, setSavingDate] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [success, setSuccess] = useState('')

  async function fetchLead() {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(`/leads/${leadId}`)
      const leadData = response.data.lead || response.data

      setLead(leadData)
      setFollowUpDate(getDateInputValue(leadData.followUpDate))
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load lead details. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLead()
  }, [leadId])

  async function handleSaveFollowUp(e) {
    e.preventDefault()

    try {
      setSavingDate(true)
      setError('')
      setSuccess('')

      await api.patch(`/leads/${leadId}`, {
        followUpDate: followUpDate || null,
      })

      await fetchLead()
      setSuccess('Follow-up date updated successfully.')
      onUpdated?.()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update follow-up date.'
      )
    } finally {
      setSavingDate(false)
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()

    const trimmedNote = noteText.trim()

    if (!trimmedNote) {
      setError('Please enter a note before submitting.')
      return
    }

    try {
      setSavingNote(true)
      setError('')
      setSuccess('')

      await api.post(`/leads/${leadId}/notes`, {
        text: trimmedNote,
      })

      setNoteText('')
      await fetchLead()
      setSuccess('Note added successfully.')
      onUpdated?.()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to add note.'
      )
    } finally {
      setSavingNote(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${lead?.name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      setError('')

      await api.delete(`/leads/${leadId}`)
      onDeleted?.()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete this lead.'
      )
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-gray-400">
        <LoaderCircle className="mr-2 animate-spin" size={22} />
        Loading lead details...
      </div>
    )
  }

  if (error && !lead) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>

        <button
          onClick={onClose}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (!lead) return null

  const notes = Array.isArray(lead.notes) ? lead.notes : []

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5"
        >
          <ArrowLeft size={17} />
          Back to Leads
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          {deleting ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          Delete Lead
        </button>
      </div>

      <div>
        <p className="mb-1 text-sm text-gray-500">Lead Management</p>
        <h1 className="text-2xl font-bold text-white">
          {lead.name}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Lead details and communication history
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-white/10 bg-[#111114] p-5">
            <h2 className="mb-5 text-lg font-semibold text-white">
              Contact Information
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                  <User size={14} /> Full Name
                </p>
                <p className="text-sm text-gray-200">{lead.name}</p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={14} /> Email Address
                </p>
                <p className="break-all text-sm text-gray-200">
                  {lead.email || 'Not provided'}
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={14} /> Phone Number
                </p>
                <p className="text-sm text-gray-200">
                  {lead.phone || 'Not provided'}
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                  <Globe size={14} /> Lead Source
                </p>
                <p className="text-sm capitalize text-gray-200">
                  {lead.source || 'Website'}
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={14} /> Created On
                </p>
                <p className="text-sm text-gray-200">
                  {formatDate(lead.createdAt)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs text-gray-500">
                  Current Status
                </p>
                <span className="inline-block rounded-full bg-blue-500/10 px-3 py-1 text-xs capitalize text-blue-400">
                  {lead.status || 'new'}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                <MessageSquare size={14} /> Message
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
                {lead.message || 'No message provided.'}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#111114] p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Notes & Activity
            </h2>

            <form onSubmit={handleAddNote}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write an update about this lead..."
                rows={3}
                maxLength={2000}
                className="w-full resize-y rounded-lg border border-white/10 bg-[#09090b] p-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingNote || !noteText.trim()}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingNote ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Add Note
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-4">
              {notes.length === 0 ? (
                <p className="rounded-lg bg-white/[0.03] p-4 text-center text-sm text-gray-500">
                  No notes yet. Add your first note above.
                </p>
              ) : (
                [...notes].reverse().map((note, index) => (
                  <div
                    key={note._id || index}
                    className="border-l-2 border-blue-500/50 pl-4"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
                      {note.text}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-[#111114] p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-400" />
              <h2 className="text-base font-semibold text-white">
                Follow-up Schedule
              </h2>
            </div>

            <p className="mb-4 text-sm text-gray-400">
              Set a date to remind yourself to contact this lead.
            </p>

            <form onSubmit={handleSaveFollowUp}>
              <label className="mb-2 block text-xs text-gray-500">
                Follow-up Date
              </label>

              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-3 text-sm text-white outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={savingDate}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {savingDate && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                Save Follow-up
              </button>
            </form>

            <div className="mt-5 rounded-lg bg-white/[0.03] p-3">
              <p className="text-xs text-gray-500">Scheduled Date</p>
              <p className="mt-1 text-sm font-medium text-gray-200">
                {formatDate(lead.followUpDate)}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#111114] p-5">
            <h2 className="mb-3 text-base font-semibold text-white">
              Lead Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Status</span>
                <span className="capitalize text-gray-200">
                  {lead.status || 'new'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Total Notes</span>
                <span className="text-gray-200">{notes.length}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-200">
                  {formatDate(lead.createdAt)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
