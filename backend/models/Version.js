const db = require('../db');
const { randomUUID } = require('crypto');

class Version {
  // Crear versión
  static async create(projectId, data) {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const [version] = await db('versions')
      .insert({
        id,
        project_id: projectId,
        version: data.version,
        description: data.description,
        changes: data.changes,
        release_date: data.releaseDate,
        status: data.status || 'draft',
        created_by: data.createdBy,
        created_at: now,
      })
      .returning('*');
    
    return this.formatVersion(version);
  }

  // Obtener historial de versiones de un proyecto
  static async findByProject(projectId) {
    const versions = await db('versions')
      .where({ project_id: projectId })
      .orderBy('created_at', 'desc');
    
    return versions.map(this.formatVersion);
  }

  // Buscar por ID
  static async findById(id) {
    const version = await db('versions').where({ id }).first();
    return version ? this.formatVersion(version) : null;
  }

  // Actualizar versión
  static async update(id, data) {
    const updates = {};
    
    if (data.version !== undefined) updates.version = data.version;
    if (data.description !== undefined) updates.description = data.description;
    if (data.changes !== undefined) updates.changes = data.changes;
    if (data.releaseDate !== undefined) updates.release_date = data.releaseDate;
    if (data.status !== undefined) updates.status = data.status;
    if (data.createdBy !== undefined) updates.created_by = data.createdBy;
    
    const [version] = await db('versions')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return version ? this.formatVersion(version) : null;
  }

  // Cambiar estado de versión
  static async updateStatus(id, status) {
    const [version] = await db('versions')
      .where({ id })
      .update({ status })
      .returning('*');
    
    return version ? this.formatVersion(version) : null;
  }

  // Formatear versión para frontend
  static formatVersion(dbVersion) {
    return {
      id: dbVersion.id,
      projectId: dbVersion.project_id,
      version: dbVersion.version,
      description: dbVersion.description,
      changes: dbVersion.changes,
      releaseDate: dbVersion.release_date,
      status: dbVersion.status,
      createdBy: dbVersion.created_by,
      createdAt: dbVersion.created_at,
    };
  }
}

module.exports = Version;
