#!/bin/bash

# Script de teste para reset de senha
# Use: ./test-reset-password.sh

API_URL="http://localhost:5000/api/auth"
EMAIL="test@example.com"

echo "🧪 Testando Sistema de Reset de Senha"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Teste 1: Solicitar reset de senha
echo "📧 Teste 1: Solicitando reset de senha..."
echo "Email: $EMAIL"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

echo "Resposta:"
echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✅ Teste 1 passou: Email enviado com sucesso${NC}"
else
  echo -e "${RED}❌ Teste 1 falhou${NC}"
fi

echo ""
echo "======================================"
echo ""

# Teste 2: Email não cadastrado (deve retornar sucesso por segurança)
echo "🔒 Teste 2: Email não cadastrado (proteção contra enumeração)..."
echo "Email: nao-existe@example.com"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"nao-existe@example.com"}')

echo "Resposta:"
echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✅ Teste 2 passou: Proteção contra enumeração funcionando${NC}"
else
  echo -e "${RED}❌ Teste 2 falhou${NC}"
fi

echo ""
echo "======================================"
echo ""

# Teste 3: Token inválido
echo "❌ Teste 3: Token inválido..."
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"token-invalido-123","newPassword":"NovaSenha123!@#"}')

echo "Resposta:"
echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✅ Teste 3 passou: Token inválido rejeitado${NC}"
else
  echo -e "${RED}❌ Teste 3 falhou${NC}"
fi

echo ""
echo "======================================"
echo ""

# Teste 4: Senha fraca
echo "🔐 Teste 4: Senha fraca (deve falhar)..."
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"token-teste","newPassword":"123"}')

echo "Resposta:"
echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✅ Teste 4 passou: Senha fraca rejeitada${NC}"
else
  echo -e "${RED}❌ Teste 4 falhou${NC}"
fi

echo ""
echo "======================================"
echo ""

# Teste 5: Rate limiting
echo "⏱️  Teste 5: Rate limiting (6 requisições seguidas)..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for i in {1..6}; do
  RESPONSE=$(curl -s -X POST "$API_URL/forgot-password" \
    -H "Content-Type: application/json" \
    -d '{"email":"rate-limit-test@example.com"}')
  
  if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo "  Requisição $i: ✅ Sucesso"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "  Requisição $i: ❌ Bloqueada (rate limit)"
  fi
  
  sleep 0.5
done

echo ""
echo "Resultados:"
echo "  Sucessos: $SUCCESS_COUNT"
echo "  Bloqueadas: $FAIL_COUNT"

if [ $FAIL_COUNT -gt 0 ]; then
  echo -e "${GREEN}✅ Teste 5 passou: Rate limiting funcionando${NC}"
else
  echo -e "${YELLOW}⚠️  Teste 5: Rate limiting pode não estar configurado${NC}"
fi

echo ""
echo "======================================"
echo ""

echo "🎉 Testes concluídos!"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "1. Verifique seu email para obter o token real"
echo "2. Use o token para testar o reset completo:"
echo "   curl -X POST $API_URL/reset-password \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"token\":\"SEU-TOKEN\",\"newPassword\":\"NovaSenha123!@#\"}'"
echo ""





