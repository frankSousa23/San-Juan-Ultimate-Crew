import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { accountsApi, categoriesApi, transactionsApi, getAuthToken } from '../lib/api'
import { Account, Category, TransactionItem, TransactionType } from '../types/finance'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from '../components/ConfirmModal'

export default function Finances() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<TransactionItem[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [type, setType] = useState<'' | TransactionType>('')
  const [accountId, setAccountId] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [summary, setSummary] = useState<{ income: number; expense: number; balance: number } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TransactionItem | null>(null)
  const [form, setForm] = useState<any>({ type: 'INCOME', amountCents: 0, occurredAt: '', accountId: '', categoryId: '' })
  const [acctModal, setAcctModal] = useState(false)
  const [acctForm, setAcctForm] = useState<any>({ name: '', type: 'CASH' })
  const [catModal, setCatModal] = useState(false)
  const [catForm, setCatForm] = useState<any>({ name: '', kind: 'INCOME' })
  const [detailItem, setDetailItem] = useState<TransactionItem | null>(null)
  const toasts = useToast()
  const { hasPermission } = useAuth()
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => Promise<void> } | null>(null)
  const authed = !!getAuthToken() && hasPermission('finance:manage')

  // API hooks
  const { execute: loadTransactions, loading, error: apiError } = useApi(transactionsApi.list, {
    onSuccess: (data) => {
      setItems(data.items)
      setTotal(data.total)
    },
    showErrorToast: true
  })

  const { execute: loadSummary } = useApi(transactionsApi.summary, {
    onSuccess: (data) => setSummary(data),
    showErrorToast: true
  })

  const { execute: createTransaction } = useApi(transactionsApi.create, {
    onSuccess: () => {
      setModalOpen(false)
      load()
      toasts.showSuccessToast('Transacción creada exitosamente')
    },
    showErrorToast: true
  })

  const { execute: updateTransaction } = useApi(transactionsApi.update, {
    onSuccess: () => {
      setModalOpen(false)
      load()
      toasts.showSuccessToast('Transacción actualizada exitosamente')
    },
    showErrorToast: true
  })

  const { execute: deleteTransaction } = useApi(transactionsApi.remove, {
    onSuccess: () => {
      load()
      toasts.showSuccessToast('Transacción eliminada exitosamente')
    },
    showErrorToast: true
  })

  const { execute: createAccount } = useApi(accountsApi.create, {
    onSuccess: (data) => {
      setAccounts(prev => [...prev, data])
      setAccountId(data.id)
      setAcctModal(false)
      setAcctForm({ name: '', type: 'CASH' })
      toasts.showSuccessToast('Cuenta creada')
    },
    showErrorToast: true
  })

  const { execute: createCategory } = useApi(categoriesApi.create, {
    onSuccess: (data) => {
      setCategories(prev => [...prev, data])
      setCategoryId(data.id)
      setCatModal(false)
      setCatForm({ name: '', kind: 'INCOME' })
      toasts.showSuccessToast('Categoría creada')
    },
    showErrorToast: true
  })

  useEffect(() => {
    Promise.all([accountsApi.list(), categoriesApi.list()]).then(([as, cs]) => { setAccounts(as); setCategories(cs) })
  }, [])

  // Seed from URL
  useEffect(() => {
    const sFrom = searchParams.get('from') || ''
    const sTo = searchParams.get('to') || ''
    const sType = (searchParams.get('type') || '') as '' | TransactionType
    const sAccountId = searchParams.get('accountId')
    const sCategoryId = searchParams.get('categoryId')
    const sLimit = parseInt(searchParams.get('limit') || '')
    const sPage = parseInt(searchParams.get('page') || '')

    if (sFrom !== from) setFrom(sFrom)
    if (sTo !== to) setTo(sTo)
    if (sType !== type) setType(sType)
    if (sAccountId && Number(sAccountId) !== accountId) setAccountId(Number(sAccountId))
    if (!sAccountId && accountId !== '') setAccountId('')
    if (sCategoryId && Number(sCategoryId) !== categoryId) setCategoryId(Number(sCategoryId))
    if (!sCategoryId && categoryId !== '') setCategoryId('')
    if (!Number.isNaN(sLimit) && sLimit >= 5 && sLimit <= 200 && sLimit !== limit) setLimit(sLimit)
    if (!Number.isNaN(sPage) && sPage >= 1) {
      const newOffset = (sPage - 1) * (Number.isNaN(sLimit) ? limit : sLimit)
      if (newOffset !== offset) setOffset(newOffset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Seed limit from localStorage if not in URL
  useEffect(() => {
    if (!searchParams.get('limit')) {
      const saved = localStorage.getItem('finances.limit')
      if (saved) {
        const n = parseInt(saved)
        if (!Number.isNaN(n) && n >= 5 && n <= 200) {
          const params = new URLSearchParams(searchParams)
          params.set('limit', String(n))
          params.set('page', '1')
          setSearchParams(params)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    const params: any = { limit, offset }
    if (from) params.from = new Date(from).toISOString()
    if (to) params.to = new Date(to).toISOString()
    if (type) params.type = type
    if (accountId) params.accountId = accountId
    if (categoryId) params.categoryId = categoryId
    
    await loadTransactions(params)
    await loadSummary({ from: params.from, to: params.to })
  }

  useEffect(() => { load() }, [limit, offset])

  const pages = useMemo(() => Math.ceil(total / limit), [total, limit])

  const openCreate = () => { if (!authed) return; setEditing(null); setForm({ type: 'INCOME', amountCents: 0, occurredAt: '', accountId: '', categoryId: '' }); setModalOpen(true) }
  const openEdit = (it: TransactionItem) => { if (!authed) return; setEditing(it); setForm({ ...it, occurredAt: it.occurredAt.slice(0,16) }) ; setModalOpen(true) }

  const save = async () => {
    const payload: any = { ...form }
    if (payload.occurredAt) payload.occurredAt = new Date(payload.occurredAt).toISOString()
    payload.amountCents = Number(payload.amountCents)
    payload.accountId = Number(payload.accountId)
    if (payload.categoryId === '') delete payload.categoryId
    
    if (editing) {
      await updateTransaction(editing.id, payload)
    } else {
      await createTransaction(payload)
    }
  }

  const remove = async (id: number) => {
    if (!authed) return
    setConfirmState({
      message: '¿Eliminar transacción? Esta acción no se puede deshacer.',
      onYes: async () => {
        await deleteTransaction(id)
      }
    })
  }

  const exportCsv = async () => {
    // Fetch all items respecting current filters
    try {
      const params: any = {}
      if (from) params.from = new Date(from).toISOString()
      if (to) params.to = new Date(to).toISOString()
      if (type) params.type = type
      if (accountId) params.accountId = accountId
      if (categoryId) params.categoryId = categoryId
      const batch = 200
      let off = 0
      let all: TransactionItem[] = []
       
      while (true) {
        const r = await transactionsApi.list({ ...params, limit: batch, offset: off })
        all = all.concat(r.items)
        off += r.items.length
        if (r.items.length < batch) break
      }
      const headers = ['Fecha','Tipo','Cuenta','Categoría','Monto','Descripción']
      const rows = all.map(it => [
        new Date(it.occurredAt).toISOString(),
        it.type === 'INCOME' ? 'Ingreso' : it.type === 'EXPENSE' ? 'Egreso' : 'Transferencia',
        it.account?.name || String(it.accountId),
        it.category?.name || (it.categoryId ?? ''),
        (it.amountCents/100).toFixed(2),
        (it.description || '').replace(/\r?\n/g,' ')
      ])
      const csv = [headers, ...rows].map(r => r.map(v => {
        const s = String(v)
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s
      }).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
      a.download = `transacciones-${ts}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.message || 'No se pudo exportar CSV')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Finanzas</h2>
      </div>
      {!authed && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 text-sm">Inicia sesión para crear, editar o eliminar transacciones, cuentas y categorías.</div>
      )}

      {(error || apiError) && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 flex items-start justify-between">
          <div className="pr-3">{error || apiError}</div>
          <div className="flex gap-2 shrink-0">
            <button className="px-2 py-1 bg-rose-100 rounded" onClick={() => load()}>Reintentar</button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Ingresos</div>
          <div className="text-2xl font-semibold text-emerald-700">{summary ? (summary.income/100).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Egresos</div>
          <div className="text-2xl font-semibold text-red-700">{summary ? (summary.expense/100).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Balance</div>
          <div className="text-2xl font-semibold text-indigo-700">{summary ? (summary.balance/100).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—'}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Desde</label>
          <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Hasta</label>
          <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tipo</label>
          <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
            <option value="">Todos</option>
            <option value="INCOME">Ingresos</option>
            <option value="EXPENSE">Egresos</option>
            <option value="TRANSFER">Transferencias</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1 flex items-center justify-between">Cuenta {authed && (<button type="button" className="text-indigo-600 text-xs underline" onClick={() => setAcctModal(true)}>Nueva</button>)}</label>
          <select value={accountId} onChange={e => setAccountId(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border rounded-lg">
            <option value="">Todas</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1 flex items-center justify-between">Categoría {authed && (<button type="button" className="text-indigo-600 text-xs underline" onClick={() => setCatModal(true)}>Nueva</button>)}</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border rounded-lg">
            <option value="">Todas</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const params: Record<string, string> = {}
              if (from) params.from = from
              if (to) params.to = to
              if (type) params.type = type
              if (accountId) params.accountId = String(accountId)
              if (categoryId) params.categoryId = String(categoryId)
              params.limit = String(limit)
              params.page = '1'
              setOffset(0)
              setSearchParams(params)
              load()
            }}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg" disabled={loading}
          >{loading ? 'Cargando…' : 'Aplicar'}</button>
          {authed && (<button onClick={openCreate} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg">+ Agregar</button>)}
          <button onClick={exportCsv} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg">Exportar CSV</button>
          <button
            onClick={() => {
              setFrom(''); setTo(''); setType(''); setAccountId(''); setCategoryId(''); setOffset(0); setLimit(20)
              localStorage.removeItem('finances.limit')
              setSearchParams({ page: '1', limit: '20' })
              load()
            }}
            className="px-3 py-2 bg-gray-100 rounded-lg"
          >Limpiar</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle sm:px-0">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-2 sm:px-4 py-2">Fecha</th>
                  <th className="text-left px-2 sm:px-4 py-2">Tipo</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden md:table-cell">Cuenta</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden lg:table-cell">Categoría</th>
                  <th className="text-right px-2 sm:px-4 py-2">Monto</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden xl:table-cell">Descripción</th>
                  <th className="px-2 sm:px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-t hover:bg-gray-50/70 transition-colors">
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm">
                      <button onClick={() => setDetailItem(it)} className="text-left font-medium text-indigo-900 hover:text-indigo-600 hover:underline">
                        {new Date(it.occurredAt).toLocaleString()}
                      </button>
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        it.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        it.type === 'EXPENSE' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {it.type === 'INCOME' ? 'Ingreso' : it.type === 'EXPENSE' ? 'Egreso' : 'Transferencia'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 hidden md:table-cell text-gray-700">{it.account?.name || it.accountId}</td>
                    <td className="px-2 sm:px-4 py-2 hidden lg:table-cell text-gray-600">{it.category?.name || (it.categoryId ? `Cat #${it.categoryId}` : '-')}</td>
                    <td className="px-2 sm:px-4 py-2 text-right whitespace-nowrap font-medium">
                      <span className={it.type === 'INCOME' ? 'text-emerald-600' : it.type === 'EXPENSE' ? 'text-rose-600' : 'text-blue-600'}>
                        {it.type === 'INCOME' ? '+' : it.type === 'EXPENSE' ? '-' : ''}{(it.amountCents/100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 hidden xl:table-cell text-gray-500 max-w-xs truncate">{it.description || '-'}</td>
                    <td className="px-2 sm:px-4 py-2">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-end">
                        <button onClick={() => setDetailItem(it)} className="text-xs text-gray-600 hover:text-indigo-600 border border-gray-200 rounded px-1.5 py-0.5 sm:px-2 sm:py-1 whitespace-nowrap">
                          Ver
                        </button>
                        {authed && <button onClick={() => openEdit(it)} className="text-indigo-700 hover:underline text-xs sm:text-sm whitespace-nowrap">Editar</button>}
                        {authed && <button onClick={() => remove(it.id)} className="text-red-700 hover:underline text-xs sm:text-sm whitespace-nowrap">Eliminar</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No hay transacciones para el filtro.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-2 text-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="whitespace-nowrap">Total: {total}</div>
            <label className="flex items-center gap-1 whitespace-nowrap">Por página:
              <select
                className="border rounded px-2 py-1 text-sm"
                value={limit}
                onChange={e => {
                  const n = Number(e.target.value)
                  setOffset(0); setLimit(n)
                  localStorage.setItem('finances.limit', String(n))
                  const params = new URLSearchParams(searchParams)
                  params.set('limit', String(n))
                  params.set('page', '1')
                  if (from) params.set('from', from); else params.delete('from')
                  if (to) params.set('to', to); else params.delete('to')
                  if (type) params.set('type', type); else params.delete('type')
                  if (accountId) params.set('accountId', String(accountId)); else params.delete('accountId')
                  if (categoryId) params.set('categoryId', String(categoryId)); else params.delete('categoryId')
                  setSearchParams(params)
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={offset===0}
              onClick={() => {
                const newOffset = Math.max(0, offset - limit)
                const newPage = Math.floor(newOffset/limit)+1
                setOffset(newOffset)
                const params = new URLSearchParams(searchParams)
                params.set('page', String(newPage))
                params.set('limit', String(limit))
                if (from) params.set('from', from); else params.delete('from')
                if (to) params.set('to', to); else params.delete('to')
                if (type) params.set('type', type); else params.delete('type')
                if (accountId) params.set('accountId', String(accountId)); else params.delete('accountId')
                if (categoryId) params.set('categoryId', String(categoryId)); else params.delete('categoryId')
                setSearchParams(params)
              }}
              className="px-2 py-1 border rounded disabled:opacity-50 whitespace-nowrap text-sm"
            >Prev</button>
            <div className="whitespace-nowrap text-sm">Página {Math.floor(offset/limit)+1} de {Math.max(1, pages)}</div>
            <button
              disabled={(offset+limit)>=total}
              onClick={() => {
                const newOffset = offset + limit
                const newPage = Math.floor(newOffset/limit)+1
                setOffset(newOffset)
                const params = new URLSearchParams(searchParams)
                params.set('page', String(newPage))
                params.set('limit', String(limit))
                if (from) params.set('from', from); else params.delete('from')
                if (to) params.set('to', to); else params.delete('to')
                if (type) params.set('type', type); else params.delete('type')
                if (accountId) params.set('accountId', String(accountId)); else params.delete('accountId')
                if (categoryId) params.set('categoryId', String(categoryId)); else params.delete('categoryId')
                setSearchParams(params)
              }}
              className="px-2 py-1 border rounded disabled:opacity-50 whitespace-nowrap text-sm"
            >Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white p-4">
              <div className="text-lg font-bold">{editing ? 'Editar' : 'Nueva'} Transacción</div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="INCOME">Ingreso</option>
                  <option value="EXPENSE">Egreso</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Monto (centavos)</label>
                <input type="number" value={form.amountCents} onChange={e => setForm((f: any) => ({ ...f, amountCents: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                <input type="datetime-local" value={form.occurredAt} onChange={e => setForm((f: any) => ({ ...f, occurredAt: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cuenta</label>
                <select value={form.accountId} onChange={e => setForm((f: any) => ({ ...f, accountId: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Selecciona</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Categoría</label>
                <select value={form.categoryId} onChange={e => setForm((f: any) => ({ ...f, categoryId: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Descripción</label>
                <input value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="p-4 flex gap-2">
              <button onClick={save} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg">Guardar</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {acctModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAcctModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 text-white p-3 font-semibold">Nueva Cuenta</div>
            <div className="p-4 grid gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input value={acctForm.name} onChange={e => setAcctForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                <select value={acctForm.type} onChange={e => setAcctForm((f: any) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="CASH">Efectivo</option>
                  <option value="BANK">Banco</option>
                  <option value="MOBILE">Billetera</option>
                </select>
              </div>
            </div>
            <div className="p-4 flex gap-2">
              <button
                onClick={() => createAccount({ name: String(acctForm.name || '').trim(), type: acctForm.type })}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg"
              >Guardar</button>
              <button onClick={() => setAcctModal(false)} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCatModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 text-white p-3 font-semibold">Nueva Categoría</div>
            <div className="p-4 grid gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input value={catForm.name} onChange={e => setCatForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                <select value={catForm.kind} onChange={e => setCatForm((f: any) => ({ ...f, kind: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="INCOME">Ingreso</option>
                  <option value="EXPENSE">Egreso</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
            </div>
            <div className="p-4 flex gap-2">
              <button
                onClick={() => createCategory({ name: String(catForm.name || '').trim(), kind: catForm.kind })}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg"
              >Guardar</button>
              <button onClick={() => setCatModal(false)} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={`p-4 text-white flex items-center justify-between ${
              detailItem.type === 'INCOME' ? 'bg-gradient-to-r from-emerald-600 to-teal-700' :
              detailItem.type === 'EXPENSE' ? 'bg-gradient-to-r from-rose-600 to-pink-700' :
              'bg-gradient-to-r from-blue-600 to-indigo-700'
            }`}>
              <div>
                <div className="text-xs uppercase tracking-wider opacity-90">Detalle de Transacción</div>
                <div className="text-xl font-bold">
                  {detailItem.type === 'INCOME' ? 'Ingreso' : detailItem.type === 'EXPENSE' ? 'Egreso' : 'Transferencia'} #{detailItem.id}
                </div>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-white/80 hover:text-white text-xl font-bold p-1">✕</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
                <div>
                  <span className="text-xs text-gray-500 block uppercase">Monto Total</span>
                  <span className={`text-2xl font-black ${
                    detailItem.type === 'INCOME' ? 'text-emerald-600' :
                    detailItem.type === 'EXPENSE' ? 'text-rose-600' : 'text-blue-600'
                  }`}>
                    {detailItem.type === 'INCOME' ? '+' : detailItem.type === 'EXPENSE' ? '-' : ''}
                    {(detailItem.amountCents/100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block uppercase">Fecha y Hora</span>
                  <span className="font-semibold text-gray-800">{new Date(detailItem.occurredAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs text-gray-500 block mb-1">Cuenta</span>
                  <span className="font-medium text-gray-800">{detailItem.account?.name || `Cuenta #${detailItem.accountId}`}</span>
                  {detailItem.account?.type && (
                    <span className="text-xs text-gray-500 block mt-0.5">Tipo: {detailItem.account.type}</span>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs text-gray-500 block mb-1">Categoría</span>
                  <span className="font-medium text-gray-800">{detailItem.category?.name || 'Sin categoría'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <span className="text-xs text-gray-500 block mb-1">Descripción / Concepto</span>
                <p className="text-gray-800 whitespace-pre-wrap">{detailItem.description || 'Sin descripción adicional.'}</p>
              </div>

              <div className="pt-2 flex gap-2">
                {authed && (
                  <button
                    onClick={() => {
                      const itemToEdit = detailItem
                      setDetailItem(null)
                      openEdit(itemToEdit)
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition"
                  >
                    Editar Transacción
                  </button>
                )}
                <button
                  onClick={() => setDetailItem(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* global toasts via ToastProvider */}
      {confirmState && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={confirmState.message}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => { await confirmState.onYes(); setConfirmState(null) }}
        />
      )}
    </div>
  )
}
