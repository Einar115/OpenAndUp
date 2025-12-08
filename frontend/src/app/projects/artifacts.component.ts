import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Artifact, ArtifactStatus, ArtifactType, Phase } from '../services/api.service';
import { sharedStyles } from './shared-styles';

@Component({
  selector: 'app-artifacts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <a [routerLink]="['/projects', projectId]" class="link-back">← Volver al proyecto</a>

    <section class="header">
      <div>
        <p class="eyebrow">Artefactos</p>
        <h1>Elaboración y Construcción</h1>
        <p class="muted">Gestiona artefactos y documentos por fase</p>
      </div>
      <button class="btn primary" type="button" (click)="toggleForm()">
        {{ editingArtifact ? 'Cancelar edición' : showForm ? 'Ocultar formulario' : 'Nuevo artefacto' }}
      </button>
    </section>

    <section class="form-card" *ngIf="showForm">
      <h3>{{ editingArtifact ? 'Editar artefacto' : 'Nuevo artefacto' }}</h3>
      <form (ngSubmit)="saveArtifact()">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre *</label>
            <input [(ngModel)]="form.name" name="name" required />
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select [(ngModel)]="form.type" name="type">
              <option *ngFor="let type of artifactTypes" [value]="type">{{ formatType(type) }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Estado</label>
            <select [(ngModel)]="form.status" name="status">
              <option *ngFor="let status of artifactStatuses" [value]="status">{{ formatStatus(status) }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fase asociada</label>
            <select [(ngModel)]="form.phaseId" name="phaseId">
              <option value="">Sin fase</option>
              <option *ngFor="let phase of phases" [value]="phase.id">{{ phase.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fecha de vencimiento</label>
            <input [(ngModel)]="form.dueDate" name="dueDate" type="date" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Propietario</label>
            <input [(ngModel)]="form.owner" name="owner" />
          </div>
          <div class="form-group">
            <label>Revisor</label>
            <input [(ngModel)]="form.reviewer" name="reviewer" />
          </div>
          <label class="checkbox">
            <input type="checkbox" [(ngModel)]="form.required" name="required" />
            Requerido
          </label>
        </div>

        <div class="form-group">
          <label>Descripción</label>
          <textarea [(ngModel)]="form.description" name="description" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label>Notas internas</label>
          <textarea [(ngModel)]="form.notes" name="notes" rows="2"></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn ghost" (click)="resetForm()">Cancelar</button>
          <button type="submit" class="btn primary">{{ editingArtifact ? 'Guardar cambios' : 'Crear artefacto' }}</button>
        </div>
      </form>
    </section>

    <section class="filters">
      <div class="filter-group">
        <label>Fase:</label>
        <select [(ngModel)]="filters.phaseId" (change)="applyFilters()" name="filterPhase">
          <option value="">Todas</option>
          <option *ngFor="let phase of phases" [value]="phase.id">{{ phase.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Estado:</label>
        <select [(ngModel)]="filters.status" (change)="applyFilters()" name="filterStatus">
          <option value="">Todos</option>
          <option *ngFor="let status of artifactStatuses" [value]="status">{{ formatStatus(status) }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Tipo:</label>
        <select [(ngModel)]="filters.type" (change)="applyFilters()" name="filterType">
          <option value="">Todos</option>
          <option *ngFor="let type of artifactTypes" [value]="type">{{ formatType(type) }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Propietario:</label>
        <input [(ngModel)]="filters.owner" name="filterOwner" (blur)="applyFilters()" placeholder="Buscar propietario" />
      </div>
    </section>

    <section class="artifact-list">
      <article *ngFor="let artifact of artifacts" class="artifact-card">
        <div class="artifact-top">
          <div>
            <h4>{{ artifact.name }}</h4>
            <p *ngIf="artifact.description" class="muted">{{ artifact.description }}</p>
          </div>
          <button class="btn-small" type="button" (click)="editArtifact(artifact)">Editar</button>
        </div>
        <div class="artifact-meta">
          <span *ngIf="artifact.phaseId">Fase: {{ phaseName(artifact.phaseId) }}</span>
          <span>Estado: <span class="badge" [attr.data-status]="artifact.status">{{ formatStatus(artifact.status) }}</span></span>
          <span>Tipo: {{ formatType(artifact.type) }}</span>
          <span *ngIf="artifact.owner">Propietario: {{ artifact.owner }}</span>
          <span *ngIf="artifact.reviewer">Revisor: {{ artifact.reviewer }}</span>
        </div>
        <div class="artifact-footer">
          <span *ngIf="artifact.dueDate">Vence: {{ artifact.dueDate }}</span>
          <span *ngIf="artifact.required">Requerido</span>
        </div>
      </article>
      <div *ngIf="artifacts.length === 0" class="empty">
        No hay artefactos registrados aún.
      </div>
    </section>
  `,
  styles: [
    sharedStyles,
    `
      .form-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }

      .checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .filters {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
        padding: 1rem;
        border-radius: 0.75rem;
        background: #f8fafc;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 200px;
      }

      .artifact-list {
        display: grid;
        gap: 1rem;
      }

      .artifact-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .artifact-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      .artifact-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        font-size: 0.9rem;
        color: #475569;
      }

      .artifact-footer {
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
        color: #64748b;
      }

      .btn-small {
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        background: #fff;
        padding: 0.3rem 0.75rem;
        cursor: pointer;
        font-weight: 600;
      }

      .badge {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .badge[data-status='pending'] {
        background: #fef3c7;
        color: #92400e;
      }

      .badge[data-status='in-progress'] {
        background: #e0f2fe;
        color: #0369a1;
      }

      .badge[data-status='review'] {
        background: #e0f7fa;
        color: #0c4a6e;
      }

      .badge[data-status='approved'] {
        background: #dcfce7;
        color: #166534;
      }

      .badge[data-status='done'] {
        background: #d1fae5;
        color: #0f766e;
      }

      .empty {
        text-align: center;
        padding: 1.5rem;
        color: #94a3b8;
        background: #fff;
        border: 1px dashed #cbd5e1;
        border-radius: 0.75rem;
      }
    `,
  ],
})
export class ArtifactsComponent implements OnInit {
  projectId = '';
  artifacts: Artifact[] = [];
  phases: Phase[] = [];
  showForm = true;
  editingArtifact: Artifact | null = null;

  artifactStatuses: ArtifactStatus[] = ['pending', 'in-progress', 'review', 'approved', 'done'];
  artifactTypes: ArtifactType[] = [
    'vision-document',
    'architecture',
    'use-case',
    'test-case',
    'requirements',
    'design-document',
    'deployment-plan',
    'user-manual',
    'other',
  ];

  filters = {
    phaseId: '',
    status: '',
    type: '',
    owner: '',
  };

  form = {
    id: '',
    name: '',
    description: '',
    type: 'other' as ArtifactType,
    status: 'pending' as ArtifactStatus,
    required: false,
    owner: '',
    reviewer: '',
    phaseId: '',
    dueDate: '',
    notes: '',
  };

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadProject();
    this.loadArtifacts();
  }

  toggleForm(): void {
    if (this.editingArtifact) {
      this.resetForm();
      return;
    }
    this.showForm = !this.showForm;
  }

  loadProject(): void {
    if (!this.projectId) return;
    this.api.getProject(this.projectId).subscribe((project) => {
      this.phases = project.phases;
    });
  }

  loadArtifacts(): void {
    const activeFilters: Record<string, any> = {};
    Object.entries(this.filters).forEach(([key, value]) => {
      if (value) activeFilters[key] = value;
    });

    this.api.getArtifacts(this.projectId, activeFilters).subscribe((data) => {
      this.artifacts = data;
    });
  }

  applyFilters(): void {
    this.loadArtifacts();
  }

  saveArtifact(): void {
    if (!this.form.name) {
      alert('El nombre es requerido');
      return;
    }

    const payload = {
      name: this.form.name,
      description: this.form.description,
      type: this.form.type,
      status: this.form.status,
      required: this.form.required,
      owner: this.form.owner,
      reviewer: this.form.reviewer,
      phaseId: this.form.phaseId || undefined,
      dueDate: this.form.dueDate || undefined,
      notes: this.form.notes,
    };

    if (this.editingArtifact) {
      this.api.updateArtifact(this.projectId, this.editingArtifact.id, payload).subscribe({
        next: () => {
          this.loadArtifacts();
          this.resetForm();
        },
        error: () => alert('Error al actualizar el artefacto'),
      });
      return;
    }

    this.api.createArtifact(this.projectId, payload).subscribe({
      next: () => {
        this.loadArtifacts();
        this.resetForm();
        this.showForm = false;
      },
      error: () => alert('Error al crear artefacto'),
    });
  }

  editArtifact(artifact: Artifact): void {
    this.editingArtifact = artifact;
    this.showForm = true;
    this.form = {
      id: artifact.id,
      name: artifact.name,
      description: artifact.description || '',
      type: artifact.type,
      status: artifact.status,
      required: artifact.required,
      owner: artifact.owner || '',
      reviewer: artifact.reviewer || '',
      phaseId: artifact.phaseId || '',
      dueDate: artifact.dueDate || '',
      notes: artifact.notes || '',
    };
  }

  resetForm(): void {
    this.editingArtifact = null;
    this.form = {
      id: '',
      name: '',
      description: '',
      type: 'other',
      status: 'pending',
      required: false,
      owner: '',
      reviewer: '',
      phaseId: '',
      dueDate: '',
      notes: '',
    };
  }

  phaseName(id?: string): string {
    return this.phases.find((p) => p.id === id)?.name || 'No definida';
  }

  formatStatus(status: ArtifactStatus): string {
    const map: Record<ArtifactStatus, string> = {
      pending: 'Pendiente',
      'in-progress': 'En progreso',
      review: 'En revisión',
      approved: 'Aprobado',
      done: 'Completado',
    };
    return map[status] || status;
  }

  formatType(type: ArtifactType): string {
    return type.replace('-', ' ').toUpperCase();
  }
}
