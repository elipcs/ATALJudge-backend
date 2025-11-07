/**
 * @module __tests__/examples/template
 * @description Template and examples for writing tests
 * 
 * Este arquivo serve como referência para como escrever testes.
 * Use este padrão quando criar novos testes.
 */

describe('Template Examples - Test Writing Guide', () => {
  it('should demonstrate basic test structure with AAA pattern', () => {
    // Arrange: Setup
    const data = { id: 1, name: 'Test' };

    // Act: Execute
    const result = data;

    // Assert: Verify
    expect(result.id).toBe(1);
    expect(result.name).toBe('Test');
  });

  it('should show how to test async functions', async () => {
    // Arrange
    const asyncFunction = jest.fn().mockResolvedValue({ success: true });

    // Act
    const result = await asyncFunction();

    // Assert
    expect(result.success).toBe(true);
    expect(asyncFunction).toHaveBeenCalledTimes(1);
  });

  it('should demonstrate error testing', () => {
    // Arrange
    const throwFunction = () => {
      throw new Error('Test error');
    };

    // Act & Assert
    expect(throwFunction).toThrow('Test error');
  });

  it('should show mock repository pattern', () => {
    // Arrange: Create mock
    const mockRepository = {
      findById: jest.fn().mockResolvedValue({ id: 1, name: 'User' }),
      save: jest.fn().mockResolvedValue({ id: 1, name: 'User', updated: true }),
      delete: jest.fn().mockResolvedValue(true),
    };

    // Act
    mockRepository.findById(1);
    mockRepository.save({ id: 1, name: 'User', updated: true });

    // Assert
    expect(mockRepository.findById).toHaveBeenCalledWith(1);
    expect(mockRepository.save).toHaveBeenCalled();
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});

describe('Template Examples - Service Testing', () => {
  it('should test a service with dependencies', () => {
    // Arrange: Create mocks for dependencies
    const mockUserRepository = {
      findById: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
      save: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
    };

    const mockGradeRepository = {
      findByStudentId: jest.fn().mockResolvedValue([
        { id: 1, score: 90 },
        { id: 2, score: 85 },
      ]),
    };

    // Mock service with injected repositories
    const userService = {
      getUserWithGrades: async (userId: number) => {
        const user = await mockUserRepository.findById(userId);
        const grades = await mockGradeRepository.findByStudentId(userId);
        return { ...user, grades };
      },
    };

    // Act & Assert
    expect(userService.getUserWithGrades).toBeDefined();
    expect(mockUserRepository.findById).toBeDefined();
  });

  it('should verify mock was called with correct parameters', () => {
    // Arrange
    const mockRepository = {
      save: jest.fn(),
    };

    const data = { id: 1, name: 'Test' };

    // Act
    mockRepository.save(data);

    // Assert
    expect(mockRepository.save).toHaveBeenCalledWith(data);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});

describe('Template Examples - Controller Testing', () => {
  it('should test controller with mocked use case', () => {
    // Arrange: Create mock use case
    const mockGetUserUseCase = {
      execute: jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      }),
    };

    // Mock Express objects
    const mockRequest = {
      params: { id: '1' },
      user: { id: 1, role: 'PROFESSOR' },
    };

    const mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Act & Assert
    expect(mockGetUserUseCase.execute).toBeDefined();
    expect(mockRequest.params.id).toBe('1');
    expect(mockResponse.status).toBeDefined();
  });
});

describe('Template Examples - Error Handling', () => {
  it('should handle not found errors', async () => {
    // Arrange
    class NotFoundError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
      }
    }

    const mockRepository = {
      findById: jest.fn().mockRejectedValue(new NotFoundError('User not found')),
    };

    // Act & Assert
    await expect(mockRepository.findById(999)).rejects.toThrow('User not found');
  });

  it('should handle validation errors', () => {
    // Arrange
    class ValidationError extends Error {
      constructor(public field: string) {
        super(`Invalid ${field}`);
        this.name = 'ValidationError';
      }
    }

    // Act & Assert
    expect(() => {
      throw new ValidationError('email');
    }).toThrow('Invalid email');
  });
});

describe('Template Examples - BeforeEach/AfterEach', () => {
  let mockRepository: any;

  beforeEach(() => {
    // Setup before each test
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  it('should have fresh mock in each test', () => {
    mockRepository.save({ id: 1 });
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should have independent mock state', () => {
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});

/*
// ====================
// CHECKLIST PRÉ-COMMIT
// ====================

Antes de fazer commit com novos testes, verifique:

☐ Todos os testes passam: npm test
☐ Cobertura adequada: npm run test:coverage
☐ Sem warnings do TypeScript
☐ Sem console.log deixados
☐ Mocks limpos com jest.clearAllMocks()
☐ Nomes descritivos para os testes
☐ Padrão AAA (Arrange, Act, Assert) seguido
☐ Testes independentes (não dependem um do outro)
☐ Testes determinísticos (sempre mesmo resultado)
☐ Documentação clara do que está sendo testado

// ====================
// DICAS E BOAS PRÁTICAS
// ====================

1. Use nomes descritivos para os testes:
   ✓ should create user with valid email
   ✗ test user creation

2. Siga o padrão AAA (Arrange, Act, Assert):
   // Arrange: Setup dados necessários
   // Act: Executar a ação
   // Assert: Verificar resultado

3. Use beforeEach/afterEach para setup/cleanup:
   beforeEach(() => {
     // Setup comum para todos os testes
   });

4. Mock apenas o necessário:
   - Mock dependências externas
   - Não mock o código sendo testado

5. Use mockResolvedValue para promessas:
   mock.mockResolvedValue({ data: 'result' });

6. Use mockRejectedValue para erros:
   mock.mockRejectedValue(new Error('Error'));

7. Teste casos de sucesso E erro:
   - Teste o caminho feliz
   - Teste casos de erro
   - Teste casos extremos

8. Mantenha testes focados:
   - Um comportamento por teste
   - Evite múltiplas asserções não relacionadas

9. Use describe para agrupar testes:
   describe('UserService', () => {
     describe('getUserById', () => {
       it('should retrieve user', () => {});
     });
   });

10. Limpe mocks entre testes:
    afterEach(() => {
      jest.clearAllMocks();
    });
*/
