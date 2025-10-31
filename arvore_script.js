// ================================================================
// CONFIGURAÇÃO DO SUPABASE
// ================================================================
const SUPABASE_URL = 'https://keaimlhudjtijdujovdu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYWltbGh1ZGp0aWpkdWpvdmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTk5NTQsImV4cCI6MjA3NjUzNTk1NH0.xv_GSrMSAW555j-h6UmFOaoq7sIa47OxLZ4LXPMUErs';

// Inicializar Supabase
let supabase = null;
if (window.supabase) {
    const { createClient } = window.supabase;
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
    // Seletores de Elementos DOM
    const btnNovaPessoa = document.getElementById('btnNovaPessoa');
    const btnGerenciar = document.getElementById('btnGerenciar');
    const secNovaPessoa = document.getElementById('secNovaPessoa');
    const secGerenciar = document.getElementById('secGerenciar');
    const secVisualizarArvore = document.getElementById('secVisualizarArvore');
    const pessoaForm = document.getElementById('pessoaForm');
    const registroAtualContainer = document.getElementById('registroAtualContainer');
    const registroAtualContainer2 = document.getElementById('registroAtualContainer2');
    const registrosLista = document.getElementById('registrosLista');
    const filtroNome = document.getElementById('filtroNome');
    const editarForm = document.getElementById('editarForm');
    const btnCancelarEditar = document.getElementById('btnCancelarEditar');
    const vinculosLista = document.getElementById('vinculosLista');
    const selectPessoaVinculo = document.getElementById('selectPessoaVinculo');
    const btnAdicionarVinculo = document.getElementById('btnAdicionarVinculo');
    const btnExportarJSON = document.getElementById('btnExportarJSON');
    const btnImportarJSON = document.getElementById('btnImportarJSON');
    const inputImportJSON = document.getElementById('inputImportJSON');
    const btnExcluirRegistro = document.getElementById('btnExcluirRegistro');
    const selectPessoaCentral = document.getElementById('selectPessoaCentral');
    const arvoreContainer = document.getElementById('arvoreContainer');
    const selectRelacao = document.getElementById('selectRelacao');
    const btnEditarSelecionado = document.getElementById('btnEditarSelecionado');
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
        "01. Para criar um vínculo (paternidade/filiação ou de casal), edite uma pessoa e use a seção 'Vínculos Atuais'.",
        "02. Você pode filtrar a lista de pessoas digitando qualquer parte do nome no campo de Busca de Pessoas.",
        "03. Use os botões 'Salvar na Nuvem' e 'Carregar da Nuvem' para manter seus dados seguros e sincronizados entre todos os usuários.",
        "04. O ícone 🎂 ao lado de um nome indica que o aniversário da pessoa está próximo! (2 dias ou menos)",
        "05. Ao vincular duas pessoas, o vínculo contrário correspondente é criado automaticamente na outra pessoa.",
        "06. O sistema aceita multiplicidade de cônjuges, podendo incluir 'EX-' e falecidos.",
        "07. Filhos e pai/mãe 'não-de-sangue' ou 'não registrados' podem ser lançados como filhos sem nenhum impedimento, podendo também vinculá-lo também aos outros parentes",
        "08. Para visualizar a árvore genealógica de alguém, selecione a pessoa na lista e clique em 'Visualizar Árvore'.",
        "09. Na visualização da Árvore, centralizada em alguém, se notar alguma falta de vínculo ou nome com erro, use o botão 'Editar' nesta tela para correção.",
        "10 Na tela de Busca de Pessoas, os 3 números que aparecem à direita do nome são: o numero de cônjuges, pais, e filhos registrados na base de dados. Auxilia a detectar erros e vinculos não registrados.",
        "11. Se você quiser, pode criar uma árvore separada, nova, pode fazer! mas *somente no seu computador/celular*, para não alterar os dados criados desde o surgimento desta árvore familiar. Neste caso, não salve na nuvem. Solicitamos cuidado!",
        "12. O criador deste aplicativo é Silvio Aurich Filho, participante e atual administrador da base de dados (nuvem).",
        "13. No primeiro uso do aplicativo é necessário carregar da nuvem. Depois, os dados ficarão na memória do seu navegador, automaticamente. Se usar outro navegador (Chrome, Edge, etc.), precisará carregar da nuvem ou da pasta de Downloads novamente.",
        "14. As alterações feitas e salvas na nuvem são associados ao seu nome de usuário.",
        "15. Clique em + e - para navegar (avançar e retroceder) nestas instruções.",
        "16. Quando usado no celular, muitas vezes o aparecimento do teclado sobrepõe o conteúdo da página. Neste caso, puxe a tela para cima para continuar visualizando.",
        "17. O sistema é flexível em aceitar registros com dados faltantes para facilitar o trabalho colaborativo com introdução de nomes e vínculos.",
        "18. Procure utilizar o nome em letras MAIÚSCULAS por padrão.",
        "19. Em breve: geração de listas de datas de aniversários."
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
        [secNovaPessoa, secGerenciar, secVisualizarArvore].forEach(sec => sec.style.display = 'none');
        [btnNovaPessoa, btnGerenciar].forEach(btn => btn.classList.remove('active'));
        if (secaoAtiva) secaoAtiva.style.display = 'block';
        if (btnAtivo) btnAtivo.classList.add('active');
        if (secaoAtiva === secGerenciar) {
            atualizarListaRegistros();
        } else if (secaoAtiva === secVisualizarArvore) {
            popularSelectPessoaCentral();
        }
    };

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
            ativarSecao(secGerenciar, btnGerenciar);
        });
    }

    function atualizarListaRegistros() {
        if (!registrosLista) return;
        const termoFiltro = (filtroNome?.value || '').toLowerCase();
        const pessoasFiltradas = banco.filter(p => p.nome.toLowerCase().includes(termoFiltro));
        registrosLista.innerHTML = '';
        if (pessoasFiltradas.length === 0) {
            registrosLista.innerHTML = '<p>Nenhum registro encontrado.</p>';
            return;
        }
        pessoasFiltradas.forEach(pessoa => {
            const item = document.createElement('label');
            item.className = 'registro-item';
            const iconAniv = isAniversarianteProximo(pessoa.nascimento) ? '🎂 ' : '';
            const infoExtra = [pessoa.sexo, pessoa.nascimento || 'N/D'].filter(Boolean).join(' | ');
            const totalPais = parseArrayField(pessoa.pais).length;
            const totalFilhos = parseArrayField(pessoa.filhos).length;
            const totalConjuges = parseArrayField(pessoa.conjuge).length;
            item.innerHTML = `
                <input type="radio" name="pessoaSelecionada" value="${pessoa.id}">
                <div class="registro-item-info">
                    <h4>${iconAniv}${pessoa.nome}</h4>
                    <small>${infoExtra}</small>
                </div>
                <div class="registro-item-vinculos">
                    <span title="Cônjuge(s)">${totalConjuges}</span>
                    <span title="Pai/Mãe">${totalPais}</span>
                    <span title="Filho(a)">${totalFilhos}</span>
                </div>
            `;
            registrosLista.appendChild(item);
        });
    }

    function editarPessoa(id) {
        registroEditando = banco.find(p => p.id === id);
        if (!registroEditando) {
            console.error('Registro não encontrado para edição:', id);
            return;
        }
        editarForm.style.display = 'block';
        registroAtualContainer2.style.display = 'block';
        document.getElementById('edit-id').value = registroEditando.id;
        document.getElementById('edit-nome').value = registroEditando.nome;
        document.getElementById('edit-sexo').value = registroEditando.sexo || '';
        document.getElementById('edit-nascimento').value = registroEditando.nascimento || '';
        document.getElementById('edit-falecimento').value = registroEditando.falecimento || '';
        document.getElementById('edit-profissao').value = registroEditando.profissao || '';
        document.getElementById('edit-cidade_pais').value = registroEditando.cidade_pais_principal || '';
        const labelNome = document.getElementById('labelNomePessoaEditada');
        if (labelNome) {
            labelNome.textContent = registroEditando.nome;
        }
        document.getElementById('selectRelacao').selectedIndex = 0;
        atualizarVinculosList();
        popularSelectVinculo();
        editarForm.scrollIntoView({ behavior: 'smooth' });
    }

    function atualizarVinculosList() {
        if (!vinculosLista || !registroEditando) return;
        vinculosLista.innerHTML = '';
        const vinculos = [];
        const pais = parseArrayField(registroEditando.pais);
        pais.forEach(id => {
            const pai = banco.find(p => p.id === id);
            if (pai) vinculos.push({ tipo: 'filho', pessoa: pai });
        });
        const filhos = parseArrayField(registroEditando.filhos);
        filhos.forEach(id => {
            const filho = banco.find(p => p.id === id);
            if (filho) vinculos.push({ tipo: 'pai', pessoa: filho });
        });
        const conjuges = parseArrayField(registroEditando.conjuge);
        conjuges.forEach(id => {
            const conj = banco.find(p => p.id === id);
            if (conj) vinculos.push({ tipo: 'cônjuge', pessoa: conj });
        });
        if (vinculos.length === 0) {
            vinculosLista.innerHTML = '<p style="margin: 0; padding: 8px;">Nenhum vínculo registrado.</p>';
            return;
        }
        vinculos.forEach((vinc, idx) => {
            const item = document.createElement('div');
            let tipoLabel = vinc.tipo;
            if (vinc.tipo === 'pai') tipoLabel = 'É Pai/Mãe de';
            if (vinc.tipo === 'filho') tipoLabel = 'É Filho(a) de';
            if (vinc.tipo === 'cônjuge') tipoLabel = 'É Cônjuge de';
            
            item.innerHTML = `
                <span>${tipoLabel}: ${vinc.pessoa.nome}</span>
                <button type="button" class="remover-vinculo-btn" data-index="${idx}">Remover</button>
            `;
            vinculosLista.appendChild(item);
        });
        document.querySelectorAll('.remover-vinculo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removerVinculo(parseInt(e.target.dataset.index));
            });
        });
    }

    function popularSelectVinculo() {
        if (!selectPessoaVinculo) return;
        selectPessoaVinculo.innerHTML = '<option value="">Selecione na lista...</option>';
        banco.forEach(pessoa => {
            if (pessoa.id !== registroEditando?.id) {
                const option = document.createElement('option');
                option.value = pessoa.id;
                option.textContent = pessoa.nome;
                selectPessoaVinculo.appendChild(option);
            }
        });
    }

    function removerVinculo(idx) {
        if (!registroEditando) return;
        const vinculos = [];
        parseArrayField(registroEditando.pais).forEach(id => vinculos.push({ tipo: 'filho', id }));
        parseArrayField(registroEditando.filhos).forEach(id => vinculos.push({ tipo: 'pai', id }));
        parseArrayField(registroEditando.conjuge).forEach(id => vinculos.push({ tipo: 'cônjuge', id }));

        if (idx >= 0 && idx < vinculos.length) {
            const vinc = vinculos[idx];
            const pessoaVinculada = banco.find(p => p.id === vinc.id);
            if (vinc.tipo === 'pai') {
                registroEditando.filhos = parseArrayField(registroEditando.filhos).filter(id => id !== vinc.id);
                if(pessoaVinculada) pessoaVinculada.pais = parseArrayField(pessoaVinculada.pais).filter(id => id !== registroEditando.id);
            }
            if (vinc.tipo === 'filho') {
                registroEditando.pais = parseArrayField(registroEditando.pais).filter(id => id !== vinc.id);
                if(pessoaVinculada) pessoaVinculada.filhos = parseArrayField(pessoaVinculada.filhos).filter(id => id !== registroEditando.id);
            }
            if (vinc.tipo === 'cônjuge') {
                registroEditando.conjuge = parseArrayField(registroEditando.conjuge).filter(id => id !== vinc.id);
                if(pessoaVinculada) pessoaVinculada.conjuge = parseArrayField(pessoaVinculada.conjuge).filter(id => id !== registroEditando.id);
            }
            salvarBancoLocal(banco);
            atualizarVinculosList();
        }
    };

    if (btnAdicionarVinculo) {
        btnAdicionarVinculo.addEventListener('click', () => {
            if (!registroEditando || !selectRelacao || !selectPessoaVinculo) return;

            const relacao = selectRelacao.value;
            const pessoaId = selectPessoaVinculo.value;
            const pessoaVinculada = banco.find(p => p.id === pessoaId);

            if (!relacao || !pessoaId || !pessoaVinculada) {
                alert('Selecione uma relação e uma pessoa.');
                return;
            }

            if (relacao === 'pai_mae' || relacao === 'pai') { 
                registroEditando.filhos = garantirRelacaoUnica(registroEditando.filhos, pessoaId);
                pessoaVinculada.pais = garantirRelacaoUnica(pessoaVinculada.pais, registroEditando.id);
            } else if (relacao === 'filho_a' || relacao === 'filho') {
                registroEditando.pais = garantirRelacaoUnica(registroEditando.pais, pessoaId);
                pessoaVinculada.filhos = garantirRelacaoUnica(pessoaVinculada.filhos, registroEditando.id);
            } else if (relacao === 'conjuge') {
                registroEditando.conjuge = garantirRelacaoUnica(registroEditando.conjuge, pessoaId);
                pessoaVinculada.conjuge = garantirRelacaoUnica(pessoaVinculada.conjuge, registroEditando.id);
            }

            salvarBancoLocal(banco);
            atualizarVinculosList();
            selectPessoaVinculo.value = '';
        });
    }

    const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
    if (btnSalvarEdicao) {
        btnSalvarEdicao.addEventListener('click', () => {
            if (!registroEditando) return;

            const userName = localStorage.getItem('arvoreUsuario');
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
            registroEditando.versão = Math.floor(Date.now() / 1000);

            salvarBancoLocal(banco);

            alert('Alterações salvas localmente!');
            cancelarEdicao();
            atualizarListaRegistros();
        });
    }

    function cancelarEdicao() {
        registroEditando = null;
        if (editarForm) editarForm.style.display = 'none';
        if (registroAtualContainer2) registroAtualContainer2.style.display = 'none';
    }

    if (btnCancelarEditar) btnCancelarEditar.addEventListener('click', cancelarEdicao);

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
            cancelarEdicao();
            atualizarListaRegistros();
        });
    }

    if (filtroNome) filtroNome.addEventListener('input', atualizarListaRegistros);

    function popularSelectPessoaCentral() {
        if (!selectPessoaCentral) return;
        selectPessoaCentral.innerHTML = '<option value="">Escolha uma pessoa...</option>';
        banco.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(pessoa => {
            const option = document.createElement('option');
            option.value = pessoa.id;
            option.textContent = pessoa.nome;
            selectPessoaCentral.appendChild(option);
        });
    }

    // ================================================================
    // EVENTOS DOS BOTÕES E NAVEGAÇÃO PRINCIPAL
    // ================================================================
    btnNovaPessoa.addEventListener('click', () => ativarSecao(secNovaPessoa, btnNovaPessoa));
    btnGerenciar.addEventListener('click', () => ativarSecao(secGerenciar, btnGerenciar));

    btnEditarSelecionado.addEventListener('click', () => {
        const selecionado = document.querySelector('input[name="pessoaSelecionada"]:checked');
        if (!selecionado) return alert('Por favor, selecione uma pessoa na lista para editar.');
        ativarSecao(secGerenciar, btnGerenciar);
        editarPessoa(selecionado.value);
    });

    btnVisualizarSelecionado.addEventListener('click', () => {
        const selecionado = document.querySelector('input[name="pessoaSelecionada"]:checked');
        if (!selecionado) return alert('Por favor, selecione uma pessoa na lista para visualizar a árvore.');
        const pessoaId = selecionado.value;
        ativarSecao(secVisualizarArvore, null);
        selectPessoaCentral.value = pessoaId;
        selectPessoaCentral.dispatchEvent(new Event('change'));
    });
    
    if (selectPessoaCentral) {
        selectPessoaCentral.addEventListener('change', () => {
            const pessoaId = selectPessoaCentral.value;
            
            if (!pessoaId) {
                arvoreContainer.innerHTML = '';
                btnEditarNaArvore.style.display = 'none';
                return;
            };

            const pessoa = banco.find(p => p.id === pessoaId);
            if (!pessoa) return;

            renderizarArvore(pessoa);
            btnEditarNaArvore.style.display = 'block';

            btnEditarNaArvore.onclick = () => {
                ativarSecao(secGerenciar, btnGerenciar);
                editarPessoa(pessoaId);
            };
        });
    }
    
    // ================================================================
    // FUNÇÃO DE RENDERIZAÇÃO DA ÁRVORE
    // ================================================================
    function renderizarArvore(pessoa) {
        if (!arvoreContainer) return;
        const pais = parseArrayField(pessoa.pais);
        const filhos = parseArrayField(pessoa.filhos);
        const conjuges = parseArrayField(pessoa.conjuge);
        let html = `<div style="text-align: center;">`;
        if (pais.length > 0) {
            html += `<div style="margin-bottom: 20px;">`;
            html += `<h4 style="margin-bottom: 10px; color: #000; font-size: 16px; font-weight: bold;">👴 Pai/Mãe:</h4>`;
            pais.forEach(idPai => {
                const pai = banco.find(p => p.id === idPai);
                if (pai) html += `<div style="background-color: #e3f2fd; padding: 15px; margin: 8px auto; border-radius: 6px; font-weight: 600; border-left: 4px solid #2196F3; color: #000; font-size: 16px; max-width: 400px; word-wrap: break-word;">${pai.nome}</div>`;
            });
            html += `</div>`;
        }
        html += `<div style="border-top: 2px solid #ddd; padding-top: 20px; margin-top: 20px;">`;
        html += `<h3 style="color: #000; font-size: 24px; font-weight: bold; margin-bottom: 5px;">${pessoa.nome}</h3>`;
        html += `<small style="color: #666; font-weight: 600; font-size: 14px;">Nascimento: ${pessoa.nascimento || 'N/D'}</small>`;
        html += `</div>`;
        if (conjuges.length > 0) {
            html += `<div style="margin-top: 20px;">`;
            html += `<h4 style="margin-bottom: 10px; color: #000; font-size: 16px; font-weight: bold;">⚭ Cônjuge(s):</h4>`;
            conjuges.forEach(idConj => {
                const conj = banco.find(p => p.id === idConj);
                if (conj) html += `<div style="background-color: #fff3e0; padding: 15px; margin: 8px auto; border-radius: 6px; font-weight: 600; border-left: 4px solid #FF9800; color: #000; font-size: 16px; max-width: 400px; word-wrap: break-word;">${conj.nome}</div>`;
            });
            html += `</div>`;
        }
        if (filhos.length > 0) {
            html += `<div style="margin-top: 20px;">`;
            html += `<h4 style="margin-bottom: 10px; color: #000; font-size: 16px; font-weight: bold;">👶 Filho(a):</h4>`;
            filhos.forEach(idFilho => {
                const filho = banco.find(p => p.id === idFilho);
                if (filho) html += `<div style="background-color: #e8f5e9; padding: 15px; margin: 8px auto; border-radius: 6px; font-weight: 600; border-left: 4px solid #4CAF50; color: #000; font-size: 16px; max-width: 400px; word-wrap: break-word;">${filho.nome}</div>`;
            });
            html += `</div>`;
        }
        if (pais.length === 0 && conjuges.length === 0 && filhos.length === 0) {
            html += `<p style="color: #000; font-style: italic; margin-top: 30px; font-size: 16px; font-weight: 600;">Nenhum vínculo registrado para esta pessoa.</p>`;
        }
        html += `</div>`;
        arvoreContainer.innerHTML = html;
    }

    // ================================================================
    // IMPORTAÇÃO E EXPORTAÇÃO
    // ================================================================
    if (btnExportarJSON) {
        btnExportarJSON.addEventListener('click', () => {
            if (banco.length === 0) return alert('Não há dados para exportar.');
            const dataStr = JSON.stringify(banco, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `arvore_genealogica_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            alert(`Dados exportados com sucesso! Total: ${banco.length} registros`);
        });
    }

    if (btnImportarJSON) btnImportarJSON.addEventListener('click', () => inputImportJSON.click());

    if (inputImportJSON) {
        inputImportJSON.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const dadosImportados = JSON.parse(event.target.result);
                    if (Array.isArray(dadosImportados)) {
                        banco = dadosImportados;
                        salvarBancoLocal(banco);
                        alert(`Dados importados do arquivo! Total: ${banco.length} pessoas`);
                        ativarSecao(secGerenciar, btnGerenciar);
                    } else {
                        alert('Formato de arquivo inválido.');
                    }
                } catch (err) {
                    alert('Erro ao ler o arquivo: ' + err.message);
                }
            };
            reader.readAsText(file);
        });
    }

    // ================================================================
    // FUNÇÕES DE SINCRONIZAÇÃO COM SUPABASE
    // ================================================================
    async function salvarNoSupabase() {
        if (!supabase) return alert('Supabase não carregado!');
        if (banco.length === 0) return alert('Não há dados para salvar.');
        
        const userName = prompt("Por favor, digite seu nome de usuário para salvar os dados:", localStorage.getItem('arvoreUsuario') || "");
        if (!userName || userName.trim().length < 3) {
            return alert("Salvamento cancelado. É necessário um nome de usuário com pelo menos 3 caracteres.");
        }
        
        const userNameLimpo = userName.trim();
        localStorage.setItem('arvoreUsuario', userNameLimpo);
        
        mostrarLoading(`Salvando dados na nuvem...`);
        
        try {
            // Futura melhoria: Implementar checagem de versão antes de salvar.
            const dadosParaSalvar = banco.map(p => ({ ...p, user_id: userNameLimpo, versão: Math.floor(Date.now() / 1000) }));
            const { error } = await supabase.from('app_genealogia').upsert(dadosParaSalvar, { onConflict: 'id' });
            
            if (error) throw error;
            
            esconderLoading();
            alert(`Dados salvos na nuvem com sucesso! Total de registros enviados: ${banco.length}`);
        } catch (err) {
            esconderLoading();
            console.error('Erro ao salvar no Supabase:', err);
            alert('Erro ao salvar: ' + err.message);
        }
    }

    async function carregarDoSupabase() {
        if (!supabase) {
            return alert('Supabase não carregado!');
        }

        mostrarLoading(`Carregando todos os dados da nuvem...`);
        
        try {
            const { data: nuvemData, error } = await supabase.from('app_genealogia').select('*');
            if (error) throw error;

            if (!nuvemData || nuvemData.length === 0) {
                esconderLoading();
                return alert(`Nenhum dado encontrado na nuvem.`);
            }
            
            const bancoLocal = carregarBancoLocal();
            const registrosCombinados = {};
            bancoLocal.forEach(p => { registrosCombinados[p.id] = p; });
            nuvemData.forEach(p_nuvem => {
                const p_local = registrosCombinados[p_nuvem.id];
                const versao_nuvem = parseInt(p_nuvem.versão) || 0;
                const versao_local = parseInt(p_local?.versão) || 0;
                if (!p_local || versao_nuvem > versao_local) {
                    registrosCombinados[p_nuvem.id] = { ...p_nuvem, pais: parseArrayField(p_nuvem.pais), filhos: parseArrayField(p_nuvem.filhos), conjuge: parseArrayField(p_nuvem.conjuge) };
                }
            });
            banco = Object.values(registrosCombinados);
            salvarBancoLocal(banco);

            esconderLoading();
            alert(`Dados da nuvem sincronizados! Total de registros na base: ${banco.length}`);
            ativarSecao(secGerenciar, btnGerenciar);
        } catch (err) {
            esconderLoading();
            console.error('Erro ao carregar do Supabase:', err);
            alert('Erro: ' + err.message);
        }
    }

    if (btnSalvarSupabase) btnSalvarSupabase.addEventListener('click', salvarNoSupabase);
    if (btnCarregarSupabase) btnCarregarSupabase.addEventListener('click', carregarDoSupabase);

    // ================================================================
    // INICIALIZAÇÃO DO APP
    // ================================================================
    banco = carregarBancoLocal();
    ativarSecao(secVisualizarArvore, null);
});
