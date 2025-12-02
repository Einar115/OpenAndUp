const db = require('../db');
const { randomUUID } = require('crypto');

class RoleAssignment {
  // Asignar rol
  static async assign(projectId, data) {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const [assignment] = await db('role_assignments')
      .insert({
        id,
        project_id: projectId,
        user: data.user,
        role: data.role,
        assigned_at: now,
      })
      .returning('*');
    
    return this.formatAssignment(assignment);
  }

  // Buscar por proyecto
  static async findByProject(projectId) {
    const assignments = await db('role_assignments')
      .where({ project_id: projectId })
      .orderBy('assigned_at', 'desc');
    
    return assignments.map(this.formatAssignment);
  }

  // Buscar por usuario y proyecto
  static async findByUserAndProject(projectId, user) {
    const assignments = await db('role_assignments')
      .where({ project_id: projectId, user })
      .orderBy('assigned_at', 'desc');
    
    return assignments.map(this.formatAssignment);
  }

  // Eliminar asignación
  static async remove(id) {
    return await db('role_assignments').where({ id }).del();
  }

  // Formatear asignación para frontend
  static formatAssignment(dbAssignment) {
    return {
      id: dbAssignment.id,
      projectId: dbAssignment.project_id,
      user: dbAssignment.user,
      role: dbAssignment.role,
      assignedAt: dbAssignment.assigned_at,
    };
  }
}

module.exports = RoleAssignment;