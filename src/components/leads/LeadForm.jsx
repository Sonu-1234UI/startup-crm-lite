import React, { useState, useEffect } from 'react';

const STATUS_OPTIONS = ['New', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Won', 'Lost'];
const SOURCE_OPTIONS = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Other'];

const inputClass = (hasError) =>
  `mt-1 block w-full rounded-md border px-3 py-2 shadow-sm text-base md:text-sm min-h-[44px] md:min-h-[38px]
   bg-white dark:bg-gray-700 text-slate-900 dark:text-white
   placeholder-slate-400 dark:placeholder-gray-500
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
   ${hasError
    ? 'border-red-500 dark:border-red-400'
    : 'border-slate-300 dark:border-gray-600'
  }`;

const LeadForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', status: 'New', source: 'Website', value: '', 
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) setFormData({ ...formData, ...initialData });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email is invalid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit({ ...formData, value: formData.value ? Number(formData.value) : undefined });
  };

  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-gray-300';
  const errorClass = 'mt-1 text-xs text-red-500 dark:text-red-400';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>Name <span className="text-red-500">*</span></label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
            className={inputClass(errors.name)} placeholder="Jane Doe" />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="company" className={labelClass}>Company <span className="text-red-500">*</span></label>
          <input type="text" id="company" name="company" value={formData.company} onChange={handleChange}
            className={inputClass(errors.company)} placeholder="Acme Corp" />
          {errors.company && <p className={errorClass}>{errors.company}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email <span className="text-red-500">*</span></label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
          className={inputClass(errors.email)} placeholder="jane@acmecorp.com" />
        {errors.email && <p className={errorClass}>{errors.email}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>Phone</label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange}
            className={inputClass(false)} placeholder="+91 99999 00000" />
        </div>
        <div>
          <label htmlFor="value" className={labelClass}>Deal Value (₹)</label>
          <input type="number" id="value" name="value" value={formData.value} onChange={handleChange}
            className={inputClass(false)} placeholder="50000" min="0" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange}
            className={inputClass(false)}>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="source" className={labelClass}>Source</label>
          <select id="source" name="source" value={formData.source} onChange={handleChange}
            className={inputClass(false)}>
            {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

     

      <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-gray-700">
        <button type="button" onClick={onCancel}
          className="rounded-md border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm font-medium text-slate-700 dark:text-gray-200 shadow-sm hover:bg-slate-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          {initialData ? 'Update Lead' : 'Create Lead'}
        </button>
      </div>
    </form>
  );
};

export default LeadForm;
