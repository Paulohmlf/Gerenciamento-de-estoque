// Define a URL base da nossa API
const API_URL = 'http://127.0.0.1:5000/api/produtos';

// Espera o conteúdo da página carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    
    // Adiciona "ouvinte" na tabela para cliques (Event Delegation)
    const tabelaCorpo = document.getElementById('corpo-tabela-produtos');
    
    tabelaCorpo.addEventListener('click', (event) => {
        // Ouve cliques nos botões de Imprimir
        if (event.target.classList.contains('btn-imprimir')) {
            const codInterno = event.target.dataset.codigo;
            imprimirBarcode(codInterno);
        }

        // ### NOVO: Ouve cliques nos botões de Excluir ###
        if (event.target.classList.contains('btn-excluir')) {
            // Pega o ID do produto guardado no 'data-id' do botão
            const idProduto = event.target.dataset.id;
            // Pega a linha da tabela (tr) que é o "pai" do "pai" do botão (td -> tr)
            const linhaProduto = event.target.closest('tr');
            
            deletarProduto(idProduto, linhaProduto);
        }
    });
});

// Função para buscar os produtos da API e exibi-los
async function carregarProdutos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Erro ao buscar produtos da API');
        }
        const produtos = await response.json();
        
        const tabelaCorpo = document.getElementById('corpo-tabela-produtos');
        tabelaCorpo.innerHTML = ''; // Limpa a tabela

        produtos.forEach(produto => {
            const tr = document.createElement('tr');
            tr.dataset.idProduto = produto.id; // Adiciona o ID na linha <tr>

            const barcodeUrl = `http://127.0.0.1:5000/api/barcode/${produto.codigo_interno}`;
            const nomeArquivo = `${produto.nome}-barcode.svg`;

            tr.innerHTML = `
                <td>${produto.id}</td>
                <td>${produto.nome}</td>
                <td>${produto.codigo_interno || 'N/A'}</td>
                <td>${produto.quantidade}</td>
                <td>${produto.categoria || 'N/A'}</td>
                <td>
                    <a href="${barcodeUrl}" download="${nomeArquivo}" class="btn-acao btn-download">Baixar</a>
                    <button class="btn-acao btn-imprimir" data-codigo="${produto.codigo_interno}">Imprimir</button>
                    <a href="editar.html?id=${produto.id}" class="btn-acao btn-editar">Editar</a>
                    <button class="btn-acao btn-excluir" data-id="${produto.id}">Excluir</button>
                </td>
            `;
            
            tabelaCorpo.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar os produtos.');
    }
}

/**
 * Função para imprimir um código de barras específico.
 * (O código desta função continua o mesmo de antes)
 */
function imprimirBarcode(codigoInterno) {
    const urlBarcode = `http://127.0.0.1:5000/api/barcode/${codigoInterno}`;
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    
    if (!printWindow) {
        alert("Por favor, habilite pop-ups para imprimir.");
        return;
    }
    printWindow.document.write(`
        <html>
        <head><title>Imprimir Código de Barras</title></head>
        <body style="text-align: center; margin-top: 20px;">
            <img src="${urlBarcode}" style="width: 300px;" />
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() { window.close(); }
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ### NOVO: Função para DELETAR um produto ###
async function deletarProduto(id, linhaElemento) {
    // 1. Pede confirmação
    const querDeletar = confirm('Tem certeza que deseja excluir este produto?');

    if (!querDeletar) {
        return; // Usuário cancelou
    }

    // 2. Envia requisição DELETE para a API
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || 'Erro ao deletar produto');
        }

        // 3. Remove a linha da tabela na tela
        linhaElemento.remove();
        alert('Produto deletado com sucesso!');

    } catch (error) {
        console.error('Erro ao deletar:', error);
        alert(`Erro: ${error.message}`);
    }
}