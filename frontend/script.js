// Define a URL base da nossa API
const API_URL = 'http://127.0.0.1:5000/api/produtos';

// Espera o conteúdo da página carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
});

// Função para buscar os produtos da API e exibi-los
async function carregarProdutos() {
    try {
        // Faz a requisição GET para a API
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar produtos da API');
        }

        const produtos = await response.json();
        
        // Pega a referência do corpo da tabela no HTML
        const tabelaCorpo = document.getElementById('corpo-tabela-produtos');
        tabelaCorpo.innerHTML = ''; // Limpa a tabela antes de preencher

        // Cria uma linha <tr> para cada produto
        produtos.forEach(produto => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${produto.id}</td>
                <td>${produto.nome}</td>
                <td>${produto.codigo_interno || 'N/A'}</td>
                <td>${produto.quantidade}</td>
                <td>${produto.categoria || 'N/A'}</td>
                <td>
                    <button>Editar</button>
                    <button>Excluir</button>
                </td>
            `;
            
            // Adiciona a linha (tr) ao corpo da tabela (tbody)
            tabelaCorpo.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar os produtos.');
    }
}