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

    // -- NOVOS seletores
    const btnEditarSelecionado = document.getElementById('btnEditarSelecionado');
    const btnVisualizarSelecionado = document.getElementById('btnVisualizarSelecionado');
    const btnSalvarSupabase = document.getElementById('btnSalvarSupabase');
    const btnCarregarSupabase = document.getElementById('btnCarregarSupabase');
    const btnDicas = document.getElementById('btnDicas');
    const dicasModal = document.getElementById('dicasModal');
    const dicaTexto = document.getElementById('dicaTexto');
    const closeModalButton = document.querySelector('.close-button');


    let banco = [];
    let ultimoRegistro = null;
    let registroEditando = null;

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

    // -- ATUALIZADO: Lista de registros com radio buttons
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
            const item = document.createElement('label'); // Usar label para melhor acessibilidade
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
                    <small>ID: ${pessoa.id} | ${infoExtra}</small>
                </div>
                <div class="registro-item-vinculos">
                    <span title="Cônjuges">${totalConjuges}</span>
                    <span title="Pais">${totalPais}</span>
                    <span title="Filhos">${totalFilhos}</span>
                </div>
            `;
            registrosLista.appendChild(item);
        });
    }

    function editarPessoa(id) {
        registroEditando = banco.find(p => p.id === id);
        if (!registroEditando) {
            console.error('Registro não encontrado para edição:', id);
            alert('Registro não encontrado!');
            return;
        }

        editarForm.style.display = 'block';
        registroAtualContainer2.style.display = 'block';

        document.getElementById('edit-id').value = registroEditando.id;
        document.getElementById('edit-nome').value = registroEditando.nome;
        // ... preenchimento dos outros campos ...
        document.getElementById('edit-sexo').value = registroEditando.sexo || '';
        document.getElementById('edit-nascimento').value = registroEditando.nascimento || '';
        document.getElementById('edit-falecimento').value = registroEditando.falecimento || '';
        document.getElementById('edit-profissao').value = registroEditando.profissao || '';
        document.getElementById('edit-cidade_pais').value = registroEditando.cidade_pais_principal || '';
        document.getElementById('labelNomePessoaEditada').textContent = registroEditando.nome;

        atualizarVinculosList();
        popularSelectVinculo();
        editarForm.scrollIntoView({ behavior: 'smooth' });
    }

    // ================================================================
    // EVENT LISTENERS (OUVINTES DE EVENTOS)
    // ================================================================
    btnNovaPessoa.addEventListener('click', () => ativarSecao(secNovaPessoa, btnNovaPessoa));
    btnGerenciar.addEventListener('click', () => ativarSecao(secGerenciar, btnGerenciar));
    filtroNome.addEventListener('input', atualizarListaRegistros);
    
    // -- NOVOS Listeners para botões globais
    btnEditarSelecionado.addEventListener('click', () => {
        const selecionado = document.querySelector('input[name="pessoaSelecionada"]:checked');
        if (!selecionado) {
            alert('Por favor, selecione uma pessoa na lista para editar.');
            return;
        }
        editarPessoa(selecionado.value);
    });

    btnVisualizarSelecionado.addEventListener('click', () => {
        const selecionado = document.querySelector('input[name="pessoaSelecionada"]:checked');
        if (!selecionado) {
            alert('Por favor, selecione uma pessoa na lista para visualizar a árvore.');
            return;
        }
        const pessoaId = selecionado.value;
        // Ativa a seção da árvore e popula o select
        ativarSecao(secVisualizarArvore, null);// Não ativa nenhum botão do nav
        selectPessoaCentral.value = pessoaId;
        
        // Dispara o evento 'change' manualmente para renderizar a árvore
        selectPessoaCentral.dispatchEvent(new Event('change'));
    });

    // ... (restante dos listeners, como pessoaForm, btnSalvarEdicao, etc., permanecem iguais)
    
    // ================================================================
    // FUNCIONALIDADE DE DICAS (NOVO)
    // ================================================================
    const dicas = [
        "Para criar um vínculo, edite uma pessoa e use a seção 'Vínculos Atuais'.",
        "Você pode filtrar a lista de pessoas digitando qualquer parte do nome no campo de busca.",
        "Use os botões 'Salvar na Nuvem' e 'Carregar da Nuvem' para manter seus dados seguros e sincronizados.",
        "O ícone 🎂 indica que o aniversário da pessoa está próximo!",
        "Ao vincular um 'pai/mãe', o vínculo contrário ('filho/a') é criado automaticamente na outra pessoa.",
        "A visualização da árvore mostra os pais, a pessoa central, cônjuges e filhos.",
        "Não se esqueça de salvar seus dados localmente ('Salvar LOCAL') como um backup extra."
    ];

    const abrirDicaModal = () => {
        const dicaAleatoria = dicas[Math.floor(Math.random() * dicas.length)];
        dicaTexto.textContent = dicaAleatoria;
        dicasModal.style.display = 'block';
    };

    const fecharDicaModal = () => {
        dicasModal.style.display = 'none';
    };

    btnDicas.addEventListener('click', abrirDicaModal);
    closeModalButton.addEventListener('click', fecharDicaModal);
    window.addEventListener('click', (event) => {
        if (event.target == dicasModal) {
            fecharDicaModal();
        }
    });

    // ================================================================
    // LÓGICA DE SINCRONIZAÇÃO COM SUPABASE (REATORADO)
    // ================================================================
    async function salvarNoSupabase() {
        if (!supabase) return alert('❌ Supabase não carregado!');
        if (banco.length === 0) return alert('ℹ️ Não há dados para salvar.');

        // 1. Pede o nome do usuário, que será o user_id
        const userName = prompt("Por favor, digite seu nome de usuário para salvar os dados:", "");

        // 2. Validação simples para o nome (filtro suave)
        if (!userName || userName.trim().length < 3) {
            alert("❌ Salvamento cancelado. É necessário um nome de usuário com pelo menos 3 caracteres.");
            return;
        }

        alert('⏳ Salvando na nuvem... Por favor, aguarde.');

        try {
            const dadosParaSalvar = banco.map(p => ({
                ...p,
                user_id: userName.trim(), // Usa o nome digitado como user_id
                versão: Math.floor(Date.now() / 1000) // Usa o timestamp numérico para 'versão'
            }));

            dadosParaSalvar.forEach(p => {
                delete p.autor;
                delete p.versao;
            });

            const { error } = await supabase
                .from('app_genealogia')
                .upsert(dadosParaSalvar, { onConflict: 'id' });

            if (error) throw error;

            alert(`✅ Dados salvos na nuvem com sucesso para o usuário: ${userName.trim()}`);

        } catch (err) {
            console.error('❌ Erro ao salvar no Supabase:', err);
            alert('❌ Erro ao salvar: ' + err.message);
        }
    }

    async function carregarDoSupabase() {
        if (!supabase) return alert('❌ Supabase não carregado!');
        
        // 1. Pede o nome do usuário para saber quais dados carregar
        const userName = prompt("Por favor, digite seu nome de usuário para carregar os dados:", "");

        if (!userName) {
            alert("❌ Carregamento cancelado. O nome de usuário é necessário.");
            return;
        }

        alert('⏳ Carregando dados da nuvem... Por favor, aguarde.');
        
        try {
            // 2. Busca os dados filtrando pelo user_id (nome do usuário)
            const { data: nuvemData, error } = await supabase
                .from('app_genealogia')
                .select('*')
                .eq('user_id', userName.trim());

            if (error) throw error;

            if (!nuvemData || nuvemData.length === 0) {
                return alert(`ℹ️ Nenhum dado encontrado na nuvem para o usuário: ${userName.trim()}`);
            }

            // Lógica de Merge (fusão) dos dados permanece a mesma
            const bancoLocal = carregarBancoLocal();
            const registrosCombinados = {};

            bancoLocal.forEach(p => {
                registrosCombinados[p.id] = p;
            });

            nuvemData.forEach(p_nuvem => {
                const p_local = registrosCombinados[p_nuvem.id];
                const versao_nuvem = parseInt(p_nuvem.versão) || 0;
                const versao_local = parseInt(p_local?.versão) || 0;

                if (!p_local || versao_nuvem > versao_local) {
                    registrosCombinados[p_nuvem.id] = {
                        ...p_nuvem,
                        pais: parseArrayField(p_nuvem.pais),
                        filhos: parseArrayField(p_nuvem.filhos),
                        conjuge: parseArrayField(p_nuvem.conjuge)
                    };
                }
            });
            
            banco = Object.values(registrosCombinados);

            salvarBancoLocal(banco);
            alert(`✅ Dados sincronizados para ${userName.trim()}! Total: ${banco.length} pessoas.`);
            ativarSecao(secGerenciar, btnGerenciar);
            
        } catch (err) {
            console.error('❌ Erro ao carregar do Supabase:', err);
            alert('❌ Erro: ' + err.message);
        }
    }


    // ================================================================
    // INICIALIZAÇÃO E OUTRAS FUNÇÕES (sem grandes mudanças aqui)
    // ================================================================
    
    // ... (a maior parte do código original que não foi mostrado aqui permanece a mesma)
    // Cole o código completo para garantir que funções como `renderizarArvore`, `popularSelectPessoaCentral`,
    // `removerVinculo`, `btnAdicionarVinculo`, etc., continuem funcionando.
    // O código abaixo é uma repetição do seu original para garantir a completude.

    banco = carregarBancoLocal();
    console.log('📊 Banco carregado:', banco);
    exibirRegistroAtual();

    function exibirRegistroAtual() {
        if (!registroAtualContainer) return;
        if (!ultimoRegistro) {
            registroAtualContainer.textContent = 'Nenhum registro criado nesta sessão.';
            return;
        }
        registroAtualContainer.textContent = `Último registro criado: ${ultimoRegistro.nome} (ID: ${ultimoRegistro.id})`;
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
                conjuge: [],
                versao: new Date().toISOString() // Adiciona versão na criação
            };
            banco.push(novaPessoa);
            ultimoRegistro = novaPessoa;
            salvarBancoLocal(banco);
            alert(`✅ Pessoa "${novaPessoa.nome}" cadastrada com ID: ${novaPessoa.id}`);
            exibirRegistroAtual();
            pessoaForm.reset();
            ativarSecao(secGerenciar, btnGerenciar);
        });
    }
    
    const isAniversarianteProximo = (nascimento) => {
        if (!nascimento) return false;
        const partes = nascimento.split(/[\/\-]/);
        if (partes.length !== 3) return false;
        const dia = parseInt(partes[0]), mes = parseInt(partes[1]);
        const hoje = new Date();
        const dataAniv = new Date(hoje.getFullYear(), mes - 1, dia);
        const diffMs = dataAniv - hoje;
        const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDias >= -2 && diffDias <= 0;
    };
    
    function atualizarVinculosList() {
        if (!vinculosLista || !registroEditando) return;
        vinculosLista.innerHTML = '';
        const vinculos = [];
        parseArrayField(registroEditando.pais).forEach(id => vinculos.push({ tipo: 'pai', id: id, pessoa: banco.find(p => p.id === id) }));
        parseArrayField(registroEditando.filhos).forEach(id => vinculos.push({ tipo: 'filho', id: id, pessoa: banco.find(p => p.id === id) }));
        parseArrayField(registroEditando.conjuge).forEach(id => vinculos.push({ tipo: 'cônjuge', id: id, pessoa: banco.find(p => p.id === id) }));

        if (vinculos.length === 0) {
            vinculosLista.innerHTML = '<p>Nenhum vínculo registrado.</p>';
            return;
        }

        vinculos.forEach(vinc => {
            if (vinc.pessoa) {
                const item = document.createElement('div');
                item.innerHTML = `<span>${vinc.tipo}: ${vinc.pessoa.nome}</span><button data-tipo="${vinc.tipo}" data-id="${vinc.id}" class="btn-remover-vinculo">Remover</button>`;
                vinculosLista.appendChild(item);
            }
        });
        
        document.querySelectorAll('.btn-remover-vinculo').forEach(btn => btn.addEventListener('click', removerVinculo));
    }
    
    function removerVinculo(e) {
        const { tipo, id } = e.target.dataset;
        const pessoaVinculada = banco.find(p => p.id === id);

        if (tipo === 'pai') {
            registroEditando.pais = parseArrayField(registroEditando.pais).filter(pId => pId !== id);
            if (pessoaVinculada) pessoaVinculada.filhos = parseArrayField(pessoaVinculada.filhos).filter(fId => fId !== registroEditando.id);
        } else if (tipo === 'filho') {
            registroEditando.filhos = parseArrayField(registroEditando.filhos).filter(fId => fId !== id);
            if (pessoaVinculada) pessoaVinculada.pais = parseArrayField(pessoaVinculada.pais).filter(pId => pId !== registroEditando.id);
        } else if (tipo === 'cônjuge') {
            registroEditando.conjuge = parseArrayField(registroEditando.conjuge).filter(cId => cId !== id);
            if (pessoaVinculada) pessoaVinculada.conjuge = parseArrayField(pessoaVinculada.conjuge).filter(cId => cId !== registroEditando.id);
        }
        
        salvarBancoLocal(banco);
        atualizarVinculosList();
    }
    
    function popularSelectVinculo() {
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

    btnAdicionarVinculo.addEventListener('click', () => {
        const relacao = selectRelacao.value;
        const pessoaId = selectPessoaVinculo.value;
        const pessoaVinculada = banco.find(p => p.id === pessoaId);
        if (!relacao || !pessoaId || !pessoaVinculada) return alert('Selecione uma relação e uma pessoa.');

        if (relacao === 'pai') {
            registroEditando.filhos = garantirRelacaoUnica(registroEditando.filhos, pessoaId);
            pessoaVinculada.pais = garantirRelacaoUnica(pessoaVinculada.pais, registroEditando.id);
        } else if (relacao === 'filho') {
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

    document.getElementById('btnSalvarEdicao').addEventListener('click', () => {
        if (!registroEditando) return;
        registroEditando.nome = document.getElementById('edit-nome').value.toUpperCase();
        registroEditando.sexo = document.getElementById('edit-sexo').value;
        registroEditando.nascimento = document.getElementById('edit-nascimento').value;
        registroEditando.falecimento = document.getElementById('edit-falecimento').value;
        registroEditando.profissao = document.getElementById('edit-profissao').value;
        registroEditando.cidade_pais_principal = document.getElementById('edit-cidade_pais').value.toUpperCase();
        registroEditando.versao = new Date().toISOString(); // Atualiza versão na edição
        
        salvarBancoLocal(banco);
        alert('✅ Alterações salvas!');
        cancelarEdicao();
        atualizarListaRegistros();
    });

    function cancelarEdicao() {
        registroEditando = null;
        editarForm.style.display = 'none';
        registroAtualContainer2.style.display = 'none';
    }

    btnCancelarEditar.addEventListener('click', cancelarEdicao);
    
    btnExcluirRegistro.addEventListener('click', () => {
        if (!registroEditando || !confirm(`⚠️ Tem certeza que deseja excluir "${registroEditando.nome}"? Esta ação não pode ser desfeita.`)) return;
        banco = banco.filter(p => p.id !== registroEditando.id);
        banco.forEach(p => {
            p.pais = parseArrayField(p.pais).filter(id => id !== registroEditando.id);
            p.filhos = parseArrayField(p.filhos).filter(id => id !== registroEditando.id);
            p.conjuge = parseArrayField(p.conjuge).filter(id => id !== registroEditando.id);
        });
        salvarBancoLocal(banco);
        alert('✅ Registro excluído!');
        cancelarEdicao();
        atualizarListaRegistros();
    });

    function popularSelectPessoaCentral() {
        selectPessoaCentral.innerHTML = '<option value="">Escolha uma pessoa...</option>';
        banco.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(pessoa => {
            const option = document.createElement('option');
            option.value = pessoa.id;
            option.textContent = pessoa.nome;
            selectPessoaCentral.appendChild(option);
        });
    }

    selectPessoaCentral.addEventListener('change', () => {
        const pessoaId = selectPessoaCentral.value;
        arvoreContainer.innerHTML = '';
        if (!pessoaId) return;
        const pessoa = banco.find(p => p.id === pessoaId);
        if (pessoa) renderizarArvore(pessoa);
    });

    function renderizarArvore(pessoa) {
        let html = `<div style="text-align: center;">`;
        const pais = parseArrayField(pessoa.pais);
        if (pais.length > 0) {
            html += `<div><h4>👴 PAIS:</h4>`;
            pais.forEach(id => {
                const p = banco.find(p => p.id === id);
                if (p) html += `<div style="background-color: #e3f2fd; padding: 10px; margin: 5px auto; border-radius: 6px; border-left: 4px solid #2196F3;">${p.nome}</div>`;
            });
            html += `</div>`;
        }

        html += `<div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px;"><h3>${pessoa.nome}</h3><small>Nasc: ${pessoa.nascimento || 'N/D'}</small></div>`;

        const conjuges = parseArrayField(pessoa.conjuge);
        if (conjuges.length > 0) {
            html += `<div><h4>⚭ CÔNJUGE(S):</h4>`;
            conjuges.forEach(id => {
                const c = banco.find(p => p.id === id);
                if (c) html += `<div style="background-color: #fff3e0; padding: 10px; margin: 5px auto; border-radius: 6px; border-left: 4px solid #FF9800;">${c.nome}</div>`;
            });
            html += `</div>`;
        }

        const filhos = parseArrayField(pessoa.filhos);
        if (filhos.length > 0) {
            html += `<div><h4>👶 FILHOS:</h4>`;
            filhos.forEach(id => {
                const f = banco.find(p => p.id === id);
                if (f) html += `<div style="background-color: #e8f5e9; padding: 10px; margin: 5px auto; border-radius: 6px; border-left: 4px solid #4CAF50;">${f.nome}</div>`;
            });
            html += `</div>`;
        }
        
        arvoreContainer.innerHTML = html + `</div>`;
    }

    btnExportarJSON.addEventListener('click', () => {
        if (banco.length === 0) return alert('ℹ️ Não há dados para exportar.');
        const dataStr = JSON.stringify(banco, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arvore_genealogica_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    btnImportarJSON.addEventListener('click', () => inputImportJSON.click());
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
                    alert(`✅ Dados importados! (${banco.length} pessoas)`);
                    ativarSecao(secGerenciar, btnGerenciar);
                } else {
                    alert('❌ Formato de arquivo inválido.');
                }
            } catch (err) {
                alert('❌ Erro ao ler o arquivo: ' + err.message);
            }
        };
        reader.readAsText(file);
    });
    
    btnSalvarSupabase.addEventListener('click', salvarNoSupabase);
    btnCarregarSupabase.addEventListener('click', carregarDoSupabase);

    // Inicia na seção de gerenciar para uma visão geral
    ativarSecao(secVisualizarArvore, null);
});
