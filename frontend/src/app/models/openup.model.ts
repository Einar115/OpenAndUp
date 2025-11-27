export type PhaseStatus = 'not-started' | 'in-progress' | 'complete';
export type ArtifactStatus = 'pending' | 'in-progress' | 'done';
export type IterationStatus = 'planned' | 'active' | 'complete';
export type RoleType = 'Project Manager' | 'Tech Lead' | 'QA' | 'Stakeholder' | 'Coach' | 'Developer';

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
