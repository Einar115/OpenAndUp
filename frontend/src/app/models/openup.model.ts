export type PhaseStatus = 'not-started' | 'in-progress' | 'complete';
export type ArtifactStatus = 'pending' | 'in-progress' | 'done';
export type IterationStatus = 'planned' | 'active' | 'complete';
export type RoleType = 'Project Manager' | 'Tech Lead' | 'QA' | 'Stakeholder' | 'Coach' | 'Developer';
export type VersionStatus = 'draft' | 'released' | 'archived';
export type DefectStatus = 'open' | 'in-progress' | 'resolved' | 'closed' | 'reopened';
export type DefectSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DefectPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'testing' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'feature' | 'bug' | 'improvement' | 'documentation' | 'technical-debt';

export interface Phase {
  id: string;
  projectId: string;
  key: 'inception' | 'elaboration' | 'construction' | 'transition';
  name: string;
  order: number;
  status: PhaseStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: 'draft' | 'active' | 'archived';
  phases: Phase[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Plan {
  id: string;
  projectId: string;
  summary: string;
  objectives?: string;
  risks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InceptionArtifact {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: ArtifactStatus;
  required: boolean;
  owner?: string;
  phaseId?: string;
}

export interface RoleAssignment {
  id: string;
  projectId: string;
  user: string;
  role: RoleType;
  assignedAt: string;
}

export interface Iteration {
  id: string;
  projectId: string;
  phaseId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status?: IterationStatus;
  createdAt?: string;
}

export interface Version {
  id: string;
  projectId: string;
  version: string;
  description?: string;
  changes?: string;
  releaseDate?: string;
  status: VersionStatus;
  createdBy?: string;
  createdAt?: string;
}

export interface Defect {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  severity: DefectSeverity;
  status: DefectStatus;
  priority: DefectPriority;
  reportedBy?: string;
  assignedTo?: string;
  phaseId?: string;
  iterationId?: string;
  reportedDate: string;
  resolvedDate?: string;
  resolutionNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DefectStatistics {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    reopened: number;
  };
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface Task {
  id: string;
  projectId: string;
  phaseId?: string;
  iterationId?: string;
  artifactId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
  assignedTo?: string;
  assignedRole?: string;
  estimatedHours?: number;
  actualHours?: number;
  progressPercentage: number;
  tags?: string[];
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskStatistics {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  overallProgress: number;
  estimatedHours: number;
  actualHours: number;
  overdueTasks: number;
}
