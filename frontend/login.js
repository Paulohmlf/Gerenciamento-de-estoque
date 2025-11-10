// URL da API de login
const API_URL = 'http://127.0.0.1:5000/api';

// Referências aos elementos
const form = document.getElementById('form-login');
const inputUsuario = document.getElementById('usuario');
const inputSenha = document.getElementById('senha');
const btnEntrar = document.getElementById('btn-entrar');
const mensagemErro = document.getElementById('mensagem-erro');
const mensagemSucesso = document.getElementById('mensagem-sucesso');

// Função para mostrar/ocultar senha
function toggleSenha() {
    const inputSenha = document.getElementById('senha');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (inputSenha.type === 'password') {
        inputSenha.type = 'text';
        toggleIcon.textContent = '🙈'; // Olho fechado
    } else {
        inputSenha.type = 'password';
        toggleIcon.textContent = '👁️'; // Olho aberto
    }
}

// Função para mostrar mensagem de erro
function mostrarErro(mensagem) {
    mensagemErro.textContent = mensagem;
    mensagemErro.style.display = 'block';
    mensagemSucesso.style.display = 'none';
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        mensagemErro.style.display = 'none';
    }, 5000);
}

// Função para mostrar mensagem de sucesso
function mostrarSucesso(mensagem) {
    mensagemSucesso.textContent = mensagem;
    mensagemSucesso.style.display = 'block';
    mensagemErro.style.display = 'none';
}

// Verificar se já está logado
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Se já tem token, redireciona para a página principal
        window.location.href = 'index.html';
    }
});

// Listener do formulário
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Desabilita o botão durante o envio
    btnEntrar.disabled = true;
    btnEntrar.textContent = 'Entrando...';
    
    // Coleta os dados
    const dadosLogin = {
        usuario: inputUsuario.value.trim(),
        senha: inputSenha.value
    };
    
    // Validação simples
    if (!dadosLogin.usuario || !dadosLogin.senha) {
        mostrarErro('❌ Por favor, preencha todos os campos!');
        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar';
        return;
    }
    
    try {
        // Envia requisição para a API
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosLogin)
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            // Login bem-sucedido
            mostrarSucesso('✅ Login realizado com sucesso! Redirecionando...');
            
            // Salva o token no localStorage
            localStorage.setItem('token', resultado.token);
            localStorage.setItem('usuario', resultado.usuario);
            
            // Redireciona após 1 segundo
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } else {
            // Erro no login
            mostrarErro(resultado.mensagem || '❌ Usuário ou senha incorretos!');
            btnEntrar.disabled = false;
            btnEntrar.textContent = 'Entrar';
        }
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        mostrarErro('❌ Erro ao conectar com o servidor. Tente novamente.');
        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar';
    }
});

// Pressionar Enter para fazer login
inputSenha.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        form.dispatchEvent(new Event('submit'));
    }
});
