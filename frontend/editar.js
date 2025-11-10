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

// 1. LER O ID DA URL
// ------------------------------------
const urlParams = new URLSearchParams(window.location.search);
const idProduto = urlParams.get('id');

// Se não tiver ID, volta para a home
if (!idProduto) {
    alert('ID do produto não encontrado.');
    window.location.href = 'index.html';
}

// 2. BUSCAR OS DADOS ATUAIS E PREENCHER O FORMULÁRIO
// ------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${API_URL}/${idProduto}`);
        if (!response.ok) {
            throw new Error('Produto não encontrado.');
        }
        const produto = await response.json();

        // Preenche o formulário com os dados do produto
        inputNome.value = produto.nome;
        inputCodInterno.value = produto.codigo_interno || '';
        inputQuantidade.value = produto.quantidade;
        inputPreco.value = produto.preco || '';
        inputCategoria.value = produto.categoria || '';
        inputLocalizacao.value = produto.localizacao || '';
        inputFornecedor.value = produto.fornecedor || '';
        inputDescricao.value = produto.descricao || '';

    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        alert(error.message);
        window.location.href = 'index.html';
    }
});

// 3. ENVIAR AS ALTERAÇÕES (SUBMIT)
// ------------------------------------
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede o recarregamento da página

    // Coleta os dados atualizados do formulário
    const dadosAtualizados = {
        nome: inputNome.value,
        codigo_interno: inputCodInterno.value,
        quantidade: parseInt(inputQuantidade.value) || 0,
        preco: parseFloat(inputPreco.value) || null,
        categoria: inputCategoria.value,
        localizacao: inputLocalizacao.value,
        fornecedor: inputFornecedor.value,
        descricao: inputDescricao.value,
    };

    try {
        // Envia a requisição PUT para a API
        const response = await fetch(`${API_URL}/${idProduto}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosAtualizados),
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || 'Erro ao atualizar produto');
        }

        alert('Produto atualizado com sucesso!');
        window.location.href = 'index.html'; // Volta para a lista

    } catch (error) {
        console.error('Erro na atualização:', error);
        alert(`Erro: ${error.message}`);
    }
});