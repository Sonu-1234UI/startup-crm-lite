import React from 'react';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import PipelineOverview from '../components/dashboard/PipelineOverview';
import RecentLeads from '../components/dashboard/RecentLeads';
import QuickActions from '../components/dashboard/QuickActions';

/**
 * Main Dashboard page assembling various dashboard components.
 * 
 * @returns {JSX.Element}
 */
const Dashboard = () => {
  // Sample data for Phase 8
  const sampleLeads = [
    { id: 1, name: 'Alice Freeman', company: 'TechNova', status: 'New', dateAdded: '2023-10-25T10:00:00Z' },
    { id: 2, name: 'Bob Smith', company: 'BuildCorp', status: 'Contacted', dateAdded: '2023-10-24T14:30:00Z' },
    { id: 3, name: 'Charlie Davis', company: 'DesignCo', status: 'Qualified', dateAdded: '2023-10-23T09:15:00Z' },
    { id: 4, name: 'Diana Prince', company: 'Amazonia', status: 'Lost', dateAdded: '2023-10-22T16:45:00Z' },
    { id: 5, name: 'Evan Wright', company: 'FlightWorks', status: 'New', dateAdded: '2023-10-21T11:20:00Z' },
    { id: 6, name: 'Fiona Gallagher', company: 'Shameless Inc', status: 'Qualified', dateAdded: '2023-10-20T08:00:00Z' }
  ];

  return (
    <div className="bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, here's what's happening with your leads today.</p>
        </div>

        {/* Stats Grid: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title="Total Leads" 
            value="1,248" 
            icon={Users} 
            change="+12.5%" 
            color="bg-blue-100 text-blue-600" 
          />
          <StatsCard 
            title="Qualified Leads" 
            value="342" 
            icon={TrendingUp} 
            change="+5.2%" 
            color="bg-green-100 text-green-600" 
          />
          <StatsCard 
            title="Conversion Rate" 
            value="24.8%" 
            icon={Activity} 
            change="-1.2%" 
            color="bg-amber-100 text-amber-600" 
          />
          <StatsCard 
            title="Expected Revenue" 
            value="$45,200" 
            icon={DollarSign} 
            change="+18.4%" 
            color="bg-indigo-100 text-indigo-600" 
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (takes 2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            <PipelineOverview leads={sampleLeads} />
            <RecentLeads leads={sampleLeads} />
          </div>
          
          {/* Right Column (takes 1/3 width on desktop) */}
          <div className="space-y-6">
            <QuickActions />
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
