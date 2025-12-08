import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Task, TaskStatistics, Project } from '../services/api.service';
import { sharedStyles } from './shared-styles';

@Component({
  selector: 'app-project-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="header-section">
        <div>
          <h2>📊 Seguimiento del Proyecto</h2>
          <p class="subtitle" *ngIf="project()">{{ project()!.name }}</p>
        </div>
        <a [routerLink]="['/projects', projectId()]" class="btn-secondary">← Volver al Proyecto</a>
      </div>

      <div *ngIf="loading()" class="loading">Cargando estadísticas...</div>
      <div *ngIf="error()" class="error">{{ error() }}</div>

      <div *ngIf="statistics() && !loading()">
        <!-- Overview Cards -->
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <div class="stat-label">Total de Tareas</div>
              <div class="stat-value">{{ statistics()!.total }}</div>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">✓</div>
            <div class="stat-content">
              <div class="stat-label">Completadas</div>
              <div class="stat-value">{{ statistics()!.byStatus['done'] || 0 }}</div>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">⚠</div>
            <div class="stat-content">
              <div class="stat-label">Vencidas</div>
              <div class="stat-value">{{ statistics()!.overdueTasks }}</div>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-label">Progreso General</div>
              <div class="stat-value">{{ statistics()!.overallProgress }}%</div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="card">
          <h3>🎯 Progreso General del Proyecto</h3>
          <div class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                [style.width.%]="statistics()!.overallProgress">
              </div>
            </div>
            <div class="progress-label">{{ statistics()!.overallProgress }}% Completado</div>
          </div>
        </div>

        <!-- Status Distribution -->
        <div class="card">
          <h3>📊 Distribución por Estado</h3>
          <div class="status-grid">
            <div class="status-item" *ngFor="let status of getStatusKeys()">
              <div class="status-header">
                <span class="status-badge" [class]="getStatusClass(status)">
                  {{ getStatusLabel(status) }}
                </span>
                <span class="status-count">{{ statistics()!.byStatus[status] || 0 }}</span>
              </div>
              <div class="status-bar">
                <div 
                  class="status-bar-fill" 
                  [class]="getStatusClass(status)"
                  [style.width.%]="getPercentage(statistics()!.byStatus[status] || 0, statistics()!.total)">
                </div>
              </div>
              <div class="status-percentage">
                {{ getPercentage(statistics()!.byStatus[status] || 0, statistics()!.total) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Priority Distribution -->
        <div class="card">
          <h3>🎯 Distribución por Prioridad</h3>
          <div class="priority-grid">
            <div class="priority-item" *ngFor="let priority of getPriorityKeys()">
              <div class="priority-badge" [class]="'priority-' + priority">
                {{ getPriorityLabel(priority) }}
              </div>
              <div class="priority-count">{{ statistics()!.byPriority[priority] || 0 }} tareas</div>
              <div class="priority-bar">
                <div 
                  class="priority-bar-fill" 
                  [class]="'priority-' + priority"
                  [style.width.%]="getPercentage(statistics()!.byPriority[priority] || 0, statistics()!.total)">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Type Distribution -->
        <div class="card">
          <h3>🏷️ Distribución por Tipo</h3>
          <div class="type-grid">
            <div class="type-item" *ngFor="let type of getTypeKeys()">
              <div class="type-icon">{{ getTypeIcon(type) }}</div>
              <div class="type-info">
                <div class="type-label">{{ getTypeLabel(type) }}</div>
                <div class="type-count">{{ statistics()!.byType[type] || 0 }} tareas</div>
              </div>
              <div class="type-percentage">
                {{ getPercentage(statistics()!.byType[type] || 0, statistics()!.total) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Time Tracking -->
        <div class="card">
          <h3>⏱️ Seguimiento de Tiempo</h3>
          <div class="time-stats">
            <div class="time-item">
              <div class="time-label">Horas Estimadas</div>
              <div class="time-value">{{ statistics()!.estimatedHours }} hrs</div>
            </div>
            <div class="time-divider">→</div>
            <div class="time-item">
              <div class="time-label">Horas Reales</div>
              <div class="time-value" [class.over-estimate]="statistics()!.actualHours > statistics()!.estimatedHours">
                {{ statistics()!.actualHours }} hrs
              </div>
            </div>
            <div class="time-divider">=</div>
            <div class="time-item">
              <div class="time-label">Diferencia</div>
              <div class="time-value" [class.over-estimate]="getTimeDifference() > 0" [class.under-estimate]="getTimeDifference() < 0">
                {{ getTimeDifference() > 0 ? '+' : '' }}{{ getTimeDifference() }} hrs
              </div>
            </div>
          </div>
          <div class="time-progress">
            <div class="time-progress-bar">
              <div 
                class="time-progress-fill" 
                [class.over-budget]="statistics()!.actualHours > statistics()!.estimatedHours"
                [style.width.%]="getTimePercentage()">
              </div>
            </div>
            <div class="time-progress-label">
              {{ getTimePercentage() }}% del tiempo estimado
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="actions-section">
          <h3>🚀 Acciones Rápidas</h3>
          <div class="actions-grid">
            <a [routerLink]="['/projects', projectId(), 'workflow-board']" class="action-card">
              <div class="action-icon">📋</div>
              <div class="action-title">Tablero de Trabajo</div>
              <div class="action-description">Ver y gestionar tareas en kanban</div>
            </a>
            <a [routerLink]="['/projects', projectId(), 'task-assignments']" class="action-card">
              <div class="action-icon">👥</div>
              <div class="action-title">Asignaciones</div>
              <div class="action-description">Gestionar asignación de tareas</div>
            </a>
            <a [routerLink]="['/projects', projectId(), 'defects']" class="action-card">
              <div class="action-icon">🐛</div>
              <div class="action-title">Defectos</div>
              <div class="action-description">Seguimiento de defectos</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [sharedStyles, `
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 8px;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stat-card.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stat-card.success { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); }
    .stat-card.warning { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    .stat-card.info { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-label {
      font-size: 0.875rem;
      opacity: 0.9;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
    }

    .progress-container {
      padding: 1rem 0;
    }

    .progress-bar {
      width: 100%;
      height: 30px;
      background: #e0e0e0;
      border-radius: 15px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      color: white;
      font-weight: bold;
    }

    .progress-label {
      text-align: center;
      font-weight: 600;
      color: #555;
    }

    .status-grid {
      display: grid;
      gap: 1rem;
    }

    .status-item {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-badge.backlog { background: #e0e0e0; color: #666; }
    .status-badge.todo { background: #bbdefb; color: #1976d2; }
    .status-badge.in-progress { background: #fff9c4; color: #f57f17; }
    .status-badge.review { background: #f3e5f5; color: #7b1fa2; }
    .status-badge.testing { background: #ffe0b2; color: #e65100; }
    .status-badge.done { background: #c8e6c9; color: #388e3c; }
    .status-badge.blocked { background: #ffcdd2; color: #c62828; }

    .status-count {
      font-size: 1.25rem;
      font-weight: bold;
      color: #333;
    }

    .status-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.25rem;
    }

    .status-bar-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .status-bar-fill.backlog { background: #9e9e9e; }
    .status-bar-fill.todo { background: #2196f3; }
    .status-bar-fill.in-progress { background: #fbc02d; }
    .status-bar-fill.review { background: #9c27b0; }
    .status-bar-fill.testing { background: #ff6f00; }
    .status-bar-fill.done { background: #4caf50; }
    .status-bar-fill.blocked { background: #f44336; }

    .status-percentage {
      text-align: right;
      font-size: 0.875rem;
      color: #666;
    }

    .priority-grid {
      display: grid;
      gap: 1rem;
    }

    .priority-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .priority-badge {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      min-width: 100px;
      text-align: center;
    }

    .priority-badge.priority-low { background: #e3f2fd; color: #1976d2; }
    .priority-badge.priority-medium { background: #fff3e0; color: #f57c00; }
    .priority-badge.priority-high { background: #fce4ec; color: #c2185b; }
    .priority-badge.priority-critical { background: #ffebee; color: #c62828; }

    .priority-count {
      min-width: 80px;
      font-weight: 500;
      color: #555;
    }

    .priority-bar {
      flex: 1;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .priority-bar-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .priority-bar-fill.priority-low { background: #2196f3; }
    .priority-bar-fill.priority-medium { background: #ff9800; }
    .priority-bar-fill.priority-high { background: #e91e63; }
    .priority-bar-fill.priority-critical { background: #f44336; }

    .type-grid {
      display: grid;
      gap: 0.75rem;
    }

    .type-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .type-icon {
      font-size: 2rem;
    }

    .type-info {
      flex: 1;
    }

    .type-label {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .type-count {
      font-size: 0.875rem;
      color: #666;
    }

    .type-percentage {
      font-size: 1.25rem;
      font-weight: bold;
      color: #667eea;
    }

    .time-stats {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .time-item {
      text-align: center;
    }

    .time-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .time-value {
      font-size: 1.75rem;
      font-weight: bold;
      color: #333;
    }

    .time-value.over-estimate {
      color: #f44336;
    }

    .time-value.under-estimate {
      color: #4caf50;
    }

    .time-divider {
      font-size: 1.5rem;
      color: #999;
    }

    .time-progress-bar {
      height: 20px;
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .time-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
      transition: width 0.3s ease;
    }

    .time-progress-fill.over-budget {
      background: linear-gradient(90deg, #f44336 0%, #ff5722 100%);
    }

    .time-progress-label {
      text-align: center;
      font-size: 0.875rem;
      color: #666;
    }

    .actions-section {
      margin-top: 2rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-card {
      padding: 1.5rem;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      text-align: center;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .action-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      transform: translateY(-2px);
    }

    .action-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .action-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .action-description {
      font-size: 0.875rem;
      color: #666;
    }
  `]
})
export class ProjectTrackingComponent implements OnInit {
  projectId = signal<string>('');
  project = signal<Project | null>(null);
  statistics = signal<TaskStatistics | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

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

    // Load project info
    this.api.getProject(this.projectId()).subscribe({
      next: (project) => this.project.set(project),
      error: (err) => console.error('Error loading project:', err)
    });

    // Load statistics
    this.api.getTaskStatistics(this.projectId()).subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar estadísticas');
        this.loading.set(false);
        console.error('Error loading statistics:', err);
      }
    });
  }

  getStatusKeys(): string[] {
    return ['backlog', 'todo', 'in-progress', 'review', 'testing', 'done', 'blocked'];
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

  getStatusClass(status: string): string {
    return status;
  }

  getPriorityKeys(): string[] {
    return ['low', 'medium', 'high', 'critical'];
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

  getTypeKeys(): string[] {
    return ['feature', 'bug', 'improvement', 'documentation', 'technical-debt'];
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

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  getTimeDifference(): number {
    if (!this.statistics()) return 0;
    return this.statistics()!.actualHours - this.statistics()!.estimatedHours;
  }

  getTimePercentage(): number {
    if (!this.statistics() || this.statistics()!.estimatedHours === 0) return 0;
    const percentage = (this.statistics()!.actualHours / this.statistics()!.estimatedHours) * 100;
    return Math.min(Math.round(percentage), 200); // Cap at 200% for visual purposes
  }
}
