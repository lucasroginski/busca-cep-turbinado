// Sistema de Cadastro de Clientes
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    if (usuarioLogado) {
        mostrarAreaUsuario();
    }
});

// Função para alternar entre abas
function mostrarAba(aba) {
    // Remover classe active de todas as abas e botões
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));
    
    // Adicionar classe active na aba selecionada
    if (aba === 'login') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else if (aba === 'cadastro') {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('cadastro-form').classList.add('active');
    }
}

// Validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Cadastrar cliente
function cadastrarCliente(event) {
    event.preventDefault();
    
    const nome = document.getElementById('cadastro-nome').value.trim();
    const email = document.getElementById('cadastro-email').value.trim();
    const senha = document.getElementById('cadastro-senha').value;
    const confirmarSenha = document.getElementById('cadastro-confirmar-senha').value;
    const mensagemDiv = document.getElementById('cadastro-mensagem');
    
    // Validações
    if (!validarEmail(email)) {
        mostrarMensagem(mensagemDiv, 'E-mail inválido!', 'erro');
        return;
    }
    
    if (senha !== confirmarSenha) {
        mostrarMensagem(mensagemDiv, 'As senhas não coincidem!', 'erro');
        return;
    }
    
    if (senha.length < 6) {
        mostrarMensagem(mensagemDiv, 'A senha deve ter pelo menos 6 caracteres!', 'erro');
        return;
    }
    
    // Verificar se email já existe
    if (clientes.some(cliente => cliente.email === email)) {
        mostrarMensagem(mensagemDiv, 'Este e-mail já está cadastrado!', 'erro');
        return;
    }
    
    // Cadastrar novo cliente
    const novoCliente = {
        id: Date.now(),
        nome: nome,
        email: email,
        senha: btoa(senha), // Simples codificação (não é segura para produção)
        dataCadastro: new Date().toISOString()
    };
    
    clientes.push(novoCliente);
    localStorage.setItem('clientes', JSON.stringify(clientes));
    
    mostrarMensagem(mensagemDiv, 'Cliente cadastrado com sucesso!', 'sucesso');
    
    // Limpar formulário
    document.getElementById('cadastro-nome').value = '';
    document.getElementById('cadastro-email').value = '';
    document.getElementById('cadastro-senha').value = '';
    document.getElementById('cadastro-confirmar-senha').value = '';
    
    // Mudar para aba de login após 2 segundos
    setTimeout(() => {
        mostrarAba('login');
        mensagemDiv.innerHTML = '';
    }, 2000);
}

// Fazer login
function fazerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    const mensagemDiv = document.getElementById('login-mensagem');
    
    // Validação de email
    if (!validarEmail(email)) {
        mostrarMensagem(mensagemDiv, 'E-mail inválido!', 'erro');
        return;
    }
    
    // Buscar cliente
    const cliente = clientes.find(c => c.email === email);
    
    if (!cliente) {
        mostrarMensagem(mensagemDiv, 'E-mail não encontrado!', 'erro');
        return;
    }
    
    // Verificar senha
    if (cliente.senha !== btoa(senha)) {
        mostrarMensagem(mensagemDiv, 'Senha incorreta!', 'erro');
        return;
    }
    
    // Login bem-sucedido
    usuarioLogado = {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email
    };
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    
    mostrarMensagem(mensagemDiv, 'Login realizado com sucesso!', 'sucesso');
    
    // Mostrar área do usuário após 1 segundo
    setTimeout(() => {
        mostrarAreaUsuario();
    }, 1000);
}

// Mostrar área do usuário logado
function mostrarAreaUsuario() {
    // Esconder formulários
    document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));
    document.querySelector('.tabs').style.display = 'none';
    
    // Mostrar área do usuário
    const areaUsuario = document.getElementById('area-usuario');
    areaUsuario.style.display = 'block';
    areaUsuario.classList.add('active');
    
    // Mostrar dados do usuário
    const dadosUsuario = document.getElementById('dados-usuario');
    dadosUsuario.innerHTML = `
        <p><strong>Nome:</strong> ${usuarioLogado.nome}</p>
        <p><strong>E-mail:</strong> ${usuarioLogado.email}</p>
        <p><strong>ID:</strong> ${usuarioLogado.id}</p>
    `;
}

// Fazer logout
function fazerLogout() {
    usuarioLogado = null;
    localStorage.removeItem('usuarioLogado');
    
    // Esconder área do usuário
    document.getElementById('area-usuario').style.display = 'none';
    document.getElementById('area-usuario').classList.remove('active');
    
    // Mostrar abas
    document.querySelector('.tabs').style.display = 'flex';
    
    // Mostrar formulário de login
    mostrarAba('login');
    
    // Limpar campos de login
    document.getElementById('login-email').value = '';
    document.getElementById('login-senha').value = '';
    document.getElementById('login-mensagem').innerHTML = '';
}

// Mostrar mensagens
function mostrarMensagem(div, mensagem, tipo) {
    const cor = tipo === 'erro' ? '#e74c3c' : '#27ae60';
    div.innerHTML = `<p style="color: ${cor}; font-weight: bold;">${mensagem}</p>`;
}