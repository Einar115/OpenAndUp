import { Routes } from '@angular/router';
import { ProjectsListComponent } from './projects/projects-list.component';
import { ProjectFormComponent } from './projects/project-form.component';
import { ProjectDetailComponent } from './projects/project-detail.component';
import { PlanFormComponent } from './projects/plan-form.component';
import { InceptionArtifactsComponent } from './projects/inception-artifacts.component';
import { IterationsComponent } from './projects/iterations.component';
import { RolesComponent } from './projects/roles.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'projects' },
  { path: 'projects', component: ProjectsListComponent },
  { path: 'projects/new', component: ProjectFormComponent },
  { path: 'projects/:id', component: ProjectDetailComponent },
  { path: 'projects/:id/plan', component: PlanFormComponent },
  { path: 'projects/:id/inception', component: InceptionArtifactsComponent },
  { path: 'projects/:id/iterations', component: IterationsComponent },
  { path: 'projects/:id/roles', component: RolesComponent },
  { path: '**', redirectTo: 'projects' },
];
