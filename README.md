# AtalJudge Backend - TypeScript

Sistema de juiz online para avaliação automática de código - Backend API em TypeScript.

## 📋 Sobre o Projeto

AtalJudge é uma plataforma completa para avaliação automática de código, permitindo que professores criem questões de programação e estudantes submetam suas soluções para avaliação automática.

Esta é a versão em **TypeScript** do backend, reescrita do zero com as melhores práticas e tecnologias modernas.

### Funcionalidades Principais

- ✅ **Autenticação e Autorização** (JWT)
- 👥 **Gerenciamento de Usuários** (Professores, Assistentes e Estudantes)
- 🏫 **Gestão de Turmas**
- 📝 **Criação e Gestão de Questões**
- 📚 **Listas de Exercícios**
- 💻 **Execução de Código** (Judge0)
- 🔍 **Submissões e Resultados**
- 🧪 **Casos de Teste Públicos e Privados**
- 🔗 **Integração com Codeforces**
- 📧 **Sistema de Convites**
- 🔐 **Recuperação de Senha**

## 🚀 Tecnologias

- **TypeScript** - Linguagem principal
- **Node.js** - Runtime
- **Express** - Framework web
- **PostgreSQL** - Banco de dados
- **TypeORM** - ORM
- **JWT** - Autenticação
- **class-validator** - Validação de dados
- **bcrypt** - Criptografia de senhas
- **Judge0** - Execução de código

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ ou superior
- npm ou yarn
- PostgreSQL 13 ou superior
- Judge0 (opcional, para execução de código)

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd backend-ts
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
NODE_ENV=development
PORT=5000

# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=ataljudge

# Segurança
SECRET_KEY=sua-chave-secreta-super-segura
JWT_SECRET=sua-chave-jwt-super-segura

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-de-app

# Judge0
JUDGE0_URL=http://localhost:2358

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 4. Execute as migrações

```bash
npm run migration:run
# ou
yarn migration:run
```

### 5. Execute o servidor

**Desenvolvimento:**

```bash
npm run dev
# ou
yarn dev
```

**Produção:**

```bash
npm run build
npm start
# ou
yarn build
yarn start
```

A API estará disponível em `http://localhost:5000`

## 📁 Estrutura do Projeto

```
backend-ts/
├── src/
│   ├── config/           # Configurações (database, environment)
│   ├── controllers/      # Controllers/Routes da API
│   ├── dtos/             # Data Transfer Objects (validação)
│   ├── enums/            # Enumerações
│   ├── middlewares/      # Middlewares (auth, validation, error)
│   ├── migrations/       # Migrações do banco
│   ├── models/           # Entidades TypeORM
│   ├── repositories/     # Repositórios de dados
│   ├── services/         # Lógica de negócio
│   ├── utils/            # Utilitários
│   ├── app.ts            # Configuração do Express
│   └── server.ts         # Inicialização do servidor
├── dist/                 # Build de produção
├── .env                  # Variáveis de ambiente
├── .env.example          # Exemplo de variáveis
├── tsconfig.json         # Configuração TypeScript
├── package.json          # Dependências
└── README.md             # Este arquivo
```

## 🔗 API Endpoints

### Autenticação

- `POST /api/auth/register` - Registro de usuário com convite
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário autenticado

### Usuários

- `GET /api/users/profile` - Perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil
- `POST /api/users/change-password` - Alterar senha
- `GET /api/users` - Listar usuários (professor)
- `GET /api/users/:id` - Buscar usuário (professor)

### Convites

- `POST /api/invites` - Criar convite (professor/assistente)
- `GET /api/invites` - Listar convites (professor/assistente)
- `GET /api/invites/validate/:token` - Validar convite
- `DELETE /api/invites/:id` - Revogar convite (professor/assistente)

### Questões

- `POST /api/questions` - Criar questão (professor/assistente)
- `GET /api/questions` - Listar questões
- `GET /api/questions/:id` - Buscar questão
- `PUT /api/questions/:id` - Atualizar questão (professor/assistente)
- `DELETE /api/questions/:id` - Deletar questão (professor/assistente)

## 🛠️ Desenvolvimento

### Comandos Úteis

```bash
# Desenvolvimento com hot-reload
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start

# Gerar migração
npm run migration:generate -- -n NomeDaMigracao

# Executar migrações
npm run migration:run

# Reverter migração
npm run migration:revert

# Executar testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Lint
npm run lint

# Lint com correção automática
npm run lint:fix
```

### Arquitetura

O projeto segue uma arquitetura em camadas:

1. **Controllers** - Recebem requisições HTTP, validam entrada e retornam respostas
2. **Services** - Contêm a lógica de negócio
3. **Repositories** - Gerenciam acesso aos dados
4. **Models** - Definem estrutura dos dados (TypeORM entities)
5. **DTOs** - Validam e transformam dados de entrada/saída

### Padrões de Código

- **TypeScript** com strict mode ativado
- **Decorators** para validação (class-validator)
- **Async/Await** para operações assíncronas
- **Try/Catch** para tratamento de erros
- **Interface Segregation** - interfaces pequenas e focadas
- **Dependency Injection** via construtores

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Autenticação via JWT
- Rate limiting para prevenir ataques
- Helmet para segurança de headers HTTP
- CORS configurado
- Validação de entrada com class-validator
- Blacklist de tokens revogados

## 📝 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

- Equipe AtalJudge

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📧 Contato

Para dúvidas e sugestões, abra uma issue no GitHub.

---

## 🎯 Diferenças da Versão Python

Esta versão TypeScript apresenta algumas melhorias em relação à versão Python:

### Vantagens do TypeScript

✅ **Tipagem estática** - Menos erros em tempo de execução
✅ **Autocompletar melhorado** - Melhor experiência de desenvolvimento
✅ **Refatoração mais segura** - Mudanças com confiança
✅ **Validação em tempo de compilação** - Erros detectados antes da execução
✅ **Performance** - Node.js é mais rápido para I/O

### Tecnologias Equivalentes

| Python | TypeScript |
|--------|-----------|
| Flask | Express |
| SQLAlchemy | TypeORM |
| Pydantic | class-validator |
| Alembic | TypeORM migrations |
| Flask-JWT-Extended | jsonwebtoken |

### Estrutura Similar

Ambas as versões mantêm a mesma arquitetura:
- Models/Entities
- Repositories
- Services
- Controllers
- DTOs
- Middlewares

Isso facilita a migração e manutenção de ambos os projetos.

---

**Última atualização:** Outubro 2025

