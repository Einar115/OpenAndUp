const db = require('../db');
const { randomUUID } = require('crypto');

class Plan {
  // Crear o actualizar plan
  static async upsert(projectId, data) {
    const existing = await db('plans').where({ project_id: projectId }).first();
    
    if (existing) {
      return await this.update(existing.id, data);
    } else {
      return await this.create(projectId, data);
    }
  }

  // Crear nuevo plan
  static async create(projectId, data) {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const [plan] = await db('plans')
      .insert({
        id,
        project_id: projectId,
        summary: data.summary,
        objectives: data.objectives,
        risks: data.risks,
        created_at: now,
        updated_at: now,
      })
      .returning('*');
    
    return this.formatPlan(plan);
  }

  // Actualizar plan existente
  static async update(id, data) {
    const updates = {};
    
    if (data.summary !== undefined) updates.summary = data.summary;
    if (data.objectives !== undefined) updates.objectives = data.objectives;
    if (data.risks !== undefined) updates.risks = data.risks;
    
    updates.updated_at = new Date().toISOString();
    
    const [plan] = await db('plans')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return plan ? this.formatPlan(plan) : null;
  }

  // Buscar por proyecto
  static async findByProject(projectId) {
    const plan = await db('plans').where({ project_id: projectId }).first();
    return plan ? this.formatPlan(plan) : null;
  }

  // Formatear plan para frontend
  static formatPlan(dbPlan) {
    return {
      id: dbPlan.id,
      projectId: dbPlan.project_id,
      summary: dbPlan.summary,
      objectives: dbPlan.objectives,
      risks: dbPlan.risks,
      createdAt: dbPlan.created_at,
      updatedAt: dbPlan.updated_at,
    };
  }
}

module.exports = Plan;