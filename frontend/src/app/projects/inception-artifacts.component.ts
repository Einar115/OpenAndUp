import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, InceptionArtifact } from '../services/api.service';
import { sharedFormStyles } from './shared-styles';

@Component({
  selector: 'app-inception-artifacts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <a [routerLink]="['/projects', projectId]" class="link-back">← Volver al proyecto</a>
    <div class="header">
      <div>
        <p class="eyebrow">Incepción</p>
        <h1>Artefactos</h1>
      </div>
      <button class="btn primary" type="button" (click)="toggleRequired()">Filtrar obligatorios</button>
    </div>

    <form [formGroup]="form" (ngSubmit)="add()" class="form condensed">
      <div class="field-group">
        <label>
          Nombre *
          <input type="text" formControlName="name" required />
        </label>
        <label>
          Estado *
          <select formControlName="status" required>
            <option value="">Selecciona un estado</option>
            <option value="pending">Pendiente</option>
            <option value="in-progress">En progreso</option>
            <option value="done">Completo</option>
          </select>
        </label>
        <label class="checkbox">
          <input type="checkbox" formControlName="required" />
          Obligatorio
        </label>
      </div>
      <button class="btn primary" type="submit" [disabled]="form.invalid">Agregar artefacto</button>
    </form>

    <div class="artifact-table">
      <div class="row header-row">
        <span>Nombre</span>
        <span>Estado</span>
        <span>Requerido</span>
      </div>
      <div
        class="row"
        *ngFor="let art of filteredArtifacts"
      >
        <span>{{ art.name }}</span>
        <span class="status" [attr.data-status]="art.status">{{ art.status | titlecase }}</span>
        <span>{{ art.required ? 'Sí' : 'No' }}</span>
      </div>
      <div class="empty" *ngIf="!filteredArtifacts.length">No hay artefactos registrados.</div>
    </div>
  `,
  styles: [
    sharedFormStyles,
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      h1 {
        margin: 0;
      }
      .form.condensed {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
        background: #fff;
        margin-bottom: 1rem;
      }
      .field-group {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .checkbox {
        align-items: center;
        gap: 0.4rem;
      }
      .artifact-table {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        overflow: hidden;
        background: #fff;
      }
      .row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid #e5e7eb;
        font-weight: 500;
        align-items: center;
      }
      .header-row {
        background: #f8fafc;
        color: #475569;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .row:last-child {
        border-bottom: none;
      }
      .empty {
        padding: 1rem;
        text-align: center;
        color: #94a3b8;
      }
      .status {
        width: fit-content;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        border: 1px solid transparent;
      }
      .status[data-status='pending'] {
        background: #fef3c7;
        color: #92400e;
      }
      .status[data-status='in-progress'] {
        background: #e0f2fe;
        color: #0369a1;
      }
      .status[data-status='done'] {
        background: #dcfce7;
        color: #14532d;
      }
    `,
  ],
})
export class InceptionArtifactsComponent implements OnInit {
  projectId = '';
  artifacts: InceptionArtifact[] = [];

  form!: FormGroup;
  onlyRequired = false;

  constructor(private fb: FormBuilder, private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      status: ['', Validators.required],
      required: [false],
    });
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.projectId) {
      this.load();
    }
  }

  add() {
    if (this.form.invalid || !this.projectId) return;
    const payload = this.form.getRawValue();
    this.api.addInceptionArtifact(this.projectId, payload).subscribe(() => {
      this.form.reset({ required: false });
      this.load();
    });
  }

  toggleRequired() {
    this.onlyRequired = !this.onlyRequired;
  }

  private load() {
    this.api.getInceptionArtifacts(this.projectId).subscribe((data) => (this.artifacts = data));
  }

  get filteredArtifacts() {
    if (this.onlyRequired) {
      return this.artifacts.filter((artifact) => artifact.required);
    }
    return this.artifacts;
  }
}
