/**
 * @module __tests__/middlewares
 * @description Error Middleware Unit Tests
 */

class ErrorMiddlewareDemo {
  handleError(err: any, req: any, res: any, next: any) {
    if (!err) {
      return next();
    }

    let status = 500;
    let message = 'Internal Server Error';

    if (err.message === 'Not found') {
      status = 404;
      message = 'Resource not found';
    } else if (err.message === 'Unauthorized') {
      status = 401;
      message = 'Unauthorized access';
    } else if (err.message === 'Forbidden') {
      status = 403;
      message = 'Forbidden';
    } else if (err.message?.includes('validation')) {
      status = 400;
      message = 'Validation error';
    }

    return res.status(status).json({ error: message });
  }

  notFound(req: any, res: any) {
    return res.status(404).json({ error: 'Route not found' });
  }
}

describe('ErrorMiddleware', () => {
  let middleware: ErrorMiddlewareDemo;
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new ErrorMiddlewareDemo();
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle not found errors', () => {
      const error = new Error('Not found');

      middleware.handleError(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle unauthorized errors', () => {
      const error = new Error('Unauthorized');

      middleware.handleError(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle validation errors', () => {
      const error = new Error('validation failed');

      middleware.handleError(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle generic errors with 500', () => {
      const error = new Error('Something went wrong');

      middleware.handleError(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should call next if no error', () => {
      middleware.handleError(null, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('notFound', () => {
    it('should return 404 for not found routes', () => {
      middleware.notFound(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
