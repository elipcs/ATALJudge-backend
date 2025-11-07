/**
 * Generic Interface para Use Cases
 * 
 * A Use Case represents a specific business action or operation,
 * orchestrating the business logic between repositories, services, and domain models.
 *
 * @template TInput - input/request type for the use case
 * @template TOutput - output/response type for the use case
 */
export interface IUseCase<TInput, TOutput> {
  /**
   * Executes the use case with the provided input
   * @param input - Input data for the use case
   * @returns Promise with the result of the execution
   */
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Interface para Use Cases sem input (void)
 *
 * @template TOutput - output/response type for the use case
 */
export interface IUseCaseVoid<TOutput> {
  /**
   * Executes the use case without input
   * @returns Promise with the result of the execution
   */
  execute(): Promise<TOutput>;
}
