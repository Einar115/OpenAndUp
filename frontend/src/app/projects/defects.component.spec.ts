import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DefectsComponent } from './defects.component';
import { ApiService } from '../services/api.service';

describe('DefectsComponent', () => {
  let component: DefectsComponent;
  let fixture: ComponentFixture<DefectsComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockProject = {
    id: 'proj-1',
    name: 'Test Project',
    phases: [
      { id: 'phase-1', name: 'Incepción', key: 'inception' as const, order: 1, status: 'in-progress' as const, projectId: 'proj-1' },
    ],
  };

  const mockDefects = [
    {
      id: '1',
      projectId: 'proj-1',
      title: 'Bug en login',
      description: 'Error al iniciar sesión',
      severity: 'high' as const,
      status: 'open' as const,
      priority: 'high' as const,
      reportedDate: '2024-01-01',
    },
    {
      id: '2',
      projectId: 'proj-1',
      title: 'Error de validación',
      description: 'Validación incorrecta',
      severity: 'medium' as const,
      status: 'resolved' as const,
      priority: 'medium' as const,
      reportedDate: '2024-01-02',
      resolvedDate: '2024-01-05',
    },
  ];

  const mockStatistics = {
    total: 2,
    byStatus: { open: 1, inProgress: 0, resolved: 1, closed: 0, reopened: 0 },
    bySeverity: { low: 0, medium: 1, high: 1, critical: 0 },
    byPriority: { low: 0, medium: 1, high: 1 },
  };

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getProject',
      'getDefects',
      'createDefect',
      'updateDefectStatus',
      'getDefectStatistics',
    ]);

    await TestBed.configureTestingModule({
      imports: [DefectsComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'proj-1',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DefectsComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load defects and statistics on init', () => {
    apiService.getProject.and.returnValue(of(mockProject as any));
    apiService.getDefects.and.returnValue(of(mockDefects));
    apiService.getDefectStatistics.and.returnValue(of(mockStatistics));

    component.ngOnInit();

    expect(apiService.getProject).toHaveBeenCalledWith('proj-1');
    expect(apiService.getDefects).toHaveBeenCalledWith('proj-1', {});
    expect(apiService.getDefectStatistics).toHaveBeenCalledWith('proj-1');
    expect(component.defects.length).toBe(2);
    expect(component.statistics?.total).toBe(2);
  });

  it('should create a new defect', () => {
    const newDefect = { ...mockDefects[0] };
    apiService.createDefect.and.returnValue(of(newDefect));
    apiService.getDefects.and.returnValue(of([...mockDefects, newDefect]));
    apiService.getDefectStatistics.and.returnValue(of(mockStatistics));

    component.form.title = 'Nuevo bug';
    component.createDefect();

    expect(apiService.createDefect).toHaveBeenCalled();
    expect(component.form.title).toBe(''); // Form should be reset
  });

  it('should change defect status', () => {
    const updatedDefect = { ...mockDefects[0], status: 'in-progress' as const };
    apiService.updateDefectStatus.and.returnValue(of(updatedDefect));
    apiService.getDefects.and.returnValue(of([updatedDefect]));
    apiService.getDefectStatistics.and.returnValue(of(mockStatistics));

    component.changeStatus(mockDefects[0], 'in-progress');

    expect(apiService.updateDefectStatus).toHaveBeenCalledWith('proj-1', '1', 'in-progress');
  });

  it('should resolve defect with notes', () => {
    const resolvedDefect = { 
      ...mockDefects[0], 
      status: 'resolved' as const,
      resolutionNotes: 'Fixed bug'
    };
    apiService.updateDefectStatus.and.returnValue(of(resolvedDefect));
    apiService.getDefects.and.returnValue(of([resolvedDefect]));
    apiService.getDefectStatistics.and.returnValue(of(mockStatistics));

    spyOn(window, 'prompt').and.returnValue('Fixed bug');
    component.resolveDefect(mockDefects[0]);

    expect(apiService.updateDefectStatus).toHaveBeenCalledWith('proj-1', '1', 'resolved', 'Fixed bug');
  });

  it('should apply filters', () => {
    apiService.getDefects.and.returnValue(of([mockDefects[0]]));

    component.filters.status = 'open';
    component.applyFilters();

    expect(apiService.getDefects).toHaveBeenCalledWith('proj-1', { status: 'open' });
  });

  it('should clear filters', () => {
    apiService.getDefects.and.returnValue(of(mockDefects));

    component.filters.status = 'open';
    component.filters.severity = 'high';
    component.clearFilters();

    expect(component.filters.status).toBe('');
    expect(component.filters.severity).toBe('');
    expect(apiService.getDefects).toHaveBeenCalledWith('proj-1', {});
  });

  it('should validate required title', () => {
    spyOn(window, 'alert');
    component.form.title = '';
    component.createDefect();

    expect(window.alert).toHaveBeenCalledWith('El título es requerido');
    expect(apiService.createDefect).not.toHaveBeenCalled();
  });

  it('should format status labels correctly', () => {
    expect(component.statusLabel('open')).toBe('Abierto');
    expect(component.statusLabel('in-progress')).toBe('En Progreso');
    expect(component.statusLabel('resolved')).toBe('Resuelto');
  });

  it('should format severity labels correctly', () => {
    expect(component.severityLabel('low')).toBe('Baja');
    expect(component.severityLabel('critical')).toBe('Crítica');
  });

  it('should reset form', () => {
    component.form.title = 'Test bug';
    component.form.severity = 'high';
    
    component.resetForm();
    
    expect(component.form.title).toBe('');
    expect(component.form.severity).toBe('medium');
  });
});
