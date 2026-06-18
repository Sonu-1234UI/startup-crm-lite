import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { sampleLeads } from '../data/sampleLeads';

const LeadContext = createContext();

export const LeadProvider = ({ children }) => {
  const [leads, setLeads] = useLocalStorage('startup-crm-leads', sampleLeads);

  const addLead = useCallback((lead) => {
    const newLead = {
      ...lead,
      id: `lead_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);
  }, [setLeads]);

  const updateLead = useCallback((id, updatedData) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updatedData } : lead))
    );
  }, [setLeads]);

  const deleteLead = useCallback((id) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  }, [setLeads]);

  return (
    <LeadContext.Provider value={{ leads, addLead, updateLead, deleteLead }}>
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};
