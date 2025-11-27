import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Plan } from '../services/api.service';
import { sharedFormStyles } from './shared-styles';

@Component({
  selector: 'app-plan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <a [routerLink]="['/projects', projectId]" class="link-back">← Volver al proyecto</a>
    <h1>Plan del proyecto</h1>

    <form [formGroup]="form" (ngSubmit)="submit()" class="form plan">
      <section>
        <h2>Resumen ejecutivo</h2>
        <p class="helper">Define los objetivos de alto nivel que justifican el proyecto.</p>
        <label>
          Resumen *
          <textarea rows="4" formControlName="summary" required></textarea>
        </label>
      </section>

      <section>
        <h2>Objetivos</h2>
        <label>
          Objetivos
          <textarea rows="3" formControlName="objectives"></textarea>
        </label>
      </section>

      <section>
        <h2>Riesgos</h2>
        <label>
          Riesgos
          <textarea rows="3" formControlName="risks"></textarea>
        </label>
      </section>

      <div class="plan-actions">
        <span class="status-indicator">Última actualización: {{ savedPlan?.updatedAt || '—' }}</span>
        <button class="btn primary" type="submit" [disabled]="form.invalid">Guardar plan</button>
      </div>
    </form>
  `,
  styles: [
    sharedFormStyles,
    `
      h1 {
        margin: 0 0 1rem;
      }
      .plan section {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1rem;
        background: #fff;
        margin-bottom: 0.75rem;
      }
      .plan section h2 {
        margin: 0 0 0.35rem;
        font-size: 1rem;
      }
      .helper {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
      }
      .plan-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .status-indicator {
        font-size: 0.85rem;
        color: #0f172a;
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
