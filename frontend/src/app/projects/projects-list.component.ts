import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Project } from '../services/api.service';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="header">
      <div>
        <p class="eyebrow">Metodología OpenUP</p>
        <h1>Proyectos</h1>
        <p class="subtitle">Crea un nuevo proyecto o abre uno existente.</p>
      </div>
      <a class="btn primary" routerLink="/projects/new">Nuevo proyecto</a>
    </div>

    <div class="card">
      <div *ngIf="!projects.length" class="empty">No hay proyectos aún.</div>
      <div class="list">
        <article *ngFor="let project of projects" class="item">
          <div>
            <h3>{{ project.name }}</h3>
            <p class="muted">{{ project.description || 'Sin descripción' }}</p>
            <p class="muted small">
              Fases: {{ project.phases.length || 0 }} ·
              {{ project.startDate || 'Sin fecha' }} — {{ project.endDate || 'Sin fecha' }}
            </p>
          </div>
          <a class="btn ghost" [routerLink]="['/projects', project.id]">Ver detalle</a>
        </article>
      </div>
    </div>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 1rem;
        flex-wrap: wrap;
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
      .subtitle {
        margin: 0;
        color: #6b7280;
      }
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
        background: #fff;
      }
      .list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .item {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 0.75rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }
      .muted {
        color: #6b7280;
        margin: 0.1rem 0;
      }
      .small {
        font-size: 0.85rem;
      }
      .empty {
        color: #9ca3af;
        text-align: center;
        padding: 1rem;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0.45rem 0.95rem;
        font-weight: 600;
        text-decoration: none;
        border: 1px solid transparent;
      }
      .btn.primary {
        background: #0ea5e9;
        color: #fff;
      }
      .btn.ghost {
        border-color: #cbd5e1;
        color: #0f172a;
      }
      .btn.ghost:hover {
        background: #f1f5f9;
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
}
