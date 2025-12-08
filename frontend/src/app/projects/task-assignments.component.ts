import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Task, Project, RoleAssignment } from '../services/api.service';
import { sharedStyles } from './shared-styles';

interface AssigneeStats {
  name: string;
  role?: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  estimatedHours: number;
  actualHours: number;
  tasks: Task[];
}

@Component({
  selector: 'app-task-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="header-section">
        <div>
          <h2>👥 Asignación de Tareas</h2>
          <p class="subtitle" *ngIf="project()">{{ project()!.name }}</p>
        </div>
        <a [routerLink]="['/projects', projectId()]" class="btn-secondary">← Volver al Proyecto</a>
      </div>

      <div *ngIf="loading()" class="loading">Cargando asignaciones...</div>
      <div *ngIf="error()" class="error">{{ error() }}</div>

      <!-- View Switcher -->
      <div class="view-switcher">
        <button 
          (click)="currentView = 'by-person'" 
          [class.active]="currentView === 'by-person'"
          class="view-btn">
          👤 Por Persona
        </button>
        <button 
          (click)="currentView = 'by-role'" 
          [class.active]="currentView === 'by-role'"
          class="view-btn">
          🎭 Por Rol
        </button>
        <button 
          (click)="currentView = 'unassigned'" 
          [class.active]="currentView === 'unassigned'"
          class="view-btn">
          📋 Sin Asignar
        </button>
      </div>

      <!-- By Person View -->
      <div *ngIf="currentView === 'by-person' && !loading()">
        <div class="stats-overview">
          <div class="overview-card">
            <div class="overview-label">Total de Personas</div>
            <div class="overview-value">{{ getAssigneeStats().length }}</div>
          </div>
          <div class="overview-card">
            <div class="overview-label">Tareas Asignadas</div>
            <div class="overview-value">{{ getTotalAssignedTasks() }}</div>
          </div>
          <div class="overview-card">
            <div class="overview-label">Carga Promedio</div>
            <div class="overview-value">{{ getAverageLoad() }} tareas</div>
          </div>
        </div>

        <div class="assignee-grid">
          <div class="assignee-card" *ngFor="let assignee of getAssigneeStats()">
            <div class="assignee-header">
              <div class="assignee-info">
                <div class="assignee-name">👤 {{ assignee.name }}</div>
                <div class="assignee-role" *ngIf="assignee.role">{{ assignee.role }}</div>
              </div>
              <div class="assignee-badge">
                {{ assignee.totalTasks }} tareas
              </div>
            </div>

            <div class="assignee-stats">
              <div class="stat-item">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                  <div class="stat-label">Completadas</div>
                  <div class="stat-value">{{ assignee.completedTasks }}</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">🔄</div>
                <div class="stat-info">
                  <div class="stat-label">En Progreso</div>
                  <div class="stat-value">{{ assignee.inProgressTasks }}</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">⏱️</div>
                <div class="stat-info">
                  <div class="stat-label">Horas</div>
                  <div class="stat-value">{{ assignee.actualHours }}/{{ assignee.estimatedHours }}</div>
                </div>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-label">
                Progreso: {{ getAssigneeProgress(assignee) }}%
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="getAssigneeProgress(assignee)"></div>
              </div>
            </div>

            <div class="task-list">
              <div class="task-item" *ngFor="let task of assignee.tasks.slice(0, 3)">
                <span class="task-status-badge" [class]="'status-' + task.status">
                  {{ getStatusIcon(task.status) }}
                </span>
                <span class="task-title-mini">{{ task.title }}</span>
                <span class="task-priority-dot" [class]="'priority-' + task.priority"></span>
              </div>
              <div class="task-item-more" *ngIf="assignee.tasks.length > 3">
                +{{ assignee.tasks.length - 3 }} más
              </div>
            </div>

            <button (click)="showAssigneeDetail(assignee)" class="btn-secondary btn-sm btn-full">
              Ver Detalles
            </button>
          </div>
        </div>
      </div>

      <!-- By Role View -->
      <div *ngIf="currentView === 'by-role' && !loading()">
        <div class="role-grid">
          <div class="role-card" *ngFor="let role of getRoleStats()">
            <div class="role-header">
              <div class="role-icon">{{ getRoleIcon(role.name) }}</div>
              <div class="role-info">
                <div class="role-name">{{ role.name }}</div>
                <div class="role-count">{{ role.members.length }} miembros</div>
              </div>
              <div class="role-tasks-count">{{ role.totalTasks }} tareas</div>
            </div>

            <div class="members-list">
              <div class="member-item" *ngFor="let member of role.members">
                <div class="member-name">👤 {{ member.user }}</div>
                <div class="member-tasks">{{ member.taskCount }} tareas</div>
                <button (click)="selectAssignee(member.user)" class="btn-link">Ver →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Unassigned View -->
      <div *ngIf="currentView === 'unassigned' && !loading()">
        <div class="unassigned-header">
          <h3>📋 Tareas Sin Asignar</h3>
          <div class="unassigned-count">{{ getUnassignedTasks().length }} tareas</div>
        </div>

        <div class="unassigned-grid">
          <div class="unassigned-card" *ngFor="let task of getUnassignedTasks()">
            <div class="unassigned-task-header">
              <span class="priority-indicator" [class]="'priority-' + task.priority"></span>
              <span class="task-type-badge" [class]="'type-' + task.taskType">
                {{ getTypeIcon(task.taskType) }}
              </span>
              <span class="status-badge-mini" [class]="'status-' + task.status">
                {{ task.status }}
              </span>
            </div>
            <div class="unassigned-task-title">{{ task.title }}</div>
            <div class="unassigned-task-meta">
              <span *ngIf="task.estimatedHours">⏱️ {{ task.estimatedHours }}h</span>
              <span *ngIf="task.dueDate" [class.overdue]="isOverdue(task)">
                📅 {{ formatDate(task.dueDate) }}
              </span>
            </div>
            <div class="assign-section">
              <select [(ngModel)]="task.tempAssignee" class="form-control-sm">
                <option value="">Seleccionar persona...</option>
                <option *ngFor="let person of getAvailableAssignees()" [value]="person">
                  {{ person }}
                </option>
              </select>
              <button 
                (click)="assignTask(task)" 
                [disabled]="!task.tempAssignee"
                class="btn-primary btn-sm">
                Asignar
              </button>
            </div>
          </div>

          <div *ngIf="getUnassignedTasks().length === 0" class="empty-state">
            <div class="empty-icon">✅</div>
            <div class="empty-title">¡Todas las tareas están asignadas!</div>
            <div class="empty-description">No hay tareas pendientes de asignación.</div>
          </div>
        </div>
      </div>

      <!-- Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedAssignee" (click)="closeDetail()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>👤 {{ selectedAssignee.name }}</h3>
            <button (click)="closeDetail()" class="btn-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-stats-grid">
              <div class="detail-stat">
                <div class="detail-stat-label">Total de Tareas</div>
                <div class="detail-stat-value">{{ selectedAssignee.totalTasks }}</div>
              </div>
              <div class="detail-stat">
                <div class="detail-stat-label">Completadas</div>
                <div class="detail-stat-value success">{{ selectedAssignee.completedTasks }}</div>
              </div>
              <div class="detail-stat">
                <div class="detail-stat-label">En Progreso</div>
                <div class="detail-stat-value warning">{{ selectedAssignee.inProgressTasks }}</div>
              </div>
              <div class="detail-stat">
                <div class="detail-stat-label">Horas Estimadas</div>
                <div class="detail-stat-value">{{ selectedAssignee.estimatedHours }}h</div>
              </div>
            </div>

            <h4>Tareas Asignadas</h4>
            <div class="detail-task-list">
              <div class="detail-task-item" *ngFor="let task of selectedAssignee.tasks">
                <div class="detail-task-header">
                  <span class="status-badge" [class]="'status-' + task.status">
                    {{ getStatusLabel(task.status) }}
                  </span>
                  <span class="priority-badge" [class]="'priority-' + task.priority">
                    {{ getPriorityLabel(task.priority) }}
                  </span>
                </div>
                <div class="detail-task-title">{{ task.title }}</div>
                <div class="detail-task-meta">
                  <span>{{ getTypeIcon(task.taskType) }} {{ getTypeLabel(task.taskType) }}</span>
                  <span *ngIf="task.estimatedHours">⏱️ {{ task.estimatedHours }}h</span>
                  <span *ngIf="task.dueDate">📅 {{ formatDate(task.dueDate) }}</span>
                </div>
                <div class="detail-task-actions">
                  <button (click)="reassignTask(task)" class="btn-link">Reasignar</button>
                  <a [routerLink]="['/projects', projectId(), 'workflow-board']" class="btn-link">Ver en Kanban →</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reassign Modal -->
      <div class="modal-overlay" *ngIf="taskToReassign" (click)="closeReassign()">
        <div class="modal-content-small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Reasignar Tarea</h3>
            <button (click)="closeReassign()" class="btn-close">✕</button>
          </div>
          <div class="modal-body">
            <p><strong>{{ taskToReassign.title }}</strong></p>
            <div class="form-group">
              <label>Asignado actualmente a:</label>
              <div class="current-assignee">{{ taskToReassign.assignedTo }}</div>
            </div>
            <div class="form-group">
              <label>Nueva persona:</label>
              <select [(ngModel)]="newAssignee" class="form-control">
                <option value="">Seleccionar...</option>
                <option *ngFor="let person of getAvailableAssignees()" [value]="person">
                  {{ person }}
                </option>
              </select>
            </div>
            <div class="modal-actions">
              <button (click)="confirmReassign()" [disabled]="!newAssignee" class="btn-primary">
                Reasignar
              </button>
              <button (click)="closeReassign()" class="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [sharedStyles, `
    .view-switcher {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      background: white;
      padding: 0.5rem;
      border-radius: 8px;
    }

    .view-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .view-btn:hover {
      border-color: #667eea;
      background: #f8f9fa;
    }

    .view-btn.active {
      border-color: #667eea;
      background: #667eea;
      color: white;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .overview-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      border: 2px solid #e0e0e0;
    }

    .overview-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .overview-value {
      font-size: 2rem;
      font-weight: bold;
      color: #667eea;
    }

    .assignee-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .assignee-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .assignee-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .assignee-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .assignee-name {
      font-size: 1.125rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .assignee-role {
      font-size: 0.875rem;
      color: #666;
    }

    .assignee-badge {
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .assignee-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-icon {
      font-size: 1.5rem;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #666;
    }

    .stat-value {
      font-size: 1rem;
      font-weight: bold;
      color: #333;
    }

    .progress-section {
      margin-bottom: 1rem;
    }

    .progress-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .task-list {
      margin-bottom: 1rem;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .task-status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      background: #e0e0e0;
    }

    .task-status-badge.status-done { background: #c8e6c9; }
    .task-status-badge.status-in-progress { background: #fff9c4; }
    .task-status-badge.status-blocked { background: #ffcdd2; }

    .task-title-mini {
      flex: 1;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .task-priority-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .task-priority-dot.priority-low { background: #2196f3; }
    .task-priority-dot.priority-medium { background: #ff9800; }
    .task-priority-dot.priority-high { background: #e91e63; }
    .task-priority-dot.priority-critical { background: #f44336; }

    .task-item-more {
      text-align: center;
      font-size: 0.875rem;
      color: #666;
      font-style: italic;
    }

    .btn-full {
      width: 100%;
    }

    .role-grid {
      display: grid;
      gap: 1rem;
    }

    .role-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .role-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .role-icon {
      font-size: 2.5rem;
    }

    .role-info {
      flex: 1;
    }

    .role-name {
      font-size: 1.25rem;
      font-weight: bold;
      color: #333;
    }

    .role-count {
      font-size: 0.875rem;
      color: #666;
    }

    .role-tasks-count {
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
    }

    .members-list {
      display: grid;
      gap: 0.5rem;
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .member-name {
      flex: 1;
      font-weight: 500;
    }

    .member-tasks {
      color: #666;
      font-size: 0.875rem;
    }

    .btn-link {
      background: none;
      border: none;
      color: #667eea;
      cursor: pointer;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .unassigned-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .unassigned-count {
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
    }

    .unassigned-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .unassigned-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .unassigned-task-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .priority-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .status-badge-mini {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      background: #e0e0e0;
    }

    .unassigned-task-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.75rem;
    }

    .unassigned-task-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 1rem;
    }

    .assign-section {
      display: flex;
      gap: 0.5rem;
    }

    .form-control-sm {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .empty-description {
      color: #666;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .modal-content-small {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 2px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .btn-close:hover {
      background: #f0f0f0;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .detail-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .detail-stat {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .detail-stat-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .detail-stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #333;
    }

    .detail-stat-value.success {
      color: #4caf50;
    }

    .detail-stat-value.warning {
      color: #ff9800;
    }

    .detail-task-list {
      display: grid;
      gap: 1rem;
      margin-top: 1rem;
    }

    .detail-task-item {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .detail-task-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .detail-task-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .detail-task-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .detail-task-actions {
      display: flex;
      gap: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .current-assignee {
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 4px;
      font-weight: 500;
    }

    .modal-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .overdue {
      color: #f44336;
      font-weight: 600;
    }
  `]
})
export class TaskAssignmentsComponent implements OnInit {
  projectId = signal<string>('');
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  roleAssignments = signal<RoleAssignment[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  currentView: 'by-person' | 'by-role' | 'unassigned' = 'by-person';
  selectedAssignee: AssigneeStats | null = null;
  taskToReassign: Task | null = null;
  newAssignee = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId.set(id);
      this.loadData();
    }
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getProject(this.projectId()).subscribe({
      next: (project) => this.project.set(project),
      error: (err) => console.error('Error loading project:', err)
    });

    this.api.getRoles(this.projectId()).subscribe({
      next: (roles) => this.roleAssignments.set(roles),
      error: (err) => console.error('Error loading roles:', err)
    });

    this.api.getTasks(this.projectId()).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar tareas');
        this.loading.set(false);
        console.error('Error loading tasks:', err);
      }
    });
  }

  getAssigneeStats(): AssigneeStats[] {
    const assigneeMap = new Map<string, AssigneeStats>();

    this.tasks().forEach(task => {
      if (task.assignedTo) {
        if (!assigneeMap.has(task.assignedTo)) {
          assigneeMap.set(task.assignedTo, {
            name: task.assignedTo,
            role: task.assignedRole,
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            estimatedHours: 0,
            actualHours: 0,
            tasks: []
          });
        }

        const stats = assigneeMap.get(task.assignedTo)!;
        stats.totalTasks++;
        stats.tasks.push(task);
        if (task.status === 'done') stats.completedTasks++;
        if (task.status === 'in-progress') stats.inProgressTasks++;
        stats.estimatedHours += task.estimatedHours || 0;
        stats.actualHours += task.actualHours || 0;
      }
    });

    return Array.from(assigneeMap.values()).sort((a, b) => b.totalTasks - a.totalTasks);
  }

  getTotalAssignedTasks(): number {
    return this.tasks().filter(t => t.assignedTo).length;
  }

  getAverageLoad(): number {
    const stats = this.getAssigneeStats();
    if (stats.length === 0) return 0;
    const total = stats.reduce((sum, s) => sum + s.totalTasks, 0);
    return Math.round(total / stats.length);
  }

  getAssigneeProgress(assignee: AssigneeStats): number {
    if (assignee.totalTasks === 0) return 0;
    return Math.round((assignee.completedTasks / assignee.totalTasks) * 100);
  }

  getRoleStats(): any[] {
    const roleMap = new Map<string, any>();

    // Initialize with all roles from assignments
    this.roleAssignments().forEach(ra => {
      if (!roleMap.has(ra.role)) {
        roleMap.set(ra.role, {
          name: ra.role,
          members: [],
          totalTasks: 0
        });
      }
      const taskCount = this.tasks().filter(t => t.assignedTo === ra.user).length;
      roleMap.get(ra.role)!.members.push({
        user: ra.user,
        taskCount
      });
      roleMap.get(ra.role)!.totalTasks += taskCount;
    });

    return Array.from(roleMap.values());
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      'Project Manager': '👔',
      'Tech Lead': '💼',
      'Developer': '👨‍💻',
      'QA': '🔍',
      'Stakeholder': '🤝',
      'Coach': '🎓'
    };
    return icons[role] || '👤';
  }

  getUnassignedTasks(): (Task & { tempAssignee?: string })[] {
    return this.tasks().filter(t => !t.assignedTo);
  }

  getAvailableAssignees(): string[] {
    const assignees = new Set<string>();
    this.roleAssignments().forEach(ra => assignees.add(ra.user));
    this.tasks().forEach(t => {
      if (t.assignedTo) assignees.add(t.assignedTo);
    });
    return Array.from(assignees).sort();
  }

  assignTask(task: Task & { tempAssignee?: string }) {
    if (!task.tempAssignee) return;

    this.api.assignTask(task.id, task.tempAssignee).subscribe({
      next: (updated) => {
        this.tasks.update(tasks => 
          tasks.map(t => t.id === updated.id ? updated : t)
        );
        delete task.tempAssignee;
      },
      error: (err) => {
        this.error.set('Error al asignar tarea');
        console.error('Error assigning task:', err);
      }
    });
  }

  selectAssignee(name: string) {
    const stats = this.getAssigneeStats().find(s => s.name === name);
    if (stats) {
      this.selectedAssignee = stats;
    }
  }

  showAssigneeDetail(assignee: AssigneeStats) {
    this.selectedAssignee = assignee;
  }

  closeDetail() {
    this.selectedAssignee = null;
  }

  reassignTask(task: Task) {
    this.taskToReassign = task;
    this.newAssignee = '';
  }

  closeReassign() {
    this.taskToReassign = null;
    this.newAssignee = '';
  }

  confirmReassign() {
    if (!this.taskToReassign || !this.newAssignee) return;

    this.api.assignTask(this.taskToReassign.id, this.newAssignee).subscribe({
      next: (updated) => {
        this.tasks.update(tasks => 
          tasks.map(t => t.id === updated.id ? updated : t)
        );
        this.closeReassign();
        if (this.selectedAssignee) {
          this.selectedAssignee = this.getAssigneeStats().find(
            s => s.name === this.selectedAssignee!.name
          ) || null;
        }
      },
      error: (err) => {
        this.error.set('Error al reasignar tarea');
        console.error('Error reassigning task:', err);
      }
    });
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'backlog': '📥',
      'todo': '📝',
      'in-progress': '🔄',
      'review': '👀',
      'testing': '🧪',
      'done': '✅',
      'blocked': '🚫'
    };
    return icons[status] || '📋';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'backlog': 'Backlog',
      'todo': 'Por Hacer',
      'in-progress': 'En Progreso',
      'review': 'En Revisión',
      'testing': 'En Pruebas',
      'done': 'Completado',
      'blocked': 'Bloqueado'
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return labels[priority] || priority;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'feature': '✨',
      'bug': '🐛',
      'improvement': '⚡',
      'documentation': '📚',
      'technical-debt': '🔧'
    };
    return icons[type] || '📝';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'feature': 'Funcionalidad',
      'bug': 'Error',
      'improvement': 'Mejora',
      'documentation': 'Documentación',
      'technical-debt': 'Deuda Técnica'
    };
    return labels[type] || type;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  }
}
