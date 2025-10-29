// ================================================================
// CONFIGURAÇÃO DO SUPABASE
// ================================================================
const SUPABASE_URL = 'https://keaimlhudjtijdujovdu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYWltbGh1ZGp0aWpkdWpvdmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTk5NTQsImV4cCI6MjA3NjUzNTk1NH0.xv_GSrMSAW555j-h6UmFOaoq7sIa47OxLZ4LXPMUErs';
const USER_EMAIL = 'aurich56@gmail.com';

// Inicializar Supabase
let supabase = null;
if (window.supabase) {
    const { createClient } = window.supabase;
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
    const btnNovaPessoa = document.getElementById('btnNovaPessoa');
    const btnGerenciar = document.getElementById('btnGerenciar');
    const btnVisualizarArvore = document.getElementById('btnVisualizarArvore');
    const btnSalvarSupabase = document.getElementById('btnSalvarSupabase');
    const btnCarregarSupabase = document.getElementById('btnCarregarSupabase');
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

    let banco = [];
    let ultimoRegistro = null;
    let registroEditando = null;

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

    const garantirArray = (valor) => {
        if (Array.isArray(valor)) return valor;
        if (typeof valor === 'string' && valor.trim() === '') return [];
        if (typeof valor === 'string') {
            try {
                const parsed = JSON.parse(valor);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const garantirRelacaoUnica = (array, id) => {
        let arr = garantirArray(array);
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

    banco = carregarBancoLocal();
    console.log('📊 Banco carregado:', banco);
    exibirRegistroAtual();

    const ativarSecao = (secaoAtiva, btnAtivo) => {
        [secNovaPessoa, secGerenciar, secVisualizarArvore].forEach(sec => {
            if (sec) sec.style.display = 'none';
        });
        [btnNovaPessoa, btnGerenciar, btnVisualizarArvore].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        if (secaoAtiva) secaoAtiva.style.display = 'block';
        if (btnAtivo) btnAtivo.classList.add('active');

        if (secaoAtiva === secGerenciar) {
            atualizarListaRegistros();
        } else if (secaoAtiva === secVisualizarArvore) {
            popularSelectPessoaCentral();
        }
    };

    if (btnNovaPessoa) btnNovaPessoa.addEventListener('click', () => ativarSecao(secNovaPessoa, btnNovaPessoa));
    if (btnGerenciar) btnGerenciar.addEventListener('click', () => ativarSecao(secGerenciar, btnGerenciar));
    if (btnVisualizarArvore) btnVisualizarArvore.addEventListener('click', () => ativarSecao(secVisualizarArvore, btnVisualizarArvore));

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
                conjuge: []
            };
            banco.push(novaPessoa);
            ultimoRegistro = novaPessoa;
            salvarBancoLocal(banco);
            console.log('✅ Nova pessoa criada:', novaPessoa);
            alert(`✅ Pessoa "${novaPessoa.nome}" cadastrada com ID: ${novaPessoa.id}`);
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
            const item = document.createElement('div');
            item.className = 'registro-item';
            const iconAniv = isAniversarianteProximo(pessoa.nascimento) ? '🎂 ' : '';
            const infoExtra = [pessoa.sexo, pessoa.nascimento || 'N/D'].filter(Boolean).join(' | ');
            const totalPais = garantirArray(pessoa.pais).length;
            const totalFilhos = garantirArray(pessoa.filhos).length;
            const totalConjuges = garantirArray(pessoa.conjuge).length;

            item.innerHTML = `
                <div style="flex: 1;">
                    <h4 style="margin: 0;">${iconAniv}${pessoa.nome}</h4>
                    <small>ID: ${pessoa.id} | ${infoExtra}</small>
                </div>
                <div style="display: flex; gap: 15px; width: 120px; text-align: center; font-weight: bold; font-size: 12px;">
                    <span title="Cônjuges">${totalConjuges}</span>
                    <span title="Pais">${totalPais}</span>
                    <span title="Filhos">${totalFilhos}</span>
                </div>
                <button class="btn-editar" data-id="${pessoa.id}">Editar</button>
            `;
            registrosLista.appendChild(item);
        });

        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                console.log('👂 Clicou em EDITAR. ID:', id);
                editarPessoa(id);
            });
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

        console.log('📋 Editando pessoa:', registroEditando);
        atualizarVinculosList();
        popularSelectVinculo();

        editarForm.scrollIntoView({ behavior: 'smooth' });
    }

    function atualizarVinculosList() {
        if (!vinculosLista || !registroEditando) return;
        vinculosLista.innerHTML = '';

        const vinculos = [];
        
        const pais = garantirArray(registroEditando.pais);
        pais.forEach(id => {
            const pai = banco.find(p => p.id === id);
            if (pai) vinculos.push({ tipo: 'pai', pessoa: pai });
        });
        
        const filhos = garantirArray(registroEditando.filhos);
        filhos.forEach(id => {
            const filho = banco.find(p => p.id === id);
            if (filho) vinculos.push({ tipo: 'filho', pessoa: filho });
        });
        
        const conjuges = garantirArray(registroEditando.conjuge);
        conjuges.forEach(id => {
            const conj = banco.find(p => p.id === id);
            if (conj) vinculos.push({ tipo: 'cônjuge', pessoa: conj });
        });

        console.log('🔗 Vínculos encontrados:', vinculos);

        if (vinculos.length === 0) {
            vinculosLista.innerHTML = '<p style="margin: 0; padding: 8px;">Nenhum vínculo registrado.</p>';
            return;
        }

        vinculos.forEach((vinc, idx) => {
            const item = document.createElement('div');
            item.innerHTML = `
                <span>${vinc.tipo}: ${vinc.pessoa.nome}</span>
                <button type="button" onclick="window.removerVinculo(${idx})">Remover</button>
            `;
            vinculosLista.appendChild(item);
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

    window.removerVinculo = (idx) => {
        if (!registroEditando) return;
        const vinculos = [];
        garantirArray(registroEditando.pais).forEach(id => vinculos.push({ tipo: 'pai', id }));
        garantirArray(registroEditando.filhos).forEach(id => vinculos.push({ tipo: 'filho', id }));
        garantirArray(registroEditando.conjuge).forEach(id => vinculos.push({ tipo: 'cônjuge', id }));

        if (idx >= 0 && idx < vinculos.length) {
            const vinc = vinculos[idx];
            if (vinc.tipo === 'pai') registroEditando.pais = garantirArray(registroEditando.pais).filter(id => id !== vinc.id);
            if (vinc.tipo === 'filho') registroEditando.filhos = garantirArray(registroEditando.filhos).filter(id => id !== vinc.id);
            if (vinc.tipo === 'cônjuge') registroEditando.conjuge = garantirArray(registroEditando.conjuge).filter(id => id !== vinc.id);
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

            console.log('✅ Vínculo adicionado:', relacao, pessoaId);
            salvarBancoLocal(banco);
            atualizarVinculosList();
            selectPessoaVinculo.value = '';
        });
    }

    const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
    if (btnSalvarEdicao) {
        btnSalvarEdicao.addEventListener('click', () => {
            if (!registroEditando) return;

            registroEditando.nome = (document.getElementById('edit-nome')?.value || '').toUpperCase();
            registroEditando.sexo = document.getElementById('edit-sexo')?.value || '';
            registroEditando.nascimento = document.getElementById('edit-nascimento')?.value || '';
            registroEditando.falecimento = document.getElementById('edit-falecimento')?.value || '';
            registroEditando.profissao = document.getElementById('edit-profissao')?.value || '';
            registroEditando.cidade_pais_principal = (document.getElementById('edit-cidade_pais')?.value || '').toUpperCase();
            
            salvarBancoLocal(banco);
            console.log('✅ Registro salvo:', registroEditando);
            alert('✅ Alterações salvas!');
            cancelarEdicao();
            atualizarListaRegistros();
        });
    }

    function cancelarEdicao() {
        registroEditando = null;
        if (editarForm) editarForm.style.display = 'none';
        if (registroAtualContainer2) registroAtualContainer2.style.display = 'none';
    }

    if (btnCancelarEditar) {
        btnCancelarEditar.addEventListener('click', cancelarEdicao);
    }

    if (btnExcluirRegistro) {
        btnExcluirRegistro.addEventListener('click', () => {
            if (!registroEditando || !confirm(`⚠️ Tem certeza que deseja excluir "${registroEditando.nome}"? Esta ação não pode ser desfeita.`)) return;
            
            banco = banco.filter(p => p.id !== registroEditando.id);
            
            banco.forEach(p => {
                p.pais = garantirArray(p.pais).filter(id => id !== registroEditando.id);
                p.filhos = garantirArray(p.filhos).filter(id => id !== registroEditando.id);
                p.conjuge = garantirArray(p.conjuge).filter(id => id !== registroEditando.id);
            });
            
            salvarBancoLocal(banco);
            alert('✅ Registro excluído!');
            cancelarEdicao();
            atualizarListaRegistros();
        });
    }

    if (filtroNome) {
        filtroNome.addEventListener('input', atualizarListaRegistros);
    }
    
    function popularSelectPessoaCentral() {
        if (!selectPessoaCentral) return;
        selectPessoaCentral.innerHTML = '<option value="">Escolha uma pessoa...</option>';
        banco.forEach(pessoa => {
            const option = document.createElement('option');
            option.value = pessoa.id;
            option.textContent = pessoa.nome;
            selectPessoaCentral.appendChild(option);
        });
    }

    if (selectPessoaCentral) {
        selectPessoaCentral.addEventListener('change', () => {
            const pessoaId = selectPessoaCentral.value;
            if (!pessoaId || !arvoreContainer) {
                arvoreContainer.innerHTML = '';
                return;
            };
            const pessoa = banco.find(p => p.id === pessoaId);
            if (!pessoa) return;
            renderizarArvore(pessoa);
        });
    }

    // ================================================================
    // FUNÇÃO DE RENDERIZAÇÃO DA ÁRVORE (COM PAIS ACIMA)
    // ================================================================
    function renderizarArvore(pessoa) {
        if (!arvoreContainer) return;
        
        const pais = garantirArray(pessoa.pais);
        const filhos = garantirArray(pessoa.filhos);
        const conjuges = garantirArray(pessoa.conjuge);
        
        let html = `<div style="text-align: center;">`;

        // 1. RENDERIZA OS PAIS PRIMEIRO
        if (pais.length > 0) {
            html += `<div style="margin-bottom: 20px;">`;
            html += `<h4 style="margin-bottom: 10px; color: #000; font-size: 16px; font-weight: bold;">👴 PAIS:</h4>`;
            pais.forEach(idPai => {
                const pai = banco.find(p => p.id === idPai);
                if (pai) {
                    html += `<div style="background-color: #e3f2fd; padding: 15px; margin: 8px auto; border-radius: 6px; font-weight: 600; border-left: 4px solid #2196F3; color: #000; font-size: 16px; max-width: 400px; word-wrap: break-word;">${pai.nome}</div>`;
                }
            });
            html += `</div>`;
        }
        
        // 2. RENDERIZA A PESSOA CENTRAL
        html += `<div style="border-top: 2px solid #ddd; padding-top: 20px; margin-top: 20px;">`;
        html += `<h3 style="color: #000; font-size: 24px; font-weight: bold; margin-bottom: 5px;">${pessoa.nome}</h3>`;
        html += `<small style="color: #666; font-weight: 600; font-size: 14px;">Nascimento: ${pessoa.nascimento || 'N/D'}</small>`;
        html += `</div>`;

        // 3. RENDERIZA CÔNJUGES E FILHOS
        if (conjuges.length > 0) {
            html += `<div style="margin-top: 20px;">`;
            html += `<h4 style="margin-bottom: 10px; color: #000; font-size: 16px; font-weight: bold;">⚭ CÔNJUGE(S):</h4>`;
            conjuges.forEach(idConj => {
                const conj = banco.find(p => p.id === idConj);
                if (conj) {
                    html += `<div style="background-color: #fff3e0; padding: 15px; margin: 8px auto; border-radius: 6px; font-weight: 600; border-left: 4px solid #FF9800; color: #000; font-size: 16px; max-width: 400px; word-wrap: break-word;">${conj.nome}</div>`;
                }
            });
            html += `</div>`;
        }

        if (filhos.length > 0) {
            html += `<div style="margin-top: 20px;">`;
            html += `<h4 style="margin-bottom: 10px; color: #000; font-size: 16px; font-weight: bold;">👶 FILHOS:</h4>`;
            filhos.forEach(idFilho => {
                const filho = banco.find(p => p.id === idFilho);
                if (filho) {
                    html += `<div style="background-color: #e8f5e9; padding: 15px; margin: 8px auto; border-radius: 6px; font-weight: 600; border-left: 4px solid #4CAF50; color: #000; font-size: 16px; max-width: 400px; word-wrap: break-word;">${filho.nome}</div>`;
                }
            });
            html += `</div>`;
        }

        if (pais.length === 0 && conjuges.length === 0 && filhos.length === 0) {
            html += `<p style="color: #000; font-style: italic; margin-top: 30px; font-size: 16px; font-weight: 600;">Nenhum vínculo registrado para esta pessoa.</p>`;
        }
        
        html += `</div>`;
        arvoreContainer.innerHTML = html;
        
        console.log('✅ Árvore renderizada com HTML:', html.length, 'caracteres');
    }

    if (btnExportarJSON) {
        btnExportarJSON.addEventListener('click', () => {
            if (banco.length === 0) {
                alert('ℹ️ Não há dados para exportar.');
                return;
            }
            const dataStr = JSON.stringify(banco, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `arvore_genealogica_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            alert('✅ Dados exportados com sucesso!');
        });
    }

    if (btnImportarJSON) {
        btnImportarJSON.addEventListener('click', () => inputImportJSON.click());
    }

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
    }

    async function salvarNoSupabase() {
        if (!supabase) {
            console.error('❌ Supabase não carregado!');
            alert('❌ Supabase não carregado!');
            return;
        }
        if (banco.length === 0) {
            alert('ℹ️ Não há dados para salvar.');
            return;
        }
        
        try {
            console.log('⏳ Salvando na nuvem...');
            alert('⏳ Salvando na nuvem...');
            
            const { error: deleteError } = await supabase
                .from('app_genealogia')
                .delete()
                .eq('user_id', USER_EMAIL);

            if (deleteError) throw deleteError;

            const dadosParaSalvar = banco.map(p => ({ ...p, user_id: USER_EMAIL }));

            const { error: insertError } = await supabase
                .from('app_genealogia')
                .insert(dadosParaSalvar);

            if (insertError) throw insertError;

            alert('✅ Dados salvos na nuvem com sucesso!');
            console.log('✅ Dados salvos na nuvem.');

        } catch (err) {
            console.error('❌ Erro ao salvar:', err);
            alert('❌ Erro ao salvar: ' + err.message);
        }
    }

    async function carregarDoSupabase() {
        if (!supabase) {
            console.error('❌ Supabase não carregado!');
            alert('❌ Supabase não carregado!');
            return;
        }
        try {
            console.log('⏳ Carregando dados da nuvem...');
            alert('⏳ Carregando dados da nuvem...');
            
            const { data, error } = await supabase
                .from('app_genealogia')
                .select('*')
                .eq('user_id', USER_EMAIL);

            if (error) {
                console.error('❌ Erro ao carregar:', error);
                alert('❌ Erro ao carregar: ' + error.message);
                return;
            }

            console.log('📊 Dados carregados do Supabase:', data);

            if (data && data.length > 0) {
                banco = data.map(item => ({
                    id: item.id,
                    nome: item.nome,
                    sexo: item.sexo || '',
                    nascimento: item.nascimento || '',
                    falecimento: item.falecimento || '',
                    profissao: item.profissao || '',
                    cidade_pais_principal: item.cidade_pais_principal || '',
                    pais: garantirArray(item.pais),
                    filhos: garantirArray(item.filhos),
                    conjuge: garantirArray(item.conjuge)
                }));
                
                console.log('✅ Dados convertidos:', banco);
                
                salvarBancoLocal(banco);
                alert('✅ Dados carregados da nuvem! (' + banco.length + ' pessoas)');
                ativarSecao(secGerenciar, btnGerenciar);
                atualizarListaRegistros();
            } else {
                alert('ℹ️ Nenhum dado encontrado na nuvem para este usuário.');
            }
        } catch (err) {
            console.error('❌ Erro:', err);
            alert('❌ Erro: ' + err.message);
        }
    }

    if (btnSalvarSupabase) {
        btnSalvarSupabase.addEventListener('click', salvarNoSupabase);
    }
    if (btnCarregarSupabase) {
        btnCarregarSupabase.addEventListener('click', carregarDoSupabase);
    }

    ativarSecao(secVisualizarArvore, btnVisualizarArvore);
});
