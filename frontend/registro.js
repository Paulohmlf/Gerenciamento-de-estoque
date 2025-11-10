// URL da API de registro
const API_URL = 'http://127.0.0.1:5000/api';

// Referências aos elementos
const form = document.getElementById('form-registro');
const inputNomeCompleto = document.getElementById('nome_completo');
const inputUsuario = document.getElementById('usuario');
const inputSenha = document.getElementById('senha');
const inputConfirmarSenha = document.getElementById('confirmar_senha');
const btnRegistrar = document.getElementById('btn-registrar');
const mensagemErro = document.getElementById('mensagem-erro');
const mensagemSucesso = document.getElementById('mensagem-sucesso');

// Função para mostrar/ocultar senha
function toggleSenha(campoId) {
    const inputSenha = document.getElementById(campoId);
    const toggleIcon = inputSenha.nextElementSibling;
    
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
    
    // Rola para o topo para ver a mensagem
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
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
    
    // Rola para o topo para ver a mensagem
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validação do nome de usuário (sem espaços)
inputUsuario.addEventListener('input', (event) => {
    event.target.value = event.target.value.replace(/\s/g, '').toLowerCase();
});

// Listener do formulário
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Desabilita o botão durante o envio
    btnRegistrar.disabled = true;
    btnRegistrar.textContent = 'Criando conta...';
    
    // Coleta os dados
    const dadosRegistro = {
        usuario: inputUsuario.value.trim(),
        senha: inputSenha.value,
        nome_completo: inputNomeCompleto.value.trim()
    };
    
    // ===== VALIDAÇÕES =====
    
    // 1. Verifica se todos os campos estão preenchidos
    if (!dadosRegistro.nome_completo || !dadosRegistro.usuario || !dadosRegistro.senha) {
        mostrarErro('❌ Por favor, preencha todos os campos!');
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Criar Conta';
        return;
    }
    
    // 2. Verifica o tamanho mínimo do usuário
    if (dadosRegistro.usuario.length < 3) {
        mostrarErro('❌ O nome de usuário deve ter no mínimo 3 caracteres!');
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Criar Conta';
        inputUsuario.focus();
        return;
    }
    
    // 3. Verifica o tamanho mínimo da senha
    if (dadosRegistro.senha.length < 6) {
        mostrarErro('❌ A senha deve ter no mínimo 6 caracteres!');
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Criar Conta';
        inputSenha.focus();
        return;
    }
    
    // 4. Verifica se as senhas coincidem
    if (dadosRegistro.senha !== inputConfirmarSenha.value) {
        mostrarErro('❌ As senhas não coincidem! Digite novamente.');
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Criar Conta';
        inputConfirmarSenha.focus();
        return;
    }
    
    // 5. Verifica se o nome de usuário não tem espaços
    if (dadosRegistro.usuario.includes(' ')) {
        mostrarErro('❌ O nome de usuário não pode conter espaços!');
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Criar Conta';
        inputUsuario.focus();
        return;
    }
    
    try {
        // Envia requisição para a API
        const response = await fetch(`${API_URL}/usuario/criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosRegistro)
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            // Cadastro bem-sucedido
            mostrarSucesso('✅ Conta criada com sucesso! Redirecionando para o login...');
            
            // Limpa o formulário
            form.reset();
            
            // Redireciona para o login após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } else {
            // Erro no cadastro
            if (response.status === 409) {
                mostrarErro('❌ Este nome de usuário já está em uso. Escolha outro.');
            } else {
                mostrarErro(resultado.mensagem || '❌ Erro ao criar conta. Tente novamente.');
            }
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = 'Criar Conta';
        }
        
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        mostrarErro('❌ Erro ao conectar com o servidor. Tente novamente.');
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Criar Conta';
    }
});
