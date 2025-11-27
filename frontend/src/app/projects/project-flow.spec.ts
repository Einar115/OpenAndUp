import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { InceptionArtifactsComponent } from './inception-artifacts.component';
import { PlanFormComponent } from './plan-form.component';
import { ProjectFormComponent } from './project-form.component';

const createRouterMock = () => {
  const router = {
    navigated: [] as any[][],
    navigate(commands: any[]) {
      this.navigated.push(commands);
      return Promise.resolve(true);
    },
  };
  return router as unknown as Router & { navigated: any[][] };
};

const createActivatedRoute = (projectId: string) =>
  ({
    snapshot: {
      paramMap: {
        get: () => projectId,
      },
    },
  } as unknown as ActivatedRoute);

describe('Proyecto UI flow', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('crea un proyecto y navega al detalle', async () => {
    const apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['createProject']);
    apiSpy.createProject.and.returnValue(of({ id: 'proj-flow', name: 'Flow', phases: [] }));
    const router = createRouterMock();
    const component = new ProjectFormComponent(fb, apiSpy as ApiService, router);
    component.ngOnInit();
    component.form.setValue({ name: 'Flow', description: '', startDate: '', endDate: '' });

    component.submit();
    expect(apiSpy.createProject).toHaveBeenCalledWith({
      name: 'Flow',
      description: '',
      startDate: '',
      endDate: '',
    });
    await Promise.resolve();
    expect(router.navigated[0]).toEqual(['/projects', 'proj-flow']);
  });

  it('guarda el plan del proyecto', () => {
    const apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getPlan', 'savePlan']);
    apiSpy.getPlan.and.returnValue(of(null));
    apiSpy.savePlan.and.returnValue(of({ id: 'plan-flow', projectId: 'proj-flow', summary: 'Resumen' }));
    const route = createActivatedRoute('proj-flow');
    const component = new PlanFormComponent(fb, apiSpy as ApiService, route);
    component.ngOnInit();
    component.form.setValue({ summary: 'Resumen', objectives: '', risks: '' });

    component.submit();
    expect(apiSpy.savePlan).toHaveBeenCalledWith('proj-flow', {
      summary: 'Resumen',
      objectives: '',
      risks: '',
    });
    expect(component.savedPlan?.id).toBe('plan-flow');
  });

  it('agrega un artefacto de Incepción', () => {
    const apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getInceptionArtifacts', 'addInceptionArtifact']);
    apiSpy.getInceptionArtifacts.and.returnValue(of([]));
    apiSpy.addInceptionArtifact.and.returnValue(
      of({ id: 'art-flow', projectId: 'proj-flow', name: 'Documento', status: 'pendiente', required: true })
    );
    const route = createActivatedRoute('proj-flow');
    const component = new InceptionArtifactsComponent(fb, apiSpy as ApiService, route);
    component.ngOnInit();
    component.form.setValue({ name: 'Documento', status: 'pendiente', required: true });

    component.add();
    expect(apiSpy.addInceptionArtifact).toHaveBeenCalledWith('proj-flow', {
      name: 'Documento',
      status: 'pendiente',
      required: true,
    });
    expect(apiSpy.getInceptionArtifacts).toHaveBeenCalledTimes(2);
  });
});
