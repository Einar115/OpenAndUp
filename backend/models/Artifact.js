const db = require('../db');
const { randomUUID } = require('crypto');

/**
 * Modelo genérico de Artefactos que puede usarse en cualquier fase
 * del proyecto OpenUP (Incepción, Elaboración, Construcción, Transición)
 */
class Artifact {
  // Crear artefacto
  static async create(projectId, data) {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const [artifact] = await db('artifacts')
      .insert({
        id,
        project_id: projectId,
        phase_id: data.phaseId,
        iteration_id: data.iterationId,
        name: data.name,
        description: data.description,
        type: data.type || 'other',
        status: data.status || 'pending',
        required: data.required || false,
        owner: data.owner,
        reviewer: data.reviewer,
        due_date: data.dueDate,
        completed_date: data.completedDate,
        notes: data.notes,
        file_url: data.fileUrl,
        created_at: now,
        updated_at: now,
      })
      .returning('*');
    
    return this.formatArtifact(artifact);
  }

  // Buscar por proyecto
  static async findByProject(projectId, filters = {}) {
    let query = db('artifacts').where({ project_id: projectId });
    
    // Aplicar filtros opcionales
    if (filters.phaseId) {
      query = query.where({ phase_id: filters.phaseId });
    }
    if (filters.iterationId) {
      query = query.where({ iteration_id: filters.iterationId });
    }
    if (filters.status) {
      query = query.where({ status: filters.status });
    }
    if (filters.type) {
      query = query.where({ type: filters.type });
    }
    if (filters.owner) {
      query = query.where({ owner: filters.owner });
    }
    
    const artifacts = await query.orderBy('created_at', 'desc');
    return artifacts.map(this.formatArtifact);
  }

  // Buscar por fase
  static async findByPhase(phaseId) {
    const artifacts = await db('artifacts')
      .where({ phase_id: phaseId })
      .orderBy('name', 'asc');
    
    return artifacts.map(this.formatArtifact);
  }

  // Buscar por iteración
  static async findByIteration(iterationId) {
    const artifacts = await db('artifacts')
      .where({ iteration_id: iterationId })
      .orderBy('name', 'asc');
    
    return artifacts.map(this.formatArtifact);
  }

  // Buscar por ID
  static async findById(id) {
    const artifact = await db('artifacts').where({ id }).first();
    return artifact ? this.formatArtifact(artifact) : null;
  }

  // Actualizar artefacto
  static async update(id, data) {
    const updates = { updated_at: new Date().toISOString() };
    
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.type !== undefined) updates.type = data.type;
    if (data.status !== undefined) updates.status = data.status;
    if (data.required !== undefined) updates.required = data.required;
    if (data.owner !== undefined) updates.owner = data.owner;
    if (data.reviewer !== undefined) updates.reviewer = data.reviewer;
    if (data.phaseId !== undefined) updates.phase_id = data.phaseId;
    if (data.iterationId !== undefined) updates.iteration_id = data.iterationId;
    if (data.dueDate !== undefined) updates.due_date = data.dueDate;
    if (data.completedDate !== undefined) updates.completed_date = data.completedDate;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.fileUrl !== undefined) updates.file_url = data.fileUrl;
    
    const [artifact] = await db('artifacts')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return artifact ? this.formatArtifact(artifact) : null;
  }

  // Cambiar estado de artefacto
  static async updateStatus(id, status, completedDate = null) {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };
    
    // Si se marca como done o approved, agregar fecha de completado
    if ((status === 'done' || status === 'approved') && !completedDate) {
      updates.completed_date = new Date().toISOString().split('T')[0];
    } else if (completedDate) {
      updates.completed_date = completedDate;
    }
    
    const [artifact] = await db('artifacts')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return artifact ? this.formatArtifact(artifact) : null;
  }

  // Obtener estadísticas de artefactos
  static async getStatistics(projectId) {
    const artifacts = await this.findByProject(projectId);
    
    return {
      total: artifacts.length,
      byStatus: {
        pending: artifacts.filter(a => a.status === 'pending').length,
        inProgress: artifacts.filter(a => a.status === 'in-progress').length,
        review: artifacts.filter(a => a.status === 'review').length,
        approved: artifacts.filter(a => a.status === 'approved').length,
        done: artifacts.filter(a => a.status === 'done').length,
      },
      byType: artifacts.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {}),
      required: artifacts.filter(a => a.required).length,
      overdue: artifacts.filter(a => 
        a.dueDate && 
        a.status !== 'done' && 
        a.status !== 'approved' &&
        new Date(a.dueDate) < new Date()
      ).length,
    };
  }

  // Formatear artefacto para frontend
  static formatArtifact(dbArtifact) {
    return {
      id: dbArtifact.id,
      projectId: dbArtifact.project_id,
      phaseId: dbArtifact.phase_id,
      iterationId: dbArtifact.iteration_id,
      name: dbArtifact.name,
      description: dbArtifact.description,
      type: dbArtifact.type,
      status: dbArtifact.status,
      required: dbArtifact.required,
      owner: dbArtifact.owner,
      reviewer: dbArtifact.reviewer,
      dueDate: dbArtifact.due_date,
      completedDate: dbArtifact.completed_date,
      notes: dbArtifact.notes,
      fileUrl: dbArtifact.file_url,
      createdAt: dbArtifact.created_at,
      updatedAt: dbArtifact.updated_at,
    };
  }
}

module.exports = Artifact;
