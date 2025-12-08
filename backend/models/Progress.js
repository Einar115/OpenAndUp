// backend/models/Progress.js
const db = require('../db');

function computePlannedProgress(iteration, now = new Date()) {
  if (!iteration.start_date || !iteration.end_date) return 0;

  const start = new Date(iteration.start_date);
  const end = new Date(iteration.end_date);

  if (now <= start) return 0;
  if (now >= end) return 100;

  const totalMs = end - start;
  const elapsedMs = now - start;

  return (elapsedMs / totalMs) * 100;
}

function computeRealProgress(tasks) {
  if (!tasks.length) return { realProgress: 0, weight: 0 };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const t of tasks) {
    const weight = t.estimated_hours || 1;
    const progress = t.progress_percentage || 0;

    totalWeight += weight;
    weightedSum += progress * weight;
  }

  if (!totalWeight) {
    return { realProgress: 0, weight: 0 };
  }

  return {
    realProgress: weightedSum / totalWeight,
    weight: totalWeight,
  };
}

class Progress {
  /**
   * Progreso de UNA iteración de un proyecto
   */
  static async getIterationProgress(projectId, iterationId) {
    const iteration = await db('iterations')
      .where({ id: iterationId, project_id: projectId })
      .first();

    if (!iteration) {
      const error = new Error('Iteration not found');
      error.status = 404;
      throw error;
    }

    const tasks = await db('tasks')
      .where({ project_id: projectId, iteration_id: iterationId });

    const now = new Date();

    const plannedProgress = computePlannedProgress(iteration, now);
    const { realProgress } = computeRealProgress(tasks);
    const deviation = realProgress - plannedProgress;

    const alerts = [];
    const overdueTaskIds = [];

    for (const t of tasks) {
      const due = t.due_date ? new Date(t.due_date) : null;
      const isCompleted =
        (t.progress_percentage && t.progress_percentage >= 100) ||
        !!t.completed_at;

      if (due && !isCompleted && due < now) {
        overdueTaskIds.push(t.id);
      }
    }

    if (deviation < -15) {
      alerts.push({
        type: 'schedule_delay',
        severity: deviation < -30 ? 'high' : 'medium',
        message: `El avance real (${realProgress.toFixed(
          1
        )}%) está por debajo del planificado (${plannedProgress.toFixed(
          1
        )}%)`,
        deviation,
      });
    }

    if (overdueTaskIds.length) {
      alerts.push({
        type: 'overdue_tasks',
        severity: 'high',
        message: `Hay ${overdueTaskIds.length} tareas vencidas en la iteración.`,
        taskIds: overdueTaskIds,
      });
    }

    const end = iteration.end_date ? new Date(iteration.end_date) : null;
    if (end && now > end && realProgress < 99.5) {
      alerts.push({
        type: 'iteration_late',
        severity: 'high',
        message:
          'La iteración ya pasó su fecha de fin y no está completada (progreso < 100%).',
      });
    }

    const taskTrace = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      iterationId: t.iteration_id,
      estimatedHours: t.estimated_hours,
      actualHours: t.actual_hours,
      progressPercentage: t.progress_percentage,
      dueDate: t.due_date,
      startedAt: t.started_at,
      completedAt: t.completed_at,
      assignedTo: t.assigned_to, // ajusta si tu columna se llama distinto
    }));

    const teamMembers = [
      ...new Set(taskTrace.map((t) => t.assignedTo).filter(Boolean)),
    ];

    return {
      iteration: {
        id: iteration.id,
        projectId: iteration.project_id,
        phaseId: iteration.phase_id,
        name: iteration.name,
        goal: iteration.goal,
        startDate: iteration.start_date,
        endDate: iteration.end_date,
        status: iteration.status,
      },
      plannedProgress,
      realProgress,
      deviation,
      alerts,
      traceability: {
        tasks: taskTrace,
        teamMembers,
      },
    };
  }

  /**
   * Progreso agregado del PROYECTO completo (todas las iteraciones)
   */
  static async getProjectProgress(projectId) {
    const iterations = await db('iterations')
      .where({ project_id: projectId })
      .orderBy('start_date', 'asc');

    if (!iterations.length) {
      const error = new Error('Project has no iterations');
      error.status = 404;
      throw error;
    }

    const tasks = await db('tasks').where({ project_id: projectId });

    const now = new Date();

    const perIteration = [];
    let totalWeight = 0;
    let totalWeightedReal = 0;

    for (const iteration of iterations) {
      const itTasks = tasks.filter(
        (t) => t.iteration_id === iteration.id
      );

      const plannedProgress = computePlannedProgress(iteration, now);
      const { realProgress, weight } = computeRealProgress(itTasks);
      const deviation = realProgress - plannedProgress;

      totalWeight += weight;
      totalWeightedReal += realProgress * weight;

      perIteration.push({
        iteration: {
          id: iteration.id,
          name: iteration.name,
          startDate: iteration.start_date,
          endDate: iteration.end_date,
          status: iteration.status,
        },
        plannedProgress,
        realProgress,
        deviation,
      });
    }

    const realProgressProject =
      totalWeight > 0 ? totalWeightedReal / totalWeight : 0;

    // plan global = promedio simple de planificado por iteración
    const plannedProgressProject =
      perIteration.reduce((acc, it) => acc + it.plannedProgress, 0) /
      perIteration.length;

    const deviationProject =
      realProgressProject - plannedProgressProject;

    const alerts = [];
    const overdueTaskIds = [];

    for (const t of tasks) {
      const due = t.due_date ? new Date(t.due_date) : null;
      const isCompleted =
        (t.progress_percentage && t.progress_percentage >= 100) ||
        !!t.completed_at;

      if (due && !isCompleted && due < now) {
        overdueTaskIds.push(t.id);
      }
    }

    if (deviationProject < -15) {
      alerts.push({
        type: 'project_schedule_delay',
        severity: deviationProject < -30 ? 'high' : 'medium',
        message: `El proyecto está retrasado. Avance real ${realProgressProject.toFixed(
          1
        )}%, planificado ${plannedProgressProject.toFixed(1)}%.`,
        deviation: deviationProject,
      });
    }

    if (overdueTaskIds.length) {
      alerts.push({
        type: 'project_overdue_tasks',
        severity: 'high',
        message: `Hay ${overdueTaskIds.length} tareas vencidas en el proyecto.`,
        taskIds: overdueTaskIds,
      });
    }

    const taskTrace = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      iterationId: t.iteration_id,
      estimatedHours: t.estimated_hours,
      actualHours: t.actual_hours,
      progressPercentage: t.progress_percentage,
      dueDate: t.due_date,
      startedAt: t.started_at,
      completedAt: t.completed_at,
      assignedTo: t.assigned_to,
    }));

    const teamMembers = [
      ...new Set(taskTrace.map((t) => t.assignedTo).filter(Boolean)),
    ];

    return {
      projectId,
      plannedProgress: plannedProgressProject,
      realProgress: realProgressProject,
      deviation: deviationProject,
      alerts,
      traceability: {
        iterations: perIteration.map((it) => it.iteration),
        tasks: taskTrace,
        teamMembers,
      },
      perIteration,
    };
  }
}

module.exports = Progress;
