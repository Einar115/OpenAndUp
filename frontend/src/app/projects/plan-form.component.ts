import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Plan, Project } from '../services/api.service';

@Component({
  selector: 'app-plan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <a [routerLink]="['/projects', projectId]" class="link-back">← Volver al proyecto</a>
    <h1>Plan del proyecto</h1>

    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <label>
        Resumen *
        <textarea rows="3" formControlName="summary" required></textarea>
      </label>

      <label>
        Objetivos
        <textarea rows="3" formControlName="objectives"></textarea>
      </label>

      <label>
        Riesgos
        <textarea rows="3" formControlName="risks"></textarea>
      </label>

      <button class="btn primary" type="submit" [disabled]="form.invalid">Guardar plan</button>
    </form>

    <div *ngIf="savedPlan" class="saved-note">Plan guardado.</div>
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
      }
      textarea {
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.65rem 0.75rem;
        font-family: inherit;
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
      .saved-note {
        margin-top: 0.75rem;
        color: #16a34a;
        font-weight: 600;
      }
    `,
  ],
})
export class PlanFormComponent implements OnInit {
  form!: FormGroup;

  projectId = '';
  savedPlan: Plan | null = null;

  constructor(private fb: FormBuilder, private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      summary: ['', Validators.required],
      objectives: [''],
      risks: [''],
    });
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.projectId) return;
    this.api.getPlan(this.projectId).subscribe((plan) => {
      if (plan) {
        this.form.patchValue(plan);
        this.savedPlan = plan;
      }
    });
  }

  submit() {
    if (this.form.invalid || !this.projectId) return;
    const payload = this.form.getRawValue();
    this.api.savePlan(this.projectId, payload).subscribe((plan) => {
      this.savedPlan = plan;
    });
  }
}
