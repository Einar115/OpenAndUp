const db = require('../db');
const { randomUUID } = require('crypto');

const TEST_CASE_STATUSES = ['draft', 'ready', 'executing', 'blocked', 'passed', 'failed'];
const TEST_RUN_OUTCOMES = ['pass', 'fail', 'blocked'];

class TestCase {
  static async create(projectId, data) {
    const id = randomUUID();
    const now = new Date().toISOString();

    const [testCase] = await db('test_cases')
      .insert({
        id,
        project_id: projectId,
        artifact_id: data.artifactId,
        title: data.title,
        description: data.description,
        status: data.status || 'ready',
        created_by: data.createdBy,
        created_at: now,
        updated_at: now,
      })
      .returning('*');

    return this.formatTestCase(testCase);
  }

  static async findByProject(projectId, filters = {}) {
    let query = db('test_cases').where({ project_id: projectId });

    if (filters.status) {
      query = query.where({ status: filters.status });
    }
    if (filters.artifactId) {
      query = query.where({ artifact_id: filters.artifactId });
    }

    const testCases = await query.orderBy('created_at', 'desc');
    return testCases.map(this.formatTestCase);
  }

  static async findById(id) {
    const testCase = await db('test_cases').where({ id }).first();
    return testCase ? this.formatTestCase(testCase) : null;
  }

  static async update(id, data) {
    const updates = { updated_at: new Date().toISOString() };

    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined && TEST_CASE_STATUSES.includes(data.status)) {
      updates.status = data.status;
    }
    if (data.artifactId !== undefined) updates.artifact_id = data.artifactId;
    if (data.createdBy !== undefined) updates.created_by = data.createdBy;

    const [testCase] = await db('test_cases')
      .where({ id })
      .update(updates)
      .returning('*');

    return testCase ? this.formatTestCase(testCase) : null;
  }

  static async addRun(testCaseId, data) {
    const now = new Date().toISOString();
    const id = randomUUID();

    if (!TEST_RUN_OUTCOMES.includes(data.outcome)) {
      throw new Error('Resultado de ejecución inválido');
    }

    const [run] = await db('test_runs')
      .insert({
        id,
        test_case_id: testCaseId,
        outcome: data.outcome,
        executed_by: data.executedBy,
        notes: data.notes,
        executed_at: data.executedAt || now,
        created_at: now,
      })
      .returning('*');

    const statusMap = {
      pass: 'passed',
      fail: 'failed',
      blocked: 'blocked',
    };

    await db('test_cases')
      .where({ id: testCaseId })
      .update({
        status: statusMap[data.outcome],
        updated_at: now,
      });

    return this.formatRun(run);
  }

  static async getRuns(testCaseId) {
    const runs = await db('test_runs')
      .where({ test_case_id: testCaseId })
      .orderBy('executed_at', 'desc');

    return runs.map(this.formatRun);
  }

  static formatTestCase(record) {
    if (!record) return null;
    return {
      id: record.id,
      projectId: record.project_id,
      artifactId: record.artifact_id,
      title: record.title,
      description: record.description,
      status: record.status,
      createdBy: record.created_by,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  static formatRun(record) {
    return {
      id: record.id,
      testCaseId: record.test_case_id,
      outcome: record.outcome,
      executedBy: record.executed_by,
      notes: record.notes,
      executedAt: record.executed_at,
      createdAt: record.created_at,
    };
  }
}

module.exports = {
  TestCase,
  TEST_CASE_STATUSES,
  TEST_RUN_OUTCOMES,
};
