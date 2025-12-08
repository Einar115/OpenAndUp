const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');

// Importar modelos de base de datos
const Project = require('./models/Project');
const Phase = require('./models/Phase');
const Plan = require('./models/Plan');
const Iteration = require('./models/Iteration');
const InceptionArtifact = require('./models/InceptionArtifact');
const RoleAssignment = require('./models/RoleAssignment');
const Artifact = require('./models/Artifact');
const { TestCase, TEST_CASE_STATUSES, TEST_RUN_OUTCOMES } = require('./models/TestCase');
const Version = require('./models/Version');
const Defect = require('./models/Defect');
const Task = require('./models/Task');
const Progress = require('./models/Progress');

const app = express();

app.use(cors());
app.use(express.json());

// Validaciones (se mantienen igual)
const validateRequired = (fields, body) => {
  const missing = fields.filter((f) => !body[f]);
  return missing.length ? `Faltan campos: ${missing.join(', ')}` : null;
};

const validateDateRange = (start, end) => {
  if (!start || !end) return null;
  return new Date(start) <= new Date(end) ? null : 'La fecha de inicio debe ser anterior o igual a la fecha fin';
};

// ============ ENDPOINTS ============

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', version: 'v1', database: 'sqlite' });
});

// ============ PROYECTOS ============

// Crear proyecto
app.post('/projects', async (req, res) => {
  try {
    const error = validateRequired(['name'], req.body);
    if (error) return res.status(400).json({ error });

    const rangeError = validateDateRange(req.body.startDate, req.body.endDate);
    if (rangeError) return res.status(400).json({ error: rangeError });

    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Listar todos los proyectos
app.get('/projects', async (_req, res) => {
  try {
    const projects = await Project.findAll();
    res.json(projects);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener proyecto por ID
app.get('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ PLANES ============

// Obtener plan de proyecto
app.get('/projects/:id/plan', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const plan = await Plan.findByProject(req.params.id);
    res.json(plan);
  } catch (error) {
    console.error('Error al obtener plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear plan de proyecto
app.post('/projects/:id/plan', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const error = validateRequired(['summary'], req.body);
    if (error) return res.status(400).json({ error });

    // Usar upsert para crear o actualizar
    const plan = await Plan.upsert(req.params.id, req.body);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar plan de proyecto
app.put('/projects/:id/plan', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const existingPlan = await Plan.findByProject(req.params.id);
    if (!existingPlan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const plan = await Plan.update(existingPlan.id, req.body);
    res.json(plan);
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ ITERACIONES ============

// Obtener iteraciones de una fase
app.get('/projects/:projectId/phases/:phaseId/iterations', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar que la fase pertenece al proyecto
    const phase = project.phases.find(p => p.id === req.params.phaseId);
    if (!phase) {
      return res.status(404).json({ error: 'Fase no encontrada' });
    }

    const iterations = await Iteration.findByPhase(req.params.phaseId);
    res.json(iterations);
  } catch (error) {
    console.error('Error al obtener iteraciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear iteración en una fase
app.post('/projects/:projectId/phases/:phaseId/iterations', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar que la fase pertenece al proyecto
    const phase = project.phases.find(p => p.id === req.params.phaseId);
    if (!phase) {
      return res.status(404).json({ error: 'Fase no encontrada' });
    }

    const error = validateRequired(['name', 'startDate', 'endDate'], req.body);
    if (error) return res.status(400).json({ error });

    const rangeError = validateDateRange(req.body.startDate, req.body.endDate);
    if (rangeError) return res.status(400).json({ error: rangeError });

    const iteration = await Iteration.create(
      req.params.projectId,
      req.params.phaseId,
      req.body
    );
    res.status(201).json(iteration);
  } catch (error) {
    console.error('Error al crear iteración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ ARTEFACTOS DE INCEPCIÓN ============

// Obtener artefactos de incepción de un proyecto
app.get('/projects/:id/inception-artifacts', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const artifacts = await InceptionArtifact.findByProject(req.params.id);
    res.json(artifacts);
  } catch (error) {
    console.error('Error al obtener artefactos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear artefacto de incepción
app.post('/projects/:id/inception-artifacts', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const error = validateRequired(['name', 'status'], req.body);
    if (error) return res.status(400).json({ error });

    // Si se envía phaseId, verificar que existe
    if (req.body.phaseId) {
      const phaseExists = project.phases.some(p => p.id === req.body.phaseId);
      if (!phaseExists) {
        return res.status(400).json({ error: 'La fase especificada no pertenece a este proyecto' });
      }
    }

    const artifact = await InceptionArtifact.create(req.params.id, req.body);
    res.status(201).json(artifact);
  } catch (error) {
    console.error('Error al crear artefacto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ ARTEFACTOS GENERICOS ============

app.get('/projects/:id/artifacts', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const filters = {
      phaseId: req.query.phaseId,
      iterationId: req.query.iterationId,
      status: req.query.status,
      type: req.query.type,
      owner: req.query.owner,
    };

    const artifacts = await Artifact.findByProject(req.params.id, filters);
    res.json(artifacts);
  } catch (error) {
    console.error('Error al obtener artefactos genéricos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/projects/:id/artifacts', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const error = validateRequired(['name'], req.body);
    if (error) return res.status(400).json({ error });

    const artifact = await Artifact.create(req.params.id, req.body);
    res.status(201).json(artifact);
  } catch (error) {
    console.error('Error al crear artefacto genérico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/projects/:projectId/artifacts/:artifactId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const artifact = await Artifact.findById(req.params.artifactId);
    if (!artifact || artifact.projectId !== req.params.projectId) {
      return res.status(404).json({ error: 'Artefacto no encontrado en este proyecto' });
    }

    const updated = await Artifact.update(req.params.artifactId, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar artefacto genérico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ CASOS DE PRUEBA ============

app.get('/projects/:id/test-cases', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const filters = {
      status: req.query.status,
      artifactId: req.query.artifactId,
    };

    const testCases = await TestCase.findByProject(req.params.id, filters);
    res.json(testCases);
  } catch (error) {
    console.error('Error al obtener casos de prueba:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/projects/:id/test-cases', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const error = validateRequired(['title'], req.body);
    if (error) return res.status(400).json({ error });

    if (req.body.artifactId) {
      const artifact = await Artifact.findById(req.body.artifactId);
      if (!artifact || artifact.projectId !== req.params.id) {
        return res.status(400).json({ error: 'El artefacto especificado no pertenece al proyecto' });
      }
    }

    if (req.body.status && !TEST_CASE_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${TEST_CASE_STATUSES.join(', ')}` });
    }

    const testCase = await TestCase.create(req.params.id, req.body);
    res.status(201).json(testCase);
  } catch (error) {
    console.error('Error al crear caso de prueba:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/projects/:projectId/test-cases/:testCaseId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const testCase = await TestCase.findById(req.params.testCaseId);
    if (!testCase || testCase.projectId !== req.params.projectId) {
      return res.status(404).json({ error: 'Caso de prueba no encontrado' });
    }

    if (req.body.artifactId) {
      const artifact = await Artifact.findById(req.body.artifactId);
      if (!artifact || artifact.projectId !== req.params.projectId) {
        return res.status(400).json({ error: 'El artefacto especificado no pertenece al proyecto' });
      }
    }

    const updated = await TestCase.update(req.params.testCaseId, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar caso de prueba:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/projects/:projectId/test-cases/:testCaseId/runs', async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.testCaseId);
    if (!testCase || testCase.projectId !== req.params.projectId) {
      return res.status(404).json({ error: 'Caso de prueba no encontrado' });
    }

    const runs = await TestCase.getRuns(req.params.testCaseId);
    res.json(runs);
  } catch (error) {
    console.error('Error al obtener ejecuciones del caso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/projects/:projectId/test-cases/:testCaseId/runs', async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.testCaseId);
    if (!testCase || testCase.projectId !== req.params.projectId) {
      return res.status(404).json({ error: 'Caso de prueba no encontrado' });
    }

    if (!req.body.outcome || !TEST_RUN_OUTCOMES.includes(req.body.outcome)) {
      return res.status(400).json({ error: `Resultado inválido. Valores permitidos: ${TEST_RUN_OUTCOMES.join(', ')}` });
    }

    const run = await TestCase.addRun(req.params.testCaseId, req.body);
    res.status(201).json(run);
  } catch (error) {
    console.error('Error al registrar ejecución del caso:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ ROLES ============

// Obtener roles de un proyecto
app.get('/projects/:id/roles', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const roles = await RoleAssignment.findByProject(req.params.id);
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Asignar rol a un proyecto
app.post('/projects/:id/roles', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const error = validateRequired(['user', 'role'], req.body);
    if (error) return res.status(400).json({ error });

    // Validar que el rol sea válido
    const validRoles = ['Project Manager', 'Tech Lead', 'QA', 'Stakeholder', 'Coach', 'Developer'];
    if (!validRoles.includes(req.body.role)) {
      return res.status(400).json({ 
        error: `Rol inválido. Roles válidos: ${validRoles.join(', ')}` 
      });
    }

    const assignment = await RoleAssignment.assign(req.params.id, req.body);
    res.status(201).json(assignment);
  } catch (error) {
    // Manejar error de duplicado (unique constraint)
    if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('unique_role_assignment')) {
      return res.status(409).json({ 
        error: 'Esta persona ya tiene asignado este rol en el proyecto' 
      });
    }
    
    console.error('Error al asignar rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ ENDPOINTS ADICIONALES ÚTILES ============

// Actualizar estado de una fase
app.put('/phases/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['not-started', 'in-progress', 'complete'].includes(status)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Valores permitidos: not-started, in-progress, complete' 
      });
    }

    const phase = await Phase.updateStatus(req.params.id, status);
    if (!phase) {
      return res.status(404).json({ error: 'Fase no encontrada' });
    }

    res.json(phase);
  } catch (error) {
    console.error('Error al actualizar fase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las iteraciones de un proyecto
app.get('/projects/:id/iterations', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const iterations = await Iteration.findByProject(req.params.id);
    res.json(iterations);
  } catch (error) {
    console.error('Error al obtener iteraciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ ADMIN ============

// Reset de base de datos (solo para desarrollo)
app.post('/admin/reset', async (_req, res) => {
  try {
    // Importar db para operaciones directas
    const db = require('./db');
    
    // Eliminar datos en orden correcto (debido a foreign keys)
    await db('defects').del();
    await db('versions').del();
    await db('role_assignments').del();
    await db('inception_artifacts').del();
    await db('iterations').del();
    await db('plans').del();
    await db('phases').del();
    await db('projects').del();
    
    res.status(204).end();
  } catch (error) {
    console.error('Error al resetear base de datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para ver estado de la base de datos (solo desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.get('/admin/status', async (_req, res) => {
    try {
      const db = require('./db');
      
      const counts = {
        projects: await db('projects').count('* as count').first(),
        phases: await db('phases').count('* as count').first(),
        plans: await db('plans').count('* as count').first(),
        iterations: await db('iterations').count('* as count').first(),
        inceptionArtifacts: await db('inception_artifacts').count('* as count').first(),
        roleAssignments: await db('role_assignments').count('* as count').first(),
        versions: await db('versions').count('* as count').first(),
        defects: await db('defects').count('* as count').first(),
      };
      
      res.json({
        database: 'sqlite',
        timestamp: new Date().toISOString(),
        counts: Object.fromEntries(
          Object.entries(counts).map(([key, value]) => [key, value.count])
        )
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// ============ VERSIONES ============

// Obtener versiones de un proyecto (historial)
app.get('/projects/:id/versions', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const versions = await Version.findByProject(req.params.id);
    res.json(versions);
  } catch (error) {
    console.error('Error al obtener versiones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva versión
app.post('/projects/:id/versions', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const error = validateRequired(['version'], req.body);
    if (error) return res.status(400).json({ error });

    const version = await Version.create(req.params.id, req.body);
    res.status(201).json(version);
  } catch (error) {
    // Manejar error de versión duplicada
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ 
        error: 'Esta versión ya existe en el proyecto' 
      });
    }
    
    console.error('Error al crear versión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado de versión
app.put('/projects/:projectId/versions/:versionId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'released', 'archived'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` 
      });
    }

    const version = await Version.updateStatus(req.params.versionId, status);
    if (!version) {
      return res.status(404).json({ error: 'Versión no encontrada' });
    }

    res.json(version);
  } catch (error) {
    console.error('Error al actualizar estado de versión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ DEFECTOS ============

// Obtener defectos de un proyecto
app.get('/projects/:id/defects', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Aplicar filtros opcionales de query params
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.severity) filters.severity = req.query.severity;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo;

    const defects = await Defect.findByProject(req.params.id, filters);
    res.json(defects);
  } catch (error) {
    console.error('Error al obtener defectos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear defecto
app.post('/projects/:id/defects', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const error = validateRequired(['title'], req.body);
    if (error) return res.status(400).json({ error });

    // Validar severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (req.body.severity && !validSeverities.includes(req.body.severity)) {
      return res.status(400).json({ 
        error: `Severidad inválida. Valores permitidos: ${validSeverities.join(', ')}` 
      });
    }

    // Validar priority
    const validPriorities = ['low', 'medium', 'high'];
    if (req.body.priority && !validPriorities.includes(req.body.priority)) {
      return res.status(400).json({ 
        error: `Prioridad inválida. Valores permitidos: ${validPriorities.join(', ')}` 
      });
    }

    const defect = await Defect.create(req.params.id, req.body);
    res.status(201).json(defect);
  } catch (error) {
    console.error('Error al crear defecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar estado de defecto
app.put('/projects/:projectId/defects/:defectId/status', async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` 
      });
    }

    const defect = await Defect.updateStatus(req.params.defectId, status, resolutionNotes);
    if (!defect) {
      return res.status(404).json({ error: 'Defecto no encontrado' });
    }

    res.json(defect);
  } catch (error) {
    console.error('Error al actualizar estado de defecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de defectos
app.get('/projects/:id/defects/statistics', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const statistics = await Defect.getStatistics(req.params.id);
    res.json(statistics);
  } catch (error) {
    console.error('Error al obtener estadísticas de defectos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ TAREAS (TASKS) ============

// Crear tarea
app.post('/projects/:id/tasks', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const error = validateRequired(['title'], req.body);
    if (error) return res.status(400).json({ error });

    const task = await Task.create(req.params.id, req.body);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener tareas del proyecto con filtros
app.get('/projects/:id/tasks', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      taskType: req.query.taskType,
      assignedTo: req.query.assignedTo,
      phaseId: req.query.phaseId,
      iterationId: req.query.iterationId,
    };

    const tasks = await Task.findByProject(req.params.id, filters);
    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener tarea por ID
app.get('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar tarea
app.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado de tarea (para kanban)
app.put('/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'El campo status es requerido' });
    }

    const task = await Task.updateStatus(req.params.id, status);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error al actualizar estado de tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Asignar tarea
app.put('/tasks/:id/assign', async (req, res) => {
  try {
    const { assignedTo, assignedRole } = req.body;
    if (!assignedTo) {
      return res.status(400).json({ error: 'El campo assignedTo es requerido' });
    }

    const task = await Task.assign(req.params.id, assignedTo, assignedRole);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error al asignar tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar progreso de tarea
app.put('/tasks/:id/progress', async (req, res) => {
  try {
    const { progressPercentage, actualHours } = req.body;
    if (progressPercentage === undefined) {
      return res.status(400).json({ error: 'El campo progressPercentage es requerido' });
    }

    const task = await Task.updateProgress(req.params.id, progressPercentage, actualHours);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error al actualizar progreso de tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar tarea
app.delete('/tasks/:id', async (req, res) => {
  try {
    const deleted = await Task.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas del proyecto
app.get('/projects/:id/tasks/statistics', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const statistics = await Task.getProjectStatistics(req.params.id);
    res.json(statistics);
  } catch (error) {
    console.error('Error al obtener estadísticas de tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener tareas asignadas a un usuario
app.get('/projects/:id/tasks/assignee/:assignedTo', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const tasks = await Task.findByAssignee(req.params.id, req.params.assignedTo);
    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ AVANCE GLOBAL DEL PROYECTO ============
// GET /projects/:id/progress
app.get('/projects/:id/progress', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Validar que exista el proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const result = await Progress.getProjectProgress(projectId);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener progreso del proyecto:', error);

    // Si el modelo Progress lanza un error con status, lo respetamos
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }

    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ AVANCE POR ITERACIÓN ============
// GET /projects/:projectId/iterations/:iterationId/progress
app.get('/projects/:projectId/iterations/:iterationId/progress', async (req, res) => {
  try {
    const { projectId, iterationId } = req.params;

    // Validar que exista el proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const result = await Progress.getIterationProgress(projectId, iterationId);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener progreso de iteración:', error);

    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }

    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Exportar app (sin store en memoria)
module.exports = { app };
