import { Routes } from '@angular/router';
import { ProjectsListComponent } from './projects/projects-list.component';
import { ProjectFormComponent } from './projects/project-form.component';
import { ProjectDetailComponent } from './projects/project-detail.component';
import { PlanFormComponent } from './projects/plan-form.component';
import { InceptionArtifactsComponent } from './projects/inception-artifacts.component';
import { IterationsComponent } from './projects/iterations.component';
import { RolesComponent } from './projects/roles.component';
import { VersionsComponent } from './projects/versions.component';
import { DefectsComponent } from './projects/defects.component';
import { ProjectTrackingComponent } from './projects/project-tracking.component';
import { WorkflowBoardComponent } from './projects/workflow-board.component';
import { TaskAssignmentsComponent } from './projects/task-assignments.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'projects' },
  { path: 'projects', component: ProjectsListComponent },
  { path: 'projects/new', component: ProjectFormComponent },
  { path: 'projects/:id', component: ProjectDetailComponent },
  { path: 'projects/:id/plan', component: PlanFormComponent },
  { path: 'projects/:id/inception', component: InceptionArtifactsComponent },
  { path: 'projects/:id/iterations', component: IterationsComponent },
  { path: 'projects/:id/roles', component: RolesComponent },
  { path: 'projects/:id/versions', component: VersionsComponent },
  { path: 'projects/:id/defects', component: DefectsComponent },
  { path: 'projects/:id/tracking', component: ProjectTrackingComponent },
  { path: 'projects/:id/workflow-board', component: WorkflowBoardComponent },
  { path: 'projects/:id/task-assignments', component: TaskAssignmentsComponent },
  { path: '**', redirectTo: 'projects' },
];
