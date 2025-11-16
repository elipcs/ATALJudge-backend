import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { SubmissionResult } from '../models/SubmissionResult';

@injectable()
export class SubmissionResultRepository extends BaseRepository<SubmissionResult> {
  constructor() {
    super(SubmissionResult);
  }

  async findBySubmission(submissionId: string): Promise<SubmissionResult[]> {
    return this.repository.find({
      where: { submissionId },
      relations: ['testCase'],
      order: { createdAt: 'ASC' }
    });
  }


  async countPassedBySubmission(submissionId: string): Promise<number> {
    return this.repository.count({
      where: { submissionId, passed: true }
    });
  }

  async countFailedBySubmission(submissionId: string): Promise<number> {
    return this.repository.count({
      where: { submissionId, passed: false }
    });
  }

  async findBySubmissionAndTestCase(
    submissionId: string,
    testCaseId: string
  ): Promise<SubmissionResult | null> {
    return this.repository.findOne({
      where: { submissionId, testCaseId },
      relations: ['testCase']
    });
  }

  async deleteBySubmission(submissionId: string): Promise<number> {
    const result = await this.repository.delete({ submissionId });
    return result.affected || 0;
  }

  async createMany(results: Partial<SubmissionResult>[]): Promise<SubmissionResult[]> {
    const entities = this.repository.create(results);
    return this.repository.save(entities);
  }

  async getSubmissionStatistics(submissionId: string): Promise<{
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageExecutionTimeMs?: number;
    maxMemoryUsedKb?: number;
  }> {
    const results = await this.findBySubmission(submissionId);

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    const executionTimes = results
      .filter(r => r.executionTimeMs !== null && r.executionTimeMs !== undefined)
      .map(r => r.executionTimeMs!);
    
    const memoryUsages = results
      .filter(r => r.memoryUsedKb !== null && r.memoryUsedKb !== undefined)
      .map(r => r.memoryUsedKb!);

    const averageExecutionTimeMs = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : undefined;

    const maxMemoryUsedKb = memoryUsages.length > 0
      ? Math.max(...memoryUsages)
      : undefined;

    return {
      totalTests,
      passedTests,
      failedTests,
      averageExecutionTimeMs,
      maxMemoryUsedKb
    };
  }
}

