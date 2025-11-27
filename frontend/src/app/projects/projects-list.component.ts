import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Project } from '../models/openup.model';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div>
        <p class="eyebrow">Metodología OpenUP</p>
        <h1>Proyectos</h1>
        <p class="subtitle">Monitorea cada fase, planifica artefactos y asigna al equipo adecuado.</p>
      </div>
      <a class="btn primary" routerLink="/projects/new">Nuevo proyecto</a>
    </section>

    <section class="stats-card" *ngIf="projects.length">
      <div>
        <p class="label">Proyectos</p>
        <strong>{{ projects.length }}</strong>
      </div>
      <div>
        <p class="label">Fases totales</p>
        <strong>{{ totalPhases }}</strong>
      </div>
      <div>
        <p class="label">Fases completas</p>
        <strong>{{ completedPhases }}</strong>
      </div>
    </section>

    <section *ngIf="!projects.length" class="empty-state">
      <p>No hay proyectos aún. Comienza con uno nuevo.</p>
      <a class="btn primary" routerLink="/projects/new">Crear proyecto</a>
    </section>

    <section class="grid">
      <article *ngFor="let project of projects" class="card">
        <div class="card-header">
          <div>
            <p class="eyebrow">Proyecto</p>
            <h3>{{ project.name }}</h3>
          </div>
          <span class="badge">{{ phaseCompletion(project) }}% fases completas</span>
        </div>
        <p class="muted">{{ project.description || 'Sin descripción' }}</p>
        <div class="dates">
          <span>Inicio: {{ project.startDate || '—' }}</span>
          <span>Fin: {{ project.endDate || '—' }}</span>
        </div>
        <div class="meta">
          <span>{{ project.phases.length }} fases</span>
          <span>{{ completedPhasesCount(project) }} cerradas</span>
        </div>
        <div class="actions">
          <a class="link" [routerLink]="['/projects', project.id]">Ver detalle</a>
          <a class="btn ghost" [routerLink]="['/projects', project.id, 'plan']">Plan</a>
        </div>
      </article>
    </section>
  `,
  styles: [
    `
      .hero {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 1rem;
        background: linear-gradient(135deg, #0f172a, #1e293b);
        color: #f8fafc;
        margin-bottom: 1rem;
      }
      .hero h1 {
        margin: 0.25rem 0;
        font-size: 2rem;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.3em;
        font-size: 0.75rem;
        margin: 0;
      }
      .subtitle {
        margin: 0;
        color: rgba(248, 250, 252, 0.8);
        max-width: 420px;
      }
      .btn {
        border-radius: 999px;
        padding: 0.6rem 1.4rem;
        font-weight: 600;
        text-decoration: none;
        text-align: center;
        border: none;
        cursor: pointer;
      }
      .btn.primary {
        background: #38bdf8;
        color: #0f172a;
      }
      .stats-card {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        padding: 1rem 1.25rem;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        background: #fff;
        margin-bottom: 1rem;
      }
      .stats-card .label {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0;
      }
      .stats-card strong {
        font-size: 1.6rem;
      }
      .empty-state {
        border: 1px dashed #cbd5e1;
        border-radius: 0.75rem;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fff;
        margin-bottom: 1rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
        background: #fff;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .badge {
        background: #e0f2fe;
        color: #0369a1;
        font-size: 0.75rem;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
      }
      .dates,
      .meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: #475569;
      }
      .actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .link {
        text-decoration: none;
        color: #0f172a;
        font-weight: 600;
      }
      .btn.ghost {
        border: 1px solid #cbd5e1;
        background: transparent;
        color: #0f172a;
      }
      .btn.ghost:hover {
        background: #f1f5f9;
      }
      .muted {
        margin: 0;
        color: #475569;
      }
    `,
  ],
})
export class ProjectsListComponent implements OnInit {
  projects: Project[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  private load() {
    this.api.getProjects().subscribe((data) => (this.projects = data));
  }

  get totalPhases(): number {
    return this.projects.reduce((total, project) => total + project.phases.length, 0);
  }

  get completedPhases(): number {
    return this.projects.reduce(
      (total, project) => total + project.phases.filter((phase) => phase.status === 'complete').length,
      0
    );
  }

  phaseCompletion(project: Project): number {
    if (!project.phases.length) {
      return 0;
    }
    const completed = project.phases.filter((phase) => phase.status === 'complete').length;
    return Math.round((completed / project.phases.length) * 100);
  }

  completedPhasesCount(project: Project): number {
    return project.phases.filter((phase) => phase.status === 'complete').length;
  }
}
