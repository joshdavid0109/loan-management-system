// src/components/CreditorsManagement.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import type { Creditor, Loan } from '../types/loan';
import { formatCurrency } from '../utils/loanCalculations';
import {
  fetchCreditorsWithStats,
  fetchLoansByCreditor,
  createCreditor,
  updateCreditor,
  deleteCreditor,
  type CreditorStat
} from '../services/creditorsService.ts';

const CreditorsManagement: React.FC = () => {
  const [creditors, setCreditors] = useState<CreditorStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCreditor, setSelectedCreditor] = useState<CreditorStat | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCreditor, setEditingCreditor] = useState<Partial<Creditor> | null>(null);

  const [loansForCreditor, setLoansForCreditor] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  // load aggregated creditors
  const loadCreditors = async () => {
    setLoading(true);
    const { data, error } = await fetchCreditorsWithStats();
    if (error) {
      console.error('Failed to load creditors', error);
      alert('Failed to load creditors. See console for details.');
      setCreditors([]);
    } else if (data) {
      setCreditors(data);
    } else {
      setCreditors([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCreditors();
  }, []);

  const filteredCreditors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return creditors;
    return creditors.filter((c) =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q) ||
      String(c.creditor_id).includes(q)
    );
  }, [creditors, searchTerm]);

  const handleViewCreditor = async (c: CreditorStat) => {
    setSelectedCreditor(c);
    setShowModal(true);

    // fetch loans for this creditor live
    setLoadingLoans(true);
    const { data, error } = await fetchLoansByCreditor(c.creditor_id);
    if (error) {
      console.error('Failed to fetch loans for creditor', error);
      setLoansForCreditor([]);
      alert('Failed to fetch loans for this creditor.');
    } else if (data) {
      setLoansForCreditor(data);
    } else {
      setLoansForCreditor([]);
    }
    setLoadingLoans(false);
  };

  const handleEditCreditor = (c: CreditorStat) => {
    setEditingCreditor({
      creditor_id: c.creditor_id,
      first_name: c.first_name,
      last_name: c.last_name,
      gender: c.gender,
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      total_capital: c.total_capital ?? 0
    });
    setShowAddModal(true);
  };


  const handleDeleteCreditor = async (creditorId: number) => {
    if (!window.confirm('Delete creditor? This will remove the creditor record.')) return;
    setActionLoading(true);

    // optimistic removal (we'll reload on success or rollback on fail)
    const prev = creditors;
    setCreditors(prev.filter((c) => c.creditor_id !== creditorId));

    const { error } = await deleteCreditor(creditorId);
    if (error) {
      console.error('Delete failed', error);
      alert('Delete failed. Rolling back.');
      setCreditors(prev);
    } else {
      // success: optionally reload to refresh aggregates
      await loadCreditors();
    }
    setActionLoading(false);
  };

  const handleSaveCreditor = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingCreditor) return;

    // basic validation
    if (!editingCreditor.first_name || !editingCreditor.last_name) {
      alert('First and last name are required.');
      return;
    }

    setActionLoading(true);

    try {
      if (editingCreditor.creditor_id && editingCreditor.creditor_id > 0) {
        // update
      const { creditor_id, ...updatePayload } = editingCreditor;

      const { error } = await updateCreditor(
        creditor_id!,
        updatePayload
      );
        if (error) throw error;
        // refresh
        await loadCreditors();
        setShowAddModal(false);
        setEditingCreditor(null);
      } else {
        // create
        const payload = {
          first_name: editingCreditor.first_name!,
          last_name: editingCreditor.last_name!,
          gender: (editingCreditor.gender ?? 'M') as 'M' | 'F' | 'Other',
          phone: editingCreditor.phone ?? null,
          email: editingCreditor.email ?? null,
          address: editingCreditor.address ?? null
        };
        const { error } = await createCreditor(payload as any);
        if (error) throw error;
        // refresh
        await loadCreditors();
        setShowAddModal(false);
        setEditingCreditor(null);
      }
    } catch (err: any) {
      console.error('Save creditor failed', err);
      alert('Failed to save creditor. See console for details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingCreditor({
      creditor_id: 0,
      first_name: '',
      last_name: '',
      gender: 'M',
      phone: '',
      email: '',
      address: '',
      total_capital: 0
    });
    setShowAddModal(true);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Creditors Management
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                Manage all creditors, track their lending history, and monitor their portfolio performance
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Creditor
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search creditors by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
            />
          </div>
        </div>

        {/* Creditors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-8 text-center text-slate-500">Loading creditors...</div>
          ) : filteredCreditors.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-500">No creditors found.</div>
          ) : (
            filteredCreditors.map((creditor) => (
              <div key={creditor.creditor_id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                      {creditor.first_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {creditor.first_name} {creditor.last_name}
                      </h3>
                      <p className="text-sm text-slate-500">ID: #{creditor.creditor_id}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {creditor.email && (
                      <div className="flex items-center text-sm text-slate-600">
                        <EnvelopeIcon className="w-4 h-4 mr-2 text-blue-500" />
                        {creditor.email}
                      </div>
                    )}
                    {creditor.phone && (
                      <div className="flex items-center text-sm text-slate-600">
                        <PhoneIcon className="w-4 h-4 mr-2 text-green-500" />
                        {creditor.phone}
                      </div>
                    )}
                    {creditor.address && (
                      <div className="flex items-start text-sm text-slate-600">
                        <MapPinIcon className="w-4 h-4 mr-2 text-purple-500 mt-0.5" />
                        {creditor.address}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                      <div className="text-xs text-slate-600">Total Lent</div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(creditor.total_lent)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3">
                      <div className="text-xs text-slate-600">Available</div>
                      <div className="text-sm font-bold text-emerald-700">
                        {formatCurrency(creditor.available)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-100 to-sky-100 rounded-lg p-3">
                      <div className="text-xs text-slate-600">Active</div>
                      <div className="text-sm font-bold text-slate-900">
                        {creditor.active_loans}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3">
                      <div className="text-xs text-slate-600">Completed</div>
                      <div className="text-sm font-bold text-slate-900">
                        {creditor.completed_loans}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewCreditor(creditor)}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                    >
                      <EyeIcon className="w-4 h-4 inline mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleEditCreditor(creditor)}
                      className="flex-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors duration-200 text-sm font-medium"
                    >
                      <PencilIcon className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCreditor(creditor.creditor_id)}
                      className="flex-1 bg-rose-50 text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-100 transition-colors duration-200 text-sm font-medium"
                      disabled={actionLoading}
                    >
                      <TrashIcon className="w-4 h-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Creditor Details Modal */}
        {showModal && selectedCreditor && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-2xl rounded-2xl bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Creditor Details - {selectedCreditor.first_name} {selectedCreditor.last_name}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-lg flex items-center">
                      <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Name:</span>
                        <span className="font-semibold text-slate-900">{selectedCreditor.first_name} {selectedCreditor.last_name}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Gender:</span>
                        <span className="font-semibold text-slate-900">{selectedCreditor.gender}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Email:</span>
                        <span className="font-semibold text-slate-900">{selectedCreditor.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Phone:</span>
                        <span className="font-semibold text-slate-900">{selectedCreditor.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Address:</span>
                        <span className="font-semibold text-slate-900">{selectedCreditor.address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-lg flex items-center">
                      <CurrencyDollarIcon className="w-5 h-5 mr-2 text-emerald-600" />
                      Lending Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Total Lent:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(selectedCreditor.total_lent)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Active Loans:</span>
                        <span className="font-semibold text-slate-900">{selectedCreditor.active_loans}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Completed Loans:</span>
                        <span className="font-semibold text-slate-900">{selectedCreditor.completed_loans}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Total Loans:</span>
                        <span className="font-semibold text-slate-900">{selectedCreditor.total_loans}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Creditor loans listing */}
                <div className="mt-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Loans</h4>
                  {loadingLoans ? (
                    <div className="p-4 text-sm text-slate-500">Loading loans for this creditor...</div>
                  ) : loansForCreditor.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No loans for this creditor.</div>
                  ) : (
                    <div className="space-y-3">
                      {loansForCreditor.map((ln) => (
                        <div key={ln.loan_id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                          <div>
                            <div className="text-sm font-semibold">{ln.debtor?.name ?? '—'}</div>
                            <div className="text-xs text-slate-500">{ln.frequency_of_collection} • {ln.loan_term_months} months</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">
                              {formatCurrency((ln as any).amount_allocated ?? ln.principal_amount)}
                            </div>
                            <div className="text-xs text-slate-500">{ln.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors duration-200 font-semibold">Close</button>
                  <button onClick={() => { setShowModal(false); handleEditCreditor(selectedCreditor!); }} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg">Edit Creditor</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Creditor Modal */}
        {showAddModal && editingCreditor && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-2xl rounded-2xl bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">{editingCreditor.creditor_id && editingCreditor.creditor_id > 0 ? 'Edit Creditor' : 'Add New Creditor'}</h3>
                  <button onClick={() => { setShowAddModal(false); setEditingCreditor(null); }} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={handleSaveCreditor} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                      <input type="text" required value={editingCreditor.first_name || ''} onChange={(e) => setEditingCreditor({ ...editingCreditor, first_name: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Enter first name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                      <input type="text" required value={editingCreditor.last_name || ''} onChange={(e) => setEditingCreditor({ ...editingCreditor, last_name: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Enter last name" />
                    </div>
                  </div>
                  {/* Capital Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Capital Amount to Lend *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      value={editingCreditor.total_capital ?? 0}
                      onChange={(e) =>
                        setEditingCreditor({
                          ...editingCreditor,
                          total_capital: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl
                                focus:outline-none focus:ring-2 focus:ring-blue-500
                                focus:border-transparent transition-all duration-200"
                      placeholder="Enter capital amount"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      This is the maximum amount this creditor can lend.
                    </p>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                    <select required value={(editingCreditor.gender as any) || 'M'} onChange={(e) => setEditingCreditor({ ...editingCreditor, gender: e.target.value as 'M' | 'F' | 'Other' })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input type="email" value={editingCreditor.email || ''} onChange={(e) => setEditingCreditor({ ...editingCreditor, email: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Enter email address" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                    <input type="tel" value={editingCreditor.phone || ''} onChange={(e) => setEditingCreditor({ ...editingCreditor, phone: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Enter phone number" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                    <textarea value={editingCreditor.address || ''} onChange={(e) => setEditingCreditor({ ...editingCreditor, address: e.target.value })} rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Enter address" />
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button type="button" onClick={() => { setShowAddModal(false); setEditingCreditor(null); }} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors duration-200 font-semibold">Cancel</button>
                    <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg">{editingCreditor.creditor_id && editingCreditor.creditor_id > 0 ? 'Update Creditor' : 'Add Creditor'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditorsManagement;
