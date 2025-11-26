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
    <div *ngIf="project; else loading">
      <div class="header">
        <div>
          <p class="eyebrow">Proyecto</p>
          <h1>{{ project.name }}</h1>
          <p class="muted">{{ project.description || 'Sin descripción' }}</p>
          <p class="muted small">
            {{ project.startDate || 'Sin inicio' }} — {{ project.endDate || 'Sin fin' }}
          </p>
        </div>
        <div class="actions">
          <a class="btn ghost" [routerLink]="['/projects', project.id, 'plan']">Plan</a>
          <a class="btn ghost" [routerLink]="['/projects', project.id, 'inception']">Incepción</a>
          <a class="btn ghost" [routerLink]="['/projects', project.id, 'iterations']">Iteraciones</a>
          <a class="btn ghost" [routerLink]="['/projects', project.id, 'roles']">Roles</a>
        </div>
      </div>

      <section class="phases">
        <h2>Fases</h2>
        <div class="phase-grid">
          <article *ngFor="let phase of project.phases" class="phase">
            <p class="eyebrow">Fase {{ phase.order }}</p>
            <h3>{{ phase.name }}</h3>
            <p class="muted">ID: {{ phase.id }}</p>
          </article>
        </div>
      </section>
    </div>
    <ng-template #loading>
      <p class="muted">Cargando proyecto...</p>
    </ng-template>
  `,
  styles: [
    `
      .link-back {
        display: inline-flex;
        margin-bottom: 0.5rem;
        color: #0ea5e9;
        text-decoration: none;
        font-weight: 600;
      }
      .header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        flex-wrap: wrap;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
        background: #fff;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6b7280;
        font-size: 0.75rem;
        margin: 0;
      }
      h1 {
        margin: 0.1rem 0;
      }
      .muted {
        color: #6b7280;
        margin: 0.1rem 0;
      }
      .small {
        font-size: 0.9rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .btn {
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        padding: 0.5rem 0.9rem;
        text-decoration: none;
        color: #0f172a;
        font-weight: 600;
      }
      .btn.ghost:hover {
        background: #f8fafc;
      }
      .phases {
        margin-top: 1rem;
      }
      .phase-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
      }
      .phase {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 0.75rem;
        background: #f8fafc;
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
