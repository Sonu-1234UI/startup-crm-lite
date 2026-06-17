import React, { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import LeadTable from '../components/leads/LeadTable';
import LeadCard from '../components/leads/LeadCard';
import LeadForm from '../components/leads/LeadForm';

// Initial dummy data
const initialLeads = [
  { id: 1, name: 'Alice Freeman', company: 'TechNova', email: 'alice@technova.com', phone: '555-0101', status: 'New', source: 'Website', dateAdded: '2023-10-25T10:00:00Z' },
  { id: 2, name: 'Bob Smith', company: 'BuildCorp', email: 'bob@buildcorp.com', phone: '555-0102', status: 'Contacted', source: 'LinkedIn', dateAdded: '2023-10-24T14:30:00Z' },
  { id: 3, name: 'Charlie Davis', company: 'DesignCo', email: 'charlie@designco.com', phone: '555-0103', status: 'Meeting Scheduled', source: 'Referral', dateAdded: '2023-10-23T09:15:00Z' },
  { id: 4, name: 'Diana Prince', company: 'Amazonia', email: 'diana@amazonia.com', phone: '555-0104', status: 'Lost', source: 'Cold Call', dateAdded: '2023-10-22T16:45:00Z' },
  { id: 5, name: 'Evan Wright', company: 'FlightWorks', email: 'evan@flightworks.com', phone: '555-0105', status: 'Won', source: 'Email Campaign', dateAdded: '2023-10-21T11:20:00Z' },
];

/**
 * Main Leads page managing the CRUD operations and view toggling.
 *
 * @returns {JSX.Element}
 */
const Leads = () => {
  const [leads, setLeads] = useState(initialLeads);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Responsive view toggle: mostly table on desktop, cards on mobile, but user can force
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

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
      // Update
      setLeads(leads.map(lead => lead.id === selectedLead.id ? { ...lead, ...formData } : lead));
      toast.success('Lead updated successfully!');
    } else {
      // Create
      const newLead = {
        ...formData,
        id: Date.now(), // simple unique id for demo
        dateAdded: new Date().toISOString()
      };
      setLeads([newLead, ...leads]);
      toast.success('Lead created successfully!');
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      setLeads(leads.filter(lead => lead.id !== id));
      toast.error('Lead deleted', {
        icon: '🗑️',
        style: {
          border: '1px solid #ef4444',
          padding: '16px',
          color: '#ef4444',
        },
      });
    }
  };

  return (
    <div className="bg-slate-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Leads</h1>
            <p className="text-slate-500 mt-1">Manage your prospects and pipeline.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                aria-label="Table view"
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-6">
          {/* Always show grid on mobile, respect toggle on md+ */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${viewMode === 'table' ? 'md:hidden' : ''}`}>
            {leads.map(lead => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                onEdit={handleOpenModal} 
                onDelete={handleDelete} 
              />
            ))}
            {leads.length === 0 && (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                No leads found. Add a new lead to get started.
              </div>
            )}
          </div>

          <div className={`hidden ${viewMode === 'table' ? 'md:block' : ''}`}>
            <LeadTable 
              leads={leads} 
              onEdit={handleOpenModal} 
              onDelete={handleDelete} 
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all sm:my-8 sm:w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                {selectedLead ? 'Edit Lead' : 'Add New Lead'}
              </h3>
            </div>
            <div className="p-6">
              <LeadForm 
                initialData={selectedLead} 
                onSubmit={handleSubmit} 
                onCancel={handleCloseModal} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
