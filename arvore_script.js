document.addEventListener('DOMContentLoaded', () => {
    // ========================================================
    // ELEMENTOS DOM
    // ========================================================
    const btnNovaPessoa = document.getElementById('btnNovaPessoa');
    const btnGerenciar = document.getElementById('btnGerenciar');
    const btnVisualizarArvore = document.getElementById('btnVisualizarArvore');
    const secNovaPessoa = document.getElementById('secNovaPessoa');
    const secGerenciar = document.getElementById('secGerenciar');
    const secVisualizarArvore = document.getElementById('secVisualizarArvore');
    const pessoaForm = document.getElementById('pessoaForm');
    const registroAtualContainer = document.getElementById('registroAtualContainer');
    const registrosLista = document.getElementById('registrosLista');
    const filtroNome = document.getElementById('filtroNome');
    const formGerenciar = document.getElementById('formGerenciar');
    const editarForm = document.getElementById('editarForm');
    const btnCancelarEditar = document.getElementById('btnCancelarEditar');
    const vinculosLista = document.getElementById('vinculosLista');
    const selectPessoaVinculo = document.getElementById('selectPessoaVinculo');
    const btnAdicionarVinculo = document.getElementById('btnAdicionarVinculo');
    const btnExportarJSON = document.getElementById('btnExportarJSON');
    const inputImportJSON = document.getElementById('inputImportJSON');
    const btnExcluirRegistro = document.getElementById('btnExcluirRegistro');
    const selectPessoaCentral = document.getElementById('selectPessoaCentral');
    const arvoreContainer = document.getElementById('arvoreContainer');

    // ========================================================
    // ESTADO GLOBAL
    // ========================================================
    let banco = [];
    let ultimoRegistro = null;
    let registroEditando = null;

    // ========================================================
    // FUNÇÕES UTILITÁRIAS
    // ========================================================
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

    const garantirRelacaoUnica = (array, id) => {
        if (!Array.isArray(array)) array = [];
        if (!array.includes(id)) array.push(id);
        return array;
    };

    const extrairAno = (dataStr) => {
        if (!dataStr) return '';
        const match = dataStr.match(/\d{4}/);
        return match ? match[0] : '';
    };

    const obterRelacao = (pessoa, pessoaCentral) => {
        if (!pessoaCentral) return '';
        
        if (pessoaCentral.pais && pessoaCentral.pais.includes(pessoa.id)) {
            return pessoa.sexo === 'M' ? 'pai' : 'mãe';
        }
        if (pessoaCentral.filhos && pessoaCentral.filhos.includes(pessoa.id)) {
            return pessoa.sexo === 'M' ? 'filho' : 'filha';
        }
        if (pessoaCentral.conjuge && pessoaCentral.conjuge.includes(pessoa.id)) {
            return 'cônjuge';
        }
        return '';
    };

    // ========================================================
    // LÓGICA PRINCIPAL (CADASTRO, EDIÇÃO, VÍNCULO)
    // ========================================================

    // Função de navegação entre abas
    const ativarSecao = (secaoAtiva, btnAtivo) => {
        [secNovaPessoa, secGerenciar, secVisualizarArvore].forEach(sec => sec.classList.remove('active'));
        [btnNovaPessoa, btnGerenciar, btnVisualizarArvore].forEach(btn => btn.classList.remove('active'));
        secaoAtiva.classList.add('active');
        btnAtivo.classList.add('active');
        
        if (secaoAtiva === secGerenciar) {
            atualizarListaRegistros();
        } else if (secaoAtiva === secVisualizarArvore) {
            popularSelectPessoaCentral();
        }
    };

    // Mostra o último registro criado
    function exibirRegistroAtual() {
        if (!ultimoRegistro) {
            registroAtualContainer.textContent = 'Nenhum registro criado nesta sessão.';
            return;
        }
        registroAtualContainer.textContent = `Último registro criado: ${ultimoRegistro.nome} (ID: ${ultimoRegistro.id})`;
    }

    // Atualiza a lista na aba "Gerenciar"
    function atualizarListaRegistros() {
        const termoFiltro = filtroNome.value.toLowerCase();
        const pessoasFiltradas = banco.filter(p => p.nome.toLowerCase().includes(termoFiltro));
        registrosLista.innerHTML = '';

        if (pessoasFiltradas.length === 0) {
            registrosLista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum registro encontrado.</p>';
            return;
        }

        pessoasFiltradas.forEach(pessoa => {
            const item = document.createElement('div');
            item.className = 'registro-item';
            const infoExtra = [pessoa.sexo, pessoa.nascimento || 'N/D'].filter(Boolean).join(' | ');
            const totalPais = pessoa.pais ? pessoa.pais.length : 0;

            item.innerHTML = `
                <div class="cabecalho-pessoa">
                    <h4>${pessoa.nome}</h4>
                    <small>ID: ${pessoa.id} | ${infoExtra}</small>
                </div>
                <div class="indicadores-bloco">
                    <span title="Cônjuge">${pessoa.conjuge ? pessoa.conjuge.length : 0}</span>
                    <span title="Filhos">${pessoa.filhos ? pessoa.filhos.length : 0}</span>
                    <span title="Pais">${totalPais}</span>
                </div>
                <div class="cabecalho-acoes">
                    <button class="btn-editar" onclick="carregarParaEdicao('${pessoa.id}')">Editar</button>
                </div>
            `;
            registrosLista.appendChild(item);
        });
    }

    // Carrega dados da pessoa para o formulário de edição
    window.carregarParaEdicao = function(id) {
        const pessoa = banco.find(p => p.id === id);
        if (!pessoa) return;
        registroEditando = pessoa;
        formGerenciar.style.display = 'block';
        document.getElementById('editarId').value = pessoa.id;
        document.getElementById('editarNome').value = pessoa.nome;
        document.getElementById('editarSexo').value = pessoa.sexo;
        document.getElementById('editarNascimento').value = pessoa.nascimento || '';
        document.getElementById('editarFalecimento').value = pessoa.falecimento || '';
        document.getElementById('editarProfissao').value = pessoa.profissao || '';
        document.getElementById('editarCidade').value = pessoa.cidade_pais_principal || '';
        carregarVinculosParaEdicao(pessoa);
        selectPessoaVinculo.innerHTML = '<option value="">Selecione para vincular...</option>';
        banco.filter(p => p.id !== pessoa.id).forEach(p => {
            const option = document.createElement("option");
            option.value = p.id;
            option.textContent = p.nome;
            selectPessoaVinculo.appendChild(option);
        });
        formGerenciar.scrollIntoView({ behavior: 'smooth' });
    };

    // Mostra os vínculos atuais na tela de edição
    function carregarVinculosParaEdicao(pessoa) {
        vinculosLista.innerHTML = '';
        const criarListaItem = (titulo, ids) => {
            if (!ids || ids.length === 0) return '';
            const nomes = ids.map(id => {
                const p = banco.find(p => p.id === id);
                return p ? p.nome : 'ID não encontrado';
            }).join(', ');
            return `<li><strong>${titulo}:</strong> ${nomes}</li>`;
        };
        let html = '<ul>';
        html += criarListaItem('Pais', pessoa.pais);
        html += criarListaItem('Cônjuge(s)', pessoa.conjuge);
        html += criarListaItem('Filhos', pessoa.filhos);
        html += '</ul>';
        vinculosLista.innerHTML = html;
    }

    // ========================================================
    // FUNÇÕES DE VISUALIZAÇÃO DA ÁRVORE
    // ========================================================

    function popularSelectPessoaCentral() {
        selectPessoaCentral.innerHTML = '<option value="">Escolha uma pessoa...</option>';
        banco.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nome;
            selectPessoaCentral.appendChild(option);
        });
    }

    function buscarAscendentes(pessoaId, geracao = 0) {
        if (geracao >= 2) return []; // Limita a 2 gerações (pais e avós)
        
        const pessoa = banco.find(p => p.id === pessoaId);
        if (!pessoa || !pessoa.pais || pessoa.pais.length === 0) return [];

        let resultado = [];
        pessoa.pais.forEach(paiId => {
            const pai = banco.find(p => p.id === paiId);
            if (pai) {
                resultado.push({ pessoa: pai, geracao: geracao });
                // Busca recursivamente os pais deste pai (avós)
                resultado = resultado.concat(buscarAscendentes(paiId, geracao + 1));
            }
        });
        return resultado;
    }

    function buscarDescendentes(pessoaId, geracao = 0) {
        if (geracao >= 2) return []; // Limita a 2 gerações (filhos e netos)
        
        const pessoa = banco.find(p => p.id === pessoaId);
        if (!pessoa || !pessoa.filhos || pessoa.filhos.length === 0) return [];

        let resultado = [];
        pessoa.filhos.forEach(filhoId => {
            const filho = banco.find(p => p.id === filhoId);
            if (filho) {
                resultado.push({ pessoa: filho, geracao: geracao });
                // Busca recursivamente os filhos deste filho (netos)
                resultado = resultado.concat(buscarDescendentes(filhoId, geracao + 1));
            }
        });
        return resultado;
    }

    function renderizarArvore() {
        const pessoaCentralId = selectPessoaCentral.value;
        arvoreContainer.innerHTML = '';

        if (!pessoaCentralId) {
            arvoreContainer.innerHTML = '<div class="arvore-vazia">Selecione uma pessoa para visualizar a árvore genealógica.</div>';
            return;
        }

        const pessoaCentral = banco.find(p => p.id === pessoaCentralId);
        if (!pessoaCentral) return;

        // Busca todos os dados
        const ascendentes = buscarAscendentes(pessoaCentralId);
        const descendentes = buscarDescendentes(pessoaCentralId);
        
        const avos = ascendentes.filter(a => a.geracao === 1);
        const pais = ascendentes.filter(a => a.geracao === 0);
        const filhos = descendentes.filter(d => d.geracao === 0);
        const netos = descendentes.filter(d => d.geracao === 1);
        
        const conjuges = pessoaCentral.conjuge ? pessoaCentral.conjuge.map(id => banco.find(p => p.id === id)).filter(Boolean) : [];

        // Renderiza avós
        if (avos.length > 0) {
            const secaoAvos = criarSecao('📊 AVÓS', avos.map(a => a.pessoa), pessoaCentral);
            arvoreContainer.appendChild(secaoAvos);
        }

        // Renderiza pais
        if (pais.length > 0) {
            const secaoPais = criarSecao('👨‍👩 PAIS', pais.map(p => p.pessoa), pessoaCentral);
            arvoreContainer.appendChild(secaoPais);
        }

        // Renderiza pessoa central
        const anoCentral = extrairAno(pessoaCentral.nascimento);
        const divCentral = document.createElement('div');
        divCentral.className = 'pessoa-central';
        divCentral.textContent = `${pessoaCentral.nome}${anoCentral ? ' (' + anoCentral + ')' : ''}`;
        arvoreContainer.appendChild(divCentral);

        // Renderiza cônjuges
        if (conjuges.length > 0) {
            const secaoConjuges = criarSecao('💑 CÔNJUGES', conjuges, pessoaCentral);
            arvoreContainer.appendChild(secaoConjuges);
        }

        // Renderiza filhos
        if (filhos.length > 0) {
            const secaoFilhos = criarSecao('👶 FILHOS', filhos.map(f => f.pessoa), pessoaCentral);
            arvoreContainer.appendChild(secaoFilhos);
        }

        // Renderiza netos
        if (netos.length > 0) {
            const secaoNetos = criarSecao('👦 NETOS', netos.map(n => n.pessoa), pessoaCentral);
            arvoreContainer.appendChild(secaoNetos);
        }

        // Mensagem se não houver relações
        if (avos.length === 0 && pais.length === 0 && filhos.length === 0 && netos.length === 0 && conjuges.length === 0) {
            const msgVazia = document.createElement('div');
            msgVazia.className = 'arvore-vazia';
            msgVazia.textContent = 'Esta pessoa não possui vínculos cadastrados ainda.';
            arvoreContainer.appendChild(msgVazia);
        }
    }

    function criarSecao(titulo, pessoas, pessoaCentral) {
        const secao = document.createElement('div');
        secao.className = 'secao-arvore';
        
        const h4 = document.createElement('h4');
        h4.textContent = titulo;
        secao.appendChild(h4);

        const ul = document.createElement('ul');
        pessoas.forEach(pessoa => {
            const li = document.createElement('li');
            const ano = extrairAno(pessoa.nascimento);
            const relacao = obterRelacao(pessoa, pessoaCentral);
            li.textContent = `${pessoa.nome}${ano ? ' (' + ano : ''}${relacao ? ', ' + relacao : ''}${ano ? ')' : ''}`;
            ul.appendChild(li);
        });
        secao.appendChild(ul);
        
        return secao;
    }

    // ========================================================
    // EVENT LISTENERS
    // ========================================================
    btnNovaPessoa.addEventListener('click', () => ativarSecao(secNovaPessoa, btnNovaPessoa));
    btnGerenciar.addEventListener('click', () => ativarSecao(secGerenciar, btnGerenciar));
    btnVisualizarArvore.addEventListener('click', () => ativarSecao(secVisualizarArvore, btnVisualizarArvore));

    selectPessoaCentral.addEventListener('change', renderizarArvore);

    pessoaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(pessoaForm);
        const novaPessoa = {
            id: gerarId(),
            nome: formData.get('nome'),
            sexo: formData.get('sexo'),
            nascimento: formData.get('nascimento'),
            falecimento: formData.get('falecimento'),
            profissao: formData.get('profissao'),
            cidade_pais_principal: formData.get('cidade_pais_principal'),
            pais: [], filhos: [], conjuge: []
        };
        banco.push(novaPessoa);
        salvarBancoLocal(banco);
        ultimoRegistro = novaPessoa;
        exibirRegistroAtual();
        pessoaForm.reset();
        alert(`${novaPessoa.nome} cadastrado(a) com sucesso!`);
    });

    editarForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!registroEditando) return;
        const idx = banco.findIndex(p => p.id === registroEditando.id);
        if (idx === -1) return;
        const formData = new FormData(editarForm);
        banco[idx].nome = formData.get('editarNome');
        banco[idx].sexo = formData.get('editarSexo');
        banco[idx].nascimento = formData.get('editarNascimento');
        banco[idx].falecimento = formData.get('editarFalecimento');
        banco[idx].profissao = formData.get('editarProfissao');
        banco[idx].cidade_pais_principal = formData.get('editarCidade');
        salvarBancoLocal(banco);
        atualizarListaRegistros();
        formGerenciar.style.display = 'none';
        registroEditando = null;
        alert("Registro atualizado com sucesso!");
    });
    
    btnCancelarEditar.addEventListener('click', () => {
        formGerenciar.style.display = 'none';
        registroEditando = null;
    });

    filtroNome.addEventListener('input', atualizarListaRegistros);

    btnAdicionarVinculo.addEventListener('click', () => {
        if (!registroEditando) return;
        const idVinculo = selectPessoaVinculo.value;
        const tipoVinculoRadio = document.querySelector('input[name="tipoVinculoNovo"]:checked');
        if (!idVinculo || !tipoVinculoRadio) {
            alert('Selecione uma pessoa e um tipo de vínculo.');
            return;
        }
        const pessoaEditada = banco.find(p => p.id === registroEditando.id);
        const pessoaVinculo = banco.find(p => p.id === idVinculo);
        const tipoVinculo = tipoVinculoRadio.value;
        if (tipoVinculo === 'pai') {
            pessoaEditada.filhos = garantirRelacaoUnica(pessoaEditada.filhos, pessoaVinculo.id);
            pessoaVinculo.pais = garantirRelacaoUnica(pessoaVinculo.pais, pessoaEditada.id);
        } else if (tipoVinculo === 'filho') {
            pessoaEditada.pais = garantirRelacaoUnica(pessoaEditada.pais, pessoaVinculo.id);
            pessoaVinculo.filhos = garantirRelacaoUnica(pessoaVinculo.filhos, pessoaEditada.id);
        } else if (tipoVinculo === 'conjuge') {
            pessoaEditada.conjuge = garantirRelacaoUnica(pessoaEditada.conjuge, pessoaVinculo.id);
            pessoaVinculo.conjuge = garantirRelacaoUnica(pessoaVinculo.conjuge, pessoaEditada.id);
        }
        salvarBancoLocal(banco);
        carregarParaEdicao(registroEditando.id);
        atualizarListaRegistros();
        tipoVinculoRadio.checked = false;
        alert("Vínculo adicionado com sucesso!");
    });

    btnExportarJSON.addEventListener('click', () => {
        if (banco.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const jsonString = JSON.stringify(banco, null, 2);
        const blob = new Blob([jsonString], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'arvore-genealogica.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    inputImportJSON.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dadosImportados = JSON.parse(e.target.result);
                if (Array.isArray(dadosImportados)) {
                    if (confirm(`Isso substituirá os ${banco.length} registros atuais por ${dadosImportados.length} novos registros. Deseja continuar?`)) {
                        banco = dadosImportados;
                        salvarBancoLocal(banco);
                        atualizarListaRegistros();
                        formGerenciar.style.display = 'none';
                        alert("Dados importados com sucesso!");
                    }
                } else {
                    alert("Erro: O arquivo JSON não é um array válido de registros.");
                }
            } catch (error) {
                alert("Erro ao ler o arquivo JSON. Verifique o formato.");
            }
        };
        reader.readAsText(file);
    });

    // ========================================================
    // INICIALIZAÇÃO
    // ========================================================
    banco = carregarBancoLocal();
    ativarSecao(secNovaPessoa, btnNovaPessoa);
    console.log("Aplicativo iniciado.");
});
