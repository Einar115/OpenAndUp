exports.seed = async function(knex) {
  // Limpiar todas las tablas
  await knex('role_assignments').del();
  await knex('inception_artifacts').del();
  await knex('iterations').del();
  await knex('plans').del();
  await knex('phases').del();
  await knex('projects').del();

  // Insertar proyecto de ejemplo
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  
  await knex('projects').insert({
    id: projectId,
    name: 'Sistema de Gestión OpenUP',
    description: 'Proyecto demo para implementar metodología OpenUP',
    start_date: '2024-01-15',
    end_date: '2024-06-30',
    status: 'active',
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });

  // Insertar fases del proyecto
  const phases = [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      project_id: projectId,
      key: 'inception',
      name: 'Incepción',
      order: 1,
      status: 'in-progress',
      start_date: '2024-01-15',
      end_date: '2024-01-31'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      project_id: projectId,
      key: 'elaboration',
      name: 'Elaboración',
      order: 2,
      status: 'not-started',
      start_date: '2024-02-01',
      end_date: '2024-03-15'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      project_id: projectId,
      key: 'construction',
      name: 'Construcción',
      order: 3,
      status: 'not-started',
      start_date: '2024-03-16',
      end_date: '2024-05-31'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440004',
      project_id: projectId,
      key: 'transition',
      name: 'Transición',
      order: 4,
      status: 'not-started',
      start_date: '2024-06-01',
      end_date: '2024-06-30'
    }
  ];
  
  await knex('phases').insert(phases);

  // Insertar plan del proyecto
  await knex('plans').insert({
    id: '770e8400-e29b-41d4-a716-446655440000',
    project_id: projectId,
    summary: 'Desarrollar un sistema para gestión de proyectos usando metodología OpenUP',
    objectives: '1. Implementar todas las fases de OpenUP\n2. Crear artefactos requeridos\n3. Asignar roles claros\n4. Seguir iteraciones ágiles',
    risks: 'Falta de experiencia en OpenUP, cambios en requisitos',
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });

  // Insertar iteraciones para la fase de incepción
  await knex('iterations').insert([
    {
      id: '880e8400-e29b-41d4-a716-446655440001',
      project_id: projectId,
      phase_id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Iteración 1.1',
      goal: 'Definir visión y alcance del proyecto',
      start_date: '2024-01-15',
      end_date: '2024-01-22',
      status: 'complete',
      created_at: knex.fn.now()
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440002',
      project_id: projectId,
      phase_id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Iteración 1.2',
      goal: 'Crear artefactos iniciales y plan de proyecto',
      start_date: '2024-01-23',
      end_date: '2024-01-31',
      status: 'active',
      created_at: knex.fn.now()
    }
  ]);

  // Insertar artefactos de incepción
  await knex('inception_artifacts').insert([
    {
      id: '990e8400-e29b-41d4-a716-446655440001',
      project_id: projectId,
      name: 'Documento de Visión',
      description: 'Describe la visión general del producto y objetivos',
      status: 'done',
      required: true,
      owner: 'Ana López',
      phase_id: '660e8400-e29b-41d4-a716-446655440001'
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440002',
      project_id: projectId,
      name: 'Casos de Negocio',
      description: 'Justificación económica y objetivos de negocio',
      status: 'in-progress',
      required: true,
      owner: 'Carlos Ruiz',
      phase_id: '660e8400-e29b-41d4-a716-446655440001'
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440003',
      project_id: projectId,
      name: 'Plan de Proyecto',
      description: 'Planificación inicial con fases e iteraciones',
      status: 'pending',
      required: true,
      owner: 'María García',
      phase_id: '660e8400-e29b-41d4-a716-446655440001'
    }
  ]);

  // Insertar asignaciones de roles
  await knex('role_assignments').insert([
    {
      id: 'aa0e8400-e29b-41d4-a716-446655440001',
      project_id: projectId,
      user: 'María García',
      role: 'Project Manager',
      assigned_at: knex.fn.now()
    },
    {
      id: 'aa0e8400-e29b-41d4-a716-446655440002',
      project_id: projectId,
      user: 'Juan Pérez',
      role: 'Tech Lead',
      assigned_at: knex.fn.now()
    },
    {
      id: 'aa0e8400-e29b-41d4-a716-446655440003',
      project_id: projectId,
      user: 'Ana López',
      role: 'Stakeholder',
      assigned_at: knex.fn.now()
    },
    {
      id: 'aa0e8400-e29b-41d4-a716-446655440004',
      project_id: projectId,
      user: 'Pedro Sánchez',
      role: 'Developer',
      assigned_at: knex.fn.now()
    }
  ]);
};