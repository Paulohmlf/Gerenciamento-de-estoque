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

// URL base da API
const API_URL = 'http://127.0.0.1:5000/api/produtos';

// Referências aos campos do formulário
const form = document.getElementById('form-edicao-produto');
const inputNome = document.getElementById('nome');
const inputCodInterno = document.getElementById('codigo_interno');
const inputQuantidade = document.getElementById('quantidade');
const inputPreco = document.getElementById('preco');
const inputCategoria = document.getElementById('categoria');
const inputLocalizacao = document.getElementById('localizacao');
const inputFornecedor = document.getElementById('fornecedor');
const inputDescricao = document.getElementById('descricao');

// Variável para guardar os dados originais
let dadosOriginais = {};

// 1. LER O ID DA URL
const urlParams = new URLSearchParams(window.location.search);
const idProduto = urlParams.get('id');

// Se não tiver ID, volta para a home
if (!idProduto) {
    alert('❌ ID da peça não encontrado.');
    window.location.href = 'index.html';
}

// 2. BUSCAR OS DADOS ATUAIS DA PEÇA
async function carregarDadosProduto() {
    try {
        const response = await fetch(`${API_URL}/${idProduto}`, {
            headers: {
                'Authorization': `Bearer ${tokenArmazenado}`,
                'Content-Type': 'application/json'
            }
        });

        // Verifica se o token expirou
        if (response.status === 401) {
            alert('⚠️ Sua sessão expirou! Faça login novamente.');
            fazerLogout();
            return;
        }

        if (!response.ok) {
            throw new Error('Peça não encontrada');
        }

        const produto = await response.json();
        
        // Guarda os dados originais
        dadosOriginais = { ...produto };

        // Preenche o formulário com os dados da peça
        inputNome.value = produto.nome || '';
        inputCodInterno.value = produto.codigo_interno || '';
        inputQuantidade.value = produto.quantidade || 0;
        inputPreco.value = produto.preco || '';
        inputCategoria.value = produto.categoria || '';
        inputLocalizacao.value = produto.localizacao || '';
        inputFornecedor.value = produto.fornecedor || '';
        inputDescricao.value = produto.descricao || '';

        // Feedback visual de que carregou
        inputNome.style.borderColor = '#4CAF50';
        setTimeout(() => {
            inputNome.style.borderColor = '';
        }, 1000);

    } catch (error) {
        console.error('Erro ao carregar peça:', error);
        alert('❌ Erro ao carregar os dados da peça.\n\nA peça pode ter sido excluída ou não existe.');
        window.location.href = 'index.html';
    }
}

// Carrega os dados assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosProduto();
    
    // Validações em tempo real
    inputQuantidade.addEventListener('input', () => {
        if (inputQuantidade.value < 0) {
            inputQuantidade.value = 0;
        }
    });
    
    inputPreco.addEventListener('input', () => {
        if (inputPreco.value < 0) {
            inputPreco.value = 0;
        }
    });
});

// Função para resetar o formulário aos valores originais
function resetarFormulario() {
    const confirmar = confirm(
        '🔄 DESFAZER ALTERAÇÕES\n\n' +
        'Isso vai restaurar todos os dados originais da peça.\n\n' +
        'Deseja continuar?'
    );
    
    if (confirmar) {
        inputNome.value = dadosOriginais.nome || '';
        inputCodInterno.value = dadosOriginais.codigo_interno || '';
        inputQuantidade.value = dadosOriginais.quantidade || 0;
        inputPreco.value = dadosOriginais.preco || '';
        inputCategoria.value = dadosOriginais.categoria || '';
        inputLocalizacao.value = dadosOriginais.localizacao || '';
        inputFornecedor.value = dadosOriginais.fornecedor || '';
        inputDescricao.value = dadosOriginais.descricao || '';
        
        alert('✅ Dados restaurados!');
    }
}

// 3. ENVIAR OS DADOS EDITADOS PARA A API
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Coleta os dados do formulário
    const dadosAtualizados = {
        nome: inputNome.value.trim(),
        codigo_interno: inputCodInterno.value.trim(),
        quantidade: parseInt(inputQuantidade.value) || 0,
        preco: parseFloat(inputPreco.value) || null,
        categoria: inputCategoria.value,
        localizacao: inputLocalizacao.value.trim(),
        fornecedor: inputFornecedor.value,
        descricao: inputDescricao.value.trim()
    };

    // Validação básica
    if (!dadosAtualizados.nome) {
        alert('❌ ATENÇÃO!\n\nO NOME DA PEÇA é obrigatório.\n\nPor favor, preencha o nome.');
        inputNome.focus();
        inputNome.style.borderColor = '#f44336';
        return;
    }

    // Confirmação antes de salvar
    const confirmar = confirm(
        '💾 SALVAR ALTERAÇÕES\n\n' +
        `Peça: ${dadosAtualizados.nome}\n` +
        `Estoque: ${dadosAtualizados.quantidade}\n` +
        `Preço: R$ ${dadosAtualizados.preco ? dadosAtualizados.preco.toFixed(2).replace('.', ',') : '0,00'}\n\n` +
        'Deseja salvar as alterações feitas?'
    );
    
    if (!confirmar) {
        return;
    }

    // Desabilita o botão durante o envio
    const btnSalvar = document.querySelector('.btn-salvar');
    const textoOriginal = btnSalvar.textContent;
    btnSalvar.disabled = true;
    btnSalvar.textContent = '⏳ Salvando...';
    btnSalvar.style.backgroundColor = '#ccc';

    try {
        const response = await fetch(`${API_URL}/${idProduto}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${tokenArmazenado}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosAtualizados)
        });

        // Verifica se o token expirou
        if (response.status === 401) {
            alert('⚠️ Sua sessão expirou! Faça login novamente.');
            fazerLogout();
            return;
        }

        if (response.ok) {
            const produtoAtualizado = await response.json();
            alert(
                `✅ SUCESSO!\n\n` +
                `A peça "${produtoAtualizado.nome}" foi atualizada com sucesso!\n\n` +
                `Voltando para a lista de peças...`
            );
            window.location.href = 'index.html';
        } else {
            const erro = await response.json();
            alert(
                `❌ ERRO AO SALVAR\n\n` +
                `${erro.erro || 'Erro desconhecido'}\n\n` +
                `Verifique os dados e tente novamente.`
            );
            
            btnSalvar.disabled = false;
            btnSalvar.textContent = textoOriginal;
            btnSalvar.style.backgroundColor = '';
        }

    } catch (error) {
        console.error('Erro ao atualizar peça:', error);
        alert(
            `❌ ERRO DE CONEXÃO\n\n` +
            `Não foi possível conectar com o sistema.\n\n` +
            `Verifique sua internet e tente novamente.`
        );
        
        btnSalvar.disabled = false;
        btnSalvar.textContent = textoOriginal;
        btnSalvar.style.backgroundColor = '';
    }
});
