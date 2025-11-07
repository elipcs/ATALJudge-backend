# Política de Logging - ATALJudge Backend

## 📋 Visão Geral

Este documento define as diretrizes para uso de logging no backend do ATALJudge, garantindo logs úteis, seguros e com impacto mínimo no desempenho.

## 🎯 Níveis de Log

### ERROR
**Quando usar:**
- Erros críticos que impedem operações essenciais
- Falhas de integração com serviços externos (banco de dados, Judge0, email)
- Exceções não tratadas que chegam ao error middleware

**Onde usar:**
- ❌ **NÃO use em controllers** (error middleware já loga automaticamente)
- ✅ **USE em services** apenas para operações críticas
- ✅ **USE em integrações externas** (Judge0Service, EmailService)

**Exemplo:**
```typescript
// ❌ ERRADO - Controller
catch (error) {
  logger.error('Erro ao criar questão', { error });
  throw error;
}

// ✅ CORRETO - Service com contexto crítico
try {
  await this.judge0Client.post('/submissions');
} catch (error) {
  logger.error('[Judge0] Falha ao enviar submissão', {
    questionId,
    error: error.message
  });
  throw new ExternalServiceError('Judge0 indisponível');
}
```

### WARN
**Quando usar:**
- Situações anormais que não impedem a operação
- Validações que falharam mas têm fallback
- Recursos esgotados ou próximos do limite

**Exemplo:**
```typescript
if (!invite.token) {
  logger.warn('[INVITE] Token não fornecido', { userId: req.user?.sub });
  throw new ValidationError('Token é obrigatório');
}
```

### INFO
**Quando usar:**
- Operações de negócio bem-sucedidas importantes
- Mudanças de estado significativas
- Eventos de auditoria (login, logout, alteração de senha)

**Onde usar:**
- ✅ Services em operações de negócio críticas
- ✅ Authentication flows (login, registro, reset senha)
- ✅ Operações de admin (reset sistema, mudança de permissões)

**Exemplo:**
```typescript
logger.info('[AUTH] Login bem-sucedido', {
  userId: user.id,
  email: user.email,
  role: user.role
});

logger.info('[SUBMISSION] Código enviado para avaliação', {
  submissionId,
  questionId,
  userId,
  language
});
```

### DEBUG
**Quando usar:**
- **APENAS durante desenvolvimento/troubleshooting**
- Fluxo de dados complexos que precisam ser rastreados
- Debugging de bugs intermitentes

**Regras:**
- ⚠️ **REMOVER antes de commit** ou colocar atrás de feature flag
- ⚠️ **NUNCA em loops** ou operações de alta frequência
- ⚠️ **NUNCA com dados sensíveis completos**

**Exemplo:**
```typescript
// ❌ EVITAR - Muito verboso, executado milhares de vezes
testCases.forEach(tc => {
  logger.debug('[TEST] Processando caso de teste', { tc });
});

// ✅ OK - Debugging temporário com dados agregados
logger.debug('[SCORING] Calculando pontuação', {
  totalQuestions,
  answeredQuestions,
  scoringMode
});
```

## 🔒 Segurança e Privacidade

### ❌ NUNCA logar:
- Senhas (plaintext ou hash)
- Tokens completos (JWT, refresh tokens, reset tokens)
- Códigos de verificação
- Dados de cartão de crédito
- Informações médicas ou sensíveis

### ✅ Logs Seguros:
```typescript
// ❌ ERRADO
logger.info('Reset senha', { email, resetToken: token });

// ✅ CORRETO
logger.info('Reset senha solicitado', {
  email,
  tokenPreview: token.substring(0, 8) + '...'
});

// ❌ ERRADO
logger.debug('Request', { body: req.body });

// ✅ CORRETO
logger.debug('Request', {
  bodyKeys: Object.keys(req.body),
  contentType: req.headers['content-type']
});
```

## 📊 Estrutura de Logs

### Formato Padrão
```typescript
logger.level('[CONTEXTO] Mensagem descritiva', {
  // IDs relevantes
  userId,
  questionId,
  submissionId,
  
  // Dados de contexto (não sensíveis)
  action: 'create' | 'update' | 'delete',
  
  // Resultado (quando aplicável)
  success: true,
  duration: 150 // ms
});
```

### Contextos Padrão
- `[AUTH]` - Autenticação e autorização
- `[SUBMISSION]` - Submissões e avaliações
- `[QUESTION]` - Questões e listas
- `[CLASS]` - Turmas e alunos
- `[INVITE]` - Convites
- `[JUDGE0]` - Integração Judge0
- `[EMAIL]` - Envio de emails
- `[DB]` - Operações de banco de dados

## 🎯 Diretrizes por Camada

### Controllers
```typescript
// ❌ NÃO logar em controllers (error middleware já faz)
router.post('/', asyncHandler(async (req, res) => {
  const result = await service.create(req.body);
  successResponse(res, result);
  // Sem logs!
}));

// ✅ EXCEÇÃO: Logs INFO para auditoria em rotas críticas
router.post('/system-reset', asyncHandler(async (req, res) => {
  logger.info('[ADMIN] Reset sistema iniciado', {
    userId: req.user.sub,
    options: req.body
  });
  // ...
}));
```

### Services
```typescript
class QuestionService {
  async createQuestion(data: CreateQuestionDTO, userId: string) {
    // ✅ INFO para operações de negócio importantes
    logger.info('[QUESTION] Criando questão', {
      title: data.title,
      type: data.type,
      createdBy: userId
    });
    
    const question = await this.repository.save(data);
    
    // ❌ NÃO logar sucesso óbvio (redundante)
    // logger.info('[QUESTION] Questão criada com sucesso');
    
    return question;
  }
  
  async complexOperation(id: string) {
    // ✅ DEBUG temporário para troubleshooting
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('[QUESTION] Estado antes da operação', { id, state });
    }
    
    // ...
  }
}
```

### Repositories
```typescript
// ❌ NÃO logar em repositories (camada muito baixa)
class QuestionRepository {
  async findById(id: string) {
    // Sem logs!
    return this.repository.findOne({ where: { id } });
  }
}
```

## 🚫 Anti-Patterns

### 1. Logging Excessivo em Loops
```typescript
// ❌ ERRADO - Log por iteração
testCases.forEach(tc => {
  logger.debug('Processando', { tc });
  // ...
});

// ✅ CORRETO - Log agregado
logger.info('[TEST] Processando casos de teste', {
  total: testCases.length
});
testCases.forEach(tc => { /* ... */ });
logger.info('[TEST] Processamento completo', {
  total: testCases.length,
  success: results.filter(r => r.success).length
});
```

### 2. Logging Redundante
```typescript
// ❌ ERRADO - 3 logs para mesma operação
logger.debug('Iniciando criação');
const result = await service.create();
logger.info('Criado com sucesso', { result });
logger.debug('Operação finalizada');

// ✅ CORRETO - 1 log significativo
const result = await service.create();
logger.info('[SERVICE] Recurso criado', { id: result.id });
```

### 3. Logging em Catch sem Contexto
```typescript
// ❌ ERRADO
catch (error) {
  logger.error('Erro', { error });
  throw error;
}

// ✅ CORRETO
catch (error) {
  logger.error('[QUESTION] Falha ao criar questão', {
    questionData: sanitize(data),
    userId,
    error: error.message
  });
  throw new ApplicationError('Não foi possível criar questão');
}
```

## 📈 Performance

### Impacto de Logs
- `logger.debug()`: ~0.1ms por call
- `logger.info()`: ~0.2ms por call
- `logger.error()`: ~0.3ms por call + stack trace

### Recomendações
1. **Evite logs em hot paths** (loops, operações de alta frequência)
2. **Use níveis apropriados** (DEBUG só em dev)
3. **Sanitize dados grandes** antes de logar
4. **Considere sampling** para operações muito frequentes

```typescript
// ✅ Sampling para operações frequentes
if (Math.random() < 0.01) { // 1% das chamadas
  logger.debug('[METRICS] Status', { stats });
}
```

## 🔍 Logs para Troubleshooting

### Quando investigar bugs:
1. **Adicione logs DEBUG temporários** com `[DEBUG]` no prefixo
2. **Documente o motivo** no código
3. **Remova após resolver** ou coloque atrás de feature flag

```typescript
// TODO: Remover após investigar issue #123
logger.debug('[DEBUG] Estado inesperado em scoring', {
  scoringMode,
  calculatedScore,
  expectedScore,
  issueUrl: 'https://github.com/org/repo/issues/123'
});
```

## ✅ Checklist de Review

Antes de commit, verifique:

- [ ] Nenhum log de senha, token ou dado sensível
- [ ] Nenhum `logger.error()` em controllers (usar asyncHandler)
- [ ] Nenhum log em loop sem agregação
- [ ] Logs DEBUG removidos ou atrás de feature flag
- [ ] Contexto `[TAG]` consistente em todos os logs
- [ ] Mensagens descritivas (não genéricas como "Erro")
- [ ] Dados logados são relevantes para debugging

## 📚 Exemplos Completos

### Exemplo 1: Authentication Flow
```typescript
// ✅ BOM
async loginWithEmail(email: string, password: string, ip: string) {
  logger.info('[AUTH] Tentativa de login', { email, ip });
  
  const user = await this.userRepository.findByEmail(email);
  if (!user) {
    logger.warn('[AUTH] Login falhou - usuário não encontrado', { email });
    throw new UnauthorizedError('Credenciais inválidas');
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    logger.warn('[AUTH] Login falhou - senha incorreta', {
      email,
      userId: user.id
    });
    throw new UnauthorizedError('Credenciais inválidas');
  }
  
  logger.info('[AUTH] Login bem-sucedido', {
    userId: user.id,
    email: user.email,
    role: user.role,
    ip
  });
  
  return this.generateTokens(user);
}
```

### Exemplo 2: Submission Processing
```typescript
// ✅ BOM
async submitCode(data: SubmitCodeDTO) {
  logger.info('[SUBMISSION] Código recebido', {
    questionId: data.questionId,
    userId: data.userId,
    language: data.language,
    codeSize: data.code.length
  });
  
  const submission = await this.createSubmission(data);
  
  try {
    const judge0Response = await this.judge0Service.submit(submission);
    logger.info('[SUBMISSION] Enviado ao Judge0', {
      submissionId: submission.id,
      judge0Token: judge0Response.token
    });
  } catch (error) {
    logger.error('[SUBMISSION] Falha ao enviar ao Judge0', {
      submissionId: submission.id,
      error: error.message
    });
    throw new ExternalServiceError('Avaliador temporariamente indisponível');
  }
  
  return submission;
}
```

## 🔄 Migração de Código Existente

Para limpar logs excessivos:

1. **Buscar logs DEBUG**: `grep -r "logger.debug" src/`
2. **Avaliar necessidade**: Remover se não for critical debugging
3. **Buscar logs em controllers**: Remover `logger.error` em catch blocks
4. **Consolidar logs repetitivos**: 3+ logs da mesma operação → 1 log significativo

---

**Data de criação:** 06/11/2025  
**Versão:** 1.0  
**Última atualização:** 06/11/2025
