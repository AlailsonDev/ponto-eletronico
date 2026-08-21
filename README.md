# Sistema de Ponto Eletrônico — CGM Jaboatão dos Guararapes

## Progresso até aqui

- **Etapa 1** — Setup do projeto, configuração do Firebase (client + admin), tipos do domínio.
- **Etapa 2** — Autenticação (login, logout, recuperação de senha, contexto de sessão, redirecionamento por perfil).
- **Etapa 3** — Modelo Firestore inicial + Security Rules (`usuarios`, `setores`, `jornadas`).
- **Etapa 4** — Dashboard do funcionário + registro de ponto (ENTRADA → SAÍDA_ALMOÇO → RETORNO_ALMOÇO → SAÍDA), com cálculo de horas trabalhadas/atraso/hora extra e Security Rules da coleção `registros_ponto`.
- **Etapa 5** — Histórico do funcionário: tabela com Data/Entrada/Almoço/Retorno/Saída/Total, filtro por mês (navegação anterior/próximo), badges de status (incompleto, atraso, hora extra). Busca por período é feita sob demanda (sem listener em tempo real), reaproveitando o mesmo índice composto do dashboard.
- **Etapa 6** — Cadastro de funcionários pelo admin: API Route (`/api/usuarios`) protegida por verificação de token + perfil admin, usando o Firebase Admin SDK para criar o usuário no Authentication e o documento em `usuarios/{uid}` atomicamente (desfaz o Auth se o Firestore falhar). Tela em `/admin/funcionarios` com formulário + lista dos já cadastrados.
- **Etapa 7** — Dashboard administrativo: contadores em tempo real (trabalhando, em almoço, ausentes, atrasados), gráfico de distribuição (recharts) e lista de funcionários com status individual, tudo a partir de um único listener do Firestore (`registros_ponto` do dia, sem filtro de usuário).
- **Gerenciamento de setores e jornadas** — `/admin/setores` (criar, renomear, ativar/desativar) e `/admin/jornadas` (criar/editar os 4 horários + tolerância + carga horária, com validação de ordem cronológica). Escrita direta do client, sem API Route — diferente do cadastro de funcionário, essas coleções não tocam o Firebase Auth, então a Security Rule (`souAdmin()`) já protege sozinha.

**O MVP original (seções 29 da especificação) está completo, e o sistema já não depende mais do Firebase Console para operação do dia a dia.**

## Como rodar localmente

```bash
npm install
cp .env.local.example .env.local
# preencha .env.local com as credenciais do seu projeto Firebase
npm run dev
```

Abra `http://localhost:3000/login`.

## Como testar o que já existe

1. **Crie um projeto no Firebase Console** (se ainda não tiver) e ative Authentication (E-mail/senha) e Cloud Firestore.
2. **Publique as regras**: copie o conteúdo de `firebase/firestore.rules` para Firestore > Regras, no console. Publique também `firebase/firestore.indexes.json` (ou deixe o Firestore sugerir o índice automaticamente na primeira consulta — ele mostra um link pronto no console quando falta).
3. **Crie manualmente, por enquanto**, os documentos de teste (o cadastro de funcionários pela interface é a próxima etapa):
   - Um usuário no Authentication (e-mail/senha).
   - Um documento em `jornadas/{id}` com os campos do tipo `Jornada` (ex: `entrada: "08:00"`, `saidaAlmoco: "12:00"`, `retornoAlmoco: "13:00"`, `saida: "17:00"`, `toleranciaMinutos: 10`, `cargaHorariaDiariaMinutos: 480`).
   - Um documento em `setores/{id}` com `nome`, `gestoresIds: []`, `ativo: true`.
   - Um documento em `usuarios/{uid}` — **o ID do documento precisa ser exatamente o UID gerado no Authentication** — com `nome`, `matricula`, `email`, `cargo`, `setorId` (o ID do setor criado acima), `perfil: "funcionario"`, `jornadaId` (o ID da jornada acima), `status: "ativo"`, `dataAdmissao`, `criadoEm`, `atualizadoEm`.
4. Faça login com esse usuário e teste o fluxo de registro de ponto na ordem correta.
5. Tente, pelo console do navegador, chamar `setDoc` diretamente em `registros_ponto` fora de ordem ou para outro `usuarioId` — deve ser bloqueado pela regra (erro `permission-denied`), confirmando que a proteção não depende só da UI.

## Próxima etapa prevista

As funcionalidades pós-MVP (seção 29 da especificação, "depois construiremos") ainda não implementadas são, na ordem que fazem mais sentido tecnicamente:

1. **Correção de ponto** (solicitação + aprovação) — depende de uma segunda API Route com Admin SDK, no mesmo padrão da de cadastro. Recomendado como próximo passo: é citado como prioridade na especificação original, e o restante do sistema já está pronto para suportá-lo.
2. **Auditoria** — coleção `auditoria`, alimentada pelas ações administrativas (cadastro, correção, desativação).
3. **Relatórios + exportação (Excel/CSV/PDF)**.
4. **Geolocalização, QR Code, PWA, banco de horas, feriados, notificações**.

## Limitações conhecidas nesta etapa (por design, não bugs)

- Captura de IP do dispositivo ainda não implementada (requer API Route lendo o cabeçalho da requisição no servidor).
- Geolocalização preparada no tipo `RegistroPonto` mas não coletada/validada ainda.
- Cadastro de funcionários (Etapa 6) ainda não existe — os usuários de teste precisam ser criados manualmente no console do Firebase, como descrito acima.
