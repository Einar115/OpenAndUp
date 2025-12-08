import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Version } from '../services/api.service';
import { sharedStyles } from './shared-styles';

@Component({
  selector: 'app-versions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <a routerLink="/projects/{{projectId}}" class="link-back">← Volver al proyecto</a>

    <section class="header">
      <div>
        <p class="eyebrow">Control de Versiones</p>
        <h1>Historial de Versiones</h1>
        <p class="muted">Gestiona las versiones del proyecto</p>
      </div>
      <button class="btn primary" (click)="showForm = !showForm">
        {{ showForm ? 'Cancelar' : 'Nueva Versión' }}
      </button>
    </section>

    <section class="form-card" *ngIf="showForm">
      <h3>Crear Nueva Versión</h3>
      <form (ngSubmit)="createVersion()">
        <div class="form-group">
          <label>Versión *</label>
          <input [(ngModel)]="form.version" name="version" placeholder="v1.0.0" required />
        </div>

        <div class="form-group">
          <label>Descripción</label>
          <textarea [(ngModel)]="form.description" name="description" rows="2" 
                    placeholder="Descripción breve de esta versión"></textarea>
        </div>

        <div class="form-group">
          <label>Cambios</label>
          <textarea [(ngModel)]="form.changes" name="changes" rows="4" 
                    placeholder="Notas de cambios y mejoras incluidas"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Fecha de Lanzamiento</label>
            <input type="date" [(ngModel)]="form.releaseDate" name="releaseDate" />
          </div>

          <div class="form-group">
            <label>Estado</label>
            <select [(ngModel)]="form.status" name="status">
              <option value="draft">Borrador</option>
              <option value="released">Lanzada</option>
              <option value="archived">Archivada</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Creado por</label>
          <input [(ngModel)]="form.createdBy" name="createdBy" placeholder="Nombre del desarrollador" />
        </div>

        <div class="form-actions">
          <button type="button" class="btn ghost" (click)="resetForm()">Limpiar</button>
          <button type="submit" class="btn primary">Crear Versión</button>
        </div>
      </form>
    </section>

    <section class="versions-list">
      <div class="list-header">
        <h3>Versiones ({{ versions.length }})</h3>
      </div>

      <div *ngIf="!versions.length" class="empty">
        <p>No hay versiones registradas aún.</p>
      </div>

      <article *ngFor="let version of versions" class="version-card">
        <div class="version-header">
          <div>
            <h4>{{ version.version }}</h4>
            <span class="badge" [attr.data-status]="version.status">
              {{ statusLabel(version.status) }}
            </span>
          </div>
          <div class="actions">
            <button class="btn-small" (click)="changeStatus(version, 'draft')" 
                    *ngIf="version.status !== 'draft'">Marcar como Borrador</button>
            <button class="btn-small primary" (click)="changeStatus(version, 'released')"
                    *ngIf="version.status !== 'released'">Lanzar</button>
            <button class="btn-small ghost" (click)="changeStatus(version, 'archived')"
                    *ngIf="version.status !== 'archived'">Archivar</button>
          </div>
        </div>

        <p class="description" *ngIf="version.description">{{ version.description }}</p>

        <div class="version-meta">
          <span *ngIf="version.releaseDate">📅 {{ version.releaseDate }}</span>
          <span *ngIf="version.createdBy">👤 {{ version.createdBy }}</span>
          <span>🕐 {{ version.createdAt | date:'short' }}</span>
        </div>

        <div class="changes" *ngIf="version.changes">
          <strong>Cambios:</strong>
          <pre>{{ version.changes }}</pre>
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

      .versions-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .version-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.25rem;
      }

      .version-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
        gap: 1rem;
      }

      .version-header h4 {
        margin: 0;
        font-size: 1.25rem;
        color: #0f172a;
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

      .version-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
        color: #64748b;
        margin: 0.75rem 0;
        flex-wrap: wrap;
      }

      .changes {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
      }

      .changes strong {
        display: block;
        margin-bottom: 0.5rem;
        color: #0f172a;
      }

      .changes pre {
        margin: 0;
        white-space: pre-wrap;
        font-family: inherit;
        color: #475569;
      }

      .badge {
        font-size: 0.75rem;
        padding: 0.2rem 0.75rem;
        border-radius: 999px;
        font-weight: 600;
      }

      .badge[data-status='draft'] {
        background: #fef3c7;
        color: #92400e;
      }

      .badge[data-status='released'] {
        background: #dcfce7;
        color: #047857;
      }

      .badge[data-status='archived'] {
        background: #e5e7eb;
        color: #475569;
      }

      .empty {
        text-align: center;
        padding: 2rem;
        color: #64748b;
      }
    `,
  ],
})
export class VersionsComponent implements OnInit {
  projectId = '';
  versions: Version[] = [];
  showForm = false;

  form = {
    version: '',
    description: '',
    changes: '',
    releaseDate: '',
    status: 'draft' as 'draft' | 'released' | 'archived',
    createdBy: '',
  };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadVersions();
  }

  loadVersions(): void {
    this.api.getVersions(this.projectId).subscribe((data) => {
      this.versions = data;
    });
  }

  createVersion(): void {
    if (!this.form.version) {
      alert('La versión es requerida');
      return;
    }

    this.api.createVersion(this.projectId, this.form).subscribe({
      next: () => {
        this.loadVersions();
        this.resetForm();
        this.showForm = false;
      },
      error: (err) => {
        alert(err.error?.error || 'Error al crear versión');
      },
    });
  }

  changeStatus(version: Version, newStatus: string): void {
    if (confirm(`¿Cambiar estado de ${version.version} a ${newStatus}?`)) {
      this.api.updateVersionStatus(this.projectId, version.id, newStatus).subscribe({
        next: () => this.loadVersions(),
        error: (err) => alert(err.error?.error || 'Error al actualizar estado'),
      });
    }
  }

  resetForm(): void {
    this.form = {
      version: '',
      description: '',
      changes: '',
      releaseDate: '',
      status: 'draft',
      createdBy: '',
    };
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      released: 'Lanzada',
      archived: 'Archivada',
    };
    return labels[status] || status;
  }
}
