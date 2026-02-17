export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface NavLink {
  href: string;
  label: string;
}

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
}

export interface StatItem {
  label: string;
  value: string;
}
