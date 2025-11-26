import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';

export interface Phase {
  id: string;
  key: string;
  name: string;
  order: number;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  phases: Phase[];
}

export interface Plan {
  id?: string;
  projectId: string;
  summary: string;
  objectives?: string;
  risks?: string;
}

export interface InceptionArtifact {
  id: string;
  projectId: string;
  name: string;
  status: string;
  required: boolean;
}

export interface Iteration {
  id: string;
  projectId: string;
  phaseId: string;
  name: string;
  startDate: string;
  endDate: string;
  goal?: string;
}

export interface RoleAssignment {
  id: string;
  projectId: string;
  user: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Projects
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/projects`);
  }

  createProject(payload: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, payload);
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`);
  }

  // Plan
  getPlan(projectId: string): Observable<Plan | null> {
    return this.http.get<Plan | null>(`${this.baseUrl}/projects/${projectId}/plan`);
  }

  savePlan(projectId: string, payload: Partial<Plan>): Observable<Plan> {
    return this.getPlan(projectId).pipe(
      switchMap((existing) => {
        if (existing?.id) {
          return this.http.put<Plan>(`${this.baseUrl}/projects/${projectId}/plan`, payload);
        }
        return this.http.post<Plan>(`${this.baseUrl}/projects/${projectId}/plan`, payload);
      })
    );
  }

  // Inception artifacts
  getInceptionArtifacts(projectId: string): Observable<InceptionArtifact[]> {
    return this.http.get<InceptionArtifact[]>(`${this.baseUrl}/projects/${projectId}/inception-artifacts`);
  }

  addInceptionArtifact(projectId: string, payload: Partial<InceptionArtifact>): Observable<InceptionArtifact> {
    return this.http.post<InceptionArtifact>(`${this.baseUrl}/projects/${projectId}/inception-artifacts`, payload);
  }

  // Iterations per phase
  getIterations(projectId: string, phaseId: string): Observable<Iteration[]> {
    return this.http.get<Iteration[]>(`${this.baseUrl}/projects/${projectId}/phases/${phaseId}/iterations`);
  }

  addIteration(projectId: string, phaseId: string, payload: Partial<Iteration>): Observable<Iteration> {
    return this.http.post<Iteration>(`${this.baseUrl}/projects/${projectId}/phases/${phaseId}/iterations`, payload);
  }

  // Roles
  getRoles(projectId: string): Observable<RoleAssignment[]> {
    return this.http.get<RoleAssignment[]>(`${this.baseUrl}/projects/${projectId}/roles`);
  }

  addRole(projectId: string, payload: Partial<RoleAssignment>): Observable<RoleAssignment> {
    return this.http.post<RoleAssignment>(`${this.baseUrl}/projects/${projectId}/roles`, payload);
  }
}
