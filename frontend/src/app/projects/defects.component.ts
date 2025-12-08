import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Defect, DefectStatistics, Project } from '../services/api.service';
import { sharedStyles } from './shared-styles';

@Component({
  selector: 'app-defects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <a routerLink="/projects/{{projectId}}" class="link-back">← Volver al proyecto</a>

    <section class="header">
      <div>
        <p class="eyebrow">Gestión de Defectos</p>
        <h1>Defectos del Proyecto</h1>
        <p class="muted">Reporta y da seguimiento a defectos encontrados</p>
      </div>
      <button class="btn primary" (click)="showForm = !showForm">
        {{ showForm ? 'Cancelar' : 'Nuevo Defecto' }}
      </button>
    </section>

    <section class="stats-grid" *ngIf="statistics">
      <div class="stat-card">
        <p class="stat-label">Total</p>
        <p class="stat-value">{{ statistics.total }}</p>
      </div>
      <div class="stat-card critical">
        <p class="stat-label">Críticos</p>
        <p class="stat-value">{{ statistics.bySeverity.critical }}</p>
      </div>
      <div class="stat-card high">
        <p class="stat-label">Altos</p>
        <p class="stat-value">{{ statistics.bySeverity.high }}</p>
      </div>
      <div class="stat-card open">
        <p class="stat-label">Abiertos</p>
        <p class="stat-value">{{ statistics.byStatus.open }}</p>
      </div>
      <div class="stat-card resolved">
        <p class="stat-label">Resueltos</p>
        <p class="stat-value">{{ statistics.byStatus.resolved }}</p>
      </div>
    </section>

    <section class="form-card" *ngIf="showForm">
      <h3>Reportar Nuevo Defecto</h3>
      <form (ngSubmit)="createDefect()">
        <div class="form-group">
          <label>Título *</label>
          <input [(ngModel)]="form.title" name="title" placeholder="Descripción breve del defecto" required />
        </div>

        <div class="form-group">
          <label>Descripción</label>
          <textarea [(ngModel)]="form.description" name="description" rows="3" 
                    placeholder="Descripción detallada del defecto"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Severidad *</label>
            <select [(ngModel)]="form.severity" name="severity">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>

          <div class="form-group">
            <label>Prioridad *</label>
            <select [(ngModel)]="form.priority" name="priority">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Reportado por</label>
            <input [(ngModel)]="form.reportedBy" name="reportedBy" placeholder="Nombre del reportador" />
          </div>

          <div class="form-group">
            <label>Asignado a</label>
            <input [(ngModel)]="form.assignedTo" name="assignedTo" placeholder="Desarrollador asignado" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Fase</label>
            <select [(ngModel)]="form.phaseId" name="phaseId">
              <option value="">Sin fase</option>
              <option *ngFor="let phase of phases" [value]="phase.id">{{ phase.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Fecha de reporte</label>
            <input type="date" [(ngModel)]="form.reportedDate" name="reportedDate" />
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn ghost" (click)="resetForm()">Limpiar</button>
          <button type="submit" class="btn primary">Crear Defecto</button>
        </div>
      </form>
    </section>

    <section class="filters">
      <div class="filter-group">
        <label>Filtrar por Estado:</label>
        <select [(ngModel)]="filters.status" (change)="applyFilters()">
          <option value="">Todos</option>
          <option value="open">Abiertos</option>
          <option value="in-progress">En Progreso</option>
          <option value="resolved">Resueltos</option>
          <option value="closed">Cerrados</option>
          <option value="reopened">Reabiertos</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Severidad:</label>
        <select [(ngModel)]="filters.severity" (change)="applyFilters()">
          <option value="">Todas</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Prioridad:</label>
        <select [(ngModel)]="filters.priority" (change)="applyFilters()">
          <option value="">Todas</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      <button class="btn ghost" (click)="clearFilters()">Limpiar Filtros</button>
    </section>

    <section class="defects-list">
      <div class="list-header">
        <h3>Defectos ({{ defects.length }})</h3>
      </div>

      <div *ngIf="!defects.length" class="empty">
        <p>No hay defectos registrados.</p>
      </div>

      <article *ngFor="let defect of defects" class="defect-card">
        <div class="defect-header">
          <div>
            <h4>{{ defect.title }}</h4>
            <div class="badges">
              <span class="badge status" [attr.data-status]="defect.status">
                {{ statusLabel(defect.status) }}
              </span>
              <span class="badge severity" [attr.data-severity]="defect.severity">
                {{ severityLabel(defect.severity) }}
              </span>
              <span class="badge priority" [attr.data-priority]="defect.priority">
                P: {{ priorityLabel(defect.priority) }}
              </span>
            </div>
          </div>
          <div class="actions">
            <button class="btn-small" (click)="changeStatus(defect, 'in-progress')"
                    *ngIf="defect.status === 'open'">Iniciar</button>
            <button class="btn-small primary" (click)="resolveDefect(defect)"
                    *ngIf="defect.status === 'in-progress'">Resolver</button>
            <button class="btn-small" (click)="changeStatus(defect, 'closed')"
                    *ngIf="defect.status === 'resolved'">Cerrar</button>
            <button class="btn-small ghost" (click)="changeStatus(defect, 'reopened')"
                    *ngIf="defect.status === 'closed'">Reabrir</button>
          </div>
        </div>

        <p class="description" *ngIf="defect.description">{{ defect.description }}</p>

        <div class="defect-meta">
          <span *ngIf="defect.reportedBy">👤 Reportado: {{ defect.reportedBy }}</span>
          <span *ngIf="defect.assignedTo">🔧 Asignado: {{ defect.assignedTo }}</span>
          <span>📅 {{ defect.reportedDate }}</span>
          <span *ngIf="defect.resolvedDate">✅ Resuelto: {{ defect.resolvedDate }}</span>
        </div>

        <div class="resolution" *ngIf="defect.resolutionNotes">
          <strong>Notas de resolución:</strong>
          <p>{{ defect.resolutionNotes }}</p>
        </div>
      </article>
    </section>
  `,
  styles: [
    sharedStyles,
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .stat-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
        text-align: center;
      }

      .stat-card.critical {
        border-left: 4px solid #dc2626;
      }

      .stat-card.high {
        border-left: 4px solid #f59e0b;
      }

      .stat-card.open {
        border-left: 4px solid #3b82f6;
      }

      .stat-card.resolved {
        border-left: 4px solid #10b981;
      }

      .stat-label {
        font-size: 0.85rem;
        color: #64748b;
        margin: 0 0 0.5rem 0;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .form-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
      }

      .form-group input,
      .form-group textarea,
      .form-group select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        font-family: inherit;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .form-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-top: 1rem;
      }

      .filters {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 0.75rem;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .filter-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
      }

      .filter-group select {
        padding: 0.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        background: #fff;
      }

      .defects-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .defect-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.25rem;
      }

      .defect-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
        gap: 1rem;
      }

      .defect-header h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.15rem;
        color: #0f172a;
      }

      .badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .btn-small {
        padding: 0.3rem 0.75rem;
        font-size: 0.85rem;
        border-radius: 0.375rem;
        border: 1px solid #cbd5e1;
        background: #fff;
        cursor: pointer;
        font-weight: 500;
        white-space: nowrap;
      }

      .btn-small.primary {
        background: #38bdf8;
        color: #0f172a;
        border: none;
      }

      .btn-small.ghost {
        background: transparent;
        color: #64748b;
      }

      .description {
        color: #475569;
        margin: 0.5rem 0;
      }

      .defect-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
        color: #64748b;
        margin: 0.75rem 0;
        flex-wrap: wrap;
      }

      .resolution {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #f0fdf4;
        border-radius: 0.5rem;
        border: 1px solid #bbf7d0;
      }

      .resolution strong {
        display: block;
        margin-bottom: 0.5rem;
        color: #047857;
      }

      .resolution p {
        margin: 0;
        color: #166534;
      }

      .badge {
        font-size: 0.75rem;
        padding: 0.2rem 0.75rem;
        border-radius: 999px;
        font-weight: 600;
      }

      .badge.status[data-status='open'] {
        background: #dbeafe;
        color: #1e40af;
      }

      .badge.status[data-status='in-progress'] {
        background: #fef3c7;
        color: #92400e;
      }

      .badge.status[data-status='resolved'] {
        background: #dcfce7;
        color: #047857;
      }

      .badge.status[data-status='closed'] {
        background: #e5e7eb;
        color: #475569;
      }

      .badge.status[data-status='reopened'] {
        background: #fecaca;
        color: #991b1b;
      }

      .badge.severity[data-severity='critical'] {
        background: #fee2e2;
        color: #991b1b;
      }

      .badge.severity[data-severity='high'] {
        background: #fed7aa;
        color: #c2410c;
      }

      .badge.severity[data-severity='medium'] {
        background: #fef3c7;
        color: #92400e;
      }

      .badge.severity[data-severity='low'] {
        background: #e0e7ff;
        color: #4338ca;
      }

      .badge.priority[data-priority='high'] {
        background: #fecaca;
        color: #991b1b;
      }

      .badge.priority[data-priority='medium'] {
        background: #fed7aa;
        color: #c2410c;
      }

      .badge.priority[data-priority='low'] {
        background: #dbeafe;
        color: #1e40af;
      }

      .empty {
        text-align: center;
        padding: 2rem;
        color: #64748b;
      }
    `,
  ],
})
export class DefectsComponent implements OnInit {
  projectId = '';
  defects: Defect[] = [];
  statistics: DefectStatistics | null = null;
  phases: any[] = [];
  showForm = false;

  form = {
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    priority: 'medium' as 'low' | 'medium' | 'high',
    reportedBy: '',
    assignedTo: '',
    phaseId: '',
    reportedDate: new Date().toISOString().split('T')[0],
  };

  filters = {
    status: '',
    severity: '',
    priority: '',
  };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadProject();
    this.loadDefects();
    this.loadStatistics();
  }

  loadProject(): void {
    this.api.getProject(this.projectId).subscribe((project) => {
      this.phases = project.phases;
    });
  }

  loadDefects(): void {
    const activeFilters: any = {};
    if (this.filters.status) activeFilters.status = this.filters.status;
    if (this.filters.severity) activeFilters.severity = this.filters.severity;
    if (this.filters.priority) activeFilters.priority = this.filters.priority;

    this.api.getDefects(this.projectId, activeFilters).subscribe((data) => {
      this.defects = data;
    });
  }

  loadStatistics(): void {
    this.api.getDefectStatistics(this.projectId).subscribe((data) => {
      this.statistics = data;
    });
  }

  createDefect(): void {
    if (!this.form.title) {
      alert('El título es requerido');
      return;
    }

    this.api.createDefect(this.projectId, this.form).subscribe({
      next: () => {
        this.loadDefects();
        this.loadStatistics();
        this.resetForm();
        this.showForm = false;
      },
      error: (err) => {
        alert(err.error?.error || 'Error al crear defecto');
      },
    });
  }

  changeStatus(defect: Defect, newStatus: string): void {
    this.api.updateDefectStatus(this.projectId, defect.id, newStatus).subscribe({
      next: () => {
        this.loadDefects();
        this.loadStatistics();
      },
      error: (err) => alert(err.error?.error || 'Error al actualizar estado'),
    });
  }

  resolveDefect(defect: Defect): void {
    const notes = prompt('Notas de resolución (opcional):');
    this.api.updateDefectStatus(this.projectId, defect.id, 'resolved', notes || undefined).subscribe({
      next: () => {
        this.loadDefects();
        this.loadStatistics();
      },
      error: (err) => alert(err.error?.error || 'Error al resolver defecto'),
    });
  }

  applyFilters(): void {
    this.loadDefects();
  }

  clearFilters(): void {
    this.filters = { status: '', severity: '', priority: '' };
    this.loadDefects();
  }

  resetForm(): void {
    this.form = {
      title: '',
      description: '',
      severity: 'medium',
      priority: 'medium',
      reportedBy: '',
      assignedTo: '',
      phaseId: '',
      reportedDate: new Date().toISOString().split('T')[0],
    };
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: 'Abierto',
      'in-progress': 'En Progreso',
      resolved: 'Resuelto',
      closed: 'Cerrado',
      reopened: 'Reabierto',
    };
    return labels[status] || status;
  }

  severityLabel(severity: string): string {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica',
    };
    return labels[severity] || severity;
  }

  priorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
    };
    return labels[priority] || priority;
  }
}
