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

// Exportar app (sin store en memoria)
module.exports = { app };