Guia para Criação de uma Nova Rede Familiar

Este guia destina-se a usuários com conhecimento técnico que desejam "bifurcar" (fork﻿) este projeto para criar e gerenciar sua própria rede familiar em uma nuvem separada.

O aplicativo foi projetado para ser flexível. A comunicação com a nuvem está isolada em poucas funções específicas, facilitando a migração para um novo backend﻿.

Pré-requisitos
Uma conta no Supabase.

Conhecimento básico de JavaScript.

Capacidade de criar e configurar um novo projeto no Supabase.

Passo a Passo
1. Preparar o Ambiente na Nuvem
A maneira mais simples de criar sua própria rede é usando um novo projeto no Supabase.

Crie um Novo Projeto no Supabase: Acesse sua conta e crie um novo projeto (ex: minha-familia-arvore).

Crie a Tabela app_genealogia: Dentro do seu novo projeto, vá para o SQL Editor﻿ e execute o script﻿ SQL abaixo para criar uma tabela idêntica à original, já com todos os campos necessários.

sql
CREATE TABLE public.app_genealogia (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  nome TEXT,
  sexo TEXT,
  nascimento TEXT,
  falecimento TEXT,
  profissao TEXT,
  cidade_pais_principal TEXT,
  pais JSONB,
  filhos JSONB,
  conjuge JSONB,
  user_id TEXT,
  versão NUMERIC
);
Ative o Trigger﻿ de Atualização: Para que a coluna updated_at funcione corretamente, execute também o seguinte comando no SQL Editor﻿:

sql
CREATE EXTENSION IF NOT EXISTS moddatetime;
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.app_genealogia
FOR EACH ROW
EXECUTE PROCEDURE moddatetime(updated_at);
2. Configurar o Aplicativo Localmente
O próximo passo é fazer o seu aplicativo apontar para a sua nova nuvem.

Obtenha as Credenciais do Novo Projeto: No seu projeto Supabase, vá para Project Settings﻿ > API. Você precisará de duas informações: a Project URL﻿ e a chave anon public﻿.

Altere o Arquivo arvore_script.js: Abra o arquivo arvore_script.js em um editor de texto. No topo do arquivo, você encontrará estas duas linhas. Substitua os valores pelos do seu novo projeto:

javascript
// Substitua pelos dados do SEU projeto Supabase
const SUPABASE_URL = 'URL_DO_SEU_PROJETO_AQUI';
const SUPABASE_KEY = 'CHAVE_ANON_PUBLIC_AQUI';

3. Conclusão
É isso! Ao salvar o arquivo arvore_script.js com as novas credenciais, seu aplicativo estará completamente desconectado da base de dados original e passará a salvar e carregar os dados do seu novo projeto privado no Supabase.

A partir deste ponto, você pode importar um arquivo JSON (como os gerados pela ferramenta de "Criar Ramo Familiar") para popular sua nova rede e começar a trabalhar de forma independente.
