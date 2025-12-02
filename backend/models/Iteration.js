const db = require('../db');
const { randomUUID } = require('crypto');

class Iteration {
  // Crear iteración
  static async create(projectId, phaseId, data) {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const [iteration] = await db('iterations')
      .insert({
        id,
        project_id: projectId,
        phase_id: phaseId,
        name: data.name,
        goal: data.goal,
        start_date: data.startDate,
        end_date: data.endDate,
        status: data.status || 'planned',
        created_at: now,
      })
      .returning('*');
    
    return this.formatIteration(iteration);
  }

  // Buscar por fase
  static async findByPhase(phaseId) {
    const iterations = await db('iterations')
      .where({ phase_id: phaseId })
      .orderBy('start_date', 'asc');
    
    return iterations.map(this.formatIteration);
  }

  // Buscar por proyecto
  static async findByProject(projectId) {
    const iterations = await db('iterations')
      .where({ project_id: projectId })
      .orderBy('start_date', 'asc');
    
    return iterations.map(this.formatIteration);
  }

  // Actualizar iteración
  static async update(id, data) {
    const updates = {};
    
    if (data.name !== undefined) updates.name = data.name;
    if (data.goal !== undefined) updates.goal = data.goal;
    if (data.startDate !== undefined) updates.start_date = data.startDate;
    if (data.endDate !== undefined) updates.end_date = data.endDate;
    if (data.status !== undefined) updates.status = data.status;
    
    const [iteration] = await db('iterations')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return iteration ? this.formatIteration(iteration) : null;
  }

  // Formatear iteración para frontend
  static formatIteration(dbIteration) {
    return {
      id: dbIteration.id,
      projectId: dbIteration.project_id,
      phaseId: dbIteration.phase_id,
      name: dbIteration.name,
      goal: dbIteration.goal,
      startDate: dbIteration.start_date,
      endDate: dbIteration.end_date,
      status: dbIteration.status,
      createdAt: dbIteration.created_at,
    };
  }
}

module.exports = Iteration;