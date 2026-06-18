import React from 'react';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { useLeads } from '../context/LeadContext';
import StatsCard from '../components/dashboard/StatsCard';
import PipelineOverview from '../components/dashboard/PipelineOverview';
import RecentLeads from '../components/dashboard/RecentLeads';
import QuickActions from '../components/dashboard/QuickActions';

const Dashboard = () => {
  const { leads } = useLeads();

  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;
  const pipelineValue = leads
    .filter(l => l.status !== 'Won' && l.status !== 'Lost')
    .reduce((sum, l) => sum + (l.value || 0), 0);
  const wonRevenue = leads.filter(l => l.status === 'Won').reduce((sum, l) => sum + (l.value || 0), 0);

  const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-slate-50 dark:bg-gray-900 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Welcome back — here's what's happening with your leads today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Total Leads" value={totalLeads} icon={Users} change="+12.5%" color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
          <StatsCard title="Won Leads" value={wonLeads} icon={TrendingUp} change="+5.2%" color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
          <StatsCard title="Conversion Rate" value={`${conversionRate}%`} icon={Activity} change="-1.2%" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
          <StatsCard title="Won Revenue" value={formatCurrency(wonRevenue)} icon={DollarSign} change="+18.4%" color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PipelineOverview leads={leads} />
            <RecentLeads leads={leads} />
          </div>
          <div className="space-y-6">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
