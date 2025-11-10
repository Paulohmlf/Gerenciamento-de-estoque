// ====== PROTEÇÃO DE AUTENTICAÇÃO ======
// Verifica se o usuário está logado
const token = localStorage.getItem('token');
if (!token) {
    // Se não tiver token, redireciona para login
    window.location.href = 'login.html';
}

// Função para fazer logout
function fazerLogout() {
    if (confirm('🚪 Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
    }
}

// Adiciona o token em todas as requisições
const tokenArmazenado = localStorage.getItem('token');
// ====== FIM DA PROTEÇÃO ======

// Define a URL base da nossa API
const API_URL = 'http://127.0.0.1:5000/api/produtos';

// Espera o conteúdo da página carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();

    // Adiciona "ouvinte" na tabela para cliques (Event Delegation)
    const tabelaCorpo = document.getElementById('corpo-tabela-produtos');
    tabelaCorpo.addEventListener('click', (event) => {
        // Ouve cliques nos botões de Ver Detalhes
        if (event.target.classList.contains('btn-ver')) {
            const idProduto = event.target.dataset.id;
            verDetalhesProduto(idProduto);
        }

        // Ouve cliques nos botões de Editar
        if (event.target.classList.contains('btn-editar')) {
            const idProduto = event.target.dataset.id;
            editarProduto(idProduto);
        }

        // Ouve cliques nos botões de Imprimir
        if (event.target.classList.contains('btn-imprimir')) {
            const codInterno = event.target.dataset.codigo;
            imprimirBarcode(codInterno);
        }

        // Ouve cliques nos botões de Excluir
        if (event.target.classList.contains('btn-excluir')) {
            const idProduto = event.target.dataset.id;
            const linhaProduto = event.target.closest('tr');
            deletarProduto(idProduto, linhaProduto);
        }
    });
});

// Função para buscar os produtos da API e exibi-los
async function carregarProdutos() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${tokenArmazenado}`,
                'Content-Type': 'application/json'
            }
        });

        // Verifica se o token expirou ou está inválido
        if (response.status === 401) {
            alert('⚠️ Sua sessão expirou! Por favor, faça login novamente.');
            fazerLogout();
            return;
        }

        if (!response.ok) {
            throw new Error('Erro ao buscar peças da API');
        }

        const produtos = await response.json();
        const tabelaCorpo = document.getElementById('corpo-tabela-produtos');
        tabelaCorpo.innerHTML = ''; // Limpa a tabela

        // Se não houver produtos, exibe mensagem amigável
        if (produtos.length === 0) {
            tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="8" class="mensagem-vazio">
                        <h2>🔧 Nenhuma peça cadastrada ainda</h2>
                        <p>Você ainda não tem peças no sistema.</p>
                        <a href="cadastro.html" class="btn-adicionar" style="display: inline-block; margin-top: 1rem;">
                            ➕ Cadastrar Minha Primeira Peça
                        </a>
                    </td>
                </tr>
            `;
            atualizarContador(0);
            return;
        }

        // Cria as linhas da tabela com os produtos
        produtos.forEach(produto => {
            const tr = document.createElement('tr');
            tr.dataset.idProduto = produto.id;

            // Determina a cor do estoque (verde se tiver, vermelho se zero)
            const corEstoque = produto.quantidade > 0 ? '#4CAF50' : '#f44336';
            const statusEstoque = produto.quantidade > 0 ? '✅' : '⚠️';

            tr.innerHTML = `
                <td><strong>${produto.nome}</strong></td>
                <td>${produto.codigo_interno || '-'}</td>
                <td>${produto.categoria || 'Não especificado'}</td>
                <td style="text-align: center;">
                    <strong style="color: ${corEstoque}; font-size: 1.1rem;">
                        ${statusEstoque} ${produto.quantidade}
                    </strong>
                </td>
                <td>${produto.localizacao || 'Não informado'}</td>
                <td><strong>R$ ${produto.preco ? produto.preco.toFixed(2).replace('.', ',') : '0,00'}</strong></td>
                <td>${produto.fornecedor || 'Não informado'}</td>
                <td style="white-space: nowrap;">
                    <button 
                        class="btn-ver" 
                        data-id="${produto.id}"
                        title="Ver todos os detalhes da peça">
                        👁️ Ver
                    </button>
                    <button 
                        class="btn-editar" 
                        data-id="${produto.id}"
                        title="Editar informações da peça">
                        ✏️ Editar
                    </button>
                    <button 
                        class="btn-excluir" 
                        data-id="${produto.id}"
                        title="Excluir peça do estoque">
                        🗑️ Excluir
                    </button>
                    <button 
                        class="btn-imprimir" 
                        data-codigo="${produto.codigo_interno || produto.id}"
                        title="Imprimir código de barras">
                        🖨️ Código
                    </button>
                </td>
            `;

            tabelaCorpo.appendChild(tr);
        });

        // Atualiza o contador de produtos
        atualizarContador(produtos.length);

    } catch (error) {
        console.error('Erro ao carregar peças:', error);
        const tabelaCorpo = document.getElementById('corpo-tabela-produtos');
        tabelaCorpo.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #f44336;">
                    <h3>❌ Erro ao carregar peças</h3>
                    <p>Não foi possível conectar com o sistema.</p>
                    <button onclick="carregarProdutos()" class="btn-adicionar" style="margin-top: 1rem;">
                        🔄 Tentar Novamente
                    </button>
                </td>
            </tr>
        `;
    }
}

// Função para ver detalhes completos da peça
function verDetalhesProduto(id) {
    fetch(`${API_URL}/${id}`, {
        headers: {
            'Authorization': `Bearer ${tokenArmazenado}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 401) {
            alert('⚠️ Sua sessão expirou! Por favor, faça login novamente.');
            fazerLogout();
            return;
        }
        return response.json();
    })
    .then(produto => {
        if (produto) {
            // Monta a mensagem com informações da peça
            const statusEstoque = produto.quantidade > 0 ? '✅ Em estoque' : '⚠️ Sem estoque';
            
            const detalhes = `
🔧 INFORMAÇÕES DA PEÇA

▪️ Nome: ${produto.nome}
▪️ Código: ${produto.codigo_interno || 'Não informado'}
▪️ Tipo/Categoria: ${produto.categoria || 'Não informado'}
▪️ Quantidade em Estoque: ${produto.quantidade} ${statusEstoque}
▪️ Localização: ${produto.localizacao || 'Não informado'}
▪️ Preço: R$ ${produto.preco ? produto.preco.toFixed(2).replace('.', ',') : '0,00'}
▪️ Marca/Fabricante: ${produto.fornecedor || 'Não informado'}
▪️ Compatibilidade: ${produto.descricao || 'Não informado'}
            `;
            alert(detalhes);
        }
    })
    .catch(error => {
        console.error('Erro ao buscar detalhes:', error);
        alert('❌ Erro ao buscar informações da peça.');
    });
}

// Função para redirecionar para a página de edição
function editarProduto(id) {
    window.location.href = `editar.html?id=${id}`;
}

// Função para deletar uma peça
async function deletarProduto(id, linha) {
    // Confirmação CLARA antes de deletar
    const confirmacao = confirm(
        '⚠️ ATENÇÃO!\n\n' +
        'Você tem certeza que deseja EXCLUIR esta peça do estoque?\n\n' +
        '❌ Esta ação NÃO pode ser desfeita!\n\n' +
        'Clique em OK para EXCLUIR ou Cancelar para manter a peça.'
    );
    
    if (!confirmacao) {
        return; // Se o usuário cancelar, não faz nada
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${tokenArmazenado}`,
                'Content-Type': 'application/json'
            }
        });

        // Verifica se o token expirou
        if (response.status === 401) {
            alert('⚠️ Sua sessão expirou! Por favor, faça login novamente.');
            fazerLogout();
            return;
        }

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || 'Erro ao excluir peça');
        }

        // Remove a linha da tabela visualmente (animação suave)
        linha.style.transition = 'opacity 0.3s, transform 0.3s';
        linha.style.opacity = '0';
        linha.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            linha.remove();
            alert('✅ Peça excluída do estoque com sucesso!');
            
            // Verifica se não há mais produtos na tabela
            const tabelaCorpo = document.getElementById('corpo-tabela-produtos');
            if (tabelaCorpo.children.length === 0) {
                carregarProdutos(); // Recarrega para mostrar mensagem de "sem peças"
            } else {
                // Atualiza o contador
                atualizarContador(tabelaCorpo.children.length);
            }
        }, 300);

    } catch (error) {
        console.error('Erro ao deletar peça:', error);
        alert(`❌ Erro ao excluir peça:\n\n${error.message}\n\nTente novamente.`);
    }
}

// Função para imprimir o código de barras
async function imprimirBarcode(codigo) {
    if (!codigo) {
        alert('❌ Esta peça não tem código para imprimir.');
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/barcode/${codigo}`, {
            headers: {
                'Authorization': `Bearer ${tokenArmazenado}`
            }
        });

        // Verifica se o token expirou
        if (response.status === 401) {
            alert('⚠️ Sua sessão expirou! Por favor, faça login novamente.');
            fazerLogout();
            return;
        }

        if (!response.ok) {
            throw new Error('Erro ao gerar código de barras');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Abre uma nova janela para impressão
        const janelaImpressao = window.open(url, '_blank', 'width=600,height=400');
        
        if (janelaImpressao) {
            // Aguarda carregar e chama a função de impressão
            janelaImpressao.onload = () => {
                setTimeout(() => {
                    janelaImpressao.print();
                }, 250);
            };
        } else {
            alert('❌ Não foi possível abrir a janela de impressão.\n\nVerifique se o navegador não está bloqueando pop-ups.');
        }

    } catch (error) {
        console.error('Erro ao imprimir código de barras:', error);
        alert('❌ Erro ao gerar código de barras.\n\nTente novamente.');
    }
}

// ===== FUNÇÃO DE BUSCA EM TEMPO REAL =====
function buscarProduto() {
    const termoBusca = document.getElementById('campo-busca').value.toLowerCase().trim();
    const linhas = document.querySelectorAll('#corpo-tabela-produtos tr');
    let contagemVisivel = 0;
    
    linhas.forEach(linha => {
        // Ignora linhas de mensagem (sem produtos)
        if (linha.cells.length < 8) {
            return;
        }

        const nomePeca = linha.cells[0]?.textContent.toLowerCase() || '';
        const codigo = linha.cells[1]?.textContent.toLowerCase() || '';
        const categoria = linha.cells[2]?.textContent.toLowerCase() || '';
        const localizacao = linha.cells[4]?.textContent.toLowerCase() || '';
        const marca = linha.cells[6]?.textContent.toLowerCase() || '';
        
        // Busca em múltiplos campos (nome, código, categoria, localização, marca)
        if (nomePeca.includes(termoBusca) || 
            codigo.includes(termoBusca) || 
            categoria.includes(termoBusca) ||
            localizacao.includes(termoBusca) ||
            marca.includes(termoBusca)) {
            linha.style.display = '';
            contagemVisivel++;
        } else {
            linha.style.display = 'none';
        }
    });
    
    // Atualiza contador com resultados filtrados
    atualizarContador(contagemVisivel);
    
    // Mostra mensagem se não encontrou nada
    if (contagemVisivel === 0 && termoBusca !== '') {
        const tabelaCorpo = document.getElementById('corpo-tabela-produtos');
        if (tabelaCorpo.children.length > 0) {
            // Só mostra se há produtos mas nenhum corresponde à busca
            const primeiraLinha = tabelaCorpo.querySelector('tr:first-child');
            if (primeiraLinha && primeiraLinha.cells.length >= 8) {
                alert(
                    `🔍 Nenhuma peça encontrada\n\n` +
                    `Não foi encontrada nenhuma peça com o termo: "${termoBusca}"\n\n` +
                    `Tente procurar por:\n` +
                    `• Nome da peça\n` +
                    `• Código\n` +
                    `• Categoria\n` +
                    `• Localização\n` +
                    `• Marca/Fabricante`
                );
            }
        }
    }
}

// ===== FUNÇÃO PARA LIMPAR BUSCA =====
function limparBusca() {
    const campoBusca = document.getElementById('campo-busca');
    campoBusca.value = '';
    campoBusca.focus();
    buscarProduto();
}

// ===== FUNÇÃO PARA ATUALIZAR CONTADOR DE PRODUTOS =====
function atualizarContador(quantidade) {
    const elementoContador = document.getElementById('total-produtos');
    if (elementoContador) {
        elementoContador.textContent = quantidade;
    }
}
