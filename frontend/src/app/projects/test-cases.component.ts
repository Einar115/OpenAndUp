import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Artifact, TestCase, TestCaseOutcome, TestCaseStatus, TestRun } from '../services/api.service';
import { sharedStyles } from './shared-styles';

@Component({
  selector: 'app-test-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <a [routerLink]="['/projects', projectId]" class="link-back">← Volver al proyecto</a>

    <section class="header">
      <div>
        <p class="eyebrow">Casos de prueba</p>
        <h1>Gestionar ejecuciones</h1>
        <p class="muted">Registra resultados y enlaza defectos o artefactos asociados</p>
      </div>
    </section>

    <section class="form-card">
      <h3>Crear caso de prueba</h3>
      <form (ngSubmit)="createTestCase()">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre *</label>
            <input [(ngModel)]="form.title" name="title" required />
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select [(ngModel)]="form.status" name="status">
              <option *ngFor="let status of statuses" [value]="status">{{ formatStatus(status) }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Artefacto relacionado</label>
            <select [(ngModel)]="form.artifactId" name="artifactId">
              <option value="">Sin artefacto</option>
              <option *ngFor="let artifact of artifacts" [value]="artifact.id">{{ artifact.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Creado por</label>
            <input [(ngModel)]="form.createdBy" name="createdBy" />
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea [(ngModel)]="form.description" name="description" rows="2"></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn primary">Guardar caso</button>
          <button type="button" class="btn ghost" (click)="resetForm()">Limpiar</button>
        </div>
      </form>
    </section>

    <section class="test-case-list">
      <article *ngFor="let testCase of testCases" class="test-case-card">
        <div class="test-case-top">
          <div>
            <h4>{{ testCase.title }}</h4>
            <div class="badges">
              <span class="badge status" [attr.data-status]="testCase.status">{{ formatStatus(testCase.status) }}</span>
              <span *ngIf="testCase.artifactId" class="badge artifact">
                {{ artifactName(testCase.artifactId) || 'Artefacto' }}
              </span>
            </div>
          </div>
          <div class="info">
            <span *ngIf="testCase.createdBy">Creado por: {{ testCase.createdBy }}</span>
            <span *ngIf="testCase.createdAt">Creado: {{ testCase.createdAt | date:'short' }}</span>
          </div>
        </div>

        <p class="muted" *ngIf="testCase.description">{{ testCase.description }}</p>

        <div class="actions">
          <button class="btn-small" type="button" (click)="openRunForm(testCase.id)">Registrar ejecución</button>
          <button class="btn-small ghost" type="button" (click)="toggleHistory(testCase.id)">
            {{ historyTargetId === testCase.id ? 'Ocultar historial' : 'Ver historial' }}
          </button>
        </div>

        <div *ngIf="runTargetId === testCase.id" class="run-form">
          <div class="form-row">
            <div class="form-group">
              <label>Resultado</label>
              <select [(ngModel)]="runForm.outcome" name="outcome">
                <option *ngFor="let option of outcomes" [value]="option">{{ option | titlecase }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ejecutado por</label>
              <input [(ngModel)]="runForm.executedBy" name="executedBy" />
            </div>
          </div>
          <div class="form-group">
            <label>Notas</label>
            <textarea [(ngModel)]="runForm.notes" name="notes" rows="2"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn primary" (click)="recordRun(testCase.id)">Guardar resultado</button>
            <button type="button" class="btn ghost" (click)="runTargetId = null">Cancelar</button>
          </div>
        </div>

        <div *ngIf="historyTargetId === testCase.id" class="run-history">
          <p class="muted">Historial de ejecuciones:</p>
          <div *ngIf="runs[testCase.id]?.length; else noRuns">
            <div *ngFor="let run of runs[testCase.id]" class="run-row">
              <span class="badge run" [attr.data-outcome]="run.outcome">{{ run.outcome | titlecase }}</span>
              <span *ngIf="run.executedBy">por {{ run.executedBy }}</span>
              <span>{{ run.executedAt | date:'short' }}</span>
              <p *ngIf="run.notes">{{ run.notes }}</p>
            </div>
          </div>
          <ng-template #noRuns>
            <p class="muted">Sin ejecuciones registradas.</p>
          </ng-template>
        </div>
      </article>
      <div *ngIf="!testCases.length" class="empty">
        No hay casos de prueba registrados.
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

      .test-case-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .test-case-card {
        background: #fff;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .test-case-top {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }

      .badges {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;
      }

      .badge.status {
        border-radius: 999px;
        padding: 0.2rem 0.75rem;
        border: 1px solid #cbd5e1;
      }

      .actions {
        display: flex;
        gap: 0.5rem;
      }

      .run-form {
        margin-top: 0.5rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
      }

      .run-history {
        margin-top: 0.5rem;
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px dashed #cbd5e1;
      }

      .run-row {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 0.35rem;
      }

      .badge.run {
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 999px;
        padding: 0.1rem 0.5rem;
      }

      .badge.run[data-outcome='pass'] {
        background: #dcfce7;
        color: #166534;
      }
      .badge.run[data-outcome='fail'] {
        background: #fee2e2;
        color: #991b1b;
      }
      .badge.run[data-outcome='blocked'] {
        background: #fef9c3;
        color: #B45309;
      }

      .empty {
        text-align: center;
        padding: 1rem;
        color: #94a3b8;
        border-radius: 0.75rem;
        background: #fff;
        border: 1px dashed #cbd5e1;
      }
    `,
  ],
})
export class TestCasesComponent implements OnInit {
  projectId = '';
  testCases: TestCase[] = [];
  artifacts: Artifact[] = [];
  runs: Record<string, TestRun[]> = {};

  form = {
    title: '',
    description: '',
    artifactId: '',
    status: 'ready' as TestCaseStatus,
    createdBy: '',
  };

  runForm = {
    outcome: 'pass' as TestCaseOutcome,
    executedBy: '',
    notes: '',
  };

  runTargetId: string | null = null;
  historyTargetId: string | null = null;

  statuses: TestCaseStatus[] = ['ready', 'executing', 'blocked', 'passed', 'failed', 'draft'];
  outcomes: TestCaseOutcome[] = ['pass', 'fail', 'blocked'];

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadArtifacts();
    this.loadTestCases();
  }

  loadArtifacts(): void {
    if (!this.projectId) return;
    this.api.getArtifacts(this.projectId).subscribe((data) => {
      this.artifacts = data;
    });
  }

  loadTestCases(): void {
    if (!this.projectId) return;
    this.api.getTestCases(this.projectId).subscribe((data) => {
      this.testCases = data;
    });
  }

  createTestCase(): void {
    if (!this.form.title) {
      alert('El nombre es requerido');
      return;
    }

    const payload = {
      title: this.form.title,
      description: this.form.description,
      artifactId: this.form.artifactId || undefined,
      status: this.form.status,
      createdBy: this.form.createdBy,
    };

    this.api.createTestCase(this.projectId, payload).subscribe({
      next: () => {
        this.loadTestCases();
        this.resetForm();
      },
      error: () => alert('Error al crear el caso de prueba'),
    });
  }

  resetForm(): void {
    this.form = {
      title: '',
      description: '',
      artifactId: '',
      status: 'ready',
      createdBy: '',
    };
  }

  openRunForm(testCaseId: string): void {
    this.runTargetId = this.runTargetId === testCaseId ? null : testCaseId;
    if (this.runTargetId) {
      this.runForm = {
        outcome: 'pass',
        executedBy: '',
        notes: '',
      };
    }
  }

  recordRun(testCaseId: string): void {
    const payload = {
      outcome: this.runForm.outcome,
      executedBy: this.runForm.executedBy,
      notes: this.runForm.notes,
    };

    this.api.runTestCase(this.projectId, testCaseId, payload).subscribe({
      next: () => {
        this.runTargetId = null;
        this.loadTestCases();
        this.loadRuns(testCaseId);
      },
      error: () => alert('Error al registrar la ejecución'),
    });
  }

  toggleHistory(testCaseId: string): void {
    if (this.historyTargetId === testCaseId) {
      this.historyTargetId = null;
      return;
    }
    this.historyTargetId = testCaseId;
    this.loadRuns(testCaseId);
  }

  loadRuns(testCaseId: string): void {
    this.api.getTestCaseRuns(this.projectId, testCaseId).subscribe((data) => {
      this.runs = { ...this.runs, [testCaseId]: data };
    });
  }

  formatStatus(status: TestCaseStatus): string {
    const map: Record<TestCaseStatus, string> = {
      draft: 'Borrador',
      ready: 'Listo',
      executing: 'En ejecución',
      blocked: 'Bloqueado',
      passed: 'Aprobado',
      failed: 'Fallido',
    };
    return map[status] || status;
  }

  artifactName(id: string): string | undefined {
    return this.artifacts.find((artifact) => artifact.id === id)?.name;
  }
}
