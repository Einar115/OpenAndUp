import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, RoleAssignment } from '../services/api.service';

const ROLE_OPTIONS = ['Project Manager', 'Equipo Técnico', 'QA', 'Stakeholder', 'Coach', 'Scrum Master'];

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <a [routerLink]="['/projects', projectId]" class="link-back">← Volver al proyecto</a>
    <h1>Asignación de roles</h1>

    <form [formGroup]="form" (ngSubmit)="add()" class="form">
      <label>
        Usuario *
        <input type="text" formControlName="user" required />
      </label>
      <label>
        Rol *
        <select formControlName="role" required>
          <option value="">Selecciona un rol</option>
          <option *ngFor="let r of roleOptions" [value]="r">{{ r }}</option>
        </select>
      </label>
      <button class="btn primary" type="submit" [disabled]="form.invalid">Asignar</button>
    </form>

    <div class="list">
      <article *ngFor="let role of roles" class="item">
        <div>
          <h3>{{ role.user }}</h3>
          <p class="muted small">{{ role.role }}</p>
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
export class RolesComponent implements OnInit {
  projectId = '';
  roles: RoleAssignment[] = [];
  roleOptions = ROLE_OPTIONS;

  form!: FormGroup;

  constructor(private fb: FormBuilder, private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.form = this.fb.nonNullable.group({
      user: ['', Validators.required],
      role: ['', Validators.required],
    });
    if (this.projectId) {
      this.load();
    }
  }

  add() {
    if (this.form.invalid || !this.projectId) return;
    const payload = this.form.getRawValue();
    this.api.addRole(this.projectId, payload).subscribe(() => {
      this.form.reset();
      this.load();
    });
  }

  private load() {
    this.api.getRoles(this.projectId).subscribe((data) => (this.roles = data));
  }
}
