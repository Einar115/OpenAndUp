import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import {
  Phase,
  Project,
  Plan,
  InceptionArtifact,
  Iteration,
  RoleAssignment,
  Version,
  Defect,
  DefectStatistics,
  Task,
  TaskStatistics,
  TaskStatus,
  TaskPriority,
  TaskType,
  Artifact,
  ArtifactStatus,
  ArtifactType,
  TestCase,
  TestCaseStatus,
  TestCaseOutcome,
  TestRun,
} from '../models/openup.model';

export type {
  Phase,
  Project,
  Plan,
  InceptionArtifact,
  Iteration,
  RoleAssignment,
  Version,
  Defect,
  DefectStatistics,
  Task,
  TaskStatistics,
  TaskStatus,
  TaskPriority,
  TaskType,
  Artifact,
  ArtifactStatus,
  ArtifactType,
  TestCase,
  TestCaseStatus,
  TestCaseOutcome,
  TestRun,
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:3001';

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

  // Artifacts
  getArtifacts(projectId: string, filters?: Record<string, any>): Observable<Artifact[]> {
    const query = this.buildQueryString(filters);
    return this.http.get<Artifact[]>(`${this.baseUrl}/projects/${projectId}/artifacts${query}`);
  }

  createArtifact(projectId: string, payload: Partial<Artifact>): Observable<Artifact> {
    return this.http.post<Artifact>(`${this.baseUrl}/projects/${projectId}/artifacts`, payload);
  }

  updateArtifact(projectId: string, artifactId: string, payload: Partial<Artifact>): Observable<Artifact> {
    return this.http.put<Artifact>(`${this.baseUrl}/projects/${projectId}/artifacts/${artifactId}`, payload);
  }

  // Test cases
  getTestCases(projectId: string, filters?: Record<string, any>): Observable<TestCase[]> {
    const query = this.buildQueryString(filters);
    return this.http.get<TestCase[]>(`${this.baseUrl}/projects/${projectId}/test-cases${query}`);
  }

  createTestCase(projectId: string, payload: Partial<TestCase>): Observable<TestCase> {
    return this.http.post<TestCase>(`${this.baseUrl}/projects/${projectId}/test-cases`, payload);
  }

  updateTestCase(projectId: string, testCaseId: string, payload: Partial<TestCase>): Observable<TestCase> {
    return this.http.put<TestCase>(`${this.baseUrl}/projects/${projectId}/test-cases/${testCaseId}`, payload);
  }

  getTestCaseRuns(projectId: string, testCaseId: string): Observable<TestRun[]> {
    return this.http.get<TestRun[]>(`${this.baseUrl}/projects/${projectId}/test-cases/${testCaseId}/runs`);
  }

  runTestCase(projectId: string, testCaseId: string, payload: Partial<TestRun> & { outcome: TestCaseOutcome }): Observable<TestRun> {
    return this.http.post<TestRun>(`${this.baseUrl}/projects/${projectId}/test-cases/${testCaseId}/runs`, payload);
  }

  // Versions
  getVersions(projectId: string): Observable<Version[]> {
    return this.http.get<Version[]>(`${this.baseUrl}/projects/${projectId}/versions`);
  }

  createVersion(projectId: string, payload: Partial<Version>): Observable<Version> {
    return this.http.post<Version>(`${this.baseUrl}/projects/${projectId}/versions`, payload);
  }

  updateVersionStatus(projectId: string, versionId: string, status: string): Observable<Version> {
    return this.http.put<Version>(`${this.baseUrl}/projects/${projectId}/versions/${versionId}/status`, { status });
  }

  // Defects
  getDefects(projectId: string, filters?: any): Observable<Defect[]> {
    let params = '';
    if (filters) {
      const queryParams = new URLSearchParams(filters).toString();
      params = queryParams ? `?${queryParams}` : '';
    }
    return this.http.get<Defect[]>(`${this.baseUrl}/projects/${projectId}/defects${params}`);
  }

  createDefect(projectId: string, payload: Partial<Defect>): Observable<Defect> {
    return this.http.post<Defect>(`${this.baseUrl}/projects/${projectId}/defects`, payload);
  }

  updateDefectStatus(projectId: string, defectId: string, status: string, resolutionNotes?: string): Observable<Defect> {
    return this.http.put<Defect>(`${this.baseUrl}/projects/${projectId}/defects/${defectId}/status`, { 
      status,
      resolutionNotes 
    });
  }

  getDefectStatistics(projectId: string): Observable<DefectStatistics> {
    return this.http.get<DefectStatistics>(`${this.baseUrl}/projects/${projectId}/defects/statistics`);
  }

  // Tasks
  getTasks(projectId: string, filters?: any): Observable<Task[]> {
    let params = '';
    if (filters) {
      const queryParams = new URLSearchParams(filters).toString();
      params = queryParams ? `?${queryParams}` : '';
    }
    return this.http.get<Task[]>(`${this.baseUrl}/projects/${projectId}/tasks${params}`);
  }

  createTask(projectId: string, payload: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/projects/${projectId}/tasks`, payload);
  }

  getTask(taskId: string): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/tasks/${taskId}`);
  }

  updateTask(taskId: string, payload: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/tasks/${taskId}`, payload);
  }

  updateTaskStatus(taskId: string, status: string): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/tasks/${taskId}/status`, { status });
  }

  assignTask(taskId: string, assignedTo: string, assignedRole?: string): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/tasks/${taskId}/assign`, { assignedTo, assignedRole });
  }

  updateTaskProgress(taskId: string, progressPercentage: number, actualHours?: number): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/tasks/${taskId}/progress`, { progressPercentage, actualHours });
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${taskId}`);
  }

  getTaskStatistics(projectId: string): Observable<TaskStatistics> {
    return this.http.get<TaskStatistics>(`${this.baseUrl}/projects/${projectId}/tasks/statistics`);
  }

  getTasksByAssignee(projectId: string, assignedTo: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/projects/${projectId}/tasks/assignee/${assignedTo}`);
  }

  private buildQueryString(filters?: Record<string, any>): string {
    if (!filters) {
      return '';
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });

    const query = params.toString();
    return query ? `?${query}` : '';
  }
}
