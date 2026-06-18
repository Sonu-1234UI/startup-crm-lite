/**
 * Consistent color palette for all analytics charts and visualizations.
 * Maps lead statuses to their brand colors.
 */
export const STATUS_COLORS = {
  New: '#94A3B8',
  Contacted: '#2563EB',
  'Meeting Scheduled': '#F59E0B',
  'Proposal Sent': '#7C3AED',
  Won: '#22C55E',
  Lost: '#EF4444',
};

/**
 * Simplified status labels for chart display.
 */
export const STATUS_LABELS = {
  New: 'New',
  Contacted: 'Contacted',
  'Meeting Scheduled': 'Meeting',
  'Proposal Sent': 'Proposal',
  Won: 'Won',
  Lost: 'Lost',
};

/**
 * Source colors for lead source analytics.
 */
export const SOURCE_COLORS = {
  Website: '#3B82F6',
  Referral: '#10B981',
  LinkedIn: '#0A66C2',
  'Cold Call': '#F97316',
  'Email Campaign': '#8B5CF6',
  Instagram: '#E4405F',
  Ads: '#EC4899',
  Other: '#6B7280',
};

/**
 * Chart theme configuration.
 */
export const CHART_COLORS = {
  primary: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#7C3AED',
  gradient: {
    start: '#22C55E',
    end: '#22C55E20',
  },
};
