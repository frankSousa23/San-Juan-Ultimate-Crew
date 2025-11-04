import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { accountsApi, categoriesApi, transactionsApi, getAuthToken } from '../lib/api'
import { Account, Category, TransactionItem, TransactionType } from '../types/finance'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'
import ConfirmModal from '../components/ConfirmModal'

export default function Finances() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<TransactionItem[]>([])
  const [total, setTotal] = useState(0)
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
  const toasts = useToast()
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => Promise<void> } | null>(null)
  const authed = !!getAuthToken()

  // API hooks
  const { execute: loadTransactions, loading, error } = useApi(transactionsApi.list, {
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
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const r = await transactionsApi.list({ ...params, limit: batch, offset: off })
        all = all.concat(r.items)
        off += r.items.length
        if (r.items.length < batch) break
      }
      const headers = ['Fecha','Tipo','Cuenta','Categoría','Monto','Descripción']
      const rows = all.map(it => [
        new Date(it.occurredAt).toISOString(),
        it.type,
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
      <h2 className="text-2xl font-bold text-gray-800">Finanzas</h2>
      {!authed && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 text-sm">Inicia sesión para crear, editar o eliminar transacciones, cuentas y categorías.</div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 flex items-start justify-between">
          <div className="pr-3">{error}</div>
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
      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
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
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Cuenta</th>
                <th className="text-left px-4 py-2">Categoría</th>
                <th className="text-right px-4 py-2">Monto</th>
                <th className="text-left px-4 py-2">Descripción</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">{new Date(it.occurredAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{it.type}</td>
                  <td className="px-4 py-2">{it.account?.name || it.accountId}</td>
                  <td className="px-4 py-2">{it.category?.name || (it.categoryId ?? '')}</td>
                  <td className="px-4 py-2 text-right">{(it.amountCents/100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                  <td className="px-4 py-2">{it.description || ''}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    {authed && <button onClick={() => openEdit(it)} className="text-indigo-700 hover:underline">Editar</button>}
                    {authed && <button onClick={() => remove(it.id)} className="text-red-700 hover:underline">Eliminar</button>}
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
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2 text-sm">
          <div className="flex items-center gap-3">
            <div>Total: {total}</div>
            <label className="flex items-center gap-1">Por página:
              <select
                className="border rounded px-2 py-1"
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
              className="px-2 py-1 border rounded disabled:opacity-50"
            >Prev</button>
            <div>Página {Math.floor(offset/limit)+1} de {Math.max(1, pages)}</div>
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
              className="px-2 py-1 border rounded disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setAcctModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setCatModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
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
