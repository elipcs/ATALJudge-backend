/**
 * @module services/SubmissionQueueService
 * @description Service for managing submission processing queue using BullMQ and Redis.
 * 
 * This service handles:
 * - Queuing submissions for async processing
 * - Worker initialization and job processing
 * - Queue statistics and monitoring
 * - Job retry logic and error handling
 * 
 * @example
 * const queueService = container.resolve(SubmissionQueueService);
 * await queueService.addSubmissionToQueue(submissionId);
 * queueService.initializeWorker(submissionService);
 */

import { injectable } from 'tsyringe';
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../utils';
import { SubmissionService } from './SubmissionService';

/**
 * Job data structure for submission processing.
 */
export interface SubmissionJobData {
  submissionId: string;
}

/**
 * Service for managing submission processing queue.
 * 
 * @class SubmissionQueueService
 */
@injectable()
export class SubmissionQueueService {
  private queue: Queue<SubmissionJobData>;
  private worker: Worker<SubmissionJobData> | null = null;
  private connection: Redis;

  constructor() {
    this.connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue<SubmissionJobData>('submission-processing', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 86400,
        },
      },
    });

    logger.info('SubmissionQueueService initialized');
  }

  /**
   * Adds a submission to the processing queue.
   * 
   * @async
   * @param {string} submissionId - The submission ID to queue
   * @returns {Promise<Job<SubmissionJobData>>} The created job
   */
  async addSubmissionToQueue(submissionId: string): Promise<Job<SubmissionJobData>> {
    logger.info('Adding submission to queue', { submissionId });

    const job = await this.queue.add(
      'process-submission',
      { submissionId },
      {
        jobId: submissionId,
      }
    );

    logger.info('Submission added to queue successfully', {
      submissionId,
      jobId: job.id,
    });

    return job;
  }

  /**
   * Initializes the worker for processing queued submissions.
   * 
   * @param {SubmissionService} submissionService - The service to process submissions
   * @returns {void}
   */
  initializeWorker(submissionService: SubmissionService): void {
    if (this.worker) {
      logger.warn('Worker already initialized, ignoring');
      return;
    }

    logger.info('Initializing submission processing worker');

    this.worker = new Worker<SubmissionJobData>(
      'submission-processing',
      async (job: Job<SubmissionJobData>) => {
        const { submissionId } = job.data;

        logger.info('Worker processing submission', {
          submissionId,
          jobId: job.id,
          attempt: job.attemptsMade + 1,
        });

        try {
          await submissionService.processSubmission(submissionId);

          logger.info('Worker completed submission processing', {
            submissionId,
            jobId: job.id,
          });

          return { success: true, submissionId };
        } catch (error) {
          logger.error('Worker failed to process submission', {
            submissionId,
            jobId: job.id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });

          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );

    this.worker.on('completed', (job: Job<SubmissionJobData>) => {
      logger.info('Job completed successfully', {
        jobId: job.id,
        submissionId: job.data.submissionId,
      });
    });

    this.worker.on('failed', (job: Job<SubmissionJobData> | undefined, error: Error) => {
      logger.error('Job failed', {
        jobId: job?.id,
        submissionId: job?.data.submissionId,
        error: error.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    this.worker.on('active', (job: Job<SubmissionJobData>) => {
      logger.debug('Job started', {
        jobId: job.id,
        submissionId: job.data.submissionId,
      });
    });

    logger.info('Worker initialized successfully', {
      concurrency: this.worker.opts.concurrency,
    });
  }


  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }


  async getJobStatus(submissionId: string) {
    const job = await this.queue.getJob(submissionId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    return {
      id: job.id,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }


  async cleanOldJobs(gracePeriodMs: number = 86400000): Promise<void> {
    logger.info('Limpando jobs antigos', { gracePeriodMs });

    await this.queue.clean(gracePeriodMs, 100, 'completed');
    await this.queue.clean(gracePeriodMs, 100, 'failed');

    logger.info('Jobs antigos limpos');
  }


  async close(): Promise<void> {
    logger.info('Fechando SubmissionQueueService');

    if (this.worker) {
      await this.worker.close();
      logger.info('Worker fechado');
    }

    await this.queue.close();
    await this.connection.quit();

    logger.info('SubmissionQueueService fechado');
  }
}
