// Define a URL da API para criar produtos
const API_URL = 'http://127.0.0.1:5000/api/produtos';

// Espera o DOM carregar para adicionar o "ouvinte" do formulário
document.addEventListener('DOMContentLoaded', () => {
    
    // Pega a referência do formulário no HTML
    const form = document.getElementById('form-cadastro-produto');
    
    // Adiciona um "ouvinte" para o evento de "submit" (envio) do formulário
    form.addEventListener('submit', async (event) => {
        // Impede o comportamento padrão do formulário (que recarregaria a página)
        event.preventDefault();

        // 1. Coletar os dados do formulário
        const dadosFormulario = {
            nome: document.getElementById('nome').value,
            codigo_interno: document.getElementById('codigo_interno').value,
            descricao: document.getElementById('descricao').value,
            // Converte quantidade e preço para números
            quantidade: parseInt(document.getElementById('quantidade').value) || 0,
            preco: parseFloat(document.getElementById('preco').value) || null,
            categoria: document.getElementById('categoria').value,
            localizacao: document.getElementById('localizacao').value,
            fornecedor: document.getElementById('fornecedor').value,
        };

        // 2. Enviar os dados para a API (POST)
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosFormulario), // Converte o objeto JS em JSON
            });

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.erro || 'Erro ao cadastrar produto');
            }

            // 3. Resposta de sucesso
            alert('Produto cadastrado com sucesso!');
            
            // Redireciona o usuário de volta para a página inicial (lista)
            window.location.href = 'index.html'; 

        } catch (error) {
            console.error('Erro no cadastro:', error);
            alert(`Erro: ${error.message}`);
        }
    });
});