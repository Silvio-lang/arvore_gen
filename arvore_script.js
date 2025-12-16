// arvore_script.js - Versão Final e Estável (Corrigida: Bug de Aspas e Silhueta CSS)
// ================================================================
// CONFIGURAÇÃO DO SUPABASE (CHAVE INVALIDADA PARA FORÇAR USO DE ARQUIVOS)
// ================================================================
const SUPABASE_URL = 'https://keaimlhudjtijdujovdu.supabase.co';
// CHAVE INTENCIONALMENTE INVALIDADA com as iniciais do nome para garantir que a Nuvem não funcione:
const SUPABASE_KEY = 'eySAFJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYWltbGh1ZGp0aWpkdWpvdmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTk5NTQsImV4cCI6MjA3NjUzNTk1NH0.xv_GSrMSAW555j-h6UmFOaoq7sIa47OxLZ4LXPMUErs';

// Inicializar Supabase (DESATIVADA)
let supabase = null;
// ================================================================

// Variáveis Globais (AGORA VERDADEIRAMENTE GLOBAIS)
let banco = []; 
let ultimoRegistro = null;
let registroEditando = null;
let dicaAtualIndex = 0;


// ================================================================
// FUNÇÃO PARA GERAR CAMINHO DE FOTO PADRONIZADO (Finalizada)
// ================================================================
/**
 * Garante que o caminho da foto comece com 'fotos/' e preenche automaticamente
 * com 'nome_pessoa.jpg' se o campo de input estiver vazio.
 * @param {string} nomePessoa O nome da pessoa (usado para auto-geração).
 * @param {string} inputPath O nome do arquivo ou caminho fornecido pelo usuário.
 * @returns {string} O caminho padronizado.
 */
function gerarCaminhoFotoFinal(nomePessoa, inputPath) {
    // Usa o nome da pessoa em maiúsculas (como está no BD) para extrair o nome limpo
    // Remove acentos e caracteres especiais para melhor compatibilidade com nomes de arquivo.
    const normalizarNome = (str) => {
        // Normaliza para remover acentos e caracteres especiais (e.g., ç -> c)
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };
    const nomeLimpo = normalizarNome(nomePessoa || '').trim().toLowerCase();
    const inputLimpo = (inputPath || '').trim();
    const prefixo = 'fotos/';

    if (inputLimpo === '') {
        // Se o input está vazio, gera automaticamente o nome: nome_pessoa.jpg
        if (nomeLimpo) {
            // Substitui espaços por '_' (sublinhado) e garante o sufixo .jpg
            const nomeArquivo = nomeLimpo.replace(/\s+/g, '_') + '.jpg';
            return prefixo + nomeArquivo;
        }
        return ''; // Não há nome para gerar
    }
    
    // Se o usuário inseriu algo, mas não o prefixo 'fotos/' nem 'http', adiciona o prefixo
    if (!inputLimpo.startsWith('http') && !inputLimpo.startsWith(prefixo)) {
        // Se o usuário digitou o nome do arquivo (ex: 'Minha Foto.jpg'),
        // faz a substituição de espaços por sublinhados no nome digitado
        const nomeArquivoComSublinhado = normalizarNome(inputLimpo).replace(/\s+/g, '_');
        return prefixo + nomeArquivoComSublinhado;
    }

    // Retorna o caminho inserido (completo ou URL externa)
    return inputLimpo;
}
// ================================================================


// ================================================================
// FUNÇÃO PARA ATUALIZAR LISTA DE ANIVERSÁRIOS 
// ================================================================
function atualizarListaAniversarios() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1; 
    const aniversariantesLista = document.getElementById('aniversariantesLista');
    const mesAtualSpan = document.getElementById('mesAtual');
    
    // Nomes dos meses para exibição
    const nomesMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    mesAtualSpan.textContent = nomesMeses[hoje.getMonth()];

    const aniversariantes = banco.filter(pessoa => {
        // 1. CHAVE: Excluir pessoas que tenham data de falecimento registrada (manter apenas pessoas vivas)
        if (pessoa.falecimento && pessoa.falecimento.trim() !== '') {
            return false;
        }

        if (!pessoa.nascimento) return false;
        
        let partes;
        let mes;

        if (pessoa.nascimento.includes('-')) {
            // Formato ISO (YYYY-MM-DD)
            partes = pessoa.nascimento.split('-');
            mes = parseInt(partes[1]);
        } else if (pessoa.nascimento.includes('/')) {
            // Formato Brasileiro (DD/MM/YYYY)
            partes = pessoa.nascimento.split('/');
            mes = parseInt(partes[1]);
        } else {
            return false;
        }

        return mes === mesAtual;
    });

    // Ordenar por dia de aniversário
    aniversariantes.sort((a, b) => {
        const getDay = (data) => {
            if (data.includes('-')) return parseInt(data.split('-')[2]);
            if (data.includes('/')) return parseInt(data.split('/')[0]);
            return 0;
        };
        return getDay(a.nascimento) - getDay(b.nascimento);
    });

    aniversariantesLista.innerHTML = '';

    if (aniversariantes.length === 0) {
        aniversariantesLista.innerHTML = '<p>Nenhum aniversariante de pessoas vivas registrado neste mês.</p>';
        return;
    }

    aniversariantes.forEach(pessoa => {
        let diaAniversario;
        let anoNascimento;
        
        if (pessoa.nascimento.includes('-')) {
            diaAniversario = pessoa.nascimento.split('-')[2];
            anoNascimento = pessoa.nascimento.split('-')[0];
        } else if (pessoa.nascimento.includes('/')) {
            diaAniversario = pessoa.nascimento.split('/')[0];
            anoNascimento = pessoa.nascimento.split('/')[2];
        }
        
        const idadeAtual = anoNascimento ? (new Date().getFullYear() - parseInt(anoNascimento)) : '?';
        
        const diaFormatado = diaAniversario ? diaAniversario.padStart(2, '0') : '?';
        const mesFormatado = mesAtual.toString().padStart(2, '0');

        const item = document.createElement('div');
        item.className = 'aniversariante-item';
        
        // Exibe o dia em destaque e na descrição 
        item.innerHTML = `
            <span style="font-weight: bold; color: #005f73;">${diaFormatado}/${mesFormatado}</span> - 
            ${pessoa.nome} 
            (${diaFormatado}/${mesFormatado} - ${idadeAtual} anos)
        `;
        aniversariantesLista.appendChild(item);
    });
}
// ================================================================

// FUNÇÕES DE MODAL DE FOTOS FORAM REMOVIDAS


document.addEventListener('DOMContentLoaded', () => {
    // Seletores de Elementos DOM
    const secAbertura = document.getElementById('secAbertura'); 
    const btnGerenciarHub = document.getElementById('btnGerenciarHub'); 
    const btnNovaPessoaHub = document.getElementById('btnNovaPessoaHub'); 
    const btnRefugio = document.getElementById('btnRefugio'); 
    
    const secNovaPessoa = document.getElementById('secNovaPessoa');
    const secGerenciar = document.getElementById('secGerenciar');
    const secVisualizarArvore = document.getElementById('secVisualizarArvore');
    const secEditarPessoa = document.getElementById('secEditarPessoa');
    const pessoaForm = document.getElementById('pessoaForm');
    const registroAtualContainer = document.getElementById('registroAtualContainer');
    const registrosLista = document.getElementById('registrosLista');
    const filtroNome = document.getElementById('filtroNome');
    const filtroCidadePais = document.getElementById('filtroCidadePais'); 
    const editarForm = document.getElementById('editarForm');
    const btnCancelarEditar = document.getElementById('btnCancelarEditar');
    const btnCancelarInclusao = document.getElementById('btnCancelarInclusao');
    const vinculosLista = document.getElementById('vinculosLista');
    const selectPessoaVinculo = document.getElementById('selectPessoaVinculo');
    const btnAdicionarVinculo = document.getElementById('btnAdicionarVinculo');
    const btnExportarJSON = document.getElementById('btnExportarJSON');
    const btnImportarJSON = document.getElementById('btnImportarJSON');
    const inputImportJSON = document.getElementById('inputImportJSON');
    const btnExcluirRegistro = document.getElementById('btnExcluirRegistro');
    const inputPessoaCentral = document.getElementById('inputPessoaCentral');
    const listaPessoas = document.getElementById('listaPessoas');
    const arvoreContainer = document.getElementById('arvoreContainer');
    const selectRelacao = document.getElementById('selectRelacao');
    const btnVisualizarSelecionado = document.getElementById('btnVisualizarSelecionado');
    const btnExportarSelecionadosMD = document.getElementById('btnExportarSelecionadosMD'); // NOVO BOTÃO
    const btnSalvarSupabase = document.getElementById('btnSalvarSupabase');
    const btnCarregarSupabase = document.getElementById('btnCarregarSupabase');
    const btnDicas = document.getElementById('btnDicas');
    const dicasModal = document.getElementById('dicasModal');
    const dicaTexto = document.getElementById('dicaTexto');
    const closeModalButton = document.querySelector('.close-button');
    const btnEditarNaArvore = document.getElementById('btnEditarNaArvore');
    const btnDicaAnterior = document.getElementById('btnDicaAnterior');
    const btnDicaProxima = document.getElementById('btnDicaProxima');
    const dicaContador = document.getElementById('dicaContador');
    const btnConcluirEdicoes = document.getElementById('btnConcluirEdicoes'); // PONTO ÚNICO DE SALVAMENTO

    // Seletores de Aniversariantes
    const secAniversariantes = document.getElementById('secAniversariantes');
    const btnVerAniversarios = document.getElementById('btnVerAniversarios');
    
    // SELETOR DE NAVEGAÇÃO RÁPIDA
    const btnListaPessoasVisu = document.getElementById('btnListaPessoasVisu'); 
    
    // As configurações de fechamento do modal de fotos foram removidas
    
    // ================================================================
    // FUNÇÕES DE FEEDBACK VISUAL (LOADING)
    // ================================================================
    function mostrarLoading(mensagem) {
        const loadingDiv = document.getElementById('loadingMessage');
        if (loadingDiv) {
            loadingDiv.textContent = mensagem;
            loadingDiv.style.display = 'block';
        }
    }
    function esconderLoading() {
        const loadingDiv = document.getElementById('loadingMessage');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }
    // ================================================================
    // LISTA DE DICAS E FUNCIONALIDADE DO MODAL (COM NAVEGAÇÃO)
    // ================================================================
    const dicas = [
        "01. Clique em ◀  e  ▶ para navegar (avançar e retroceder) as instruções numeradas desta janela.",
        "02. Na lista de pessoas:  (c)ônjuges, (p)ais, e (f)ilhos vinculados. Isto auxilia a detectar pessoas e vínculos ainda não registrados.",
        "03. Na visualização da família de alguém, ao notar erros, use o botão 'Editar' na mesma tela.",
        "04. O ícone 🎂 ao lado de um nome indica que o aniversário da pessoa está próximo! (2 dias ou menos)",
        "05 Ao vincular duas pessoas, o vínculo  é criado automaticamente já nas duas pessoas.",
        "06. O sistema aceita multiplicidade de cônjuges, podendo incluir 'EX-' e falecidos.",
        "07. Não há restrição a filhos e pai/mãe 'não-biológicos' nem registros de seus parentes e vínculos.",
        "08. Registros podem ser colocados com dados mínimos (nome/apelido e vínculos) para complementação futura.",
        "09. Para criar um vínculo (paternidade, filiação ou de casal), edite uma das pessoas e use a seção 'Vínculos Atuais'.",
        "10. No celular, o aparecimento do teclado pode encobrir parcialmente o conteúdo da página. Arraste a tela para cima para visualizar.",
        "11. Intercambie dados com pessoas próximas, da família, através do Relatório salvo na pasta de Downloads.",
        "12. O campo NOTAS é privado para você, e não é incluído no Relatório de Dados para intercâmbio.",
        "13. Sem ter carregado nenhuma rede familiar a partir de um arquivo 'arvore.json', inicia uma nova, vazia."
    ];

let dicaAtualIndex = 0;

    function mostrarDica(index) {
        // Lógica de carrossel (loop infinito)
        if (index < 0) index = dicas.length - 1;
        if (index >= dicas.length) index = 0;
        
        dicaAtualIndex = index;
        
        const textoEl = document.getElementById('dicaTexto');
        const contEl = document.getElementById('dicaContador');
        
        if(textoEl) textoEl.textContent = dicas[dicaAtualIndex];
        if(contEl) contEl.textContent = `${dicaAtualIndex + 1} / ${dicas.length}`;
    }

    const abrirDicaModal = () => {
        mostrarDica(0);
        // O SEGREDO ESTÁ AQUI: Força 'flex' para o CSS poder centralizar
        if(dicasModal) dicasModal.style.display = 'flex'; 
    };

    const fecharDicaModal = () => {
        if(dicasModal) dicasModal.style.display = 'none';
    };

    // Listeners (Garantia de funcionamento)
    if(btnDicas) btnDicas.onclick = abrirDicaModal;
    
    // Fechar no X
    const btnFecharX = document.querySelector('.close-button');
    if(btnFecharX) btnFecharX.onclick = fecharDicaModal;

    // Fechar clicando no fundo escuro
    if(dicasModal) {
        dicasModal.onclick = (e) => {
            if (e.target === dicasModal) fecharDicaModal();
        };
    }

    // Navegação
    if(btnDicaAnterior) btnDicaAnterior.onclick = () => mostrarDica(dicaAtualIndex - 1);
    if(btnDicaProxima) btnDicaProxima.onclick = () => mostrarDica(dicaAtualIndex + 1);
    // ================================================================
    // FUNÇÕES DE DADOS (localStorage e Utilitários)
    // ================================================================
    const carregarBancoLocal = () => {
        try {
            const json = localStorage.getItem('arvoreGenealogica');
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error("Erro ao carregar dados do localStorage:", e);
            return [];
        }
    };
    const salvarBancoLocal = (bancoData) => {
        try {
            localStorage.setItem('arvoreGenealogica', JSON.stringify(bancoData));
        } catch (e) {
            console.error("Erro ao salvar dados no localStorage:", e);
        }
    };
    const gerarId = () => {
        let novoId;
        do {
            novoId = Math.random().toString(36).substr(2, 9);
        } while (banco.some(p => p.id === novoId));
        return novoId;
    };
    const parseArrayField = (valor) => {
        if (Array.isArray(valor)) return valor;
        if (!valor || typeof valor !== 'string') return [];
        try {
            const parsed = JSON.parse(valor);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };
    const garantirRelacaoUnica = (array, id) => {
        let arr = parseArrayField(array);
        if (!arr.includes(id)) arr.push(id);
        return arr;
    };
    const isAniversarianteProximo = (nascimento) => {
        if (!nascimento) return false;
        let dia, mes;
        if (nascimento.includes('-')) {
            const partes = nascimento.split('-');
            mes = parseInt(partes[1]);
            dia = parseInt(partes[2]);
        } else if (nascimento.includes('/')) {
            const partes = nascimento.split('/');
            dia = parseInt(partes[0]);
            mes = parseInt(partes[1]);
        } else {
            return false;
        }
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const dataAniv = new Date(anoAtual, mes - 1, dia);
        const diffMs = dataAniv - hoje;
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return diffDias >= -2 && diffDias <= 0;
    };
    
    // ================================================================
    // FUNÇÃO PARA GERAR CAMINHO DE FOTO PADRONIZADO (Finalizada)
    // ================================================================
    /**
     * Garante que o caminho da foto comece com 'fotos/' e preenche automaticamente
     * com 'nome_pessoa.jpg' se o campo de input estiver vazio.
     * @param {string} nomePessoa O nome da pessoa (usado para auto-geração).
     * @param {string} inputPath O nome do arquivo ou caminho fornecido pelo usuário.
     * @returns {string} O caminho padronizado.
     */
    function gerarCaminhoFotoFinal(nomePessoa, inputPath) {
        // Usa o nome da pessoa em maiúsculas (como está no BD) para extrair o nome limpo
        // Remove acentos e caracteres especiais para melhor compatibilidade com nomes de arquivo.
        const normalizarNome = (str) => {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };
        const nomeLimpo = normalizarNome(nomePessoa || '').trim().toLowerCase();
        const inputLimpo = (inputPath || '').trim();
        const prefixo = 'fotos/';

        if (inputLimpo === '') {
            // Se o input está vazio, gera automaticamente o nome: nome_pessoa.jpg
            if (nomeLimpo) {
                // Substitui espaços por '_' (sublinhado) e garante o sufixo .jpg
                const nomeArquivo = nomeLimpo.replace(/\s+/g, '_') + '.jpg';
                return prefixo + nomeArquivo;
            }
            return ''; // Não há nome para gerar
        }
        
        // Se o usuário inseriu algo, mas não o prefixo 'fotos/' nem 'http', adiciona o prefixo
        if (!inputLimpo.startsWith('http') && !inputLimpo.startsWith(prefixo)) {
            // Se o usuário digitou o nome do arquivo (ex: 'Minha Foto.jpg'),
            // faz a substituição de espaços por sublinhados no nome digitado
            const nomeArquivoComSublinhado = normalizarNome(inputLimpo).replace(/\s+/g, '_');
            return prefixo + nomeArquivoComSublinhado;
        }

        // Retorna o caminho inserido (completo ou URL externa)
        return inputLimpo;
    }
    // ================================================================

    // ================================================================
    // LÓGICA DA INTERFACE (UI)
    // ================================================================
    const ativarSecao = (secaoAtiva, btnAtivo) => {
        // Inclui a nova seção para esconder
        [secAbertura, secNovaPessoa, secGerenciar, secVisualizarArvore, secEditarPessoa, secAniversariantes].forEach(sec => sec.style.display = 'none'); 
        
        // Esconde ou mostra os botões de Navegação Rápida
        const mostrarBotoesRapidos = (secaoAtiva !== secAbertura);
        
        if (btnRefugio) {
            btnRefugio.style.display = mostrarBotoesRapidos ? 'inline-block' : 'none';
        }
        if (btnListaPessoasVisu) { // NOVO BOTÃO DE LISTA
            btnListaPessoasVisu.style.display = mostrarBotoesRapidos ? 'inline-block' : 'none';
        }
        
        if (secaoAtiva) secaoAtiva.style.display = 'block';

        // Lógica de inicialização de seções
        if (secaoAtiva === secGerenciar) {
            atualizarListaRegistros();
        } else if (secaoAtiva === secVisualizarArvore) {
            popularInputPessoaCentral();
        } else if (secaoAtiva === secAniversariantes) {
            // Se for a seção de aniversariantes, carrega os dados
            atualizarListaAniversarios();
        } 
    };
    
    // Listener para o botão de Início na navegação
    if (btnRefugio) {
        btnRefugio.addEventListener('click', () => ativarSecao(secAbertura, null));
    }
    // NOVO: Listener para o botão de Lista/Pessoas na Navegação Rápida
    if (btnListaPessoasVisu) {
        btnListaPessoasVisu.addEventListener('click', () => ativarSecao(secGerenciar, null));
    }

    // Listeners para os botões do Hub (Tela de Abertura)
    if (btnGerenciarHub) {
        btnGerenciarHub.addEventListener('click', () => ativarSecao(secGerenciar, null));
    }
    if (btnNovaPessoaHub) {
        btnNovaPessoaHub.addEventListener('click', () => ativarSecao(secNovaPessoa, null));
    }
    // Listener para o botão de Aniversários
    if (btnVerAniversarios) {
        btnVerAniversarios.addEventListener('click', () => {
            atualizarListaAniversarios(); // Carrega os dados antes de mostrar
            ativarSecao(secAniversariantes, null);
        });
    }


    function exibirRegistroAtual() {
        if (!registroAtualContainer) return;
        if (!ultimoRegistro) {
            registroAtualContainer.textContent = 'Nenhum registro criado nesta sessão.';
            return;
        }
        registroAtualContainer.textContent = `Último registro criado: ${ultimoRegistro.nome}`;
    }
    if (pessoaForm) {
        pessoaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // O nome deve ser obtido e padronizado antes de gerar o caminho
            const nomePessoa = (document.getElementById('nome')?.value || '').toUpperCase();
            const fotoPathInput = document.getElementById('foto_path')?.value || '';
            
            // --- APLICA A NOVA FUNÇÃO DE FORMATAÇÃO DE CAMINHO ---
            const fotoPathPadronizado = gerarCaminhoFotoFinal(nomePessoa, fotoPathInput);
            // ---------------------------------------------------
            
            const novaPessoa = {
                id: gerarId(),
                // NOME MANTIDO EM MAIÚSCULAS PARA CONSISTÊNCIA DA BASE DE DADOS
                nome: nomePessoa, 
                sexo: document.getElementById('sexo')?.value || '',
                nascimento: document.getElementById('nascimento')?.value || '',
                falecimento: document.getElementById('falecimento')?.value || '',
                profissao: document.getElementById('profissao')?.value || '',
                cidade_pais_principal: (document.getElementById('cidade_pais')?.value || '').toUpperCase(),
                // SALVA O CAMINHO PADRONIZADO
                foto_path: fotoPathPadronizado,
                // CAMPO DE OBSERVAÇÕES
                observacoes: document.getElementById('observacoes')?.value || '',
                pais: [],
                filhos: [],
                conjuge: [],
            };
            banco.push(novaPessoa);
            ultimoRegistro = novaPessoa;
            salvarBancoLocal(banco);
            alert(`Pessoa "${novaPessoa.nome}" cadastrada!`);
            exibirRegistroAtual();
            pessoaForm.reset();
            ativarSecao(secAbertura, null); 
        });
    }
    // Listener para o botão Cancelar na Inclusão
    if (btnCancelarInclusao) {
        btnCancelarInclusao.addEventListener('click', () => {
            pessoaForm.reset();
            ativarSecao(secAbertura, null); 
        });
    }

    function atualizarListaRegistros() {
        if (!registrosLista) return;
        
        // NOVO: Captura o valor dos dois filtros
        const termoFiltroNome = (document.getElementById('filtroNome')?.value || '').toLowerCase();
        const termoFiltroCidade = (document.getElementById('filtroCidadePais')?.value || '').toLowerCase(); 
        
        const pessoasFiltradas = banco.filter(pessoa => {
            let mostrar = true;

            // 1. FILTRO POR NOME (Já existente)
            if (termoFiltroNome && !pessoa.nome.toLowerCase().includes(termoFiltroNome)) {
                mostrar = false;
            }

            // 2. FILTRO POR CIDADE/PAÍS 
            if (termoFiltroCidade) {
                // Acessa o campo cidade_pais_principal
                const cidadePais = pessoa.cidade_pais_principal ? pessoa.cidade_pais_principal.toLowerCase() : ''; 
                if (!cidadePais.includes(termoFiltroCidade)) {
                    mostrar = false;
                }
            }

            return mostrar;
        });

        registrosLista.innerHTML = '';
        if (pessoasFiltradas.length === 0) {
            registrosLista.innerHTML = '<tr><td colspan="3">Nenhum registro encontrado.</td></tr>';
            return;
        }
        pessoasFiltradas.forEach(pessoa => {
            const item = document.createElement('label');
            item.className = 'registro-item';
            const iconAniv = isAniversarianteProximo(pessoa.nascimento) ? '🎂 ' : '';
            const totalPais = parseArrayField(pessoa.pais).length;
            const totalFilhos = parseArrayField(pessoa.filhos).length;
            const totalConjuges = parseArrayField(pessoa.conjuge).length;

            item.innerHTML = `
                <!-- CORREÇÃO: MUDADO DE radio PARA CHECKBOX para permitir seleção múltipla -->
                <input type="checkbox" name="pessoaSelecionada" value="${pessoa.id}">
                <span class="registro-nome-container">
                    <span class="registro-nome">${iconAniv}${pessoa.nome}</span>
                </span>
                <span class="registro-detalhes">
                    (C:${totalConjuges} P:${totalPais} F:${totalFilhos})
                </span>
            `; 
            registrosLista.appendChild(item);
        });
    }

    // NOVO LISTENER: Adiciona o listener para o filtro de Cidade/País
    if (filtroCidadePais) filtroCidadePais.addEventListener('input', atualizarListaRegistros);
    if (filtroNome) filtroNome.addEventListener('input', atualizarListaRegistros);


    function editarPessoa(id) {
        registroEditando = banco.find(p => p.id === id);
        if (!registroEditando) return;
        
        // Preencher o formulário na nova seção de edição
        document.getElementById('edit-nome').value = registroEditando.nome;
        document.getElementById('edit-sexo').value = registroEditando.sexo;
        document.getElementById('edit-nascimento').value = registroEditando.nascimento;
        document.getElementById('edit-falecimento').value = registroEditando.falecimento;
        document.getElementById('edit-profissao').value = registroEditando.profissao;
        document.getElementById('edit-cidade_pais').value = registroEditando.cidade_pais_principal;
        
        // --- NOVO: Exibe o nome do arquivo, removendo o prefixo "fotos/" e sublinhados ---
        const caminhoCompleto = registroEditando.foto_path || '';
        // Mostra apenas o nome do arquivo se o caminho for padronizado
        let nomeArquivo = caminhoCompleto;
        if (caminhoCompleto.startsWith('fotos/')) {
            nomeArquivo = caminhoCompleto.substring('fotos/'.length);
        }
        // Remove sublinhados para facilitar a leitura no campo de edição
        nomeArquivo = nomeArquivo.replace(/_/g, ' '); 
        document.getElementById('edit-foto_path').value = nomeArquivo;
        // ------------------------------------------------------------------

        // Preencher campo de observações (usa || '' para garantir retrocompatibilidade)
        document.getElementById('edit-observacoes').value = registroEditando.observacoes || ''; 
        
        const labelNomePessoaEditada = document.getElementById('labelNomePessoaEditada');
        if (labelNomePessoaEditada) {
            labelNomePessoaEditada.textContent = 'Editando ' + registroEditando.nome;
            document.getElementById('nomePessoaPrincipalVinculo').textContent = registroEditando.nome;
        }

        atualizarVinculosList();
        popularSelectVinculo();
        
        // Ativa a seção de edição em vez de mostrar um formulário interno
        ativarSecao(secEditarPessoa, null);
    }
    function atualizarVinculosList() {
        if (!vinculosLista || !registroEditando) return;
        vinculosLista.innerHTML = '';
        const vinculos = [];
        
        // Adiciona todos os tipos de vínculos para exibição
        parseArrayField(registroEditando.pais).map(id => banco.find(p => p.id === id)).filter(Boolean)
            .forEach(p => vinculos.push({ tipo: 'pai', pessoa: p })); 
        parseArrayField(registroEditando.filhos).map(id => banco.find(p => p.id === id)).filter(Boolean)
            .forEach(p => vinculos.push({ tipo: 'filho', pessoa: p })); 
        parseArrayField(registroEditando.conjuge).map(id => banco.find(p => p.id === id)).filter(Boolean)
            .forEach(p => vinculos.push({ tipo: 'cônjuge', pessoa: p }));
            
        if (vinculos.length === 0) {
            vinculosLista.innerHTML = 'Nenhum vínculo registrado.';
            return;
        }
        vinculos.forEach((vinc, idx) => {
            const item = document.createElement('div');
            let tipoLabel = vinc.tipo;
            
            if (vinc.tipo === 'pai') tipoLabel = 'É Filho(a) de';
            if (vinc.tipo === 'filho') tipoLabel = 'É Pai/Mãe de';
            if (vinc.tipo === 'cônjuge') tipoLabel = 'É Cônjuge de';
            
            item.innerHTML = `
                ${tipoLabel}: ${vinc.pessoa.nome}
                <button class="remover-vinculo-btn" data-id="${vinc.pessoa.id}" data-tipo-vinculo="${vinc.tipo}">[Remover]</button>
            `;
            vinculosLista.appendChild(item);
        });
        document.querySelectorAll('.remover-vinculo-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                 const idRemover = e.target.dataset.id;
                 const tipoVinc = e.target.dataset.tipoVinculo;
                 removerVinculoPorIdETipo(idRemover, tipoVinc);
             });
        });
    }
    
    function removerVinculoPorIdETipo(idVinculado, tipo) {
        if (!registroEditando) return;
        // Encontra o registro na memória de trabalho
        const pessoaVinculada = banco.find(p => p.id === idVinculado);
        
        // 1. Atualiza a pessoa que está sendo editada (registroEditando)
        if (tipo === 'pai') { 
            // Fortalecimento: Garante que o array existe antes de filtrar
            registroEditando.pais = parseArrayField(registroEditando.pais).filter(id => id !== idVinculado);
        } else if (tipo === 'filho') { 
            registroEditando.filhos = parseArrayField(registroEditando.filhos).filter(id => id !== idVinculado);
        } else if (tipo === 'cônjuge') { 
            registroEditando.conjuge = parseArrayField(registroEditando.conjuge).filter(id => id !== idVinculado);
        }
        
        // 2. Atualiza a pessoa vinculada (o contrário)
        if(pessoaVinculada) {
            if (tipo === 'pai') { 
                pessoaVinculada.filhos = parseArrayField(pessoaVinculada.filhos).filter(id => id !== registroEditando.id);
            } else if (tipo === 'filho') { 
                pessoaVinculada.pais = parseArrayField(pessoaVinculada.pais).filter(id => id !== registroEditando.id);
            } else if (tipo === 'cônjuge') { 
                pessoaVinculada.conjuge = parseArrayField(pessoaVinculada.conjuge).filter(id => id !== registroEditando.id);
            }
        }

        // NOVO FLUXO: NÃO SALVAMOS NO LOCAL STORAGE AQUI. O SALVAMENTO É FEITO APENAS PELO BTN CONCLUIR EDIÇÕES.
        
        // Feedback de sucesso da AÇÃO, mas não do SALVAMENTO COMPLETO
        mostrarLoading("Vínculo removido! Clique em 'Concluir Edições' para salvar na memória.");
        setTimeout(esconderLoading, 2000); 

        atualizarVinculosList();
    }

    function popularSelectVinculo() {
        if (!selectPessoaVinculo) return;
        selectPessoaVinculo.innerHTML = '';
        
        const optionDefault = document.createElement('option');
        optionDefault.value = "";
        optionDefault.textContent = "Selecione uma pessoa...";
        selectPessoaVinculo.appendChild(optionDefault);

        banco.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(pessoa => {
            if (pessoa.id !== registroEditando?.id) {
                const option = document.createElement('option');
                option.value = pessoa.id;
                option.textContent = pessoa.nome;
                selectPessoaVinculo.appendChild(option);
            }
        });
    }
    
    if (btnAdicionarVinculo) {
        btnAdicionarVinculo.addEventListener('click', () => {
            const tipoRelacao = selectRelacao.value;
            const pessoaVinculoId = selectPessoaVinculo.value;
            const pessoaVinculo = banco.find(p => p.id === pessoaVinculoId);

            if (!registroEditando || !pessoaVinculo) {
                alert("Por favor, selecione uma pessoa para criar o vínculo.");
                return;
            }

            // --- LÓGICA DE PARENTESCO (FORTALECIDA) ---
            if (tipoRelacao === 'pai') { 
                // Ação Correta: A (registroEditando) é o pai, B (pessoaVinculo) é o filho.
                registroEditando.filhos = garantirRelacaoUnica(registroEditando.filhos, pessoaVinculoId);
                pessoaVinculo.pais = garantirRelacaoUnica(pessoaVinculo.pais, registroEditando.id);

            } else if (tipoRelacao === 'filho') { 
                // Ação Correta: A (registroEditando) é o filho, B (pessoaVinculo) é o pai.
                registroEditando.pais = garantirRelacaoUnica(registroEditando.pais, pessoaVinculoId);
                pessoaVinculo.filhos = garantirRelacaoUnica(pessoaVinculo.filhos, registroEditando.id);
                
            } else if (tipoRelacao === 'conjuge') {
                // Ação para cônjuge (recíproco)
                registroEditando.conjuge = garantirRelacaoUnica(registroEditando.conjuge, pessoaVinculoId);
                pessoaVinculo.conjuge = garantirRelacaoUnica(pessoaVinculo.conjuge, registroEditando.id);
            }

            // NOVO FLUXO: NÃO SALVAMOS NO LOCAL STORAGE AQUI. DEFERIMOS PARA O BTN CONCLUIR EDIÇÕES.
            
            // Feedback de sucesso da AÇÃO, mas não do SALVAMENTO COMPLETO
            mostrarLoading("Vínculo adicionado! Clique em 'Concluir Edições' para salvar na memória.");
            setTimeout(esconderLoading, 2000); 

            atualizarVinculosList();
        });
        
        // Altera o texto do botão para CONFIRMAR
        btnAdicionarVinculo.textContent = "CONFIRMAR";
    }

    // ================================================================
    // NOVO PONTO DE PERSISTÊNCIA: CONCLUIR EDIÇÕES
    // ================================================================
    if (btnConcluirEdicoes) {
        btnConcluirEdicoes.addEventListener('click', () => {
            if (!registroEditando) return;
            
            // 1. COLETAR ALTERAÇÕES DOS CAMPOS DE TEXTO E SALVÁ-LAS NO REGISTRO
            
            const novoNome = (document.getElementById('edit-nome')?.value || '').toUpperCase();
            const fotoPathInput = document.getElementById('edit-foto_path')?.value || '';
            
            // --- APLICA A NOVA FUNÇÃO DE FORMATAÇÃO DE CAMINHO NA EDIÇÃO ---
            const fotoPathPadronizado = gerarCaminhoFotoFinal(novoNome, fotoPathInput);
            // --------------------------------------------------------------
            
            // NOME MANTIDO EM MAIÚSCULAS
            registroEditando.nome = novoNome;
            registroEditando.sexo = document.getElementById('edit-sexo')?.value || '';
            registroEditando.nascimento = document.getElementById('edit-nascimento')?.value || '';
            registroEditando.falecimento = document.getElementById('edit-falecimento')?.value || '';
            registroEditando.profissao = document.getElementById('edit-profissao')?.value || '';
            registroEditando.cidade_pais_principal = (document.getElementById('edit-cidade_pais')?.value || '').toUpperCase();
            // NOVO: Coletar campo de foto PADRONIZADO
            registroEditando.foto_path = fotoPathPadronizado;
            // Coletar campo de observações
            registroEditando.observacoes = document.getElementById('edit-observacoes')?.value || '';
            
            registroEditando.user_id = localStorage.getItem('arvoreUsuario') || 'LOCAL_USER';
            
            // 2. Lógica de versionamento (Mantida)
            const versaoAtual = parseInt(registroEditando.versão) || 0;
            const LIMITE_TIMESTAMP = 10000000000; 
            if (versaoAtual > LIMITE_TIMESTAMP) { 
                registroEditando.versão = 1;
            } else {
                registroEditando.versão = versaoAtual + 1;
            }
            
            // 3. SALVAMENTO ÚNICO NA MEMÓRIA (localStorage) - SALVA TUDO, INCLUINDO VÍNCULOS PENDENTES
            salvarBancoLocal(banco);
            
            // MENSAGEM FINAL DE SUCESSO
            alert(`Edições concluídas e salvas na MEMÓRIA do Navegador! Total de registros: ${banco.length}.`); 
            
            // AÇÕES FINAIS
            registroEditando = null;
            ativarSecao(secGerenciar, null); 
            atualizarListaRegistros();
        });
    }
    
    
    function cancelarEdicao() {
        registroEditando = null;
        ativarSecao(secGerenciar, null); 
    }
    if (btnCancelarEditar) btnCancelarEditar.addEventListener('click', () => {
        // PERGUNTA DE SEGURANÇA: Se o usuário clica em Cancelar, ele perde as alterações pendentes.
        if (confirm("Você tem alterações pendentes que não foram salvas. Deseja realmente cancelar e descartá-las?")) {
            // Recarrega o banco local para descartar alterações no registroEditando temporário
            banco = carregarBancoLocal(); 
            ativarSecao(secGerenciar, null);
        }
    }); 
    
    if (btnExcluirRegistro) {
        btnExcluirRegistro.addEventListener('click', () => {
            if (!registroEditando || !confirm(`Tem certeza que deseja excluir "${registroEditando.nome}"? Esta ação não pode ser desfeita.`)) return;
            // Remove a pessoa do banco
            banco = banco.filter(p => p.id !== registroEditando.id);
            // Remove os vínculos em todas as outras pessoas
            banco.forEach(p => {
                p.pais = parseArrayField(p.pais).filter(id => id !== registroEditando.id);
                p.filhos = parseArrayField(p.filhos).filter(id => id !== registroEditando.id);
                p.conjuge = parseArrayField(p.conjuge).filter(id => id !== registroEditando.id);
            });
            salvarBancoLocal(banco); // Exclusão deve ser salva imediatamente
            alert('Registro excluído!');
            ativarSecao(secGerenciar, null); 
            atualizarListaRegistros();
        });
    }
    if (filtroNome) filtroNome.addEventListener('input', atualizarListaRegistros);
    if (filtroCidadePais) filtroCidadePais.addEventListener('input', atualizarListaRegistros);
    
    // ================================================================
    // LÓGICA DE IMPORTAÇÃO E EXPORTAÇÃO
    // ================================================================
    btnExportarJSON.addEventListener('click', () => {
        if (banco.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        
        // NOME FINAL DO ARQUIVO: arvore(1).json para forçar o SO a gerenciar as cópias (2, 3...)
        const filename = `arvore(1).json`; 

        // FEEDBACK VISUAL: Mensagem de processamento (2 segundos)
        mostrarLoading(`Salvando ${banco.length} registros como ${filename}... Verifique a pasta Downloads!`);
        
        const dataStr = JSON.stringify(banco, null, 2);
        const dataBlob = new Blob([dataStr], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        // USO DO NOME FINAL
        link.download = filename; 
        
        link.click();
        URL.revokeObjectURL(url);

        // FEEDBACK VISUAL: Esconde a mensagem após 2000 ms (2 segundos)
        setTimeout(esconderLoading, 2000); 
    });


    btnImportarJSON.addEventListener('click', () => inputImportJSON.click());
    
    // CORREÇÃO DE SEGURANÇA NA IMPORTAÇÃO (HD -> VERSÃO ZERO)
    inputImportJSON.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dadosImportados = JSON.parse(e.target.result);
                if (Array.isArray(dadosImportados)) {
                    if (confirm("Isso substituirá todos os dados locais. Deseja continuar?")) {
                        
                        // LÓGICA DE SEGURANÇA: Zera a versão de qualquer dado importado (HD)
                        dadosImportados.forEach(pessoa => {
                            pessoa.versão = 0; 
                        });

                        banco = dadosImportados;
                        salvarBancoLocal(banco);
                        alert("Dados importados com sucesso!");
                        ativarSecao(secGerenciar, null); // Ativa a seção de gerenciamento após importar
                    }
                } else {
                    alert("O arquivo JSON não está no formato esperado (deve ser um array).");
                }
            } catch (err) {
                alert("Erro ao ler o arquivo JSON. Verifique o formato.");
                console.error(err);
            }
        };
        reader.readAsText(file);
        inputImportJSON.value = '';
    });
    
    // ================================================================
    // NOVO: LÓGICA DE EXPORTAÇÃO SELETIVA EM MARKDOWN (MD)
    // ================================================================
    
    // Função utilitária para obter nomes de parentes
    const getParentesNomes = (ids) => {
        return parseArrayField(ids).map(id => {
            const p = banco.find(p => p.id === id);
            return p ? p.nome : '[Registro Removido]';
        }).join(', ');
    };

    function exportarSelecionadosMarkdown() {
        const selecionados = document.querySelectorAll('input[name="pessoaSelecionada"]:checked');
        
        if (selecionados.length === 0) {
            alert("Por favor, selecione uma ou mais pessoas na lista para exportar.");
            return;
        }

        mostrarLoading(`Exportando ${selecionados.length} registros em Markdown...`);
        
        let markdownContent = `# Relatório Familiar - Árvore Genealógica\n\n`;
        markdownContent += `*Data da Exportação: ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
        markdownContent += `---\n\n`;

        selecionados.forEach((input, index) => {
            const pessoaId = input.value;
            const pessoa = banco.find(p => p.id === pessoaId);

            if (!pessoa) return;

            // --- SEÇÃO DA PESSOA ---
            markdownContent += `## ${index + 1}. ${pessoa.nome}\n`;
            markdownContent += `**Gênero:** ${pessoa.sexo === 'M' ? 'Masculino' : (pessoa.sexo === 'F' ? 'Feminino' : 'Não Informado')}\n`;
            
            if (pessoa.nascimento) markdownContent += `**Nascimento:** ${pessoa.nascimento}\n`;
            if (pessoa.falecimento) markdownContent += `**Falecimento:** ${pessoa.falecimento}\n`;
            if (pessoa.profissao) markdownContent += `**Profissão:** ${pessoa.profissao}\n`;
            if (pessoa.cidade_pais_principal) markdownContent += `**Localidade:** ${pessoa.cidade_pais_principal}\n`;

            // --- VÍNCULOS ---
            markdownContent += `\n### Vínculos\n`;
            
            const conjugeNomes = getParentesNomes(pessoa.conjuge);
            const paisNomes = getParentesNomes(pessoa.pais);
            const filhosNomes = getParentesNomes(pessoa.filhos);

            markdownContent += `* **Cônjuge(s):** ${conjugeNomes || 'Nenhum'}\n`;
            markdownContent += `* **Pai/Mãe:** ${paisNomes || 'Nenhum'}\n`;
            markdownContent += `* **Filho(s):** ${filhosNomes || 'Nenhum'}\n`;
            
            // IMPORTANTE: O campo 'observacoes' (Notas Pessoais) NÃO É INCLUÍDO
            
            markdownContent += `\n----------------------------------------\n\n`;
        });
        
        const dataStr = markdownContent;
        const dataBlob = new Blob([dataStr], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'relatorio_familiar.md';
        
        link.click();
        URL.revokeObjectURL(url);

        setTimeout(esconderLoading, 2000); 
    }
    
    if (btnExportarSelecionadosMD) {
        btnExportarSelecionadosMD.addEventListener('click', exportarSelecionadosMarkdown);
    }

    // ================================================================
    // LÓGICA DE VISUALIZAÇÃO DE ÁRVORE
    // ================================================================
    function popularInputPessoaCentral() {
        if (!listaPessoas) return;
        listaPessoas.innerHTML = ''; // Limpa as opções antigas
        // Nomes de listagem mantidos em maiúsculas (consistência de busca)
        banco.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(pessoa => {
            const option = document.createElement('option');
            option.value = pessoa.nome;
            option.dataset.id = pessoa.id; // Armazena o ID aqui
            listaPessoas.appendChild(option);
        });
    }
    if (inputPessoaCentral) {
        inputPessoaCentral.addEventListener('change', () => {
            const nomeSelecionado = inputPessoaCentral.value;
            const optionSelecionada = document.querySelector(`#listaPessoas option[value="${nomeSelecionado}"]`);
            if (!optionSelecionada) {
                arvoreContainer.innerHTML = '';
                btnEditarNaArvore.style.display = 'none';
                return;

            }
            const pessoaId = optionSelecionada.dataset.id;
            const pessoa = banco.find(p => p.id === pessoaId);
            if (!pessoa) return;
            renderizarArvore(pessoa);
            btnEditarNaArvore.style.display = 'block';
            btnEditarNaArvore.textContent = `✏️ Editar ${pessoa.nome}`; 
            btnEditarNaArvore.onclick = () => {
                 editarPessoa(pessoaId);
            };

        });
    }
    window.centralizarPessoaNaArvore = (id) => {
        const pessoa = banco.find(p => p.id === id);
        if (pessoa) {
            inputPessoaCentral.value = pessoa.nome;
            inputPessoaCentral.dispatchEvent(new Event('change'));
        }
    }
    
    // NOVO: Silhueta SVG em Base64 para ser injetada como URL de fundo no CSS
    // Base64 gerado de um SVG (Material Icons 'Person')
    const SILHUETA_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzQ0NDQ0NCI+PHBhdGggZD0iTTEyIDEyYzIyMSAwIDQtMTc5IDQtNHMtMTc5LTQtNC00LTQgMTc5LTQgNHMxNzkgNCA0IDR6bTAgMmMtMjY3IDAtOCA1MzQgLTggNHYyaDE2di0yYzAtMjY2LTUzMy00LTgtNHoiLz48L3N2Zz4=`;


    // NOVO: Função renderizarArvore com Cartão de Identidade e Fallback CSS
    function renderizarArvore(pessoa) {
        if (!arvoreContainer) return;

        const notas = pessoa.observacoes ? pessoa.observacoes.trim() : '';
        const fotoPath = pessoa.foto_path ? pessoa.foto_path.trim() : '';
        
        // CORREÇÃO: Usa a classe CSS "sem-foto" se fotoPath estiver vazio.
        // Se há um caminho, usa a tag <img>. Se não há, usa um <div> com a classe `sem-foto`
        // para que o CSS injete a silhueta no background.
        let fotoContent = '';
        
        if (fotoPath) {
            // Se houver caminho da foto, usa a tag <img>. Removido onerror para simplificar e evitar o bug de string.
            fotoContent = `<img src="${fotoPath}" class="miniatura-foto">`;
        } else {
            // Se o caminho estiver vazio, usa um <div> com a classe para fallback via CSS
            fotoContent = `<div class="miniatura-foto sem-foto"></div>`;
        }


        const cidade = pessoa.cidade_pais_principal ? `, ${pessoa.cidade_pais_principal}` : '';
        let falecimento = '';
        if (pessoa.falecimento && pessoa.falecimento.trim() !== '') {
            falecimento = ` - ✝ ${pessoa.falecimento}`; 
        }
        const detalhesCompletos = `${pessoa.nascimento || ''}${cidade}${falecimento}`;

        // ================================================================
        // 1. CONSTRUÇÃO DO CARTÃO DE IDENTIDADE (Bloco de Destaque)
        // ================================================================
        // CORREÇÃO: Removidos os caracteres de aspas duplas e > que apareceram devido ao erro de string no HTML
        let cartaoIdentidade = `
            <div class="cartao-identidade">
                ${fotoContent}
                
                <div class="cartao-info">
                    <h3 class="nome-central">${pessoa.nome}</h3>
                    <div class="detalhes-centrais">${detalhesCompletos}</div>
                    ${notas ? `<div class="detalhes-notas-central"><span style="white-space: pre-wrap;">NOTAS: ${notas}</span></div>` : ''}
                </div>
            </div>
            <div class="separator"></div>
        `;
        // ================================================================

        const paisIds = parseArrayField(pessoa.pais);
        const filhosIds = parseArrayField(pessoa.filhos);
        const conjugesIds = parseArrayField(pessoa.conjuge);
        
        const secoes = {
            'Pais': paisIds,
            'Cônjuge(s)': conjugesIds,
            'Filho(s)': filhosIds,
        };
        
        let htmlVinculos = '<div class="arvore">';
        
        // --- PAIS ---
        if (secoes['Pais'].length > 0) {
            htmlVinculos += '<div class="arvore-secao"><h3>Pais</h3>';
            secoes['Pais'].forEach(id => {
                const parente = banco.find(p => p.id === id);
                if (parente) {
                    htmlVinculos += `<div><a href="javascript:void(0)" onclick="centralizarPessoaNaArvore('${parente.id}')" class="arvore-item arvore-link">${parente.nome}</a></div>`;
                }
            });
            htmlVinculos += '</div>';
        }
        
        // --- CÔNJUGES ---
        if (secoes['Cônjuge(s)'].length > 0) {
             htmlVinculos += '<div class="arvore-secao"><h3>Cônjuge(s)</h3>';
            secoes['Cônjuge(s)'].forEach(id => {
                const parente = banco.find(p => p.id === id);
                if (parente) {
                    htmlVinculos += `<div><a href="javascript:void(0)" onclick="centralizarPessoaNaArvore('${parente.id}')" class="arvore-item arvore-link">${parente.nome}</a></div>`;
                }
            });
            htmlVinculos += '</div>';
        }
        
        // --- FILHOS ---
        if (secoes['Filho(s)'].length > 0) {
            htmlVinculos += '<div class="arvore-secao"><h3>Filho(s)</h3>';
            secoes['Filho(s)'].forEach(id => {
                const parente = banco.find(p => p.id === id);
                if (parente) {
                    htmlVinculos += `<div><a href="javascript:void(0)" onclick="centralizarPessoaNaArvore('${parente.id}')" class="arvore-item arvore-link">${parente.nome}</a></div>`;
                }
            });
            htmlVinculos += '</div>';
        }
        
        // Mensagem para pessoa sem vínculos
        if (paisIds.length === 0 && filhosIds.length === 0 && conjugesIds.length === 0) {
            htmlVinculos += '<p>Nenhum vínculo registrado para esta pessoa.</p>';
        }
        htmlVinculos += '</div>'; 
        
        // Junta o Cartão de Identidade e os Vínculos
        arvoreContainer.innerHTML = cartaoIdentidade + htmlVinculos;
    }

    // ================================================================
    // EVENTOS DOS BOTÕES E NAVEGAÇÃO PRINCIPAL
    // ================================================================
    
    if (btnVisualizarSelecionado) { // Garante que o elemento existe antes de anexar o evento
        btnVisualizarSelecionado.addEventListener('click', () => {
            // CORREÇÃO E VALIDAÇÃO: Busca todos os checkboxes marcados
            const selecionados = document.querySelectorAll('input[name="pessoaSelecionada"]:checked');
            
            if (selecionados.length === 0) {
                return alert('Por favor, assinale uma pessoa na lista para visualizar a família.');
            }
            if (selecionados.length > 1) {
                // MENSAGEM CLARA PARA O USUÁRIO (Sua ideia)
                return alert('Para a "Visualização da Família", assinale APENAS UMA pessoa para ser o ponto central.');
            }
            
            // Se houver exatamente 1 pessoa marcada, prossegue com a visualização
            const pessoaId = selecionados[0].value;
            const pessoa = banco.find(p => p.id === pessoaId);
            
            if (!pessoa) return;
            
            ativarSecao(secVisualizarArvore, null);
            inputPessoaCentral.value = pessoa.nome;
            inputPessoaCentral.dispatchEvent(new Event('change'));
        });
    }
    
    // ================================================================
    // INICIALIZAÇÃO
    // ================================================================
    banco = carregarBancoLocal();
    exibirRegistroAtual();
    ativarSecao(secAbertura, null); 
});