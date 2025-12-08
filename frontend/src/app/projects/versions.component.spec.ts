import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { VersionsComponent } from './versions.component';
import { ApiService } from '../services/api.service';

describe('VersionsComponent', () => {
  let component: VersionsComponent;
  let fixture: ComponentFixture<VersionsComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockVersions = [
    {
      id: '1',
      projectId: 'proj-1',
      version: 'v1.0.0',
      description: 'Primera versión',
      status: 'released' as const,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      projectId: 'proj-1',
      version: 'v1.1.0',
      description: 'Segunda versión',
      status: 'draft' as const,
      createdAt: '2024-02-01T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getVersions',
      'createVersion',
      'updateVersionStatus',
    ]);

    await TestBed.configureTestingModule({
      imports: [VersionsComponent, HttpClientTestingModule],
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

    fixture = TestBed.createComponent(VersionsComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load versions on init', () => {
    apiService.getVersions.and.returnValue(of(mockVersions));
    
    component.ngOnInit();

    expect(apiService.getVersions).toHaveBeenCalledWith('proj-1');
    expect(component.versions.length).toBe(2);
    expect(component.versions[0].version).toBe('v1.0.0');
  });

  it('should create a new version', () => {
    const newVersion = { ...mockVersions[0] };
    apiService.createVersion.and.returnValue(of(newVersion));
    apiService.getVersions.and.returnValue(of([...mockVersions, newVersion]));

    component.form.version = 'v2.0.0';
    component.createVersion();

    expect(apiService.createVersion).toHaveBeenCalled();
    expect(component.form.version).toBe(''); // Form should be reset
  });

  it('should update version status', () => {
    const updatedVersion = { ...mockVersions[0], status: 'archived' as const };
    apiService.updateVersionStatus.and.returnValue(of(updatedVersion));
    apiService.getVersions.and.returnValue(of([updatedVersion]));

    spyOn(window, 'confirm').and.returnValue(true);
    component.changeStatus(mockVersions[0], 'archived');

    expect(apiService.updateVersionStatus).toHaveBeenCalledWith('proj-1', '1', 'archived');
  });

  it('should toggle form visibility', () => {
    expect(component.showForm).toBeFalse();
    
    component.showForm = true;
    expect(component.showForm).toBeTrue();
  });

  it('should reset form', () => {
    component.form.version = 'v1.0.0';
    component.form.description = 'Test';
    
    component.resetForm();
    
    expect(component.form.version).toBe('');
    expect(component.form.description).toBe('');
  });
});
