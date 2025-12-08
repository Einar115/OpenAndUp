import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Task, Project } from '../services/api.service';
import { sharedStyles } from './shared-styles';

@Component({
  selector: 'app-workflow-board',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="header-section">
        <div>
          <h2>📋 Tablero de Flujo de Trabajo</h2>
          <p class="subtitle" *ngIf="project()">{{ project()!.name }}</p>
        </div>
        <div class="header-actions">
          <button (click)="showNewTaskForm = !showNewTaskForm" class="btn-primary">
            {{ showNewTaskForm ? '✕ Cancelar' : '+ Nueva Tarea' }}
          </button>
          <a [routerLink]="['/projects', projectId()]" class="btn-secondary">← Volver</a>
        </div>
      </div>

      <!-- New Task Form -->
      <div *ngIf="showNewTaskForm" class="card form-card">
        <h3>Nueva Tarea</h3>
        <form (ngSubmit)="createTask()">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label>Título *</label>
              <input [(ngModel)]="newTask.title" name="title" required class="form-control">
            </div>
            <div class="form-group">
              <label>Prioridad</label>
              <select [(ngModel)]="newTask.priority" name="priority" class="form-control">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tipo</label>
              <select [(ngModel)]="newTask.taskType" name="taskType" class="form-control">
                <option value="feature">Funcionalidad</option>
                <option value="bug">Error</option>
                <option value="improvement">Mejora</option>
                <option value="documentation">Documentación</option>
                <option value="technical-debt">Deuda Técnica</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Descripción</label>
              <textarea [(ngModel)]="newTask.description" name="description" class="form-control" rows="3"></textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Asignado a</label>
              <input [(ngModel)]="newTask.assignedTo" name="assignedTo" class="form-control" placeholder="Usuario">
            </div>
            <div class="form-group">
              <label>Horas estimadas</label>
              <input [(ngModel)]="newTask.estimatedHours" name="estimatedHours" type="number" class="form-control" min="0">
            </div>
            <div class="form-group">
              <label>Fecha límite</label>
              <input [(ngModel)]="newTask.dueDate" name="dueDate" type="datetime-local" class="form-control">
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Crear Tarea</button>
            <button type="button" (click)="showNewTaskForm = false" class="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>🔍 Buscar:</label>
          <input [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" class="filter-input" placeholder="Buscar tareas...">
        </div>
        <div class="filter-group">
          <label>🎯 Prioridad:</label>
          <select [(ngModel)]="filterPriority" (ngModelChange)="applyFilters()" class="filter-select">
            <option value="">Todas</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>
        </div>
        <div class="filter-group">
          <label>🏷️ Tipo:</label>
          <select [(ngModel)]="filterType" (ngModelChange)="applyFilters()" class="filter-select">
            <option value="">Todos</option>
            <option value="feature">Funcionalidad</option>
            <option value="bug">Error</option>
            <option value="improvement">Mejora</option>
            <option value="documentation">Documentación</option>
            <option value="technical-debt">Deuda Técnica</option>
          </select>
        </div>
        <div class="filter-group">
          <label>👤 Asignado a:</label>
          <input [(ngModel)]="filterAssignee" (ngModelChange)="applyFilters()" class="filter-input" placeholder="Usuario">
        </div>
        <button (click)="clearFilters()" class="btn-secondary btn-sm">Limpiar Filtros</button>
      </div>

      <div *ngIf="loading()" class="loading">Cargando tareas...</div>
      <div *ngIf="error()" class="error">{{ error() }}</div>

      <!-- Kanban Board -->
      <div class="kanban-board" *ngIf="!loading()">
        <div class="kanban-column" *ngFor="let column of columns">
          <div class="column-header" [class]="'status-' + column.status">
            <div class="column-title">
              <span class="column-icon">{{ column.icon }}</span>
              <span>{{ column.label }}</span>
            </div>
            <span class="column-count">{{ getTasksByStatus(column.status).length }}</span>
          </div>
          <div class="column-body">
            <div 
              class="task-card" 
              *ngFor="let task of getTasksByStatus(column.status)"
              [class.selected]="selectedTask()?.id === task.id"
              (click)="selectTask(task)">
              <div class="task-header">
                <span class="priority-indicator" [class]="'priority-' + task.priority" [title]="getPriorityLabel(task.priority)"></span>
                <span class="task-type-badge" [class]="'type-' + task.taskType">
                  {{ getTypeIcon(task.taskType) }}
                </span>
              </div>
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
                <span *ngIf="task.assignedTo" class="task-assignee">👤 {{ task.assignedTo }}</span>
                <span *ngIf="task.estimatedHours" class="task-hours">⏱️ {{ task.estimatedHours }}h</span>
              </div>
              <div class="task-progress" *ngIf="task.progressPercentage > 0">
                <div class="progress-bar-mini">
                  <div class="progress-fill-mini" [style.width.%]="task.progressPercentage"></div>
                </div>
                <span class="progress-text">{{ task.progressPercentage }}%</span>
              </div>
              <div class="task-footer" *ngIf="task.dueDate">
                <span class="task-due-date" [class.overdue]="isOverdue(task)">
                  📅 {{ formatDate(task.dueDate) }}
                </span>
              </div>
            </div>
            <div *ngIf="getTasksByStatus(column.status).length === 0" class="empty-column">
              Sin tareas
            </div>
          </div>
        </div>
      </div>

      <!-- Task Detail Panel -->
      <div class="detail-panel" *ngIf="selectedTask()" [class.open]="selectedTask()">
        <div class="detail-header">
          <h3>Detalle de Tarea</h3>
          <button (click)="closeDetail()" class="btn-close">✕</button>
        </div>
        <div class="detail-body">
          <div class="detail-section">
            <label>Estado</label>
            <select [(ngModel)]="selectedTask()!.status" (ngModelChange)="updateTaskStatus()" class="form-control">
              <option value="backlog">Backlog</option>
              <option value="todo">Por Hacer</option>
              <option value="in-progress">En Progreso</option>
              <option value="review">En Revisión</option>
              <option value="testing">En Pruebas</option>
              <option value="done">Completado</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>
          <div class="detail-section">
            <label>Título</label>
            <input [(ngModel)]="selectedTask()!.title" (blur)="updateTask()" class="form-control">
          </div>
          <div class="detail-section">
            <label>Descripción</label>
            <textarea [(ngModel)]="selectedTask()!.description" (blur)="updateTask()" class="form-control" rows="4"></textarea>
          </div>
          <div class="detail-row">
            <div class="detail-section">
              <label>Prioridad</label>
              <select [(ngModel)]="selectedTask()!.priority" (ngModelChange)="updateTask()" class="form-control">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div class="detail-section">
              <label>Tipo</label>
              <select [(ngModel)]="selectedTask()!.taskType" (ngModelChange)="updateTask()" class="form-control">
                <option value="feature">Funcionalidad</option>
                <option value="bug">Error</option>
                <option value="improvement">Mejora</option>
                <option value="documentation">Documentación</option>
                <option value="technical-debt">Deuda Técnica</option>
              </select>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-section">
              <label>Asignado a</label>
              <input [(ngModel)]="selectedTask()!.assignedTo" (blur)="updateTask()" class="form-control">
            </div>
            <div class="detail-section">
              <label>Rol</label>
              <input [(ngModel)]="selectedTask()!.assignedRole" (blur)="updateTask()" class="form-control">
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-section">
              <label>Horas estimadas</label>
              <input [(ngModel)]="selectedTask()!.estimatedHours" (blur)="updateTask()" type="number" class="form-control">
            </div>
            <div class="detail-section">
              <label>Horas reales</label>
              <input [(ngModel)]="selectedTask()!.actualHours" (blur)="updateTask()" type="number" class="form-control">
            </div>
          </div>
          <div class="detail-section">
            <label>Progreso: {{ selectedTask()!.progressPercentage }}%</label>
            <input 
              [(ngModel)]="selectedTask()!.progressPercentage" 
              (ngModelChange)="updateTask()" 
              type="range" 
              min="0" 
              max="100" 
              class="progress-slider">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="selectedTask()!.progressPercentage"></div>
            </div>
          </div>
          <div class="detail-section">
            <label>Fecha límite</label>
            <input [(ngModel)]="selectedTask()!.dueDate" (blur)="updateTask()" type="datetime-local" class="form-control">
          </div>
          <div class="detail-actions">
            <button (click)="deleteTask()" class="btn-danger">🗑️ Eliminar Tarea</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [sharedStyles, `
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .form-card {
      margin-bottom: 1.5rem;
      background: #f8f9fa;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .filters-section {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .filter-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #666;
    }

    .filter-input, .filter-select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .kanban-board {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .kanban-column {
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 400px);
    }

    .column-header {
      padding: 1rem;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid;
    }

    .column-header.status-backlog { background: #e0e0e0; border-color: #9e9e9e; }
    .column-header.status-todo { background: #e3f2fd; border-color: #2196f3; }
    .column-header.status-in-progress { background: #fff9c4; border-color: #fbc02d; }
    .column-header.status-review { background: #f3e5f5; border-color: #9c27b0; }
    .column-header.status-testing { background: #ffe0b2; border-color: #ff6f00; }
    .column-header.status-done { background: #c8e6c9; border-color: #4caf50; }
    .column-header.status-blocked { background: #ffcdd2; border-color: #f44336; }

    .column-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .column-icon {
      font-size: 1.25rem;
    }

    .column-count {
      background: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: bold;
    }

    .column-body {
      padding: 1rem;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .task-card {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
    }

    .task-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .task-card.selected {
      border-left-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .priority-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }

    .priority-indicator.priority-low { background: #2196f3; }
    .priority-indicator.priority-medium { background: #ff9800; }
    .priority-indicator.priority-high { background: #e91e63; }
    .priority-indicator.priority-critical { background: #f44336; }

    .task-type-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      background: #e0e0e0;
    }

    .task-type-badge.type-feature { background: #e3f2fd; }
    .task-type-badge.type-bug { background: #ffebee; }
    .task-type-badge.type-improvement { background: #f3e5f5; }
    .task-type-badge.type-documentation { background: #fff3e0; }
    .task-type-badge.type-technical-debt { background: #fce4ec; }

    .task-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    .task-meta {
      display: flex;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .task-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .progress-bar-mini {
      flex: 1;
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill-mini {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.75rem;
      color: #666;
      font-weight: 500;
    }

    .task-footer {
      padding-top: 0.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .task-due-date {
      font-size: 0.75rem;
      color: #666;
    }

    .task-due-date.overdue {
      color: #f44336;
      font-weight: 600;
    }

    .empty-column {
      text-align: center;
      padding: 2rem;
      color: #999;
      font-style: italic;
    }

    .detail-panel {
      position: fixed;
      right: -400px;
      top: 0;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 12px rgba(0,0,0,0.15);
      transition: right 0.3s ease;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .detail-panel.open {
      right: 0;
    }

    .detail-header {
      padding: 1.5rem;
      border-bottom: 2px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #667eea;
      color: white;
    }

    .detail-header h3 {
      margin: 0;
      font-size: 1.25rem;
    }

    .btn-close {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .btn-close:hover {
      background: rgba(255,255,255,0.2);
    }

    .detail-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .detail-section {
      margin-bottom: 1.5rem;
    }

    .detail-section label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .detail-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .progress-slider {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .detail-actions {
      padding-top: 1rem;
      border-top: 2px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class WorkflowBoardComponent implements OnInit {
  projectId = signal<string>('');
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  filteredTasks = signal<Task[]>([]);
  selectedTask = signal<Task | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  showNewTaskForm = false;
  newTask: Partial<Task> = {
    title: '',
    description: '',
    priority: 'medium',
    taskType: 'feature',
    status: 'backlog'
  };

  searchTerm = '';
  filterPriority = '';
  filterType = '';
  filterAssignee = '';

  columns = [
    { status: 'backlog', label: 'Backlog', icon: '📥' },
    { status: 'todo', label: 'Por Hacer', icon: '📝' },
    { status: 'in-progress', label: 'En Progreso', icon: '🔄' },
    { status: 'review', label: 'En Revisión', icon: '👀' },
    { status: 'testing', label: 'En Pruebas', icon: '🧪' },
    { status: 'done', label: 'Completado', icon: '✅' },
    { status: 'blocked', label: 'Bloqueado', icon: '🚫' }
  ];

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

    this.api.getTasks(this.projectId()).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar tareas');
        this.loading.set(false);
        console.error('Error loading tasks:', err);
      }
    });
  }

  createTask() {
    if (!this.newTask.title) return;

    this.api.createTask(this.projectId(), this.newTask).subscribe({
      next: (task) => {
        this.tasks.update(tasks => [...tasks, task]);
        this.applyFilters();
        this.showNewTaskForm = false;
        this.newTask = {
          title: '',
          description: '',
          priority: 'medium',
          taskType: 'feature',
          status: 'backlog'
        };
      },
      error: (err) => {
        this.error.set('Error al crear tarea');
        console.error('Error creating task:', err);
      }
    });
  }

  applyFilters() {
    let filtered = this.tasks();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(term) || 
        t.description?.toLowerCase().includes(term)
      );
    }

    if (this.filterPriority) {
      filtered = filtered.filter(t => t.priority === this.filterPriority);
    }

    if (this.filterType) {
      filtered = filtered.filter(t => t.taskType === this.filterType);
    }

    if (this.filterAssignee) {
      filtered = filtered.filter(t => 
        t.assignedTo?.toLowerCase().includes(this.filterAssignee.toLowerCase())
      );
    }

    this.filteredTasks.set(filtered);
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterPriority = '';
    this.filterType = '';
    this.filterAssignee = '';
    this.applyFilters();
  }

  getTasksByStatus(status: string): Task[] {
    return this.filteredTasks().filter(t => t.status === status);
  }

  selectTask(task: Task) {
    this.selectedTask.set({ ...task });
  }

  closeDetail() {
    this.selectedTask.set(null);
  }

  updateTaskStatus() {
    const task = this.selectedTask();
    if (!task) return;

    this.api.updateTaskStatus(task.id, task.status).subscribe({
      next: (updated) => {
        this.tasks.update(tasks => 
          tasks.map(t => t.id === updated.id ? updated : t)
        );
        this.selectedTask.set(updated);
        this.applyFilters();
      },
      error: (err) => {
        this.error.set('Error al actualizar estado');
        console.error('Error updating status:', err);
      }
    });
  }

  updateTask() {
    const task = this.selectedTask();
    if (!task) return;

    this.api.updateTask(task.id, task).subscribe({
      next: (updated) => {
        this.tasks.update(tasks => 
          tasks.map(t => t.id === updated.id ? updated : t)
        );
        this.selectedTask.set(updated);
        this.applyFilters();
      },
      error: (err) => {
        this.error.set('Error al actualizar tarea');
        console.error('Error updating task:', err);
      }
    });
  }

  deleteTask() {
    const task = this.selectedTask();
    if (!task || !confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

    this.api.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks.update(tasks => tasks.filter(t => t.id !== task.id));
        this.applyFilters();
        this.closeDetail();
      },
      error: (err) => {
        this.error.set('Error al eliminar tarea');
        console.error('Error deleting task:', err);
      }
    });
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Vencida hace ${Math.abs(diffDays)} días`;
    } else if (diffDays === 0) {
      return 'Vence hoy';
    } else if (diffDays === 1) {
      return 'Vence mañana';
    } else if (diffDays <= 7) {
      return `En ${diffDays} días`;
    } else {
      return date.toLocaleDateString();
    }
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  }
}
