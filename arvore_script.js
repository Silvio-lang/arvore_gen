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
    const inputPessoaCentral = document.getElementById('inputPessoaCentral'); // ATUALIZADO
    const listaPessoas = document.getElementById('listaPessoas'); // NOVO
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
        "01. Para criar um vínculo (paternidade/filiação ou de casal), edite uma das pessoas e use a seção 'Vínculos Atuais'.",
        "02. Você pode filtrar a lista de pessoas digitando qualquer parte do nome na área de Busca de Pessoas.",
        "03. 'Salvar na Nuvem' e 'Carregar da Nuvem' mantem seus registros seguros e sincronizados entre todos os usuários.",
        "04. O ícone 🎂 ao lado de um nome indica que o aniversário da pessoa está próximo! (2 dias ou menos)",
        "05. Ao vincular duas pessoas, o vínculo contrário correspondente é criado automaticamente na segunda pessoa.",
        "06. O sistema aceita multiplicidade de cônjuges, podendo incluir 'EX-' e falecidos.",
        "07. Não há restrição a filhos e pai/mãe 'não-biológicos', podendo ser lançados normalmente além de registrados e vinculados outros parentes seus",
        "08. Para visualizar a árvore genealógica de alguém, selecione a pessoa na lista e clique em 'Visualizar Árvore'.",
        "09. Na visualização da Árvore, centralizada em alguém, se notar a falta de vínculo ou erro no nome, use o botão 'Editar' nesta tela para correção.",
        "10. Na tela de Busca de Pessoas, os 3 números que aparecem à direita do nome são: o numero registrado de cônjuges, pais, e filhos na base de dados. Isto auxilia a detectar pessoas e vínculos não registrados.",
        "11. Se você quiser criar uma árvore separada, nova, pode fazê-lo! mas 'somente no seu computador ou celular' para não afetar os dados já registrados de longa data. Neste caso, não salve na nuvem. Tenha cautela!",
        "12. Para criação de outra 'nuvem' com banco de dados novo/independente - leia: https://raw.githubusercontent.com/silvio-lang/arvore_gen/main/README.md",
        "13. Procure utilizar o nome da pessoa e também cidade/país em letras MAIÚSCULAS para uniformização.",
        "14. No primeiro uso do aplicativo é necessário carregar da nuvem. Depois os dados ficarão na memória do seu navegador. Cada navegador (Chrome, Edge, etc.), precisa carregar da nuvem ou do dispositivo uma vez.",
        "15. As alterações feitas e salvas na nuvem ficam associados ao usuário que as fez.",
        "16. Clique em + e - para navegar (avançar e retroceder) as instruções numeradas desta janela.",
        "17. No celular, o aparecimento do teclado pode encobrir parcialmente o conteúdo da página. Arraste a tela para cima para visualizar novamente.",
        "18. O sistema aceita registros com dados mínimos (nome e vínculos) para facilitar o trabalho colaborativo com complementação posterior."
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
            popularInputPessoaCentral();
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
            registrosLista.innerHTML = '<tr><td colspan="3">Nenhum registro encontrado.</td></tr>';
            return;
        }

        pessoasFiltradas.forEach(pessoa => {
            const item = document.createElement('label');
            item.className = 'registro-item';

            const iconAniv = isAniversarianteProximo(pessoa.nascimento) ? '🎂 ' : '';
            const infoExtra = [pessoa.nascimento || 'N/D'].filter(Boolean).join(' | ');
            const totalPais = parseArrayField(pessoa.pais).length;
            const totalFilhos = parseArrayField(pessoa.filhos).length;
            const totalConjuges = parseArrayField(pessoa.conjuge).length;

            item.innerHTML = `
                <input type="radio" name="pessoaSelecionada" value="${pessoa.id}">
                <div class="registro-info">
                    <span class="registro-nome">${iconAniv}${pessoa.nome}</span>
                    <span class="registro-detalhes">
                        (C:${totalConjuges} P:${totalPais} F:${totalFilhos})
                    </span>
                </div>
            `;
            registrosLista.appendChild(item);
        });
    }


    function editarPessoa(id) {
        registroEditando = banco.find(p => p.id === id);
        if (!registroEditando) return;

        document.getElementById('edit-id').value = registroEditando.id;
        document.getElementById('edit-nome').value = registroEditando.nome;
        document.getElementById('edit-sexo').value = registroEditando.sexo;
        document.getElementById('edit-nascimento').value = registroEditando.nascimento;
        document.getElementById('edit-falecimento').value = registroEditando.falecimento;
        document.getElementById('edit-profissao').value = registroEditando.profissao;
        document.getElementById('edit-cidade_pais').value = registroEditando.cidade_pais_principal;

        atualizarVinculosList();
        popularSelectVinculo();

        if (editarForm) editarForm.style.display = 'block';
        if (registroAtualContainer2) registroAtualContainer2.style.display = 'block';
    }

    function atualizarVinculosList() {
        if (!vinculosLista || !registroEditando) return;
        vinculosLista.innerHTML = '';
        const vinculos = [];

        parseArrayField(registroEditando.pais).map(id => banco.find(p => p.id === id)).filter(Boolean)
            .forEach(p => vinculos.push({ tipo: 'filho', pessoa: p }));

        parseArrayField(registroEditando.filhos).map(id => banco.find(p => p.id === id)).filter(Boolean)
            .forEach(p => vinculos.push({ tipo: 'pai', pessoa: p }));

        parseArrayField(registroEditando.conjuge).map(id => banco.find(p => p.id === id)).filter(Boolean)
            .forEach(p => vinculos.push({ tipo: 'cônjuge', pessoa: p }));

        if (vinculos.length === 0) {
            vinculosLista.innerHTML = 'Nenhum vínculo registrado.';
            return;
        }

        vinculos.forEach((vinc, idx) => {
            const item = document.createElement('div');
            let tipoLabel = vinc.tipo;
            if (vinc.tipo === 'pai') tipoLabel = 'É Pai/Mãe de';
            if (vinc.tipo === 'filho') tipoLabel = 'É Filho(a) de';
            if (vinc.tipo === 'cônjuge') tipoLabel = 'É Cônjuge de';

            item.innerHTML = `
                ${tipoLabel}: ${vinc.pessoa.nome}
                <button class="remover-vinculo-btn" data-index="${idx}">Remover</button>
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
        selectPessoaVinculo.innerHTML = '';
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
            
            if (vinc.tipo === 'pai') { // A pessoa editada é pai/mãe, o outro é filho
                registroEditando.filhos = parseArrayField(registroEditando.filhos).filter(id => id !== vinc.id);
                if(pessoaVinculada) pessoaVinculada.pais = parseArrayField(pessoaVinculada.pais).filter(id => id !== registroEditando.id);
            }
            if (vinc.tipo === 'filho') { // A pessoa editada é filho/a, o outro é pai
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
            btnEditarNaArvore.onclick = () => {
                 ativarSecao(secGerenciar, btnGerenciar);
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
                // CORREÇÃO: Cada link agora é um bloco separado, garantindo a quebra de linha.
                html += `<div><a href="javascript:void(0)" onclick="centralizarPessoaNaArvore('${parente.id}')" class="arvore-item arvore-link">${parente.nome}</a></div>`;
            }
        });
        html += '</div>';
    }

    // --- PESSOA CENTRAL ---
    html += `<div class="arvore-secao arvore-central">
                <h3>Pessoa Central</h3>
                <div class="arvore-item principal">
                    ${pessoa.nome}
                    <div class="detalhes">${pessoa.nascimento || ''}</div>
                </div>
             </div>`;

    // --- CÔNJUGES E FILHOS (renderizados em suas próprias seções) ---
    ['Cônjuge(s)', 'Filho(s)'].forEach(titulo => {
        if (secoes[titulo].length > 0) {
            html += `<div class="arvore-secao"><h3>${titulo}</h3>`;
            secoes[titulo].forEach(id => {
                const parente = banco.find(p => p.id === id);
                if (parente) {
                    // CORREÇÃO: Envolve cada link em sua própria div para forçar a quebra.
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
        const dataStr = JSON.stringify(banco, null, 2);
        const dataBlob = new Blob([dataStr], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const data = new Date();
        const dataFormatada = `${data.getFullYear()}-${(data.getMonth()+1).toString().padStart(2,'0')}-${data.getDate().toString().padStart(2,'0')}`;
        link.download = `arvore_genealogica_${dataFormatada}.json`;
        link.click();
        URL.revokeObjectURL(url);
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
                        banco = dadosImportados;
                        salvarBancoLocal(banco);
                        alert("Dados importados com sucesso!");
                        ativarSecao(secGerenciar, btnGerenciar);
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
    // LÓGICA DO SUPABASE
    // ================================================================
    
    const solicitarNomeUsuario = () => {
        let nome = localStorage.getItem('arvoreUsuario');
        if (!nome) {
            nome = prompt("Por favor, digite seu nome de usuário para identificar suas alterações na nuvem:");
            if (nome && nome.trim()) {
                localStorage.setItem('arvoreUsuario', nome.trim());
            } else {
                 alert("Nome de usuário é necessário para salvar na nuvem.");
                 return null;
            }
        }
        return nome;
    }


    btnSalvarSupabase.addEventListener('click', async () => {
        if (!supabase) return alert("A conexão com o Supabase não foi inicializada.");
        if (!solicitarNomeUsuario()) return;

        mostrarLoading('Salvando na nuvem...');
        try {
            // *** CORREÇÃO AQUI ***
            const { data: dadosNuvem, error: fetchError } = await supabase
                .from('app_genealogia') 
                .select('id, versão');
                
            if (fetchError) throw fetchError;

            const dadosParaEnviar = banco.filter(local => {
                const nuvem = dadosNuvem.find(d => d.id === local.id);
                return !nuvem || (local.versão || 0) > (nuvem.versão || 0); 
            });

            if (dadosParaEnviar.length === 0) {
                 alert("Todos os dados locais já estão sincronizados com a nuvem.");
                 esconderLoading();
                 return;
            }
            
            const userName = localStorage.getItem('arvoreUsuario');
            dadosParaEnviar.forEach(p => {
                p.versão = Math.floor(Date.now() / 1000);
                p.user_id = userName;
            });

            // *** CORREÇÃO AQUI ***
            const { error } = await supabase.from('app_genealogia').upsert(dadosParaEnviar);
            if (error) throw error;
            
            salvarBancoLocal(banco);
            alert(`${dadosParaEnviar.length} registros foram salvos/atualizados na nuvem!`);

        } catch (error) {
            console.error('Erro ao salvar no Supabase:', error);
            alert(`Erro ao salvar na nuvem: ${error.message}`);
        } finally {
            esconderLoading();
        }
    });

    btnCarregarSupabase.addEventListener('click', async () => {
        if (!supabase) return alert("A conexão com o Supabase não foi inicializada.");
        
        mostrarLoading('Carregando da nuvem...');
        try {
            // *** CORREÇÃO AQUI ***
            const { data, error } = await supabase.from('app_genealogia').select('*');
            if (error) throw error;
            
            if (confirm(`Foram encontrados ${data.length} registros na nuvem. Deseja substituir seus dados locais por estes?`)) {
                banco = data;
                salvarBancoLocal(banco);
                alert("Dados carregados da nuvem com sucesso!");
                ativarSecao(secGerenciar, btnGerenciar);
            }
        } catch (error) {
            console.error('Erro ao carregar do Supabase:', error);
            alert(`Erro ao carregar da nuvem: ${error.message}`);
        } finally {
            esconderLoading();
        }
    });

    // ================================================================
    // INICIALIZAÇÃO
    // ================================================================
    banco = carregarBancoLocal();
    exibirRegistroAtual();
    ativarSecao(secGerenciar, btnGerenciar);

});
