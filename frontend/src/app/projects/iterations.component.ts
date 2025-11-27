import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Iteration, Phase } from '../models/openup.model';
import { sharedFormStyles } from './shared-styles';

@Component({
  selector: 'app-iterations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <a [routerLink]="['/projects', projectId]" class="link-back">← Volver al proyecto</a>
    <h1>Iteraciones</h1>

    <label class="select-phase">
      Fase
      <select [(ngModel)]="selectedPhaseId" (ngModelChange)="onPhaseChange($event)">
        <option *ngFor="let phase of phases" [value]="phase.id">{{ phase.name }}</option>
      </select>
    </label>

    <form [formGroup]="form" (ngSubmit)="add()" class="form">
      <label>
        Nombre *
        <input type="text" formControlName="name" required />
      </label>
      <div class="grid">
        <label>
          Inicio *
          <input type="date" formControlName="startDate" required />
        </label>
        <label>
          Fin *
          <input type="date" formControlName="endDate" required />
        </label>
      </div>
      <label>
        Objetivo
        <textarea rows="2" formControlName="goal"></textarea>
      </label>
      <button class="btn primary" type="submit" [disabled]="form.invalid">Agregar iteración</button>
    </form>

    <div class="list">
      <article *ngFor="let it of iterations" class="item">
        <div>
          <h3>{{ it.name }}</h3>
          <p class="muted small">{{ it.startDate }} — {{ it.endDate }}</p>
          <p class="muted">{{ it.goal || 'Sin objetivo' }}</p>
        </div>
      </article>
    </div>
  `,
  styles: [
    sharedFormStyles,
    `
      h1 {
        margin: 0 0 1rem;
      }
      .select-phase {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-weight: 600;
        margin-bottom: 0.75rem;
      }
      select {
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.55rem 0.65rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
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
        background: #fff;
      }
    `,
  ],
})
export class IterationsComponent implements OnInit {
  projectId = '';
  phases: Phase[] = [];
  selectedPhaseId = '';
  iterations: Iteration[] = [];

  form!: FormGroup;

  constructor(private fb: FormBuilder, private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      goal: [''],
    });
    if (this.projectId) {
      this.api.getProject(this.projectId).subscribe((project) => {
        this.phases = project.phases || [];
        this.selectedPhaseId = this.phases[0]?.id || '';
        if (this.selectedPhaseId) {
          this.loadIterations();
        }
      });
    }
  }

  onPhaseChange(phaseId: string) {
    this.selectedPhaseId = phaseId;
    this.loadIterations();
  }

  add() {
    if (this.form.invalid || !this.projectId || !this.selectedPhaseId) return;
    const payload = this.form.getRawValue();
    this.api.addIteration(this.projectId, this.selectedPhaseId, payload).subscribe(() => {
      this.form.reset();
      this.loadIterations();
    });
  }

  private loadIterations() {
    if (!this.projectId || !this.selectedPhaseId) return;
    this.api.getIterations(this.projectId, this.selectedPhaseId).subscribe((data) => (this.iterations = data));
  }
}
