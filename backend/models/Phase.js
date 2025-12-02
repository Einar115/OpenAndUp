const db = require('../db');
const { randomUUID } = require('crypto');

class Phase {
  // Buscar por ID
  static async findById(id) {
    const phase = await db('phases').where({ id }).first();
    return phase ? this.formatPhase(phase) : null;
  }

  // Buscar por proyecto y key
  static async findByProjectAndKey(projectId, key) {
    const phase = await db('phases')
      .where({ project_id: projectId, key })
      .first();
    return phase ? this.formatPhase(phase) : null;
  }

  // Actualizar fase
  static async update(id, data) {
    const updates = {};
    
    if (data.name !== undefined) updates.name = data.name;
    if (data.order !== undefined) updates.order = data.order;
    if (data.status !== undefined) updates.status = data.status;
    if (data.startDate !== undefined) updates.start_date = data.startDate;
    if (data.endDate !== undefined) updates.end_date = data.endDate;
    
    const [phase] = await db('phases')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return phase ? this.formatPhase(phase) : null;
  }

  // Cambiar estado de fase
  static async updateStatus(id, status) {
    const [phase] = await db('phases')
      .where({ id })
      .update({ status })
      .returning('*');
    
    return phase ? this.formatPhase(phase) : null;
  }

  // Formatear fase para frontend
  static formatPhase(dbPhase) {
    return {
      id: dbPhase.id,
      projectId: dbPhase.project_id,
      key: dbPhase.key,
      name: dbPhase.name,
      order: dbPhase.order,
      status: dbPhase.status,
      startDate: dbPhase.start_date,
      endDate: dbPhase.end_date,
    };
  }
}

module.exports = Phase;