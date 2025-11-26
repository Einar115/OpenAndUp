import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, InceptionArtifact } from '../services/api.service';

@Component({
  selector: 'app-inception-artifacts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <a [routerLink]="['/projects', projectId]" class="link-back">← Volver al proyecto</a>
    <h1>Artefactos de Incepción</h1>

    <form [formGroup]="form" (ngSubmit)="add()" class="form">
      <label>
        Nombre *
        <input type="text" formControlName="name" required />
      </label>

      <label>
        Estado *
        <select formControlName="status" required>
          <option value="">Selecciona un estado</option>
          <option value="pendiente">Pendiente</option>
          <option value="en-progreso">En progreso</option>
          <option value="completo">Completo</option>
        </select>
      </label>

      <label class="checkbox">
        <input type="checkbox" formControlName="required" />
        Obligatorio
      </label>

      <button class="btn primary" type="submit" [disabled]="form.invalid">Agregar</button>
    </form>

    <div class="list">
      <article *ngFor="let art of artifacts" class="item">
        <div>
          <h3>{{ art.name }}</h3>
          <p class="muted small">Estado: {{ art.status }} · {{ art.required ? 'Obligatorio' : 'Opcional' }}</p>
        </div>
      </article>
    </div>
  `,
  styles: [
    `
      h1 {
        margin: 0 0 1rem;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-weight: 600;
      }
      input,
      select {
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.65rem 0.75rem;
        font-size: 1rem;
      }
      .checkbox {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
      }
      .btn {
        align-self: flex-start;
        border-radius: 999px;
        border: none;
        padding: 0.6rem 1.2rem;
        font-weight: 700;
        cursor: pointer;
        color: #fff;
        background: #0ea5e9;
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
      .muted {
        color: #6b7280;
        margin: 0.15rem 0;
      }
      .small {
        font-size: 0.9rem;
      }
      .link-back {
        display: inline-flex;
        margin-bottom: 0.5rem;
        color: #0ea5e9;
        text-decoration: none;
        font-weight: 600;
      }
    `,
  ],
})
export class InceptionArtifactsComponent implements OnInit {
  projectId = '';
  artifacts: InceptionArtifact[] = [];

  form!: FormGroup;

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

  private load() {
    this.api.getInceptionArtifacts(this.projectId).subscribe((data) => (this.artifacts = data));
  }
}
