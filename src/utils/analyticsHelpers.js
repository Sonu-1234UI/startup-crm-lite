import { STATUS_COLORS, STATUS_LABELS } from '../constants/analyticsColors';

/**
 * Filters leads by a date range string.
 * @param {Array} leads - All leads
 * @param {string} range - '7d' | '30d' | '90d' | 'year' | 'all'
 * @returns {Array} Filtered leads
 */
export const filterLeadsByDateRange = (leads, range) => {
  if (!leads || !Array.isArray(leads)) return [];
  if (range === 'all') return leads;

  const now = new Date();
  let startDate;

  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return leads;
  }

  return leads.filter((lead) => {
    const createdAt = new Date(lead.createdAt);
    return createdAt >= startDate && createdAt <= now;
  });
};

/**
 * Gets the previous period leads for comparison.
 */
export const getPreviousPeriodLeads = (leads, range) => {
  if (!leads || !Array.isArray(leads)) return [];
  if (range === 'all') return [];

  const now = new Date();
  let periodMs;

  switch (range) {
    case '7d':
      periodMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case '30d':
      periodMs = 30 * 24 * 60 * 60 * 1000;
      break;
    case '90d':
      periodMs = 90 * 24 * 60 * 60 * 1000;
      break;
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      periodMs = now.getTime() - startOfYear.getTime();
      break;
    }
    default:
      return [];
  }

  const currentStart = new Date(now.getTime() - periodMs);
  const prevStart = new Date(currentStart.getTime() - periodMs);

  return leads.filter((lead) => {
    const createdAt = new Date(lead.createdAt);
    return createdAt >= prevStart && createdAt < currentStart;
  });
};

/**
 * Calculates growth percentage between current and previous period.
 */
export const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Returns the distribution of leads by status.
 */
export const getStatusDistribution = (leads) => {
  if (!leads || leads.length === 0) return [];

  const statusMap = {};
  leads.forEach((lead) => {
    const status = lead.status || 'Unknown';
    statusMap[status] = (statusMap[status] || 0) + 1;
  });

  return Object.entries(statusMap).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    fullName: status,
    value: count,
    color: STATUS_COLORS[status] || '#6B7280',
    percentage: ((count / leads.length) * 100).toFixed(1),
  }));
};

/**
 * Groups leads by month based on createdAt.
 * Returns last 6 months of data.
 */
export const getMonthlyLeads = (leads) => {
  if (!leads || leads.length === 0) return [];

  const months = {};
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[key] = {
      month: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      count: 0,
      key,
    };
  }

  leads.forEach((lead) => {
    if (!lead.createdAt) return;
    const d = new Date(lead.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (months[key]) {
      months[key].count += 1;
    }
  });

  return Object.values(months);
};

/**
 * Calculates monthly conversion rate (Won / Total per month).
 */
export const getConversionByMonth = (leads) => {
  if (!leads || leads.length === 0) return [];

  const now = new Date();
  const monthData = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthData[key] = {
      month: d.toLocaleString('default', { month: 'short' }),
      total: 0,
      won: 0,
      rate: 0,
      key,
    };
  }

  leads.forEach((lead) => {
    if (!lead.createdAt) return;
    const d = new Date(lead.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthData[key]) {
      monthData[key].total += 1;
      if (lead.status === 'Won') {
        monthData[key].won += 1;
      }
    }
  });

  return Object.values(monthData).map((m) => ({
    ...m,
    rate: m.total > 0 ? parseFloat(((m.won / m.total) * 100).toFixed(1)) : 0,
  }));
};

/**
 * Calculates monthly revenue from Won deals.
 */
export const getRevenueByMonth = (leads) => {
  if (!leads || leads.length === 0) return [];

  const now = new Date();
  const monthData = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthData[key] = {
      month: d.toLocaleString('default', { month: 'short' }),
      revenue: 0,
      key,
    };
  }

  leads.forEach((lead) => {
    if (lead.status !== 'Won' || !lead.wonAt) return;
    const d = new Date(lead.wonAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthData[key]) {
      monthData[key].revenue += lead.value || 0;
    }
  });

  return Object.values(monthData);
};

/**
 * Sum of all active (non-Won, non-Lost) lead values.
 */
export const getPipelineValue = (leads) => {
  if (!leads || leads.length === 0) return 0;
  return leads
    .filter((l) => l.status !== 'Won' && l.status !== 'Lost')
    .reduce((sum, l) => sum + (l.value || 0), 0);
};

/**
 * Sum of all Won lead values.
 */
export const getWonRevenue = (leads) => {
  if (!leads || leads.length === 0) return 0;
  return leads
    .filter((l) => l.status === 'Won')
    .reduce((sum, l) => sum + (l.value || 0), 0);
};

/**
 * Average number of days from createdAt to wonAt.
 */
export const getAverageSalesCycle = (leads) => {
  if (!leads || leads.length === 0) return 0;

  const wonLeads = leads.filter((l) => l.status === 'Won' && l.createdAt && l.wonAt);
  if (wonLeads.length === 0) return 0;

  const totalDays = wonLeads.reduce((sum, l) => {
    const created = new Date(l.createdAt);
    const won = new Date(l.wonAt);
    const diffDays = Math.ceil((won - created) / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);

  return Math.round(totalDays / wonLeads.length);
};

/**
 * Lost leads / total leads as a percentage.
 */
export const getLostRate = (leads) => {
  if (!leads || leads.length === 0) return 0;
  const lostCount = leads.filter((l) => l.status === 'Lost').length;
  return parseFloat(((lostCount / leads.length) * 100).toFixed(1));
};

/**
 * Gets lead source distribution, sorted descending by count.
 */
export const getLeadSourceStats = (leads) => {
  if (!leads || leads.length === 0) return [];

  const sourceMap = {};
  leads.forEach((lead) => {
    const source = lead.source || 'Other';
    sourceMap[source] = (sourceMap[source] || 0) + 1;
  });

  return Object.entries(sourceMap)
    .map(([source, count]) => ({
      source,
      count,
      percentage: parseFloat(((count / leads.length) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Returns funnel data showing conversion through each stage.
 */
export const getFunnelData = (leads) => {
  if (!leads || leads.length === 0) return [];

  const total = leads.length;

  // Count leads that reached each stage (cumulative funnel logic)
  const stages = [
    { name: 'New', key: 'createdAt', color: STATUS_COLORS['New'] },
    { name: 'Contacted', key: 'contactedAt', color: STATUS_COLORS['Contacted'] },
    { name: 'Meeting', key: 'meetingAt', color: STATUS_COLORS['Meeting Scheduled'] },
    { name: 'Proposal', key: 'proposalAt', color: STATUS_COLORS['Proposal Sent'] },
    { name: 'Won', key: 'wonAt', color: STATUS_COLORS['Won'] },
  ];

  const funnelData = stages.map((stage) => {
    const count = leads.filter((l) => l[stage.key]).length;
    return {
      name: stage.name,
      value: count,
      fill: stage.color,
      percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
    };
  });

  // Calculate drop-off between stages
  for (let i = 1; i < funnelData.length; i++) {
    const prev = funnelData[i - 1].value;
    const curr = funnelData[i].value;
    funnelData[i].conversionFromPrev = prev > 0 ? parseFloat(((curr / prev) * 100).toFixed(1)) : 0;
    funnelData[i].dropOff = prev - curr;
    funnelData[i].dropOffPercent = prev > 0 ? parseFloat((((prev - curr) / prev) * 100).toFixed(1)) : 0;
  }

  return funnelData;
};

/**
 * Calculates Sales Velocity:
 * (Opportunities × Win Rate × Avg Deal Size) / Sales Cycle Length
 */
export const getSalesVelocity = (leads) => {
  if (!leads || leads.length === 0) return { velocity: 0, opportunities: 0, winRate: 0, avgDealSize: 0, salesCycle: 0 };

  const activeLeads = leads.filter((l) => l.status !== 'Lost');
  const wonLeads = leads.filter((l) => l.status === 'Won');
  const opportunities = activeLeads.length;
  const winRate = leads.length > 0 ? wonLeads.length / leads.length : 0;
  const avgDealSize = wonLeads.length > 0
    ? wonLeads.reduce((s, l) => s + (l.value || 0), 0) / wonLeads.length
    : 0;
  const salesCycle = getAverageSalesCycle(leads) || 1;

  const velocity = (opportunities * winRate * avgDealSize) / salesCycle;

  return {
    velocity: Math.round(velocity),
    opportunities,
    winRate: parseFloat((winRate * 100).toFixed(1)),
    avgDealSize: Math.round(avgDealSize),
    salesCycle,
  };
};

/**
 * Forecasts next month revenue based on average of last 6 months.
 */
export const getForecastRevenue = (leads) => {
  if (!leads || leads.length === 0) return { predicted: 0, confidence: 0, trend: 0 };

  const revenueData = getRevenueByMonth(leads);
  const revenues = revenueData.map((m) => m.revenue);
  const nonZeroRevenues = revenues.filter((r) => r > 0);

  if (nonZeroRevenues.length === 0) return { predicted: 0, confidence: 0, trend: 0 };

  const avgRevenue = nonZeroRevenues.reduce((s, r) => s + r, 0) / nonZeroRevenues.length;

  // Simple trend: compare last 3 months avg vs first 3 months avg
  const firstHalf = revenues.slice(0, 3).reduce((s, r) => s + r, 0) / 3;
  const secondHalf = revenues.slice(3).reduce((s, r) => s + r, 0) / 3;
  const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

  // Predicted = avg revenue + trend adjustment
  const predicted = Math.round(avgRevenue * (1 + trend / 100));

  // Confidence based on consistency (lower stddev = higher confidence)
  const variance = nonZeroRevenues.reduce((s, r) => s + Math.pow(r - avgRevenue, 2), 0) / nonZeroRevenues.length;
  const stddev = Math.sqrt(variance);
  const cv = avgRevenue > 0 ? stddev / avgRevenue : 1;
  const confidence = Math.max(40, Math.min(95, Math.round(100 - cv * 50)));

  return {
    predicted: Math.max(0, predicted),
    confidence,
    trend: parseFloat(trend.toFixed(1)),
  };
};

/**
 * Ranks sales reps by total Won revenue.
 */
export const getTopPerformers = (leads) => {
  if (!leads || leads.length === 0) return [];

  const ownerMap = {};
  leads
    .filter((l) => l.status === 'Won' && l.owner)
    .forEach((lead) => {
      if (!ownerMap[lead.owner]) {
        ownerMap[lead.owner] = { name: lead.owner, revenue: 0, deals: 0 };
      }
      ownerMap[lead.owner].revenue += lead.value || 0;
      ownerMap[lead.owner].deals += 1;
    });

  return Object.values(ownerMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map((p, i) => ({ ...p, rank: i + 1 }));
};

/**
 * Generates GitHub-style heatmap data for lead activity.
 * Returns data for the last ~6 months (26 weeks).
 */
export const getActivityHeatmapData = (leads) => {
  if (!leads || leads.length === 0) return [];

  const now = new Date();
  const weeksBack = 26;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (weeksBack * 7));
  // Adjust to start of week (Sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Build a map of date -> activity count
  const activityMap = {};
  leads.forEach((lead) => {
    const dates = [lead.createdAt, lead.contactedAt, lead.meetingAt, lead.proposalAt, lead.wonAt];
    dates.forEach((dateStr) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      activityMap[key] = (activityMap[key] || 0) + 1;
    });
  });

  // Generate cells for each day
  const cells = [];
  const current = new Date(startDate);
  while (current <= now) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    cells.push({
      date: key,
      count: activityMap[key] || 0,
      day: current.getDay(),
      week: Math.floor((current - startDate) / (7 * 24 * 60 * 60 * 1000)),
    });
    current.setDate(current.getDate() + 1);
  }

  return cells;
};

/**
 * Formats a number as Indian Rupee currency.
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a number with commas.
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(value);
};
