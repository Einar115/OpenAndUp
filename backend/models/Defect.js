const db = require('../db');
const { randomUUID } = require('crypto');

class Defect {
  // Crear defecto
  static async create(projectId, data) {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const [defect] = await db('defects')
      .insert({
        id,
        project_id: projectId,
        title: data.title,
        description: data.description,
        severity: data.severity || 'medium',
        status: data.status || 'open',
        priority: data.priority || 'medium',
        reported_by: data.reportedBy,
        assigned_to: data.assignedTo,
        phase_id: data.phaseId,
        iteration_id: data.iterationId,
        reported_date: data.reportedDate || new Date().toISOString().split('T')[0],
        resolved_date: data.resolvedDate,
        resolution_notes: data.resolutionNotes,
        created_at: now,
        updated_at: now,
      })
      .returning('*');
    
    return this.formatDefect(defect);
  }

  // Buscar por proyecto
  static async findByProject(projectId, filters = {}) {
    let query = db('defects').where({ project_id: projectId });
    
    // Aplicar filtros opcionales
    if (filters.status) {
      query = query.where({ status: filters.status });
    }
    if (filters.severity) {
      query = query.where({ severity: filters.severity });
    }
    if (filters.priority) {
      query = query.where({ priority: filters.priority });
    }
    if (filters.assignedTo) {
      query = query.where({ assigned_to: filters.assignedTo });
    }
    
    const defects = await query.orderBy('created_at', 'desc');
    return defects.map(this.formatDefect);
  }

  // Buscar por ID
  static async findById(id) {
    const defect = await db('defects').where({ id }).first();
    return defect ? this.formatDefect(defect) : null;
  }

  // Actualizar defecto
  static async update(id, data) {
    const updates = { updated_at: new Date().toISOString() };
    
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.severity !== undefined) updates.severity = data.severity;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.reportedBy !== undefined) updates.reported_by = data.reportedBy;
    if (data.assignedTo !== undefined) updates.assigned_to = data.assignedTo;
    if (data.phaseId !== undefined) updates.phase_id = data.phaseId;
    if (data.iterationId !== undefined) updates.iteration_id = data.iterationId;
    if (data.reportedDate !== undefined) updates.reported_date = data.reportedDate;
    if (data.resolvedDate !== undefined) updates.resolved_date = data.resolvedDate;
    if (data.resolutionNotes !== undefined) updates.resolution_notes = data.resolutionNotes;
    
    const [defect] = await db('defects')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return defect ? this.formatDefect(defect) : null;
  }

  // Cambiar estado de defecto
  static async updateStatus(id, status, resolutionNotes = null) {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };
    
    // Si se resuelve o cierra, agregar fecha de resolución
    if (status === 'resolved' || status === 'closed') {
      updates.resolved_date = new Date().toISOString().split('T')[0];
    }
    
    if (resolutionNotes) {
      updates.resolution_notes = resolutionNotes;
    }
    
    const [defect] = await db('defects')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return defect ? this.formatDefect(defect) : null;
  }

  // Obtener estadísticas de defectos
  static async getStatistics(projectId) {
    const defects = await this.findByProject(projectId);
    
    return {
      total: defects.length,
      byStatus: {
        open: defects.filter(d => d.status === 'open').length,
        inProgress: defects.filter(d => d.status === 'in-progress').length,
        resolved: defects.filter(d => d.status === 'resolved').length,
        closed: defects.filter(d => d.status === 'closed').length,
        reopened: defects.filter(d => d.status === 'reopened').length,
      },
      bySeverity: {
        low: defects.filter(d => d.severity === 'low').length,
        medium: defects.filter(d => d.severity === 'medium').length,
        high: defects.filter(d => d.severity === 'high').length,
        critical: defects.filter(d => d.severity === 'critical').length,
      },
      byPriority: {
        low: defects.filter(d => d.priority === 'low').length,
        medium: defects.filter(d => d.priority === 'medium').length,
        high: defects.filter(d => d.priority === 'high').length,
      },
    };
  }

  // Formatear defecto para frontend
  static formatDefect(dbDefect) {
    return {
      id: dbDefect.id,
      projectId: dbDefect.project_id,
      title: dbDefect.title,
      description: dbDefect.description,
      severity: dbDefect.severity,
      status: dbDefect.status,
      priority: dbDefect.priority,
      reportedBy: dbDefect.reported_by,
      assignedTo: dbDefect.assigned_to,
      phaseId: dbDefect.phase_id,
      iterationId: dbDefect.iteration_id,
      reportedDate: dbDefect.reported_date,
      resolvedDate: dbDefect.resolved_date,
      resolutionNotes: dbDefect.resolution_notes,
      createdAt: dbDefect.created_at,
      updatedAt: dbDefect.updated_at,
    };
  }
}

module.exports = Defect;
