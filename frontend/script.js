// Define a URL base da nossa API
const API_URL = 'http://127.0.0.1:5000/api/produtos';

// Espera o conteúdo da página carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    
    // Adiciona "ouvinte" na tabela para cliques (Event Delegation)
    const tabelaCorpo = document.getElementById('corpo-tabela-produtos');
    
    // Ouve cliques nos botões de Imprimir
    tabelaCorpo.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-imprimir')) {
            const codInterno = event.target.dataset.codigo;
            imprimirBarcode(codInterno);
        }
    });

    // (Aqui adicionaremos os ouvintes de Excluir e Editar depois)

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
            
            // Define a URL do barcode para este produto
            const barcodeUrl = `http://127.0.0.1:5000/api/barcode/${produto.codigo_interno}`;
            // Define o nome do arquivo para download
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
                    
                    <button class="btn-acao btn-editar" data-id="${produto.id}">Editar</button>
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
 * Abre uma nova janela, insere a imagem e chama a impressão.
 */
function imprimirBarcode(codigoInterno) {
    const urlBarcode = `http://127.0.0.1:5000/api/barcode/${codigoInterno}`;
    
    // Abre uma nova janela pop-up
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    
    if (!printWindow) {
        alert("Por favor, habilite pop-ups para imprimir.");
        return;
    }

    // Escreve o conteúdo na nova janela
    printWindow.document.write(`
        <html>
        <head><title>Imprimir Código de Barras</title></head>
        <body style="text-align: center; margin-top: 20px;">
            <img src="${urlBarcode}" style="width: 300px;" />
            <script>
                // Espera a imagem carregar para chamar a impressão
                window.onload = function() {
                    window.print(); // Abre a caixa de diálogo de impressão
                    window.onafterprint = function() {
                         window.close(); // Fecha a janela após imprimir ou cancelar
                    }
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}