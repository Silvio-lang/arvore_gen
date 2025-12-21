// arvore_script.js - Versão Final: Convenção de Fotos Minúsculas & Silhueta Automática
// ================================================================
// CONFIGURAÇÃO DO SUPABASE (CHAVE INVALIDADA PARA FORÇAR USO DE ARQUIVOS LOCAIS)
// ================================================================
const SUPABASE_URL = 'https://keaimlhudjtijdujovdu.supabase.co';
const SUPABASE_KEY = 'eySAFJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYWltbGh1ZGp0aWpkdWpvdmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTk5NTQsImV4cCI6MjA3NjUzNTk1NH0.xv_GSrMSAW555j-h6UmFOaoq7sIa47OxLZ4LXPMUErs';

// Inicializar Supabase (DESATIVADA)
let supabase = null;

// ================================================================
// Variáveis Globais
// ================================================================
let banco = []; 
let ultimoRegistro = null;
let registroEditando = null;
let dicaAtualIndex = 0;

// SILHUETA BASE64 (Ícone Sólido e Nítido)
const SILHUETA_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIiBmaWxsPSIjNTU1Ij48cGF0aCBkPSJNMjI0IDI1NmM3MC43IDAgMTI4LTU3LjMgMTI4LTEyOFMyOTQuNyAwIDIyNCAwIDk2IDU3LjMgOTYgMTI4czU3LjMgMTI4IDEyOCAxMjh6bTg5LjYgMzJoLTE2LjdjLTIyLjIgMTAuMi00Ni45IDE2LTcyLjkgMTZzLTUwLjctNS44LTcyLjktMTZoLTE2LjdDNjAuMiAyODggMCAzNDguMiAwIDQyMi40VjQ2NGMwIDI2LjUgMjEuNSA0OCA0OCA0OGgzNTJjMjYuNSAwIDQ4LTIxLjUgNDgtNDh2LTQxLjZjMC03NC4yLTYwLjItMTM0LjQtMTM0LjQtMTM0LjR6Ii8+PC9zdmc+`;

// ================================================================
// FUNÇÃO AUXILIAR: GERAR CAMINHO PADRONIZADO (AUTOMÁTICO)
// ================================================================
// Regra: fotos/nome_sobrenome.jpg (Minúsculas, sem acento, com underline)
function gerarCaminhoAutomatico(nome) {
    if (!nome) return '';
    const nomeLimpo = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const nomeArquivo = nomeLimpo.replace(/\s+/g, '_') + '.jpg';
    return `fotos/${nomeArquivo}`;
}

// ================================================================
// FUNÇÃO PARA ATUALIZAR LISTA DE ANIVERSÁRIOS 
// ================================================================
function atualizarListaAniversarios() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1; 
    const aniversariantesLista = document.getElementById('aniversariantesLista');
    const mesAtualSpan = document.getElementById('mesAtual');
    
    const nomesMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    mesAtualSpan.textContent = nomesMeses[hoje.getMonth()];

    const aniversariantes = banco.filter(pessoa => {
        // Excluir pessoas falecidas
        if (pessoa.falecimento && pessoa.falecimento.trim() !== '') return false;
        if (!pessoa.nascimento) return false;
        
        let partes, mes;
        if (pessoa.nascimento.includes('-')) {
            partes = pessoa.nascimento.split('-');
            mes = parseInt(partes[1]);
        } else if (pessoa.nascimento.includes('/')) {
            partes = pessoa.nascimento.split('/');
            mes = parseInt(partes[1]);
        } else {
            return false;
        }
        return mes === mesAtual;
    });

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
        let diaAniversario, anoNascimento;
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
        item.innerHTML = `
            <span style="font-weight: bold; color: #005f73;">${diaFormatado}/${mesFormatado}</span> - 
            ${pessoa.nome} 
            (${diaFormatado}/${mesFormatado} - ${idadeAtual} anos)
        `;
        aniversariantesLista.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // ================================================================
    // LIMPEZA DE INTERFACE (ESCONDER CAMPOS DE FOTO)
    // ================================================================
    // Como estamos usando convenção automática, escondemos os inputs para não confundir
    const inputFotoAdd = document.getElementById('foto_path');
    const inputFotoEdit = document.getElementById('edit-foto_path');
    
    // Tenta esconder o elemento pai (o label e o input juntos) se possível, ou só o input
    if(inputFotoAdd) {
        if(inputFotoAdd.parentElement && inputFotoAdd.parentElement.tagName === 'LABEL') {
            inputFotoAdd.parentElement.style.display = 'none';
        } else {
            inputFotoAdd.style.display = 'none';
        }
    }
    if(inputFotoEdit) {
        if(inputFotoEdit.parentElement && inputFotoEdit.parentElement.tagName === 'LABEL') {
             inputFotoEdit.parentElement.style.display = 'none';
        } else {
             inputFotoEdit.style.display = 'none';
        }
    }

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
    const btnExportarSelecionadosMD = document.getElementById('btnExportarSelecionadosMD');
    const btnDicas = document.getElementById('btnDicas');
    const dicasModal = document.getElementById('dicasModal');
    const dicaTexto = document.getElementById('dicaTexto');
    const closeModalButton = document.querySelector('.close-button');
    const btnEditarNaArvore = document.getElementById('btnEditarNaArvore');
    const btnDicaAnterior = document.getElementById('btnDicaAnterior');
    const btnDicaProxima = document.getElementById('btnDicaProxima');
    const dicaContador = document.getElementById('dicaContador');
    const btnConcluirEdicoes = document.getElementById('btnConcluirEdicoes');

    // Seletores de Aniversariantes
    const secAniversariantes = document.getElementById('secAniversariantes');
    const btnVerAniversarios = document.getElementById('btnVerAniversarios');
    
    // SELETOR DE NAVEGAÇÃO RÁPIDA
    const btnListaPessoasVisu = document.getElementById('btnListaPessoasVisu'); 
    
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
        "02. Na lista de pessoas há os dados:  (c) de cônjuges, (p) de pais, e (f) de filhos já vinculados.",
        "03. Na visualização da família de alguém, se notar erros, use o botão 'Editar' na mesma tela.",
        "04. O ícone 🎂 ao lado de um nome indica que o aniversário da pessoa está próximo! (2 dias ou menos)",
        "05 Ao vincular duas pessoas, o vínculo  é criado simultaneamente já nas duas pessoas.",
        "06. O sistema aceita multiplicidade de cônjuges, podendo incluir 'EX-' e falecidos.",
        "07. Não há restrição a filhos e pai/mãe 'não-biológicos' nem os registros de seus parentes e vínculos.",
        "08. Pessoas podem ser inseridas com apenas os dados mínimos (nome ou apelido, e vínculos) para complementação futura.",
        "09. Para criar um vínculo (paternidade, filiação ou de casal), edite 1 das pessoas na seção 'Novo Vínculo'. No final, CONFIRME!",
        "10. No celular, o aparecimento do teclado pode encobrir parcialmente o conteúdo da página. Arraste a tela para cima para visualizar.",
        "11.  Após fazer modificações nos dados, é aconselhavel SALVAR DADOS, pois a memória do celular às vezes apaga sem querermos.",
        "12. Intercambie dados com pessoas da família através do Relatório salvo na pasta de Downloads.",
        "13. O campo NOTAS é privado para você, e não é incluído no Relatório de Dados para intercâmbio.",
        "14. O arquivo da foto tem o nome (presumido) da pessoa. Registre-a com o nome correto (presumido) para poder vê-la.",
        "15. Ao estrear o aplicativo no celular, é carregada uma base de dados inicial. Pode ser esvaziada removendo pessoas.",
        "16. Se carregar um arquivo 'arvore.json', vai substituir todos os dados da memória pelos do arquivo."
    ];

    function mostrarDica(index) {
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
        if(dicasModal) dicasModal.style.display = 'flex'; 
    };

    const fecharDicaModal = () => {
        if(dicasModal) dicasModal.style.display = 'none';
    };

    if(btnDicas) btnDicas.onclick = abrirDicaModal;
    
    const btnFecharX = document.querySelector('.close-button');
    if(btnFecharX) btnFecharX.onclick = fecharDicaModal;

    if(dicasModal) {
        dicasModal.onclick = (e) => {
            if (e.target === dicasModal) fecharDicaModal();
        };
    }

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
    // LÓGICA DA INTERFACE (UI)
    // ================================================================
    const ativarSecao = (secaoAtiva, btnAtivo) => {
        [secAbertura, secNovaPessoa, secGerenciar, secVisualizarArvore, secEditarPessoa, secAniversariantes].forEach(sec => sec.style.display = 'none'); 
        
        const mostrarBotoesRapidos = (secaoAtiva !== secAbertura);
        
        if (btnRefugio) {
            btnRefugio.style.display = mostrarBotoesRapidos ? 'inline-block' : 'none';
        }
        if (btnListaPessoasVisu) { 
            btnListaPessoasVisu.style.display = mostrarBotoesRapidos ? 'inline-block' : 'none';
        }
        
        if (secaoAtiva) secaoAtiva.style.display = 'block';

        if (secaoAtiva === secGerenciar) {
            atualizarListaRegistros();
        } else if (secaoAtiva === secVisualizarArvore) {
            popularInputPessoaCentral();
        } else if (secaoAtiva === secAniversariantes) {
            atualizarListaAniversarios();
        } 
    };
    
    if (btnRefugio) {
        btnRefugio.addEventListener('click', () => ativarSecao(secAbertura, null));
    }
    if (btnListaPessoasVisu) {
        btnListaPessoasVisu.addEventListener('click', () => ativarSecao(secGerenciar, null));
    }
    if (btnGerenciarHub) {
        btnGerenciarHub.addEventListener('click', () => ativarSecao(secGerenciar, null));
    }
    if (btnNovaPessoaHub) {
        btnNovaPessoaHub.addEventListener('click', () => ativarSecao(secNovaPessoa, null));
    }
    if (btnVerAniversarios) {
        btnVerAniversarios.addEventListener('click', () => {
            atualizarListaAniversarios(); 
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
            
            const nomePessoa = (document.getElementById('nome')?.value || '').toUpperCase();
            
            // GERAÇÃO AUTOMÁTICA DO CAMINHO NA CRIAÇÃO
            const fotoPathAutomatico = gerarCaminhoAutomatico(nomePessoa);
            
            const novaPessoa = {
                id: gerarId(),
                nome: nomePessoa, 
                sexo: document.getElementById('sexo')?.value || '',
                nascimento: document.getElementById('nascimento')?.value || '',
                falecimento: document.getElementById('falecimento')?.value || '',
                profissao: document.getElementById('profissao')?.value || '',
                cidade_pais_principal: (document.getElementById('cidade_pais')?.value || '').toUpperCase(),
                foto_path: fotoPathAutomatico, // Salva o caminho calculado
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

    if (btnCancelarInclusao) {
        btnCancelarInclusao.addEventListener('click', () => {
            pessoaForm.reset();
            ativarSecao(secAbertura, null); 
        });
    }

    function atualizarListaRegistros() {
        if (!registrosLista) return;
        
        const termoFiltroNome = (document.getElementById('filtroNome')?.value || '').toLowerCase();
        const termoFiltroCidade = (document.getElementById('filtroCidadePais')?.value || '').toLowerCase(); 
        
        const pessoasFiltradas = banco.filter(pessoa => {
            let mostrar = true;

            if (termoFiltroNome && !pessoa.nome.toLowerCase().includes(termoFiltroNome)) {
                mostrar = false;
            }

            if (termoFiltroCidade) {
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

    if (filtroCidadePais) filtroCidadePais.addEventListener('input', atualizarListaRegistros);
    if (filtroNome) filtroNome.addEventListener('input', atualizarListaRegistros);

    function editarPessoa(id) {
        registroEditando = banco.find(p => p.id === id);
        if (!registroEditando) return;
        
        document.getElementById('edit-nome').value = registroEditando.nome;
        document.getElementById('edit-sexo').value = registroEditando.sexo;
        document.getElementById('edit-nascimento').value = registroEditando.nascimento;
        document.getElementById('edit-falecimento').value = registroEditando.falecimento;
        document.getElementById('edit-profissao').value = registroEditando.profissao;
        document.getElementById('edit-cidade_pais').value = registroEditando.cidade_pais_principal;
        
        // O campo de foto não é mais preenchido pois foi ocultado da interface.
        // O sistema gerenciará automaticamente.

        document.getElementById('edit-observacoes').value = registroEditando.observacoes || ''; 
        
        const labelNomePessoaEditada = document.getElementById('labelNomePessoaEditada');
        if (labelNomePessoaEditada) {
            labelNomePessoaEditada.textContent = 'Editando ' + registroEditando.nome;
            document.getElementById('nomePessoaPrincipalVinculo').textContent = registroEditando.nome;
        }

        atualizarVinculosList();
        popularSelectVinculo();
        
        ativarSecao(secEditarPessoa, null);
    }
    function atualizarVinculosList() {
        if (!vinculosLista || !registroEditando) return;
        vinculosLista.innerHTML = '';
        const vinculos = [];
        
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
        const pessoaVinculada = banco.find(p => p.id === idVinculado);
        
        if (tipo === 'pai') { 
            registroEditando.pais = parseArrayField(registroEditando.pais).filter(id => id !== idVinculado);
        } else if (tipo === 'filho') { 
            registroEditando.filhos = parseArrayField(registroEditando.filhos).filter(id => id !== idVinculado);
        } else if (tipo === 'cônjuge') { 
            registroEditando.conjuge = parseArrayField(registroEditando.conjuge).filter(id => id !== idVinculado);
        }
        
        if(pessoaVinculada) {
            if (tipo === 'pai') { 
                pessoaVinculada.filhos = parseArrayField(pessoaVinculada.filhos).filter(id => id !== registroEditando.id);
            } else if (tipo === 'filho') { 
                pessoaVinculada.pais = parseArrayField(pessoaVinculada.pais).filter(id => id !== registroEditando.id);
            } else if (tipo === 'cônjuge') { 
                pessoaVinculada.conjuge = parseArrayField(pessoaVinculada.conjuge).filter(id => id !== registroEditando.id);
            }
        }

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

            if (tipoRelacao === 'pai') { 
                registroEditando.filhos = garantirRelacaoUnica(registroEditando.filhos, pessoaVinculoId);
                pessoaVinculo.pais = garantirRelacaoUnica(pessoaVinculo.pais, registroEditando.id);
            } else if (tipoRelacao === 'filho') { 
                registroEditando.pais = garantirRelacaoUnica(registroEditando.pais, pessoaVinculoId);
                pessoaVinculo.filhos = garantirRelacaoUnica(pessoaVinculo.filhos, registroEditando.id);
            } else if (tipoRelacao === 'conjuge') {
                registroEditando.conjuge = garantirRelacaoUnica(registroEditando.conjuge, pessoaVinculoId);
                pessoaVinculo.conjuge = garantirRelacaoUnica(pessoaVinculo.conjuge, registroEditando.id);
            }

            mostrarLoading("Vínculo adicionado! Clique em 'Concluir Edições' para salvar na memória.");
            setTimeout(esconderLoading, 2000); 

            atualizarVinculosList();
        });
        
        btnAdicionarVinculo.textContent = "CONFIRMAR";
    }

    // ================================================================
    // NOVO PONTO DE PERSISTÊNCIA: CONCLUIR EDIÇÕES
    // ================================================================
    if (btnConcluirEdicoes) {
        btnConcluirEdicoes.addEventListener('click', () => {
            if (!registroEditando) return;
            
            const novoNome = (document.getElementById('edit-nome')?.value || '').toUpperCase();
            
            // GERAÇÃO AUTOMÁTICA NA EDIÇÃO (Mantém a consistência se o nome mudar)
            const fotoPathAutomatico = gerarCaminhoAutomatico(novoNome);
            
            registroEditando.nome = novoNome;
            registroEditando.sexo = document.getElementById('edit-sexo')?.value || '';
            registroEditando.nascimento = document.getElementById('edit-nascimento')?.value || '';
            registroEditando.falecimento = document.getElementById('edit-falecimento')?.value || '';
            registroEditando.profissao = document.getElementById('edit-profissao')?.value || '';
            registroEditando.cidade_pais_principal = (document.getElementById('edit-cidade_pais')?.value || '').toUpperCase();
            
            registroEditando.foto_path = fotoPathAutomatico; // Atualiza o caminho com base no nome
            
            registroEditando.observacoes = document.getElementById('edit-observacoes')?.value || '';
            
            registroEditando.user_id = localStorage.getItem('arvoreUsuario') || 'LOCAL_USER';
            
            const versaoAtual = parseInt(registroEditando.versão) || 0;
            const LIMITE_TIMESTAMP = 10000000000; 
            if (versaoAtual > LIMITE_TIMESTAMP) { 
                registroEditando.versão = 1;
            } else {
                registroEditando.versão = versaoAtual + 1;
            }
            
            salvarBancoLocal(banco);
            
            alert(`Edições concluídas e salvas na MEMÓRIA do Navegador! Total de registros: ${banco.length}.`); 
            
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
        if (confirm("Você tem alterações pendentes que não foram salvas. Deseja realmente cancelar e descartá-las?")) {
            banco = carregarBancoLocal(); 
            ativarSecao(secGerenciar, null);
        }
    }); 
    
    if (btnExcluirRegistro) {
        btnExcluirRegistro.addEventListener('click', () => {
            if (!registroEditando || !confirm(`Tem certeza que deseja excluir "${registroEditando.nome}"? Esta ação não pode ser desfeita.`)) return;
            banco = banco.filter(p => p.id !== registroEditando.id);
            banco.forEach(p => {
                p.pais = parseArrayField(p.pais).filter(id => id !== registroEditando.id);
                p.filhos = parseArrayField(p.filhos).filter(id => id !== registroEditando.id);
                p.conjuge = parseArrayField(p.conjuge).filter(id => id !== registroEditando.id);
            });
            salvarBancoLocal(banco); 
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
        
        const filename = `arvore(1).json`; 

        mostrarLoading(`Salvando ${banco.length} registros como ${filename}... Verifique a pasta Downloads!`);
        
        const dataStr = JSON.stringify(banco, null, 2);
        const dataBlob = new Blob([dataStr], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        link.download = filename; 
        
        link.click();
        URL.revokeObjectURL(url);

        setTimeout(esconderLoading, 2000); 
    });


    btnImportarJSON.addEventListener('click', () => inputImportJSON.click());
    
    inputImportJSON.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dadosImportados = JSON.parse(e.target.result);
                if (Array.isArray(dadosImportados)) {
                    if (confirm("Isso substituirá todos os dados locais. Deseja continuar?")) {
                        
                        dadosImportados.forEach(pessoa => {
                            pessoa.versão = 0; 
                        });

                        banco = dadosImportados;
                        salvarBancoLocal(banco);
                        alert("Dados importados com sucesso!");
                        ativarSecao(secGerenciar, null); 
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
        markdownContent += `              - Este documento tem formatação MarkDown -\n\n`;
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
        listaPessoas.innerHTML = '';
        banco.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(pessoa => {
            const option = document.createElement('option');
            option.value = pessoa.nome;
            option.dataset.id = pessoa.id; 
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
    
    // NOVO: Função renderizarArvore com Cartão de Identidade e Fallback para Silhueta
    function renderizarArvore(pessoa) {
        if (!arvoreContainer) return;

        const notas = pessoa.observacoes ? pessoa.observacoes.trim() : '';
        
        // GERA O CAMINHO ESPERADO DA FOTO
        const fotoEsperada = gerarCaminhoAutomatico(pessoa.nome);
        
        // VACINA DA SILHUETA: onerror garante que, se a foto não existir, entra o SVG
        const fotoContent = `<img src="${fotoEsperada}" class="miniatura-foto" onerror="this.onerror=null; this.src='${SILHUETA_BASE64}'; this.style.padding='15px'; this.style.backgroundColor='#e0e0e0'; this.style.objectFit='contain';">`;

        const cidade = pessoa.cidade_pais_principal ? `, ${pessoa.cidade_pais_principal}` : '';
        let falecimento = '';
        if (pessoa.falecimento && pessoa.falecimento.trim() !== '') {
            falecimento = ` - ✝ ${pessoa.falecimento}`; 
        }
        const detalhesCompletos = `${pessoa.nascimento || ''}${cidade}${falecimento}`;

        // ================================================================
        // 1. CONSTRUÇÃO DO CARTÃO DE IDENTIDADE (Bloco de Destaque)
        // ================================================================
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
    
    if (btnVisualizarSelecionado) {
        btnVisualizarSelecionado.addEventListener('click', () => {
            const selecionados = document.querySelectorAll('input[name="pessoaSelecionada"]:checked');
            
            if (selecionados.length === 0) {
                return alert('Por favor, assinale uma pessoa na lista para visualizar a família.');
            }
            if (selecionados.length > 1) {
                return alert('Para a "Visualização da Família", assinale APENAS UMA pessoa para ser o ponto central.');
            }
            
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