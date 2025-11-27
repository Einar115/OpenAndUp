const request = require('supertest');
const { app, resetStore } = require('../app');

describe('OpenAndUp API', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('projects', () => {
    it('creates a project and returns phases', async () => {
      const payload = { name: 'Proyecto Prueba', description: 'Descripción', startDate: '2024-01-01', endDate: '2024-06-01' };
      const create = await request(app).post('/projects').send(payload);
      expect(create.status).toBe(201);
      expect(create.body.name).toBe(payload.name);
      expect(create.body.phases).toHaveLength(4);

      const list = await request(app).get('/projects');
      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].id).toBe(create.body.id);
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
});
