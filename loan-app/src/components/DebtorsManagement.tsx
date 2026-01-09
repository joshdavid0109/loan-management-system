// src/components/DebtorsManagement.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import type { Debtor, Loan } from '../types/loan';
import { formatCurrency } from '../utils/loanCalculations';
import {
  fetchDebtorsWithStats,
  fetchLoansByDebtor,
  createDebtor,
  updateDebtor,
  deleteDebtor,
  type DebtorStat
} from '../services/debtorsService';

const DebtorsManagement: React.FC = () => {
  const [debtors, setDebtors] = useState<DebtorStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDebtor, setSelectedDebtor] = useState<DebtorStat | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<Partial<Debtor> | null>(null);

  const [loansForDebtor, setLoansForDebtor] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  // load aggregated debtors
  const loadDebtors = async () => {
    setLoading(true);
    const { data, error } = await fetchDebtorsWithStats();
    if (error) {
      console.error('Failed to load debtors', error);
      alert('Failed to load debtors. See console.');
      setDebtors([]);
    } else {
      setDebtors(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDebtors();
  }, []);

  const filteredDebtors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return debtors;
    return debtors.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      (d.contact_info ?? '').toLowerCase().includes(q) ||
      (d.address ?? '').toLowerCase().includes(q) ||
      String(d.debtor_id).includes(q)
    );
  }, [debtors, searchTerm]);

  const handleViewDebtor = async (d: DebtorStat) => {
    setSelectedDebtor(d);
    setShowModal(true);

    setLoadingLoans(true);
    const { data, error } = await fetchLoansByDebtor(d.debtor_id);
    if (error) {
      console.error('Failed to fetch loans', error);
      setLoansForDebtor([]);
      alert('Failed to fetch loans for this debtor.');
    } else {
      setLoansForDebtor(data ?? []);
    }
    setLoadingLoans(false);
  };

  const handleEditDebtor = (d: DebtorStat) => {
    setEditingDebtor({
      debtor_id: d.debtor_id,
      name: d.name,
      contact_info: d.contact_info ?? '',
      address: d.address ?? ''
    });
    setShowAddModal(true);
  };

  const handleDeleteDebtor = async (debtorId: number) => {
    const debtor = debtors.find((x) => x.debtor_id === debtorId);
    if (!debtor) return;
    if (debtor.total_loans > 0) {
      if (!window.confirm('This debtor has loans. Deleting may fail or orphan data. Proceed?')) return;
    } else {
      if (!window.confirm('Delete debtor?')) return;
    }

    setActionLoading(true);
    const prev = debtors;
    setDebtors(prev.filter((d) => d.debtor_id !== debtorId));

    const { error } = await deleteDebtor(debtorId);
    if (error) {
      console.error('Delete failed', error);
      alert('Delete failed. Rolling back.');
      setDebtors(prev);
    } else {
      await loadDebtors();
    }
    setActionLoading(false);
  };

  const handleSaveDebtor = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingDebtor) return;
    if (!editingDebtor.name) {
      alert('Name is required');
      return;
    }

    setActionLoading(true);

    try {
      if (editingDebtor.debtor_id && editingDebtor.debtor_id > 0) {
        const { error } = await updateDebtor(editingDebtor.debtor_id, editingDebtor as any);
        if (error) throw error;
        await loadDebtors();
        setShowAddModal(false);
        setEditingDebtor(null);
      } else {
        const payload = {
          name: editingDebtor.name!,
          contact_info: editingDebtor.contact_info ?? null,
          address: editingDebtor.address ?? null
        };
        const { error } = await createDebtor(payload as any);
        if (error) throw error;
        await loadDebtors();
        setShowAddModal(false);
        setEditingDebtor(null);
      }
    } catch (err: any) {
      console.error('Save debtor failed', err);
      alert('Failed to save debtor. See console for details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingDebtor({ debtor_id: 0, name: '', contact_info: '', address: '' });
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
                Debtors Management
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                Manage all debtors, track their loan history, and monitor their borrowing patterns
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Debtor
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search debtors by name, contact, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 transition-all duration-200"
            />
          </div>
        </div>

        {/* Debtors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-8 text-center text-slate-500">Loading debtors...</div>
          ) : filteredDebtors.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-500">No debtors found.</div>
          ) : (
            filteredDebtors.map((debtor) => (
              <div key={debtor.debtor_id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                      {debtor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{debtor.name}</h3>
                      <p className="text-sm text-slate-500">ID: #{debtor.debtor_id}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {debtor.contact_info && (
                      <div className="flex items-center text-sm text-slate-600">
                        <PhoneIcon className="w-4 h-4 mr-2 text-blue-500" />
                        {debtor.contact_info}
                      </div>
                    )}
                    {debtor.address && (
                      <div className="flex items-start text-sm text-slate-600">
                        <MapPinIcon className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        {debtor.address}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                      <div className="text-sm text-slate-600">Total Borrowed</div>
                      <div className="text-lg font-bold text-slate-900">
                        {formatCurrency(debtor.total_borrowed)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3">
                      <div className="text-sm text-slate-600">Active Loans</div>
                      <div className="text-lg font-bold text-slate-900">
                        {debtor.active_loans}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button onClick={() => handleViewDebtor(debtor)} className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium">
                      <EyeIcon className="w-4 h-4 inline mr-1" />
                      View
                    </button>
                    <button onClick={() => handleEditDebtor(debtor)} className="flex-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors duration-200 text-sm font-medium">
                      <PencilIcon className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>
                    <button onClick={() => handleDeleteDebtor(debtor.debtor_id)} disabled={actionLoading} className="flex-1 bg-rose-50 text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-100 transition-colors duration-200 text-sm font-medium">
                      <TrashIcon className="w-4 h-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Debtor Details Modal */}
        {showModal && selectedDebtor && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-2xl rounded-2xl bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Debtor Details - {selectedDebtor.name}</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-lg flex items-center"><UserIcon className="w-5 h-5 mr-2 text-blue-600" />Personal Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Name:</span><span className="font-semibold text-slate-900">{selectedDebtor.name}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Contact:</span><span className="font-semibold text-slate-900">{selectedDebtor.contact_info || 'N/A'}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Address:</span><span className="font-semibold text-slate-900">{selectedDebtor.address || 'N/A'}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4 text-lg flex items-center"><div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full mr-3"></div>Loan Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Total Borrowed:</span><span className="font-semibold text-slate-900">{formatCurrency(selectedDebtor.total_borrowed)}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Active Loans:</span><span className="font-semibold text-slate-900">{selectedDebtor.active_loans}</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600 font-medium">Total Loans:</span><span className="font-semibold text-slate-900">{selectedDebtor.total_loans}</span></div>
                    </div>
                  </div>
                </div>

                {/* Debtor loans listing */}
                <div className="mt-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Loans</h4>
                  {loadingLoans ? (
                    <div className="p-4 text-sm text-slate-500">Loading loans for this debtor...</div>
                  ) : loansForDebtor.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No loans for this debtor.</div>
                  ) : (
                    <div className="space-y-3">{loansForDebtor.map((ln) => (
                      <div key={ln.loan_id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                        <div>
                          <div>
                            <div>
                              {/* Case: multi creditor */}
                              {(() => {
                                const allocs = (ln as any).allocations ?? [];

                                if (allocs.length > 0) {
                                  return (
                                    <div className="space-y-1">
                                      {allocs.map((a: any, i: number) => (
                                        <div key={i} className="text-sm font-semibold">
                                          {a.creditors.first_name} {a.creditors.last_name}
                                          <span className="text-xs text-slate-500">
                                            {" • "}Allocated: {formatCurrency(a.amount_allocated)}
                                          </span>
                                          <div className="text-xs text-slate-500">
                                            {ln.frequency_of_collection} • {ln.loan_term_months} months
                                        </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }

                                // Case: single creditor
                                if (ln.creditor) {
                                  return (
                                    <>
                                    <div className="text-sm font-semibold">
                                      {ln.creditor.first_name} {ln.creditor.last_name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {ln.frequency_of_collection} • {ln.loan_term_months} months
                                   </div>
                            </>
                                  );
                                }

                                return <div className="text-sm text-slate-500">—</div>;
                              })()}
                            </div>

                            
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{formatCurrency(ln.principal_amount)}</div>
                          <div className="text-xs text-slate-500">{ln.status}</div>
                        </div>
                      </div>
                    ))}</div>
                  )}
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors duration-200 font-semibold">Close</button>
                  <button onClick={() => { setShowModal(false); handleEditDebtor(selectedDebtor!); }} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg">Edit Debtor</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Debtor Modal */}
        {showAddModal && editingDebtor && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-2xl rounded-2xl bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">{editingDebtor.debtor_id && editingDebtor.debtor_id > 0 ? 'Edit Debtor' : 'Add New Debtor'}</h3>
                  <button onClick={() => { setShowAddModal(false); setEditingDebtor(null); }} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={handleSaveDebtor} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                    <input type="text" required value={editingDebtor.name || ''} onChange={(e) => setEditingDebtor({ ...editingDebtor, name: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Enter debtor name" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Contact Information</label>
                    <input type="text" value={editingDebtor.contact_info || ''} onChange={(e) => setEditingDebtor({ ...editingDebtor, contact_info: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Phone number or email" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                    <textarea value={editingDebtor.address || ''} onChange={(e) => setEditingDebtor({ ...editingDebtor, address: e.target.value })} rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Enter address" />
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button type="button" onClick={() => { setShowAddModal(false); setEditingDebtor(null); }} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors duration-200 font-semibold">Cancel</button>
                    <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg">{editingDebtor.debtor_id && editingDebtor.debtor_id > 0 ? 'Update Debtor' : 'Add Debtor'}</button>
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

export default DebtorsManagement;
