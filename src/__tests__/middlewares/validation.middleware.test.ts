/**
 * @module __tests__/middlewares
 * @description Validation Middleware Unit Tests
 */

class ValidationMiddlewareDemo {
  validateEmail(value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  validatePassword(password: string) {
    if (!password || password.length < 8) return false;
    return /[A-Z]/.test(password) && /[0-9]/.test(password);
  }

  validate(schema: any) {
    return (req: any, res: any, next: any) => {
      const errors: any = {};

      for (const [key, rule] of Object.entries(schema)) {
        const value = req.body[key];
        if (rule === 'required' && !value) {
          errors[key] = `${key} is required`;
        }
        if (key === 'email' && value && !this.validateEmail(value)) {
          errors[key] = 'Invalid email';
        }
        if (key === 'password' && value && !this.validatePassword(value)) {
          errors[key] = 'Password too weak';
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      next();
    };
  }
}

describe('ValidationMiddleware', () => {
  let middleware: ValidationMiddlewareDemo;

  beforeEach(() => {
    middleware = new ValidationMiddlewareDemo();
    jest.clearAllMocks();
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(middleware.validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(middleware.validateEmail('invalid-email')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(middleware.validateEmail('test@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      expect(middleware.validatePassword('Password123')).toBe(true);
    });

    it('should reject weak password', () => {
      expect(middleware.validatePassword('weak')).toBe(false);
    });

    it('should reject password without uppercase', () => {
      expect(middleware.validatePassword('password123')).toBe(false);
    });

    it('should reject password without numbers', () => {
      expect(middleware.validatePassword('Password')).toBe(false);
    });
  });

  describe('validate middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = { body: {} };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    it('should validate required fields', () => {
      const schema = { email: 'required', password: 'required' };
      const validator = middleware.validate(schema);

      validator(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should pass valid data', () => {
      mockReq.body = { email: 'test@example.com', password: 'Password123' };
      const schema = { email: 'email', password: 'password' };
      const validator = middleware.validate(schema);

      validator(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid email', () => {
      mockReq.body = { email: 'invalid', password: 'Password123' };
      const schema = { email: 'email', password: 'password' };
      const validator = middleware.validate(schema);

      validator(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
