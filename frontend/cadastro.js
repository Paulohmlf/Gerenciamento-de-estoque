// ====== PROTEÇÃO DE AUTENTICAÇÃO ======
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

function fazerLogout() {
    if (confirm('🚪 Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
    }
}

const tokenArmazenado = localStorage.getItem('token');
// ====== FIM DA PROTEÇÃO ======

const API_URL = 'http://127.0.0.1:5000/api/produtos';

// Espera o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-cadastro-produto');
    
    // ===== VALIDAÇÃO EM TEMPO REAL =====
    
    // Validação do nome
    const inputNome = document.getElementById('nome');
    inputNome.addEventListener('input', () => {
        if (inputNome.value.trim().length > 0) {
            inputNome.style.borderColor = '#4CAF50';
        } else {
            inputNome.style.borderColor = '#f44336';
        }
    });
    
    // Validação da quantidade
    const inputQuantidade = document.getElementById('quantidade');
    inputQuantidade.addEventListener('input', () => {
        if (inputQuantidade.value < 0) {
            inputQuantidade.value = 0;
        }
    });
    
    // Validação do preço
    const inputPreco = document.getElementById('preco');
    inputPreco.addEventListener('input', () => {
        if (inputPreco.value < 0) {
            inputPreco.value = 0;
        }
    });

    // ===== ENVIO DO FORMULÁRIO =====
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Coleta os dados do formulário
        const dadosFormulario = {
            nome: document.getElementById('nome').value.trim(),
            codigo_interno: document.getElementById('codigo_interno').value.trim(),
            descricao: document.getElementById('descricao').value.trim(),
            quantidade: parseInt(document.getElementById('quantidade').value) || 0,
            preco: parseFloat(document.getElementById('preco').value) || null,
            categoria: document.getElementById('categoria').value.trim(),
            localizacao: document.getElementById('localizacao').value.trim(),
            fornecedor: document.getElementById('fornecedor').value.trim()
        };

        // ===== VALIDAÇÕES =====
        
        // 1. Nome é obrigatório
        if (!dadosFormulario.nome) {
            alert('❌ ATENÇÃO!\n\nO NOME DO PRODUTO é obrigatório.\n\nPor favor, digite o nome do produto que você quer cadastrar.');
            document.getElementById('nome').focus();
            document.getElementById('nome').style.borderColor = '#f44336';
            return;
        }

        // 2. Quantidade mínima
        if (dadosFormulario.quantidade < 0) {
            alert('❌ ATENÇÃO!\n\nA quantidade não pode ser negativa.\n\nDigite 0 se não tiver estoque.');
            document.getElementById('quantidade').focus();
            return;
        }

        // 3. Preço não pode ser negativo
        if (dadosFormulario.preco !== null && dadosFormulario.preco < 0) {
            alert('❌ ATENÇÃO!\n\nO preço não pode ser negativo.');
            document.getElementById('preco').focus();
            return;
        }

        // ===== CONFIRMAÇÃO ANTES DE SALVAR =====
        const confirmacao = confirm(
            `📦 CONFIRMAR CADASTRO\n\n` +
            `Produto: ${dadosFormulario.nome}\n` +
            `Quantidade: ${dadosFormulario.quantidade}\n` +
            `Preço: R$ ${dadosFormulario.preco ? dadosFormulario.preco.toFixed(2).replace('.', ',') : '0,00'}\n\n` +
            `✅ Clique em OK para CADASTRAR\n` +
            `❌ Clique em Cancelar para REVISAR`
        );

        if (!confirmacao) {
            return;
        }

        // Desabilita o botão durante o envio
        const btnSalvar = document.querySelector('.btn-salvar');
        const textoOriginal = btnSalvar.textContent;
        btnSalvar.disabled = true;
        btnSalvar.textContent = '⏳ Cadastrando...';
        btnSalvar.style.backgroundColor = '#ccc';

        try {
            // Envia para a API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenArmazenado}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosFormulario)
            });

            // Verifica se o token expirou
            if (response.status === 401) {
                alert('⚠️ Sua sessão expirou!\n\nPor favor, faça login novamente.');
                fazerLogout();
                return;
            }

            if (response.ok) {
                const produtoCriado = await response.json();
                
                // Mensagem de sucesso detalhada
                alert(
                    `✅ SUCESSO!\n\n` +
                    `O produto "${produtoCriado.nome}" foi cadastrado com sucesso!\n\n` +
                    `📊 Quantidade: ${produtoCriado.quantidade}\n` +
                    `💰 Preço: R$ ${produtoCriado.preco ? produtoCriado.preco.toFixed(2).replace('.', ',') : '0,00'}\n\n` +
                    `O que deseja fazer agora?`
                );
                
                // Limpa o formulário
                form.reset();
                document.getElementById('nome').style.borderColor = '';
                
                // Pergunta o que fazer
                const cadastrarOutro = confirm(
                    '📦 CADASTRAR OUTRO PRODUTO?\n\n' +
                    '✅ Clique em OK para cadastrar outro produto\n' +
                    '❌ Clique em Cancelar para ver a lista de produtos'
                );
                
                if (!cadastrarOutro) {
                    window.location.href = 'index.html';
                } else {
                    // Foca no primeiro campo
                    document.getElementById('nome').focus();
                    // Reabilita o botão
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = textoOriginal;
                    btnSalvar.style.backgroundColor = '';
                }
                
            } else {
                // Erro na API
                const erro = await response.json();
                alert(
                    `❌ ERRO AO CADASTRAR\n\n` +
                    `${erro.erro || 'Erro desconhecido'}\n\n` +
                    `Verifique os dados e tente novamente.`
                );
                
                // Reabilita o botão
                btnSalvar.disabled = false;
                btnSalvar.textContent = textoOriginal;
                btnSalvar.style.backgroundColor = '';
            }

        } catch (error) {
            console.error('Erro ao cadastrar produto:', error);
            alert(
                `❌ ERRO DE CONEXÃO\n\n` +
                `Não foi possível conectar com o sistema.\n\n` +
                `Verifique sua internet e tente novamente.`
            );
            
            // Reabilita o botão
            btnSalvar.disabled = false;
            btnSalvar.textContent = textoOriginal;
            btnSalvar.style.backgroundColor = '';
        }
    });

    // ===== BOTÃO LIMPAR =====
    const btnLimpar = document.querySelector('.btn-limpar');
    btnLimpar.addEventListener('click', () => {
        const confirmar = confirm(
            '🧹 LIMPAR TODOS OS CAMPOS?\n\n' +
            'Isso vai apagar tudo que você digitou.\n\n' +
            '✅ Clique em OK para LIMPAR\n' +
            '❌ Clique em Cancelar para MANTER'
        );
        
        if (confirmar) {
            document.getElementById('nome').style.borderColor = '';
            document.getElementById('nome').focus();
        } else {
            return false;
        }
    });
});
