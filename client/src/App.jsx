
import { useState, useMemo, useEffect, useCallback } from 'react'
import Login from './components/Login'
import AddLead from './components/AddLead'
import LeadDetails from './components/LeadDetails'
import api from './api/axios'

import {
  LayoutDashboard,
  Users,
  UserPlus,
  TrendingUp,
  Search,
  CalendarDays,
  ArrowUpRight,
  Menu,
  X,
  Filter,
  Download,
  Plus,
  Mail,
  Phone,
  Clock3,
  LogOut,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react'

const avatarColors = [
  'bg-violet-500/15 text-violet-300',
  'bg-pink-500/15 text-pink-300',
  'bg-cyan-500/15 text-cyan-300',
  'bg-amber-500/15 text-amber-300',
  'bg-emerald-500/15 text-emerald-300',
]

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function formatDate(date) {
  if (!date) return '—'

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function App() {
  const [admin, setAdmin] = useState(null)
  const [authChecking, setAuthChecking] = useState(true)

  const [leads, setLeads] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)

  const [loadingLeads, setLoadingLeads] = useState(false)
  const [dashboardError, setDashboardError] = useState('')

  const [activePage, setActivePage] = useState('Overview')
  const [selectedLeadId, setSelectedLeadId] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [mobileMenu, setMobileMenu] = useState(false)

  // Verify authentication
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('crm_token')

      if (!token) {
        setAuthChecking(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        setAdmin(response.data.admin)
      } catch {
        localStorage.removeItem('crm_token')
      } finally {
        setAuthChecking(false)
      }
    }

    checkAuth()
  }, [])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoadingLeads(true)
    setDashboardError('')

    try {
      const [leadsResponse, statsResponse] = await Promise.all([
        api.get('/leads', {
          params: { page: 1, limit: 100 },
        }),
        api.get('/leads/stats'),
      ])

      setLeads(leadsResponse.data.leads || [])
      setDashboardStats(statsResponse.data)
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout()
        return
      }

      setDashboardError(
        error.response?.data?.message ||
        'Unable to load dashboard data. Please try again.'
      )
    } finally {
      setLoadingLeads(false)
    }
  }, [])

  useEffect(() => {
    if (admin) {
      fetchDashboardData()
    }
  }, [admin, fetchDashboardData])

  function handleLogout() {
    localStorage.removeItem('crm_token')
    setAdmin(null)
    setLeads([])
    setDashboardStats(null)
    setSelectedLeadId(null)
    setActivePage('Overview')
  }

  // Update lead status
  async function updateStatus(id, status) {
    try {
      await api.patch(`/leads/${id}`, { status })
      await fetchDashboardData()
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Unable to update lead status.'
      )
    }
  }

  // Open lead details
  function openLeadDetails(id) {
    setSelectedLeadId(id)
    setMobileMenu(false)
  }

  // Close lead details
  function closeLeadDetails() {
    setSelectedLeadId(null)
  }

  // Delete callback
  async function handleLeadDeleted() {
    setSelectedLeadId(null)
    await fetchDashboardData()
  }

  // Search and filter
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchText = search.toLowerCase()

      const matchesSearch =
        (lead.name || '').toLowerCase().includes(searchText) ||
        (lead.email || '').toLowerCase().includes(searchText) ||
        (lead.phone || '').toLowerCase().includes(searchText)

      const matchesStatus =
        statusFilter === 'all' || lead.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [leads, search, statusFilter])

  const total = dashboardStats?.total ?? leads.length
  const newThisWeek = dashboardStats?.newThisWeek ?? 0
  const converted = dashboardStats?.converted ?? 0
  const conversionRate = dashboardStats?.conversionRate ?? 0

  const newCount = dashboardStats?.byStatus?.new ?? 0
  const contactedCount = dashboardStats?.byStatus?.contacted ?? 0
  const convertedCount = dashboardStats?.byStatus?.converted ?? 0

  const stats = [
    {
      label: 'Total Leads',
      value: total,
      icon: Users,
      color: 'text-violet-300',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'New This Week',
      value: newThisWeek,
      icon: UserPlus,
      color: 'text-cyan-300',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Converted Leads',
      value: converted,
      icon: TrendingUp,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: ArrowUpRight,
      color: 'text-amber-300',
      bg: 'bg-amber-500/10',
    },
  ]

  const navigation = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'All Leads', icon: Users },
    { label: 'Add Lead', icon: UserPlus },
  ]

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090b12] text-slate-300">
        <div className="text-center">
          <RefreshCw
            className="mx-auto mb-3 animate-spin text-violet-400"
            size={28}
          />
          <p className="text-sm">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return <Login onLogin={setAdmin} />
  }

  const pageTitle = selectedLeadId ? 'Lead Details' : activePage

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">

      {mobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.07] bg-[#0e111b] transition-transform duration-300 lg:translate-x-0 ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/[0.07] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20">
              <TrendingUp size={22} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                LeadFlow
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                CRM Platform
              </p>
            </div>
          </div>

          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setMobileMenu(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-8">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {
                  setSelectedLeadId(null)
                  setActivePage(label)
                  setMobileMenu(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  !selectedLeadId && activePage === label
                    ? 'bg-violet-600/15 text-violet-300'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}

                {label === 'All Leads' && (
                  <span className="ml-auto rounded-md bg-white/[0.07] px-2 py-0.5 text-xs">
                    {total}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <TrendingUp size={18} />
            </div>

            <p className="text-sm font-semibold">Grow your business</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Keep track of every conversation and never miss a follow-up.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-white/[0.07] pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
              {getInitials(admin.email)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {admin.email}
              </p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="min-h-screen lg:ml-64">

        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/[0.07] bg-[#090b12]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="text-slate-300 lg:hidden"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-xs text-slate-500">
                Workspace / {pageTitle}
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {pageTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              title="Refresh dashboard"
              className="rounded-xl border border-white/[0.08] p-2.5 text-slate-400 hover:bg-white/[0.05]"
            >
              <RefreshCw
                size={17}
                className={loadingLeads ? 'animate-spin' : ''}
              />
            </button>

            <div className="hidden items-center gap-2 border-l border-white/[0.08] pl-4 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-200">
                {getInitials(admin.email)}
              </div>
              <span className="max-w-48 truncate text-sm font-medium">
                {admin.email}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-8 p-5 sm:p-8">

          {/* Lead Details page */}
          {selectedLeadId ? (
            <LeadDetails
              leadId={selectedLeadId}
              onClose={closeLeadDetails}
              onUpdated={fetchDashboardData}
              onDeleted={handleLeadDeleted}
            />
          ) : activePage === 'Add Lead' ? (
            <AddLead
              onLeadAdded={async () => {
                await fetchDashboardData()
                setActivePage('All Leads')
              }}
              onCancel={() => setActivePage('Overview')}
            />
          ) : (
            <>
              {/* Welcome */}
              <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm text-slate-400">
                    {new Date().toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    Welcome back, Admin <span>✦</span>
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Here's what's happening with your leads today.
                  </p>
                </div>

                <button
                  onClick={() => setActivePage('Add Lead')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
                >
                  <Plus size={18} />
                  Add New Lead
                </button>
              </section>

              {dashboardError && (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                  <p>{dashboardError}</p>
                  <button
                    onClick={fetchDashboardData}
                    className="shrink-0 font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Statistics */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(({ label, value, icon: Icon, color, bg }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/[0.07] bg-[#10131e] p-5 transition hover:border-violet-400/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}>
                        <Icon size={20} />
                      </div>
                      <span className="text-xs text-slate-500">
                        Live data
                      </span>
                    </div>

                    <p className="mt-5 text-sm text-slate-400">{label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">
                      {value}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      From your database
                    </p>
                  </div>
                ))}
              </section>

              {/* Pipeline and insights */}
              <section className="grid gap-5 xl:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.07] bg-[#10131e] p-5 xl:col-span-2 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Lead activity</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Your lead pipeline at a glance
                      </p>
                    </div>

                    <span className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-slate-300">
                      All time
                    </span>
                  </div>

                  <div className="mt-7 grid grid-cols-3 gap-3">
                    {[
                      { label: 'New', count: newCount, color: 'bg-violet-400' },
                      { label: 'Contacted', count: contactedCount, color: 'bg-cyan-400' },
                      { label: 'Converted', count: convertedCount, color: 'bg-emerald-400' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl bg-white/[0.025] p-3 sm:p-4"
                      >
                        <div className={`mb-3 h-1.5 w-8 rounded-full ${item.color}`} />
                        <p className="text-xs text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                          {item.count}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/[0.05]">
                    {total > 0 && (
                      <>
                        <div
                          className="bg-violet-400 transition-all"
                          style={{ width: `${(newCount / total) * 100}%` }}
                        />
                        <div
                          className="bg-cyan-400 transition-all"
                          style={{ width: `${(contactedCount / total) * 100}%` }}
                        />
                        <div
                          className="bg-emerald-400 transition-all"
                          style={{ width: `${(convertedCount / total) * 100}%` }}
                        />
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-400">
                    <span>
                      <i className="mr-2 inline-block h-2 w-2 rounded-full bg-violet-400" />
                      New
                    </span>
                    <span>
                      <i className="mr-2 inline-block h-2 w-2 rounded-full bg-cyan-400" />
                      Contacted
                    </span>
                    <span>
                      <i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      Converted
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#10131e] p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Quick insights</h3>
                    <TrendingUp size={18} className="text-violet-300" />
                  </div>

                  <div className="mt-6 space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300">
                        <Users size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Lead pipeline</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {total} leads are currently in your workspace.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-amber-500/10 p-2 text-amber-300">
                        <Clock3 size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Follow-up reminder
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {dashboardStats?.dueFollowUps ?? 0} follow-ups are due.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300">
                        <TrendingUp size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Conversion progress
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {converted} leads have converted so far.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Leads table */}
              <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#10131e]">
                <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:p-6">
                  <div>
                    <h3 className="font-semibold">
                      {activePage === 'All Leads' ? 'All leads' : 'Recent leads'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Manage and track your prospects
                    </p>
                  </div>

                  <button
                    onClick={() => setActivePage('All Leads')}
                    className="text-left text-xs font-semibold text-violet-300 hover:text-violet-200"
                  >
                    View all leads →
                  </button>
                </div>

                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div className="relative flex-1">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, email or phone..."
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0b0e17] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/50"
                    />
                  </div>

                  <div className="relative">
                    <Filter
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0b0e17] py-2.5 pl-9 pr-8 text-sm text-slate-300 outline-none focus:border-violet-500/50 sm:w-44"
                    >
                      <option value="all">All statuses</option>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const csv = [
                        ['Name', 'Email', 'Phone', 'Source', 'Status', 'Date Added'],
                        ...filteredLeads.map((lead) => [
                          lead.name,
                          lead.email,
                          lead.phone || '',
                          lead.source,
                          lead.status,
                          formatDate(lead.createdAt),
                        ]),
                      ]
                        .map((row) =>
                          row.map((value) =>
                            `"${String(value ?? '').replace(/"/g, '""')}"`
                          ).join(',')
                        )
                        .join('\n')

                      const blob = new Blob([csv], {
                        type: 'text/csv;charset=utf-8;',
                      })

                      const url = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = 'leadflow-leads.csv'
                      link.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04]"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>

                {loadingLeads ? (
                  <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-400">
                    <RefreshCw size={18} className="animate-spin" />
                    Loading leads from database...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead className="bg-white/[0.025] text-[10px] uppercase tracking-[0.15em] text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            Lead / Contact
                          </th>
                          <th className="px-6 py-4 font-semibold">Source</th>
                          <th className="px-6 py-4 font-semibold">Date Added</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/[0.05]">
                        {filteredLeads.map((lead, index) => (
                          <tr
                            key={lead._id}
                            className="transition hover:bg-white/[0.02]"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColors[index % avatarColors.length]}`}
                                >
                                  {getInitials(lead.name)}
                                </div>

                                <div>
                                  <p className="text-sm font-semibold">
                                    {lead.name}
                                  </p>
                                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                    <Mail size={12} />
                                    {lead.email}
                                  </p>

                                  {lead.phone && (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                      <Phone size={12} />
                                      {lead.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm capitalize text-slate-400">
                              {lead.source || 'website'}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-400">
                              <span className="flex items-center gap-2">
                                <CalendarDays size={14} />
                                {formatDate(lead.createdAt)}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <select
                                value={lead.status}
                                onChange={(e) =>
                                  updateStatus(lead._id, e.target.value)
                                }
                                className={`rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 py-2 text-xs font-semibold outline-none ${
                                  lead.status === 'new'
                                    ? 'text-violet-300'
                                    : lead.status === 'contacted'
                                      ? 'text-cyan-300'
                                      : 'text-emerald-300'
                                }`}
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="converted">Converted</option>
                              </select>
                            </td>

                            <td className="px-6 py-4">
                              <button
                                onClick={() => openLeadDetails(lead._id)}
                                title="View lead details"
                                className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-white"
                              >
                                <MoreHorizontal size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {filteredLeads.length === 0 && (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-6 py-12 text-center text-sm text-slate-500"
                            >
                              {leads.length === 0
                                ? 'No leads in your database yet.'
                                : 'No leads match your search.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-col justify-between gap-3 border-t border-white/[0.07] px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
                  <p>Showing {filteredLeads.length} of {total} leads</p>
                  <p>Connected to MongoDB · Live API data</p>
                </div>
              </section>
            </>
          )}

          <p className="pb-4 text-center text-xs text-slate-600">
            LeadFlow CRM · Secure Admin Dashboard
          </p>
        </div>
      </main>
    </div>
  )
}

export default App

