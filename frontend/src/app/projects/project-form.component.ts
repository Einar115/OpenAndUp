import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/projects" class="link-back">← Volver</a>
    <h1>Nuevo proyecto</h1>

    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <label>
        Nombre *
        <input type="text" formControlName="name" required />
      </label>

      <label>
        Descripción
        <textarea rows="3" formControlName="description"></textarea>
      </label>

      <div class="grid">
        <label>
          Inicio
          <input type="date" formControlName="startDate" />
        </label>
        <label>
          Fin
          <input type="date" formControlName="endDate" />
        </label>
      </div>

      <button class="btn primary" type="submit" [disabled]="form.invalid">Crear proyecto</button>
    </form>
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
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-weight: 600;
        color: #0f172a;
      }
      input,
      textarea {
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.65rem 0.75rem;
        font-size: 1rem;
        font-family: inherit;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
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
export class ProjectFormComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      description: [''],
      startDate: [''],
      endDate: [''],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const payload = this.form.getRawValue();
    this.api.createProject(payload).subscribe((project) => {
      this.router.navigate(['/projects', project.id]);
    });
  }
}
