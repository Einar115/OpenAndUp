import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Project } from '../services/api.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a routerLink="/projects" class="link-back">← Volver</a>

    <ng-container *ngIf="project; else loading">
      <section class="summary-card">
        <div>
          <p class="eyebrow">Proyecto</p>
          <h1>{{ project.name }}</h1>
          <p class="muted">{{ project.description || 'Sin descripción' }}</p>
          <div class="dates">
            <span>Inicio: {{ project.startDate || '—' }}</span>
            <span>Fin: {{ project.endDate || '—' }}</span>
          </div>
        </div>
        <div class="shortcuts">
          <a [routerLink]="['/projects', project.id, 'plan']">Plan</a>
          <a [routerLink]="['/projects', project.id, 'inception']">Artefactos</a>
          <a [routerLink]="['/projects', project.id, 'iterations']">Iteraciones</a>
          <a [routerLink]="['/projects', project.id, 'roles']">Equipo</a>
          <a [routerLink]="['/projects', project.id, 'versions']">Versiones</a>
          <a [routerLink]="['/projects', project.id, 'defects']">Defectos</a>
          <hr style="margin: 0.5rem 0; border: 0; border-top: 1px solid #e5e7eb;">
          <a [routerLink]="['/projects', project.id, 'tracking']" style="color: #667eea;">📊 Seguimiento</a>
          <a [routerLink]="['/projects', project.id, 'workflow-board']" style="color: #667eea;">📋 Tablero</a>
          <a [routerLink]="['/projects', project.id, 'task-assignments']" style="color: #667eea;">👥 Asignaciones</a>
        </div>
      </section>

      <section class="phases">
        <header>
          <h2>Fases OpenUP</h2>
          <p>{{ project.phases.length }} fases definidas</p>
        </header>
        <div class="phase-grid">
          <article *ngFor="let phase of project.phases" class="phase">
            <div class="phase-top">
              <p class="eyebrow">Fase {{ phase.order }}</p>
              <span class="status" [attr.data-status]="phase.status">{{ phase.status | titlecase }}</span>
            </div>
            <h3>{{ phase.name }}</h3>
            <p>ID: {{ phase.id }}</p>
          </article>
        </div>
      </section>
    </ng-container>

    <ng-template #loading>
      <p class="muted">Cargando proyecto...</p>
    </ng-template>
  `,
  styles: [
    `
      .summary-card {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.5rem;
        border-radius: 1rem;
        border: 1px solid #e5e7eb;
        background: #fff;
        flex-wrap: wrap;
      }
      .link-back {
        display: inline-flex;
        margin-bottom: 0.5rem;
        color: #0ea5e9;
        text-decoration: none;
        font-weight: 600;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.2em;
        font-size: 0.7rem;
        margin: 0;
        color: #475569;
      }
      h1 {
        margin: 0.25rem 0;
      }
      .muted {
        color: #475569;
        margin: 0.25rem 0;
      }
      .dates {
        display: flex;
        gap: 1rem;
        font-size: 0.9rem;
      }
      .shortcuts {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .shortcuts a {
        text-decoration: none;
        padding: 0.5rem 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        color: #0f172a;
        font-weight: 600;
        text-align: center;
        background: #f8fafc;
      }
      .phases {
        margin-top: 1.5rem;
      }
      .phases header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 1rem;
      }
      .phase-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }
      .phase {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
        background: #fff;
      }
      .phase-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .status {
        font-size: 0.75rem;
        border-radius: 999px;
        padding: 0.1rem 0.6rem;
        border: 1px solid transparent;
      }
      .status[data-status='in-progress'] {
        background: #fef3c7;
        color: #92400e;
      }
      .status[data-status='complete'] {
        background: #dcfce7;
        color: #047857;
      }
      .status[data-status='not-started'] {
        background: #e0e7ff;
        color: #4338ca;
      }
    `,
  ],
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') as string;
    this.api.getProject(id).subscribe((p) => (this.project = p));
  }
}
