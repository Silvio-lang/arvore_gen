// arvore_script.js - Versão Final (Last Write Wins e Nuvem Desativada)
// ================================================================
// CONFIGURAÇÃO DO SUPABASE (CHAVE INVALIDADA PARA FORÇAR USO DE ARQUIVOS)
// ================================================================
const SUPABASE_URL = 'https://keaimlhudjtijdujovdu.supabase.co';
// CHAVE INTENCIONALMENTE INVALIDADA com as iniciais do nome para garantir que a Nuvem não funcione:
const SUPABASE_KEY = 'eySAFJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYWltbGh1ZGp0aWpkdWpvdmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTk5NTQsImV4cCI6MjA3NjUzNTk1NH0.xv_GSrMSAW555j-h6UmFOaoq7sIa47OxLZ4LXPMUErs';

// Inicializar Supabase (DESATIVADA)
let supabase = null;
// if (window.supabase) {
//     const { createClient } = window.supabase;
//     supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// }
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Seletores de Elementos DOM
    const secAbertura = document.getElementById('secAbertura'); // NOVO: Tela de Abertura
    const btnGerenciarHub = document.getElementById('btnGerenciarHub'); // NOVO: Botão de Gerenciar no Hub
    const btnNovaPessoaHub = document.getElementById('btnNovaPessoaHub'); // NOVO: Botão de Nova Pessoa no Hub
    const btnRefugio = document.getElementById('btnRefugio'); // NOVO: Botão Início na navegação
    
    const secNovaPessoa = document.getElementById('secNovaPessoa');
    const secGerenciar = document.getElementById('secGerenciar');
    const secVisualizarArvore = document.getElementById('secVisualizarArvore');
    const secEditarPessoa = document.getElementById('secEditarPessoa');
    const pessoaForm = document.getElementById('pessoaForm');
    const registroAtualContainer = document.getElementById('registroAtualContainer');
    const registrosLista = document.getElementById('registrosLista');
    const filtroNome = document.getElementById('filtroNome');
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
    // Variáveis Globais
    let banco = [];
    let ultimoRegistro = null;
    let registroEditando = null;
    let dicaAtualIndex = 0;
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

        "01. Na tela de Busca de Pessoas, filtre a lista de pessoas digitando qualquer parte do nome .",
        "02. Na tela de Busca de Pessoas, os 3 números que aparecem à direita do nome são: o numero registrado de (c)ônjuges, (p)ais, e (f)ilhos na base de dados. Isto auxilia a detectar pessoas e vínculos não registrados.",
        "03. Para visualizar a árvore genealógica de alguém, selecione a pessoa na lista e clique em 'Visualizar Árvore'.",
        "04. Na visualização da Árvore, de alguém, quando notar a falta de vínculo ou erro no nome, use o botão 'Editar' nesta tela para correção desta pesssoa.",
        "05. O ícone 🎂 ao lado de um nome indica que o aniversário da pessoa está próximo! (2 dias ou menos)",
        "06 Ao vincular duas pessoas, o vínculo  é criado automaticamente nas duas pessoas.",
        "07. O sistema aceita multiplicidade de cônjuges, podendo incluir 'EX-' e falecidos.",
        "08. Não há restrição a filhos e pai/mãe 'não-biológicos', podendo ser lançados normalmente, além de registrados seus parentes e vínculos.",
        "09. São aceitos registros com dados mínimos (nome e vínculos) para facilitar o trabalho colaborativo com complementação posterior.",
        "10. Para criar um vínculo (paternidade/filiação ou de casal), edite uma das pessoas e use a seção 'Vínculos Atuais'.",
        "11. Clique em < e > para navegar (avançar e retroceder) as instruções numeradas desta janela.",
        "12. No celular, o aparecimento do teclado pode encobrir parcialmente o conteúdo da página. Arraste a tela para cima para visualizar novamente.",
        "13. Forneça as suas atualizações às pessoas da família de sua proximidade através do arquivo salvo na pasta de Downloads. Assim, os núcleos mais próximos podem se expandir nos registros."
    ];

    function mostrarDica(index) {
        dicaAtualIndex = index;
        if (dicaAtualIndex < 0) {
            dicaAtualIndex = dicas.length - 1;
        }
        if (dicaAtualIndex >= dicas.length) {
            dicaAtualIndex = 0;
        }
        dicaTexto.textContent = dicas[dicaAtualIndex];
        dicaContador.textContent = `${dicaAtualIndex + 1} / ${dicas.length}`;
    }
    const abrirDicaModal = () => {
        const indiceSorteado = Math.floor(Math.random() * dicas.length);
        mostrarDica(indiceSorteado);
        dicasModal.style.display = 'block';
    };
    const fecharDicaModal = () => {
        dicasModal.style.display = 'none';
    };
    btnDicas.addEventListener('click', abrirDicaModal);
    closeModalButton.addEventListener('click', fecharDicaModal);
    btnDicaAnterior.addEventListener('click', () => mostrarDica(dicaAtualIndex - 1));
    btnDicaProxima.addEventListener('click', () => mostrarDica(dicaAtualIndex + 1));
    window.addEventListener('click', (event) => {
        if (event.target == dicasModal) {
            fecharDicaModal();
        }
    });
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
    // LÓGICA DA INTERFACE (UI)
    // ================================================================
    const ativarSecao = (secaoAtiva, btnAtivo) => {
        [secAbertura, secNovaPessoa, secGerenciar, secVisualizarArvore, secEditarPessoa].forEach(sec => sec.style.display = 'none'); // ATUALIZADO: Inclui secAbertura
        
        // Esconde ou mostra o botão de Início/Refúgio
        if (btnRefugio) {
             btnRefugio.style.display = (secaoAtiva !== secAbertura) ? 'block' : 'none';
        }
        
        if (secaoAtiva) secaoAtiva.style.display = 'block';

        // Lógica de inicialização de seções
        if (secaoAtiva === secGerenciar) {
            atualizarListaRegistros();
        } else if (secaoAtiva === secVisualizarArvore) {
            popularInputPessoaCentral();
        } 
    };
    
    // NOVO: Listener para o botão de Início na navegação
    if (btnRefugio) {
        btnRefugio.addEventListener('click', () => ativarSecao(secAbertura, null));
    }
    // NOVO: Listeners para os botões do Hub (Tela de Abertura)
    if (btnGerenciarHub) {
        btnGerenciarHub.addEventListener('click', () => ativarSecao(secGerenciar, null));
    }
    if (btnNovaPessoaHub) {
        btnNovaPessoaHub.addEventListener('click', () => ativarSecao(secNovaPessoa, null));
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
            const novaPessoa = {
                id: gerarId(),
                nome: (document.getElementById('nome')?.value || '').toUpperCase(),
                sexo: document.getElementById('sexo')?.value || '',
                nascimento: document.getElementById('nascimento')?.value || '',
                falecimento: document.getElementById('falecimento')?.value || '',
                profissao: document.getElementById('profissao')?.value || '',
                cidade_pais_principal: (document.getElementById('cidade_pais')?.value || '').toUpperCase(),
                pais: [],
                filhos: [],
                conjuge: []
            };
            banco.push(novaPessoa);
            ultimoRegistro = novaPessoa;
            salvarBancoLocal(banco);
            alert(`Pessoa "${novaPessoa.nome}" cadastrada!`);
            exibirRegistroAtual();
            pessoaForm.reset();
            ativarSecao(secAbertura, null); // ATUALIZADO: Volta para o Hub/Refúgio após cadastrar
        });
    }
    // Listener para o botão Cancelar na Inclusão
    if (btnCancelarInclusao) {
        btnCancelarInclusao.addEventListener('click', () => {
            pessoaForm.reset();
            ativarSecao(secAbertura, null); // ATUALIZADO: Volta para o Hub/Refúgio
        });
    }

    function atualizarListaRegistros() {
        if (!registrosLista) return;
        const termoFiltro = (filtroNome?.value || '').toLowerCase();
        const pessoasFiltradas = banco.filter(p => p.nome.toLowerCase().includes(termoFiltro));
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
          <input type="radio" name="pessoaSelecionada" value="${pessoa.id}">
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
        // Adiciona pais (a pessoa editada é filho)
        parseArrayField(registroEditando.pais).map(id => banco.find(p => p.id === id)).filter(Boolean)
            .forEach(p => vinculos.push({ tipo: 'pai', pessoa: p })); // Tipo "pai" para quem está vinculado
        // Adiciona filhos (a pessoa editada é pai/mãe)
        parseArrayField(registroEditando.filhos).map(id => banco.find(p => p.id === id)).filter(Boolean)
            .forEach(p => vinculos.push({ tipo: 'filho', pessoa: p })); // Tipo "filho" para quem está vinculado
        // Adiciona cônjuges
        parseArrayField(registroEditando.conjuge).map(id => banco.find(p => p.id === id)).filter(Boolean)
            .forEach(p => vinculos.push({ tipo: 'cônjuge', pessoa: p }));
        if (vinculos.length === 0) {
            vinculosLista.innerHTML = 'Nenhum vínculo registrado.';
            return;
        }
        vinculos.forEach((vinc, idx) => {
            const item = document.createElement('div');
            let tipoLabel = vinc.tipo;
            // Corrigindo a exibição do tipo para o contexto da pessoa sendo editada
            if (vinc.tipo === 'pai') tipoLabel = 'É Filho(a) de';
            if (vinc.tipo === 'filho') tipoLabel = 'É Pai/Mãe de';
            if (vinc.tipo === 'cônjuge') tipoLabel = 'É Cônjuge de';
            item.innerHTML = `
                ${tipoLabel}: ${vinc.pessoa.nome}
                <button class="remover-vinculo-btn" data-id="${vinc.pessoa.id}" data-tipo-vinculo="${vinc.tipo}">Remover</button>
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
        const pessoaVinculada = banco.find(p => p.id === idVinculado);
        
        // 1. Atualiza a pessoa que está sendo editada (registroEditando)
        if (tipo === 'pai') { // A pessoa editada tem esse como PAI (ou seja, está no array 'pais')
            registroEditando.pais = parseArrayField(registroEditando.pais).filter(id => id !== idVinculado);
        } else if (tipo === 'filho') { // A pessoa editada tem esse como FILHO (ou seja, está no array 'filhos')
            registroEditando.filhos = parseArrayField(registroEditando.filhos).filter(id => id !== idVinculado);
        } else if (tipo === 'cônjuge') { // CÔNJUGE
            registroEditando.conjuge = parseArrayField(registroEditando.conjuge).filter(id => id !== idVinculado);
        }
        
        // 2. Atualiza a pessoa vinculada (o contrário)
        if(pessoaVinculada) {
            if (tipo === 'pai') { // Se o outro é meu pai, eu sou o filho dele
                pessoaVinculada.filhos = parseArrayField(pessoaVinculada.filhos).filter(id => id !== registroEditando.id);
            } else if (tipo === 'filho') { // Se o outro é meu filho, eu sou o pai/mãe dele
                pessoaVinculada.pais = parseArrayField(pessoaVinculada.pais).filter(id => id !== registroEditando.id);
            } else if (tipo === 'cônjuge') { // Se o outro é meu cônjuge, eu sou o cônjuge dele
                pessoaVinculada.conjuge = parseArrayField(pessoaVinculada.conjuge).filter(id => id !== registroEditando.id);
            }
        }

        salvarBancoLocal(banco);
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

            // --- LÓGICA DE PARENTESCO CORRIGIDA ---
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

            salvarBancoLocal(banco);
            atualizarVinculosList();
        });
    }


    const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
    if (btnSalvarEdicao) {
        btnSalvarEdicao.addEventListener('click', () => {
            if (!registroEditando) return;
            const userName = localStorage.getItem('arvoreUsuario');
            
            // Requisito de Autoria (Placa de Cuidado)
            if (!userName) {
                alert("Para garantir a autoria das alterações, por favor, salve os dados na nuvem ao menos uma vez antes de editar.");
                return;
            }
            
            registroEditando.nome = (document.getElementById('edit-nome')?.value || '').toUpperCase();
            registroEditando.sexo = document.getElementById('edit-sexo')?.value || '';
            registroEditando.nascimento = document.getElementById('edit-nascimento')?.value || '';
            registroEditando.falecimento = document.getElementById('edit-falecimento')?.value || '';
            registroEditando.profissao = document.getElementById('edit-profissao')?.value || '';
            registroEditando.cidade_pais_principal = (document.getElementById('edit-cidade_pais')?.value || '').toUpperCase();
            registroEditando.user_id = userName;
            
            // CORREÇÃO FINAL DE VERSÃO: Transição de TIMESTAMP para SEQUENCIAL CONTROLADO
            const versaoAtual = parseInt(registroEditando.versão) || 0;
            // Limite de 10 Bilhões para separar o timestamp grande (corrompido) do sequencial
            const LIMITE_TIMESTAMP = 10000000000; 

            if (versaoAtual > LIMITE_TIMESTAMP) { 
                // Se for um timestamp antigo, forçamos o reset para 1 para começar o versionamento sequencial.
                registroEditando.versão = 1;
            } else {
                // Se já for sequencial (ou 0), apenas incrementa.
                registroEditando.versão = versaoAtual + 1;
            }
            
            salvarBancoLocal(banco);
            alert('Alterações salvas em memória!');
            cancelarEdicao(); 
            atualizarListaRegistros();
        });
    }
    
    function cancelarEdicao() {
        registroEditando = null;
        ativarSecao(secGerenciar, null); // ATUALIZADO: Volta para a seção de gerenciamento
    }
    if (btnCancelarEditar) btnCancelarEditar.addEventListener('click', () => ativarSecao(secGerenciar, null)); // ATUALIZADO: Volta para a seção de gerenciamento
    
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
            salvarBancoLocal(banco);
            alert('Registro excluído!');
            ativarSecao(secGerenciar, null); // ATUALIZADO: Volta para a seção de gerenciamento
            atualizarListaRegistros();
        });
    }
    if (filtroNome) filtroNome.addEventListener('input', atualizarListaRegistros);
    function popularInputPessoaCentral() {
        if (!listaPessoas) return;
        listaPessoas.innerHTML = ''; // Limpa as opções antigas
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
            btnEditarNaArvore.textContent = `✏️ Editar ${pessoa.nome}`; // <--- MUDANÇA AQUI
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
    function renderizarArvore(pessoa) {
        if (!arvoreContainer) return;
        const paisIds = parseArrayField(pessoa.pais);
        const filhosIds = parseArrayField(pessoa.filhos);
        const conjugesIds = parseArrayField(pessoa.conjuge);
        // Usa um objeto para agrupar os parentes por seção para facilitar a renderização
        const secoes = {
            'Pais': paisIds,
            'Cônjuge(s)': conjugesIds,
            'Filho(s)': filhosIds
        };
        let html = '<div class="arvore">';
        // --- PAIS ---
        if (secoes['Pais'].length > 0) {
            html += '<div class="arvore-secao"><h3>Pais</h3>';
            secoes['Pais'].forEach(id => {
                const parente = banco.find(p => p.id === id);
                if (parente) {
                    html += `<div><a href="javascript:void(0)" onclick="centralizarPessoaNaArvore('${parente.id}')" class="arvore-item arvore-link">${parente.nome}</a></div>`;
                }
            });
            html += '</div>';
        }

        // --- PESSOA CENTRAL (AJUSTADO PARA EXIBIÇÃO MINIMALISTA E FIEL) ---
        
        // 1. Prepara a Cidade Principal (usa a nomenclatura CORRETA do seu objeto)
        const cidade = pessoa.cidade_pais_principal ? `, ${pessoa.cidade_pais_principal}` : '';
        
        // 2. Prepara a Data de Falecimento (com a Cruz ✝ e Fidelidade ao Dado)
        let falecimento = '';
        // Usa a nomenclatura CORRETA do seu objeto: 'pessoa.falecimento'
        if (pessoa.falecimento && pessoa.falecimento.trim() !== '') {
            falecimento = ` - ✝ ${pessoa.falecimento}`; 
        }
        
        // 3. Monta a string de Detalhes Completa
        const detalhesCompletos = `${pessoa.nascimento || ''}${cidade}${falecimento}`;

        html += `<div class="arvore-secao arvore-central">
                               <div class="arvore-item principal">
                        ${pessoa.nome}
                        <div class="detalhes">${detalhesCompletos}</div>
                    </div>
                </div>`;
      
        // --- CÔNJUGES E FILHOS (renderizados em suas próprias seções) ---
        ['Cônjuge(s)', 'Filho(s)'].forEach(titulo => {
            if (secoes[titulo].length > 0) {
                html += `<div class="arvore-secao"><h3>${titulo}</h3>`;
                secoes[titulo].forEach(id => {
                    const parente = banco.find(p => p.id === id);
                    if (parente) {
                        html += `<div><a href="javascript:void(0)" onclick="centralizarPessoaNaArvore('${parente.id}')" class="arvore-item arvore-link">${parente.nome}</a></div>`;
                    }
                });
                html += '</div>';
            }
        });
        // Mensagem para pessoa sem vínculos
        if (paisIds.length === 0 && filhosIds.length === 0 && conjugesIds.length === 0) {
            html += '<p>Nenhum vínculo registrado para esta pessoa.</p>';
        }
        html += '</div>'; // Fecha div.arvore
        arvoreContainer.innerHTML = html;
    }
    // ================================================================
    // EVENTOS DOS BOTÕES E NAVEGAÇÃO PRINCIPAL
    // ================================================================
    
    btnVisualizarSelecionado.addEventListener('click', () => {
        const selecionado = document.querySelector('input[name="pessoaSelecionada"]:checked');
        if (!selecionado) return alert('Por favor, selecione uma pessoa na lista para visualizar a árvore.');
        const pessoaId = selecionado.value;
        const pessoa = banco.find(p => p.id === pessoaId);
        if (!pessoa) return;
        ativarSecao(secVisualizarArvore, null);
        inputPessoaCentral.value = pessoa.nome;
        inputPessoaCentral.dispatchEvent(new Event('change'));
    });
    // ================================================================
    // LÓGICA DE IMPORTAÇÃO E EXPORTAÇÃO
    // ================================================================
    btnExportarJSON.addEventListener('click', () => {
        if (banco.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        // FEEDBACK VISUAL: Mensagem de processamento (2 segundos)
        mostrarLoading("Salvando dados... Verifique a pasta Downloads!");
        
        const dataStr = JSON.stringify(banco, null, 2);
        const dataBlob = new Blob([dataStr], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        // ATUALIZAÇÃO: Nome base simples para permitir numeração automática pelo SO (arvore, arvore(1), ...)
        link.download = `arvore.json`; 
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
    // LÓGICA DO SUPABASE (FUNÇÕES VÃO RETORNAR ERRO DE NÃO-INICIALIZAÇÃO)
    // ================================================================

    btnSalvarSupabase.addEventListener('click', async () => {
        if (!supabase) return alert("A conexão com a Nuvem está desativada. Por favor, utilize a importação/exportação de arquivos.");
        
        // ... (O restante do código Supabase aqui não será executado) ...
    });

    btnCarregarSupabase.addEventListener('click', async () => {
        if (!supabase) return alert("A conexão com a Nuvem está desativada. Por favor, utilize a importação/exportação de arquivos.");
        // ... (O restante do código Supabase aqui não será executado) ...
    });
    
    // ================================================================
    // INICIALIZAÇÃO
    // ================================================================
    banco = carregarBancoLocal();
    exibirRegistroAtual();
    ativarSecao(secAbertura, null); // ATUALIZADO: Inicia na Tela de Abertura (Hub/Refúgio)
});