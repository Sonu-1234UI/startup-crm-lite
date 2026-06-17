import React from 'react';

/**
 * Pill-shaped colored badge showing the lead's status.
 *
 * @param {Object} props
 * @param {string} props.status - The lead's status.
 * @returns {JSX.Element}
 */
const StatusBadge = ({ status }) => {
  const getBadgeStyle = (status) => {
    switch (status) {
      case 'New':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Contacted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Meeting Scheduled':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Proposal Sent':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Won':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Lost':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getBadgeStyle(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
