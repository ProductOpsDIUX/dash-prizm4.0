export interface TestUser {
  id: string;
  count: number;
}

export interface MetricScore {
  score: number;
  date: string;
  testUsers: number;
  testType?: 'prototype' | 'system';
}

export interface ProjectMetrics {
  sus: MetricScore[];
  easeOfUse: MetricScore[];
  lookAndFeel: MetricScore[];
  userNeeds: MetricScore[];
  nps: MetricScore[];
  performance?: MetricScore[];
  customMetrics?: Record<string, MetricScore[]>;
  systemSUS?: number;
  systemCSAT?: number;
  systemTestSessions?: number;
  systemTestUsers?: number;
}

export interface Project {
  id: string;
  name: string;
  chapterId: string;
  portfolioId?: string;
  programmeId?: string;
  isArchived: boolean;
  project_status?: string;
  lastTested: string | null;
  project_type?: 'digital' | 'non-digital';
  metrics: ProjectMetrics;
}

export interface Programme {
  id: string;
  name: string;
  portfolioId: string;
  projects: Project[];
}

export interface Portfolio {
  id: string;
  name: string;
  chapterId: string;
  programmes: Programme[];
  projects: Project[];
}

export interface Chapter {
  id: string;
  name: string;
  portfolios: Portfolio[];
  projects: Project[];
}

export interface ChapterStats {
  testCount: number;
  userCount: number;
  csatIndex: number;
  avgSUS: number;
  // Properties for separate testing types
  prototypeSUS: number;
  systemSUS: number;
  prototypeCSAT: number;
  systemCSAT: number;
  prototypeCSATScore?: number;
  systemCSATScore?: number;
}

export interface ChapterWithStats extends Chapter {
  stats: ChapterStats;
  teamMembers: number;
  teamMembersList?: string[];
  lastTested: string | null;
  daysSinceLastTest: number | null;
}

export interface PortfolioWithStats extends Portfolio {
  stats: ChapterStats;
  teamMembers: number;
  lastTested: string | null;
  daysSinceLastTest: number | null;
}

export interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  quarters: Quarter[];
}

export interface Quarter {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export type SortOption = 'recent' | 'alphabetical' | 'csatAsc' | 'csatDesc';

export type TestingType = 'all' | 'prototype' | 'system';

export interface CustomMetric {
  id?: string;
  category: string;
  value: string;
  project_id?: string;
  created_at?: string;
  testing_type?: 'prototype' | 'system' | 'all';
  metric_type: 'usability' | 'desirability' | 'ops_impact';
  validated?: boolean;
  last_validated_date?: string;
  questionText?: string; // Question text for tooltips
  userCount?: number; // Number of users who responded to this question
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange?: (value: number) => void;
  totalItems?: number;
}
