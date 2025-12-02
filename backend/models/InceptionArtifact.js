const db = require('../db');
const { randomUUID } = require('crypto');

class InceptionArtifact {
  // Crear artefacto
  static async create(projectId, data) {
    const id = randomUUID();
    
    const [artifact] = await db('inception_artifacts')
      .insert({
        id,
        project_id: projectId,
        name: data.name,
        description: data.description,
        status: data.status || 'pending',
        required: data.required || false,
        owner: data.owner,
        phase_id: data.phaseId,
      })
      .returning('*');
    
    return this.formatArtifact(artifact);
  }

  // Buscar por proyecto
  static async findByProject(projectId) {
    const artifacts = await db('inception_artifacts')
      .where({ project_id: projectId })
      .orderBy('name', 'asc');
    
    return artifacts.map(this.formatArtifact);
  }

  // Actualizar artefacto
  static async update(id, data) {
    const updates = {};
    
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;
    if (data.required !== undefined) updates.required = data.required;
    if (data.owner !== undefined) updates.owner = data.owner;
    if (data.phaseId !== undefined) updates.phase_id = data.phaseId;
    
    const [artifact] = await db('inception_artifacts')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return artifact ? this.formatArtifact(artifact) : null;
  }

  // Formatear artefacto para frontend
  static formatArtifact(dbArtifact) {
    return {
      id: dbArtifact.id,
      projectId: dbArtifact.project_id,
      name: dbArtifact.name,
      description: dbArtifact.description,
      status: dbArtifact.status,
      required: dbArtifact.required,
      owner: dbArtifact.owner,
      phaseId: dbArtifact.phase_id,
    };
  }
}

module.exports = InceptionArtifact;