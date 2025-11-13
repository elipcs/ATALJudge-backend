/**
 * @module controllers/CodeForcesController
 * @description Controller for Codeforces API integration endpoints.
 * Handles problem submission and status checking for Codeforces problems.
 */

import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { CodeForcesService } from '../services';
import { SubmitCodeForcesProblemDTO } from '../dtos';
import { asyncHandler, logger } from '../utils';
import { validateBody } from '../middlewares';

const router = Router();

const codeForcesService = container.resolve(CodeForcesService);

/**
 * Submit a Codeforces problem
 * POST /codeforces/submit
 * 
 * Submits code to a specific Codeforces problem and initiates execution.
 * 
 * @body {SubmitCodeForcesProblemDTO} Problem submission details
 * @returns {CodeForcesSubmissionResponseDTO} Submission response with submission ID
 */
router.post(
  '/submit',
  validateBody(SubmitCodeForcesProblemDTO),
  asyncHandler(async (req: Request, res: Response) => {
    const { contestId, problemId, sourceCode, language, stdin, expectedOutput, timeLimitSeconds, memoryLimitMB } = req.body;

    logger.info('[CodeForcesController] Submitting problem', {
      contestId,
      problemId,
      language,
      codeLength: sourceCode.length
    });

    try {
      const response = await codeForcesService.submitProblem({
        problemId,
        sourceCode,
        language,
        contestId,
        stdin,
        expectedOutput,
        timeLimitSeconds,
        memoryLimitMB
      });

      logger.info('[CodeForcesController] Problem submitted successfully', {
        submissionId: response.submissionId,
        problemId
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('[CodeForcesController] Error submitting problem', {
        problemId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  })
);

/**
 * Get submission status
 * GET /codeforces/status/:submissionId
 * 
 * Retrieves the current status and verdict of a submitted problem.
 * 
 * @param {string} submissionId Submission ID
 * @returns {CodeForcesSubmissionResponseDTO} Current submission status
 */
router.get(
  '/status/:submissionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { submissionId } = req.params;

    logger.info('[CodeForcesController] Getting submission status', {
      submissionId
    });

    try {
      const response = await codeForcesService.getSubmissionStatus(submissionId);

      logger.debug('[CodeForcesController] Submission status retrieved', {
        submissionId,
        verdict: response.verdict
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('[CodeForcesController] Error getting submission status', {
        submissionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  })
);

/**
 * Wait for submission completion
 * GET /codeforces/wait/:submissionId
 * 
 * Polls for submission completion and returns final verdict.
 * 
 * @param {string} submissionId Submission ID
 * @query {number} maxAttempts Maximum polling attempts (default: 60)
 * @query {number} intervalMs Polling interval in milliseconds (default: 1000)
 * @returns {CodeForcesSubmissionResponseDTO} Final submission status
 */
router.get(
  '/wait/:submissionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const maxAttempts = parseInt(req.query.maxAttempts as string) || 60;
    const intervalMs = parseInt(req.query.intervalMs as string) || 1000;

    logger.info('[CodeForcesController] Waiting for submission completion', {
      submissionId,
      maxAttempts,
      intervalMs
    });

    try {
      const response = await codeForcesService.waitForSubmission(
        submissionId,
        maxAttempts,
        intervalMs
      );

      logger.info('[CodeForcesController] Submission completed', {
        submissionId,
        verdict: response.verdict
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('[CodeForcesController] Error waiting for submission', {
        submissionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  })
);

/**
 * Get problem details
 * GET /codeforces/problem/:contestId/:problemId
 * 
 * Retrieves problem statement, time limit, memory limit, and sample test cases.
 * 
 * @param {string} contestId Contest ID
 * @param {string} problemId Problem ID
 * @returns {Object} Problem details
 */
router.get(
  '/problem/:contestId/:problemId',
  asyncHandler(async (req: Request, res: Response) => {
    const { contestId, problemId } = req.params;

    logger.info('[CodeForcesController] Fetching problem details', {
      contestId,
      problemId
    });

    try {
      const problem = await codeForcesService.getProblem(contestId, problemId);

      logger.info('[CodeForcesController] Problem details retrieved', {
        contestId,
        problemId,
        title: problem.title
      });

      res.status(200).json(problem);
    } catch (error) {
      logger.error('[CodeForcesController] Error fetching problem', {
        contestId,
        problemId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  })
);

/**
 * Submit batch of problems
 * POST /codeforces/batch-submit
 * 
 * Submits multiple problems in batch.
 * 
 * @body {Object} Array of problem submissions
 * @returns {Object} Array of submission IDs
 */
router.post(
  '/batch-submit',
  asyncHandler(async (req: Request, res: Response) => {
    const submissions = req.body;

    if (!Array.isArray(submissions)) {
      logger.warn('[CodeForcesController] Invalid batch submission format');
      res.status(400).json({ error: 'Expected an array of submissions' });
      return;
    }

    logger.info('[CodeForcesController] Submitting batch of problems', {
      batchSize: submissions.length
    });

    try {
      const submissionIds = await codeForcesService.submitBatch(submissions);

      logger.info('[CodeForcesController] Batch submitted successfully', {
        batchSize: submissionIds.length
      });

      res.status(200).json({ submissionIds });
    } catch (error) {
      logger.error('[CodeForcesController] Error submitting batch', {
        batchSize: submissions.length,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  })
);

export default router;
