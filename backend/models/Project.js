const db = require('../db');
const { randomUUID } = require('crypto');

class Project {
  static PHASE_TEMPLATES = [
    { key: 'inception', name: 'Incepción' },
    { key: 'elaboration', name: 'Elaboración' },
    { key: 'construction', name: 'Construcción' },
    { key: 'transition', name: 'Transición' },
  ];

  // Crear proyecto con fases automáticas (transacción)
  static async create(data) {
    const trx = await db.transaction();
    
    try {
      const id = randomUUID();
      const now = new Date().toISOString();
      
      // 1. Crear proyecto
      const [project] = await trx('projects')
        .insert({
          id,
          name: data.name,
          description: data.description || '',
          start_date: data.startDate,
          end_date: data.endDate,
          status: data.status || 'active',
          created_at: now,
          updated_at: now,
        })
        .returning('*');
      
      // 2. Crear fases automáticamente
      const phases = this.PHASE_TEMPLATES.map((phase, idx) => ({
        id: randomUUID(),
        project_id: id,
        key: phase.key,
        name: phase.name,
        order: idx + 1,
        status: idx === 0 ? 'in-progress' : 'not-started',
      }));
      
      await trx('phases').insert(phases);
      
      await trx.commit();
      
      // Formatear respuesta para frontend
      return {
        ...project,
        startDate: project.start_date,
        endDate: project.end_date,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        phases: phases.map(p => ({
          id: p.id,
          projectId: p.project_id,
          key: p.key,
          name: p.name,
          order: p.order,
          status: p.status,
        }))
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Buscar por ID con fases
  static async findById(id) {
    const project = await db('projects').where({ id }).first();
    if (!project) return null;
    
    const phases = await db('phases')
      .where({ project_id: id })
      .orderBy('order', 'asc');
    
    // Formatear para frontend
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.start_date,
      endDate: project.end_date,
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      phases: phases.map(p => ({
        id: p.id,
        projectId: p.project_id,
        key: p.key,
        name: p.name,
        order: p.order,
        status: p.status,
        startDate: p.start_date,
        endDate: p.end_date,
      }))
    };
  }

  // Listar todos los proyectos con sus fases
  static async findAll() {
    const projects = await db('projects').select('*');
    
    const projectsWithPhases = await Promise.all(
      projects.map(async (project) => {
        const phases = await db('phases')
          .where({ project_id: project.id })
          .orderBy('order', 'asc');
        
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          startDate: project.start_date,
          endDate: project.end_date,
          status: project.status,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          phases: phases.map(p => ({
            id: p.id,
            projectId: p.project_id,
            key: p.key,
            name: p.name,
            order: p.order,
            status: p.status,
            startDate: p.start_date,
            endDate: p.end_date,
          }))
        };
      })
    );
    
    return projectsWithPhases;
  }

  // Actualizar proyecto
  static async update(id, data) {
    const updates = {};
    
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.startDate !== undefined) updates.start_date = data.startDate;
    if (data.endDate !== undefined) updates.end_date = data.endDate;
    if (data.status !== undefined) updates.status = data.status;
    
    updates.updated_at = new Date().toISOString();
    
    const [project] = await db('projects')
      .where({ id })
      .update(updates)
      .returning('*');
    
    return project ? await this.findById(id) : null;
  }

  // Eliminar proyecto (CASCADE eliminará todo lo relacionado)
  static async delete(id) {
    return await db('projects').where({ id }).del();
  }
}

module.exports = Project;