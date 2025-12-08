const db = require('../db');
const { randomUUID } = require('crypto');

class Task {
  // Crear tarea
  static async create(projectId, data) {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const [task] = await db('tasks')
      .insert({
        id,
        project_id: projectId,
        phase_id: data.phaseId || null,
        iteration_id: data.iterationId || null,
        artifact_id: data.artifactId || null,
        title: data.title,
        description: data.description || '',
        status: data.status || 'backlog',
        priority: data.priority || 'medium',
        task_type: data.taskType || 'feature',
        assigned_to: data.assignedTo || null,
        assigned_role: data.assignedRole || null,
        estimated_hours: data.estimatedHours || null,
        actual_hours: data.actualHours || null,
        progress_percentage: data.progressPercentage || 0,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        due_date: data.dueDate || null,
        started_at: data.status === 'in-progress' ? now : null,
        completed_at: data.status === 'done' ? now : null,
        created_at: now,
        updated_at: now,
      })
      .returning('*');
    
    return this.formatTask(task);
  }

  // Buscar por proyecto con filtros
  static async findByProject(projectId, filters = {}) {
    let query = db('tasks')
      .where('project_id', projectId);
    
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    
    if (filters.priority) {
      query = query.where('priority', filters.priority);
    }
    
    if (filters.taskType) {
      query = query.where('task_type', filters.taskType);
    }
    
    if (filters.assignedTo) {
      query = query.where('assigned_to', filters.assignedTo);
    }
    
    if (filters.phaseId) {
      query = query.where('phase_id', filters.phaseId);
    }
    
    if (filters.iterationId) {
      query = query.where('iteration_id', filters.iterationId);
    }
    
    const tasks = await query.orderBy('created_at', 'desc');
    return tasks.map(this.formatTask);
  }

  // Buscar por ID
  static async findById(id) {
    const task = await db('tasks').where({ id }).first();
    return task ? this.formatTask(task) : null;
  }

  // Actualizar tarea
  static async update(id, data) {
    const now = new Date().toISOString();
    const updateData = {
      updated_at: now,
    };
    
    // Solo actualizar campos proporcionados
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.taskType !== undefined) updateData.task_type = data.taskType;
    if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
    if (data.assignedRole !== undefined) updateData.assigned_role = data.assignedRole;
    if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours;
    if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours;
    if (data.progressPercentage !== undefined) updateData.progress_percentage = data.progressPercentage;
    if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.phaseId !== undefined) updateData.phase_id = data.phaseId;
    if (data.iterationId !== undefined) updateData.iteration_id = data.iterationId;
    if (data.artifactId !== undefined) updateData.artifact_id = data.artifactId;
    
    // Actualizar fechas de inicio/finalización según estado
    if (data.status === 'in-progress') {
      const current = await this.findById(id);
      if (current && current.status !== 'in-progress') {
        updateData.started_at = now;
      }
    }
    
    if (data.status === 'done') {
      updateData.completed_at = now;
      updateData.progress_percentage = 100;
    }
    
    const [task] = await db('tasks')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    return task ? this.formatTask(task) : null;
  }

  // Actualizar solo el estado de la tarea (para drag-and-drop)
  static async updateStatus(id, status) {
    return this.update(id, { status });
  }

  // Asignar tarea
  static async assign(id, assignedTo, assignedRole = null) {
    return this.update(id, { assignedTo, assignedRole });
  }

  // Actualizar progreso
  static async updateProgress(id, progressPercentage, actualHours = null) {
    const data = { progressPercentage };
    if (actualHours !== null) {
      data.actualHours = actualHours;
    }
    return this.update(id, data);
  }

  // Eliminar tarea
  static async delete(id) {
    return await db('tasks').where({ id }).del();
  }

  // Obtener estadísticas del proyecto
  static async getProjectStatistics(projectId) {
    // Total de tareas
    const totalResult = await db('tasks')
      .where('project_id', projectId)
      .count('* as count')
      .first();
    
    const total = parseInt(totalResult.count);
    
    // Tareas por estado
    const byStatus = await db('tasks')
      .where('project_id', projectId)
      .select('status')
      .count('* as count')
      .groupBy('status');
    
    // Tareas por prioridad
    const byPriority = await db('tasks')
      .where('project_id', projectId)
      .select('priority')
      .count('* as count')
      .groupBy('priority');
    
    // Tareas por tipo
    const byType = await db('tasks')
      .where('project_id', projectId)
      .select('task_type')
      .count('* as count')
      .groupBy('task_type');
    
    // Progreso general
    const progressResult = await db('tasks')
      .where('project_id', projectId)
      .avg('progress_percentage as avg')
      .first();
    
    // Horas estimadas vs reales
    const hoursResult = await db('tasks')
      .where('project_id', projectId)
      .sum('estimated_hours as estimated')
      .sum('actual_hours as actual')
      .first();
    
    // Tareas vencidas
    const now = new Date().toISOString();
    const overdueResult = await db('tasks')
      .where('project_id', projectId)
      .where('status', '!=', 'done')
      .where('due_date', '<', now)
      .count('* as count')
      .first();
    
    return {
      total,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, row) => {
        acc[row.priority] = parseInt(row.count);
        return acc;
      }, {}),
      byType: byType.reduce((acc, row) => {
        acc[row.task_type] = parseInt(row.count);
        return acc;
      }, {}),
      overallProgress: parseFloat(progressResult.avg || 0).toFixed(2),
      estimatedHours: parseInt(hoursResult.estimated || 0),
      actualHours: parseInt(hoursResult.actual || 0),
      overdueTasks: parseInt(overdueResult.count),
    };
  }

  // Obtener tareas asignadas a un usuario
  static async findByAssignee(projectId, assignedTo) {
    const tasks = await db('tasks')
      .where({ project_id: projectId, assigned_to: assignedTo })
      .orderBy('priority', 'desc')
      .orderBy('due_date', 'asc');
    
    return tasks.map(this.formatTask);
  }

  // Formatear tarea para frontend
  static formatTask(dbTask) {
    return {
      id: dbTask.id,
      projectId: dbTask.project_id,
      phaseId: dbTask.phase_id,
      iterationId: dbTask.iteration_id,
      artifactId: dbTask.artifact_id,
      title: dbTask.title,
      description: dbTask.description,
      status: dbTask.status,
      priority: dbTask.priority,
      taskType: dbTask.task_type,
      assignedTo: dbTask.assigned_to,
      assignedRole: dbTask.assigned_role,
      estimatedHours: dbTask.estimated_hours,
      actualHours: dbTask.actual_hours,
      progressPercentage: dbTask.progress_percentage,
      tags: dbTask.tags ? JSON.parse(dbTask.tags) : [],
      dueDate: dbTask.due_date,
      startedAt: dbTask.started_at,
      completedAt: dbTask.completed_at,
      createdAt: dbTask.created_at,
      updatedAt: dbTask.updated_at,
    };
  }
}

module.exports = Task;
