import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, RoleAssignment } from '../services/api.service';
import { sharedFormStyles } from './shared-styles';

const ROLE_OPTIONS = ['Project Manager', 'Tech Lead', 'QA', 'Stakeholder', 'Coach', 'Developer'];

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <a [routerLink]="['/projects', projectId]" class="link-back">← Volver al proyecto</a>
    <div class="header">
      <div>
        <p class="eyebrow">Equipo del proyecto</p>
        <h1>Roles asignados</h1>
      </div>
      <p class="helper">Agrega usuarios con roles que guiarán cada fase.</p>
    </div>

    <form [formGroup]="form" (ngSubmit)="add()" class="form row">
      <label>
        Usuario *
        <input type="text" formControlName="user" placeholder="Nombre o correo" required />
      </label>
      <label>
        Rol *
        <select formControlName="role" required>
          <option value="">Selecciona un rol</option>
          <option *ngFor="let r of roleOptions" [value]="r">{{ r }}</option>
        </select>
      </label>
      <button class="btn primary" type="submit" [disabled]="form.invalid">Agregar miembro</button>
    </form>

    <section class="list">
      <article *ngFor="let role of roles" class="item">
        <div class="avatar">{{ role.user.charAt(0) }}</div>
        <div>
          <h3>{{ role.user }}</h3>
          <p class="muted">{{ role.role }}</p>
        </div>
        <span class="date">{{ role.assignedAt | date: 'mediumDate' }}</span>
      </article>
      <div class="empty" *ngIf="!roles.length">Todavía no hay equipo asignado.</div>
    </section>
  `,
  styles: [
    sharedFormStyles,
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }
      h1 {
        margin: 0;
      }
      .helper {
        margin: 0;
        color: #475569;
      }
      .form.row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }
      .list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .item {
        display: flex;
        align-items: center;
        gap: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        background: #fff;
      }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #0ea5e9;
        color: #fff;
        font-weight: 700;
      }
      .item h3 {
        margin: 0;
      }
      .date {
        margin-left: auto;
        font-size: 0.8rem;
        color: #94a3b8;
      }
      .empty {
        padding: 1rem;
        text-align: center;
        color: #94a3b8;
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
