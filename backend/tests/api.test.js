const request = require('supertest');
const { app } = require('../app');

describe('OpenAndUp API', () => {
  let testProjectId;

  // Helper: crear proyecto de prueba
  const createTestProject = async () => {
    const res = await request(app)
      .post('/projects')
      .send({ 
        name: 'Test Project', 
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      });
    return res.body;
  };

  describe('projects', () => {
    it('creates a project and returns phases', async () => {
      const payload = { name: 'Proyecto Prueba', description: 'Descripción', startDate: '2024-01-01', endDate: '2024-06-01' };
      const create = await request(app).post('/projects').send(payload);
      expect(create.status).toBe(201);
      expect(create.body.name).toBe(payload.name);
      expect(create.body.phases).toHaveLength(4);

      const list = await request(app).get('/projects');
      expect(list.status).toBe(200);
      expect(list.body.length).toBeGreaterThan(0);
    });
  });

  describe('plan', () => {
    it('creates and reads a project plan', async () => {
      const project = await request(app).post('/projects').send({ name: 'PlanTest' }).expect(201);
      const planPayload = { summary: 'Resumen', objectives: 'Objetivos', risks: 'Riesgos' };
      const saved = await request(app).post(`/projects/${project.body.id}/plan`).send(planPayload);
      expect(saved.status).toBe(201);
      expect(saved.body.projectId).toBe(project.body.id);
      expect(saved.body.summary).toBe(planPayload.summary);

      const fetched = await request(app).get(`/projects/${project.body.id}/plan`);
      expect(fetched.status).toBe(200);
      expect(fetched.body.summary).toBe(planPayload.summary);
    });
  });

  describe('versions', () => {
    beforeEach(async () => {
      const project = await createTestProject();
      testProjectId = project.id;
    });

    it('creates a new version for a project', async () => {
      const versionPayload = {
        version: 'v1.0.0',
        description: 'Primera versión estable',
        changes: 'Implementación inicial de todas las funcionalidades',
        releaseDate: '2024-06-01',
        status: 'draft',
        createdBy: 'Developer 1'
      };

      const res = await request(app)
        .post(`/projects/${testProjectId}/versions`)
        .send(versionPayload);

      expect(res.status).toBe(201);
      expect(res.body.version).toBe(versionPayload.version);
      expect(res.body.description).toBe(versionPayload.description);
      expect(res.body.projectId).toBe(testProjectId);
      expect(res.body.status).toBe('draft');
    });

    it('retrieves version history for a project', async () => {
      // Crear varias versiones
      await request(app).post(`/projects/${testProjectId}/versions`).send({
        version: 'v1.0.0',
        description: 'Primera versión',
        createdBy: 'Dev1'
      });
      
      await request(app).post(`/projects/${testProjectId}/versions`).send({
        version: 'v1.1.0',
        description: 'Segunda versión',
        createdBy: 'Dev2'
      });

      const res = await request(app).get(`/projects/${testProjectId}/versions`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].version).toBeDefined();
      expect(res.body[1].version).toBeDefined();
    });

    it('updates version status', async () => {
      const version = await request(app)
        .post(`/projects/${testProjectId}/versions`)
        .send({ version: 'v1.0.0', createdBy: 'Dev1' });

      const res = await request(app)
        .put(`/projects/${testProjectId}/versions/${version.body.id}/status`)
        .send({ status: 'released' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('released');
    });

    it('prevents duplicate version numbers', async () => {
      await request(app).post(`/projects/${testProjectId}/versions`).send({
        version: 'v1.0.0',
        createdBy: 'Dev1'
      });

      const res = await request(app).post(`/projects/${testProjectId}/versions`).send({
        version: 'v1.0.0',
        createdBy: 'Dev2'
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('ya existe');
    });

    it('returns 404 when project does not exist', async () => {
      const res = await request(app)
        .get('/projects/nonexistent-id/versions');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Proyecto no encontrado');
    });
  });

  describe('defects', () => {
    beforeEach(async () => {
      const project = await createTestProject();
      testProjectId = project.id;
    });

    it('creates a new defect for a project', async () => {
      const defectPayload = {
        title: 'Error en login',
        description: 'El login falla con credenciales válidas',
        severity: 'high',
        priority: 'high',
        reportedBy: 'QA Tester',
        assignedTo: 'Developer 1',
        reportedDate: '2024-05-15'
      };

      const res = await request(app)
        .post(`/projects/${testProjectId}/defects`)
        .send(defectPayload);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(defectPayload.title);
      expect(res.body.severity).toBe('high');
      expect(res.body.status).toBe('open');
      expect(res.body.projectId).toBe(testProjectId);
    });

    it('retrieves all defects for a project', async () => {
      // Crear varios defectos
      await request(app).post(`/projects/${testProjectId}/defects`).send({
        title: 'Bug 1',
        severity: 'low',
        reportedBy: 'Tester1'
      });

      await request(app).post(`/projects/${testProjectId}/defects`).send({
        title: 'Bug 2',
        severity: 'critical',
        reportedBy: 'Tester2'
      });

      const res = await request(app).get(`/projects/${testProjectId}/defects`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('changes defect status', async () => {
      const defect = await request(app)
        .post(`/projects/${testProjectId}/defects`)
        .send({ 
          title: 'Test defect',
          reportedBy: 'Tester'
        });

      const res = await request(app)
        .put(`/projects/${testProjectId}/defects/${defect.body.id}/status`)
        .send({ 
          status: 'in-progress'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in-progress');
    });

    it('resolves a defect with resolution notes', async () => {
      const defect = await request(app)
        .post(`/projects/${testProjectId}/defects`)
        .send({ 
          title: 'Bug to resolve',
          reportedBy: 'Tester'
        });

      const res = await request(app)
        .put(`/projects/${testProjectId}/defects/${defect.body.id}/status`)
        .send({ 
          status: 'resolved',
          resolutionNotes: 'Fixed by updating validation logic'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('resolved');
      expect(res.body.resolutionNotes).toBe('Fixed by updating validation logic');
      expect(res.body.resolvedDate).toBeDefined();
    });

    it('filters defects by status', async () => {
      // Crear defectos con diferentes estados
      const defect1 = await request(app).post(`/projects/${testProjectId}/defects`).send({
        title: 'Open bug',
        reportedBy: 'Tester1'
      });

      const defect2 = await request(app).post(`/projects/${testProjectId}/defects`).send({
        title: 'Another bug',
        reportedBy: 'Tester2'
      });

      // Cambiar estado del segundo
      await request(app)
        .put(`/projects/${testProjectId}/defects/${defect2.body.id}/status`)
        .send({ status: 'resolved' });

      // Filtrar por estado 'open'
      const res = await request(app).get(`/projects/${testProjectId}/defects?status=open`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Open bug');
    });

    it('retrieves defect statistics', async () => {
      // Crear defectos con diferentes características
      await request(app).post(`/projects/${testProjectId}/defects`).send({
        title: 'Critical bug',
        severity: 'critical',
        priority: 'high',
        reportedBy: 'Tester1'
      });

      await request(app).post(`/projects/${testProjectId}/defects`).send({
        title: 'Low priority bug',
        severity: 'low',
        priority: 'low',
        reportedBy: 'Tester2'
      });

      const res = await request(app).get(`/projects/${testProjectId}/defects/statistics`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.byStatus.open).toBe(2);
      expect(res.body.bySeverity.critical).toBe(1);
      expect(res.body.bySeverity.low).toBe(1);
      expect(res.body.byPriority.high).toBe(1);
      expect(res.body.byPriority.low).toBe(1);
    });

    it('links defect to artifact and test case', async () => {
      const artifact = await request(app)
        .post(`/projects/${testProjectId}/artifacts`)
        .send({ name: 'Documento de arquitectura', status: 'pending', type: 'architecture' });

      const testCase = await request(app)
        .post(`/projects/${testProjectId}/test-cases`)
        .send({ title: 'Login flow', artifactId: artifact.body.id });

      const res = await request(app)
        .post(`/projects/${testProjectId}/defects`)
        .send({
          title: 'Defecto vinculado',
          artifactId: artifact.body.id,
          testCaseId: testCase.body.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.artifactId).toBe(artifact.body.id);
      expect(res.body.testCaseId).toBe(testCase.body.id);
    });

    it('validates severity values', async () => {
      const res = await request(app)
        .post(`/projects/${testProjectId}/defects`)
        .send({
          title: 'Test bug',
          severity: 'invalid-severity',
          reportedBy: 'Tester'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Severidad inválida');
    });

    it('validates status values when updating', async () => {
      const defect = await request(app)
        .post(`/projects/${testProjectId}/defects`)
        .send({ 
          title: 'Test defect',
          reportedBy: 'Tester'
        });

      const res = await request(app)
        .put(`/projects/${testProjectId}/defects/${defect.body.id}/status`)
        .send({ status: 'invalid-status' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Estado inválido');
    });

    it('returns 404 when project does not exist', async () => {
      const res = await request(app)
        .get('/projects/nonexistent-id/defects');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Proyecto no encontrado');
    });
  });

  describe('artifacts', () => {
    beforeEach(async () => {
      const project = await createTestProject();
      testProjectId = project.id;
    });

    it('creates and lists generic artifacts', async () => {
      const created = await request(app)
        .post(`/projects/${testProjectId}/artifacts`)
        .send({ name: 'Documento elaboraciA3n', status: 'pending', type: 'architecture' });

      expect(created.status).toBe(201);
      expect(created.body.name).toBe('Documento elaboraciA3n');

      const list = await request(app).get(`/projects/${testProjectId}/artifacts`);
      expect(list.status).toBe(200);
      expect(list.body.some((artifact) => artifact.id === created.body.id)).toBeTruthy();
    });

    it('updates an artifact', async () => {
      const artifact = await request(app)
        .post(`/projects/${testProjectId}/artifacts`)
        .send({ name: 'Documento de construcciA3n', status: 'pending', type: 'design-document' });

      const updated = await request(app)
        .put(`/projects/${testProjectId}/artifacts/${artifact.body.id}`)
        .send({ status: 'review', owner: 'Equipo QA' });

      expect(updated.status).toBe(200);
      expect(updated.body.status).toBe('review');
      expect(updated.body.owner).toBe('Equipo QA');
    });
  });

  describe('test cases', () => {
    beforeEach(async () => {
      const project = await createTestProject();
      testProjectId = project.id;
    });

    it('creates test cases linked to artifacts', async () => {
      const artifact = await request(app)
        .post(`/projects/${testProjectId}/artifacts`)
        .send({ name: 'Plan de pruebas', status: 'pending', type: 'test-case' });

      const testCase = await request(app)
        .post(`/projects/${testProjectId}/test-cases`)
        .send({
          title: 'Login con credenciales',
          artifactId: artifact.body.id,
          createdBy: 'QA Lead',
        });

      expect(testCase.status).toBe(201);
      expect(testCase.body.artifactId).toBe(artifact.body.id);

      const list = await request(app).get(`/projects/${testProjectId}/test-cases`);
      expect(list.status).toBe(200);
      expect(list.body.some((tc) => tc.id === testCase.body.id)).toBeTruthy();
    });

    it('records executions and updates status', async () => {
      const artifact = await request(app)
        .post(`/projects/${testProjectId}/artifacts`)
        .send({ name: 'Caso crítico', status: 'pending', type: 'test-case' });

      const testCase = await request(app)
        .post(`/projects/${testProjectId}/test-cases`)
        .send({ title: 'Registro de error', artifactId: artifact.body.id });

      const run = await request(app)
        .post(`/projects/${testProjectId}/test-cases/${testCase.body.id}/runs`)
        .send({ outcome: 'pass', executedBy: 'QA', notes: 'Automatizado' });

      expect(run.status).toBe(201);
      expect(run.body.outcome).toBe('pass');

      const updated = await request(app).get(`/projects/${testProjectId}/test-cases`);
      const refreshed = updated.body.find((tc) => tc.id === testCase.body.id);
      expect(refreshed?.status).toBe('passed');
    });
  });

  describe('tasks', () => {
    beforeEach(async () => {
      const project = await createTestProject();
      testProjectId = project.id;
    });

    it('creates a task', async () => {
      const res = await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({
          title: 'Nueva tarea de prueba',
          description: 'Descripción de la tarea',
          priority: 'high',
          taskType: 'feature',
          estimatedHours: 8
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Nueva tarea de prueba');
      expect(res.body.priority).toBe('high');
      expect(res.body.taskType).toBe('feature');
      expect(res.body.status).toBe('backlog');
      expect(res.body.progressPercentage).toBe(0);
      expect(res.body.estimatedHours).toBe(8);
    });

    it('gets all tasks for a project', async () => {
      await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task 1', priority: 'medium' });
      
      await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task 2', priority: 'high' });

      const res = await request(app).get(`/projects/${testProjectId}/tasks`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Task 2'); // Más reciente primero
      expect(res.body[1].title).toBe('Task 1');
    });

    it('filters tasks by status', async () => {
      await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task backlog', status: 'backlog' });
      
      await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task in progress', status: 'in-progress' });

      const res = await request(app)
        .get(`/projects/${testProjectId}/tasks?status=in-progress`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('in-progress');
    });

    it('updates a task', async () => {
      const task = await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Original title', priority: 'low' });

      const res = await request(app)
        .put(`/tasks/${task.body.id}`)
        .send({ 
          title: 'Updated title',
          priority: 'high',
          description: 'Updated description'
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated title');
      expect(res.body.priority).toBe('high');
      expect(res.body.description).toBe('Updated description');
    });

    it('updates task status', async () => {
      const task = await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Test task' });

      const res = await request(app)
        .put(`/tasks/${task.body.id}/status`)
        .send({ status: 'in-progress' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in-progress');
      expect(res.body.startedAt).toBeTruthy();
    });

    it('sets completedAt when status changes to done', async () => {
      const task = await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task to complete' });

      const res = await request(app)
        .put(`/tasks/${task.body.id}/status`)
        .send({ status: 'done' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).toBeTruthy();
      expect(res.body.progressPercentage).toBe(100);
    });

    it('assigns a task to a user', async () => {
      const task = await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task to assign' });

      const res = await request(app)
        .put(`/tasks/${task.body.id}/assign`)
        .send({ 
          assignedTo: 'john.doe',
          assignedRole: 'Developer'
        });

      expect(res.status).toBe(200);
      expect(res.body.assignedTo).toBe('john.doe');
      expect(res.body.assignedRole).toBe('Developer');
    });

    it('updates task progress', async () => {
      const task = await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task with progress', estimatedHours: 10 });

      const res = await request(app)
        .put(`/tasks/${task.body.id}/progress`)
        .send({ 
          progressPercentage: 50,
          actualHours: 5
        });

      expect(res.status).toBe(200);
      expect(res.body.progressPercentage).toBe(50);
      expect(res.body.actualHours).toBe(5);
    });

    it('deletes a task', async () => {
      const task = await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task to delete' });

      const res = await request(app).delete(`/tasks/${task.body.id}`);
      expect(res.status).toBe(204);

      const getRes = await request(app).get(`/tasks/${task.body.id}`);
      expect(getRes.status).toBe(404);
    });

    it('gets project statistics', async () => {
      await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ 
          title: 'Task 1',
          status: 'done',
          priority: 'high',
          taskType: 'feature',
          estimatedHours: 10,
          actualHours: 8,
          progressPercentage: 100
        });

      await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ 
          title: 'Task 2',
          status: 'in-progress',
          priority: 'medium',
          taskType: 'bug',
          estimatedHours: 5,
          actualHours: 3,
          progressPercentage: 60
        });

      const res = await request(app)
        .get(`/projects/${testProjectId}/tasks/statistics`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.byStatus.done).toBe(1);
      expect(res.body.byStatus['in-progress']).toBe(1);
      expect(res.body.byPriority.high).toBe(1);
      expect(res.body.byPriority.medium).toBe(1);
      expect(res.body.byType.feature).toBe(1);
      expect(res.body.byType.bug).toBe(1);
      expect(res.body.estimatedHours).toBe(15);
      expect(res.body.actualHours).toBe(11);
      expect(parseFloat(res.body.overallProgress)).toBeGreaterThan(0);
    });

    it('gets tasks by assignee', async () => {
      await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task 1', assignedTo: 'john.doe' });

      await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task 2', assignedTo: 'john.doe' });

      await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ title: 'Task 3', assignedTo: 'jane.doe' });

      const res = await request(app)
        .get(`/projects/${testProjectId}/tasks/assignee/john.doe`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.every(t => t.assignedTo === 'john.doe')).toBe(true);
    });

    it('validates required fields when creating task', async () => {
      const res = await request(app)
        .post(`/projects/${testProjectId}/tasks`)
        .send({ description: 'Missing title' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Faltan campos');
    });

    it('returns 404 when project does not exist', async () => {
      const res = await request(app)
        .get('/projects/nonexistent-id/tasks');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Proyecto no encontrado');
    });
  });
});
