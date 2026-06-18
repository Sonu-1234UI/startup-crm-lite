import React, { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useLeads } from '../context/LeadContext';
import LeadTable from '../components/leads/LeadTable';
import LeadCard from '../components/leads/LeadCard';
import LeadForm from '../components/leads/LeadForm';

const Leads = () => {
  const { leads, addLead, updateLead, deleteLead } = useLeads();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const handleOpenModal = (lead = null) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (formData) => {
    if (selectedLead) {
      updateLead(selectedLead.id, formData);
      toast.success('Lead updated successfully!');
    } else {
      addLead(formData);
      toast.success('Lead created successfully!');
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteLead(id);
      toast.error('Lead deleted', { icon: '🗑️' });
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-gray-900 min-h-screen p-4 md:p-8">
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--toast-bg, #fff)', color: 'var(--toast-color, #1e293b)' }
      }} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Leads</h1>
            <p className="text-slate-500 dark:text-gray-400 mt-1">Manage your prospects and pipeline.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* View toggle - Only visible on md (hidden on sm and hidden on lg+) */}
            <div className="hidden md:flex lg:hidden bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-1 shadow-sm shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${viewMode === 'table' ? 'bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-white' : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'}`}
                aria-label="Table view"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-white' : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors w-full sm:w-auto min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-2">
          {/* Card grid — Default on Mobile. Shown on Tablet if viewMode=grid. Hidden on Desktop. */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 lg:hidden ${viewMode === 'table' ? 'md:hidden' : ''}`}>
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onEdit={handleOpenModal} onDelete={handleDelete} />
            ))}
            {leads.length === 0 && (
              <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-8 text-center text-slate-500 dark:text-gray-400">
                No leads found. Add a new lead to get started.
              </div>
            )}
          </div>

          {/* Table — Hidden on Mobile. Shown on Tablet if viewMode=table. Default on Desktop. */}
          <div className={`hidden md:block lg:block ${viewMode === 'grid' ? 'md:hidden lg:block' : ''}`}>
            <LeadTable leads={leads} onEdit={handleOpenModal} onDelete={handleDelete} />
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity" onClick={handleCloseModal} />
          <div className="relative bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:max-w-lg sm:rounded-xl overflow-y-auto transform transition-all shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 shrink-0">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {selectedLead ? 'Edit Lead' : 'Add New Lead'}
              </h3>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              <LeadForm initialData={selectedLead} onSubmit={handleSubmit} onCancel={handleCloseModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
