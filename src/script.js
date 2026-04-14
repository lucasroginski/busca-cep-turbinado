let clientes = [];
let produtos = [];
let movimentacoes = [];
let pedidos = [];
let clienteLogado = localStorage.getItem('clienteLogado') ? JSON.parse(localStorage.getItem('clienteLogado')) : null;
let usuarioLogado = localStorage.getItem('usuarioLogado') ? JSON.parse(localStorage.getItem('usuarioLogado')) : null;

// Configuração da API
const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async ()=>{
    if(usuarioLogado) await mostrarAreaUsuario();
    carregarClientesPublicos();
});

function mostrarAba(aba){
    document.querySelectorAll('.tab-btn').forEach(btn=>btn.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(form=>form.classList.remove('active'));
    
    const abaMap={
        'login':()=>{document.querySelector('.tab-btn:nth-child(2)').classList.add('active');document.getElementById('login-form').classList.add('active');atualizarInterfaceLogin()},
        'cadastro':()=>{document.querySelector('.tab-btn:nth-child(3)').classList.add('active');document.getElementById('cadastro-form').classList.add('active');atualizarInterfaceCadastro()},
        'cadastrar-produto':()=>{document.querySelector('.tab-btn:nth-child(4)').classList.add('active');document.getElementById('cadastrar-produto-form').classList.add('active')},
        'consultar-produto':()=>{document.querySelector('.tab-btn:nth-child(5)').classList.add('active');document.getElementById('consultar-produto-form').classList.add('active');buscarProdutos()},
        'movimentacoes':()=>{document.querySelector('.tab-btn:nth-child(6)').classList.add('active');document.getElementById('movimentacoes-form').classList.add('active');carregarProdutosMovimentacao();buscarMovimentacoes()},
        'gerenciar-pedidos':()=>{document.querySelector('.tab-btn:nth-child(7)').classList.add('active');document.getElementById('gerenciar-pedidos-form').classList.add('active');carregarTodosPedidos()},
        'fazer-pedido':()=>{document.querySelector('.tab-btn:nth-child(8)').classList.add('active');document.getElementById('fazer-pedido-form').classList.add('active');carregarProdutosParaPedido()},
        'meus-pedidos':()=>{document.querySelector('.tab-btn:nth-child(9)').classList.add('active');document.getElementById('meus-pedidos-form').classList.add('active');carregarMeusPedidos()},
        'usuario':()=>{atualizarInterfaceLogin();mostrarAba('login')},
        'cliente':()=>{atualizarInterfaceLogin();mostrarAba('login')}
    };
    
    if(abaMap[aba])abaMap[aba]();
}

function atualizarInterfaceLogin(){
    const tipoUsuario = document.getElementById('tipo-usuario').value;
    const tituloLogin = document.getElementById('login-titulo');
    const loginForm = document.getElementById('login-form-element');
    const usuariosSection = document.getElementById('login-usuarios-section');
    const listaTitulo = document.getElementById('lista-titulo');
    const verButton = usuariosSection.querySelector('button');
    
    console.log('atualizarInterfaceLogin chamado, tipoUsuario:', tipoUsuario);
    
    if(tipoUsuario === 'cliente'){
        tituloLogin.textContent = 'Login Cliente';
        loginForm.setAttribute('onsubmit', 'fazerLoginCliente(event)');
        usuariosSection.style.display = 'block';
        listaTitulo.textContent = 'Clientes Cadastrados';
        verButton.setAttribute('onclick', 'verClientesRegistrados()');
        verButton.textContent = '👥 Ver Todos os Clientes';
    } else {
        tituloLogin.textContent = 'Login Usuário';
        loginForm.setAttribute('onsubmit', 'fazerLogin(event)');
        usuariosSection.style.display = 'block';
        listaTitulo.textContent = 'Usuários Cadastrados';
        verButton.setAttribute('onclick', 'verUsuariosRegistrados()');
        verButton.textContent = '👥 Ver Todos os Usuários';
    }
}

function atualizarInterfaceCadastro(){
    const tipoUsuario = document.getElementById('tipo-usuario').value;
    const tituloCadastro = document.getElementById('cadastro-titulo');
    const cadastroForm = document.getElementById('cadastro-form-element');
    const camposCliente = document.getElementById('campos-cliente');
    
    console.log('atualizarInterfaceCadastro chamado, tipoUsuario:', tipoUsuario);
    
    if(tipoUsuario === 'cliente'){
        tituloCadastro.textContent = 'Cadastrar Cliente';
        cadastroForm.setAttribute('onsubmit', 'cadastrarCliente(event)');
        camposCliente.style.display = 'block';
        document.getElementById('cadastro-telefone').setAttribute('required', 'required');
        document.getElementById('cadastro-endereco').setAttribute('required', 'required');
    } else {
        tituloCadastro.textContent = 'Cadastrar Usuário';
        cadastroForm.setAttribute('onsubmit', 'cadastrarUsuario(event)');
        camposCliente.style.display = 'none';
        document.getElementById('cadastro-telefone').removeAttribute('required');
        document.getElementById('cadastro-endereco').removeAttribute('required');
    }
}

function validarEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}

function mostrarMensagem(div,mensagem,tipo){div.innerHTML=`<p style="color: ${tipo==='erro'?'#f44336':'#4caf50'};font-weight:bold;">${mensagem}</p>`}

// Funções da API
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro na requisição');
        }
        
        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

async function cadastrarUsuario(e){
    e.preventDefault();
    const nome=document.getElementById('cadastro-nome').value.trim();
    const email=document.getElementById('cadastro-email').value.trim();
    const senha=document.getElementById('cadastro-senha').value;
    const confirmarSenha=document.getElementById('cadastro-confirmar-senha').value;
    const msgDiv=document.getElementById('cadastro-mensagem');
    
    if(!validarEmail(email)){mostrarMensagem(msgDiv,'E-mail inválido!','erro');return}
    if(senha!==confirmarSenha){mostrarMensagem(msgDiv,'As senhas não coincidem!','erro');return}
    if(senha.length<6){mostrarMensagem(msgDiv,'Senha mínimo 6 caracteres!','erro');return}
    
    try {
        await apiRequest('/usuarios/cadastrar', {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha })
        });
        
        mostrarMensagem(msgDiv,'Usuário cadastrado!','sucesso');
        
        ['cadastro-nome','cadastro-email','cadastro-senha','cadastro-confirmar-senha','cadastro-telefone','cadastro-endereco'].forEach(id=>document.getElementById(id).value='');
        carregarClientesPublicos();
        setTimeout(()=>{mostrarAba('login');msgDiv.innerHTML=''},2000);
    } catch (error) {
        mostrarMensagem(msgDiv, error.message, 'erro');
    }
}

async function cadastrarCliente(e){
    e.preventDefault();
    console.log('cadastrarCliente chamado');
    
    const nome=document.getElementById('cadastro-nome').value.trim();
    const email=document.getElementById('cadastro-email').value.trim();
    const telefone=document.getElementById('cadastro-telefone').value.trim();
    const endereco=document.getElementById('cadastro-endereco').value.trim();
    const senha=document.getElementById('cadastro-senha').value;
    const confirmarSenha=document.getElementById('cadastro-confirmar-senha').value;
    const msgDiv=document.getElementById('cadastro-mensagem');
    
    console.log('Dados do formulário:', { nome, email, telefone, endereco, senha: '***' });
    
    if(!validarEmail(email)){mostrarMensagem(msgDiv,'E-mail inválido!','erro');return}
    if(senha!==confirmarSenha){mostrarMensagem(msgDiv,'As senhas não coincidem!','erro');return}
    if(senha.length<6){mostrarMensagem(msgDiv,'Senha mínimo 6 caracteres!','erro');return}
    if(!telefone || !endereco){mostrarMensagem(msgDiv,'Telefone e endereço são obrigatórios!','erro');return}
    
    try {
        console.log('Enviando requisição para API...');
        const response = await apiRequest('/clientes/cadastrar', {
            method: 'POST',
            body: JSON.stringify({ nome, email, telefone, endereco, senha })
        });
        
        console.log('Resposta da API:', response);
        mostrarMensagem(msgDiv,'Cliente cadastrado com sucesso!','sucesso');
        
        ['cadastro-nome','cadastro-email','cadastro-senha','cadastro-confirmar-senha','cadastro-telefone','cadastro-endereco'].forEach(id=>document.getElementById(id).value='');
        carregarClientesPublicos();
        setTimeout(()=>{mostrarAba('login');msgDiv.innerHTML=''},2000);
    } catch (error) {
        console.error('Erro no cadastro:', error);
        mostrarMensagem(msgDiv, error.message, 'erro');
    }
}

async function fazerLogin(e){
    e.preventDefault();
    const email=document.getElementById('login-email').value.trim();
    const senha=document.getElementById('login-senha').value;
    const msgDiv=document.getElementById('login-mensagem');
    
    if(!validarEmail(email)){mostrarMensagem(msgDiv,'E-mail inválido!','erro');return}
    
    try {
        const usuario = await apiRequest('/usuarios/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });
        
        usuarioLogado = usuario;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        mostrarMensagem(msgDiv,'Login realizado!','sucesso');
        setTimeout(()=>mostrarAreaUsuario(),1000);
    } catch (error) {
        mostrarMensagem(msgDiv, error.message, 'erro');
    }
}

async function mostrarAreaUsuario(){
    // Esconder botões de login/cadastro e select
    document.getElementById('tipo-usuario').style.display='none';
    document.querySelector('.tab-btn:nth-child(2)').style.display='none'; // Login
    document.querySelector('.tab-btn:nth-child(3)').style.display='none'; // Cadastro
    
    // Mostrar botões do usuário
    ['aba-produto','aba-consulta','aba-movimentacoes','aba-gerenciar-pedidos'].forEach(id=>document.getElementById(id).style.display='block');
    
    document.querySelectorAll('.form-container').forEach(form=>form.classList.remove('active'));
    const areaUsuario=document.getElementById('area-usuario');
    areaUsuario.style.display='block';
    areaUsuario.classList.add('active');
    
    // Carregar produtos do usuário
    try {
        produtos = await apiRequest(`/produtos/${usuarioLogado.id}`);
        const totalItens=produtos.reduce((sum,p)=>sum+p.quantidade,0);
        const itensBaixoEstoque=produtos.filter(p=>p.quantidade <= (p.quantidade_minima||5)).length;
        
        document.getElementById('dados-usuario').innerHTML=`
            <p><strong>Nome:</strong> ${usuarioLogado.nome}</p>
            <p><strong>E-mail:</strong> ${usuarioLogado.email}</p>
            <p><strong>Total de Itens:</strong> ${totalItens}</p>
            <p><strong>Alertas de Estoque:</strong> <span style="color:${itensBaixoEstoque>0?'#f44336':'#4caf50'}">${itensBaixoEstoque}</span></p>
            <div class="botoes-usuario">
                <button onclick="mostrarAba('cadastrar-produto')" class="btn-secondary">➕ Adicionar</button>
                <button onclick="mostrarAba('consultar-produto')" class="btn-secondary">📦 Estoque</button>
                <button onclick="mostrarAba('movimentacoes')" class="btn-secondary">📊 Movimentações</button>
                <button onclick="mostrarAba('gerenciar-pedidos')" class="btn-secondary">🛒 Gerenciar Pedidos</button>
            </div>`;
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        document.getElementById('dados-usuario').innerHTML=`
            <p><strong>Nome:</strong> ${usuarioLogado.nome}</p>
            <p><strong>E-mail:</strong> ${usuarioLogado.email}</p>
            <p><strong>Total de Itens:</strong> 0</p>
            <p><strong>Alertas de Estoque:</strong> <span style="color:#4caf50">0</span></p>
            <div class="botoes-usuario">
                <button onclick="mostrarAba('cadastrar-produto')" class="btn-secondary">➕ Adicionar</button>
                <button onclick="mostrarAba('consultar-produto')" class="btn-secondary">📦 Estoque</button>
                <button onclick="mostrarAba('movimentacoes')" class="btn-secondary">📊 Movimentações</button>
                <button onclick="mostrarAba('gerenciar-pedidos')" class="btn-secondary">🛒 Gerenciar Pedidos</button>
            </div>`;
    }
}

function fazerLogout(){
    usuarioLogado=null;
    localStorage.removeItem('usuarioLogado');
    document.getElementById('area-usuario').style.display='none';
    document.getElementById('area-usuario').classList.remove('active');
    
    // Restaurar elementos da interface
    document.getElementById('tipo-usuario').style.display='block';
    document.querySelector('.tab-btn:nth-child(2)').style.display='block'; // Login
    document.querySelector('.tab-btn:nth-child(3)').style.display='block'; // Cadastro
    ['aba-produto','aba-consulta','aba-movimentacoes','aba-gerenciar-pedidos'].forEach(id=>document.getElementById(id).style.display='none');
    
    mostrarAba('login');
    ['login-email','login-senha','login-mensagem'].forEach(id=>document.getElementById(id).value='');
}

async function cadastrarProduto(e){
    e.preventDefault();
    const nome=document.getElementById('produto-nome').value.trim();
    const codigo=document.getElementById('produto-codigo').value.trim();
    const descricao=document.getElementById('produto-descricao').value.trim();
    const preco=parseFloat(document.getElementById('produto-preco').value);
    const quantidade=parseInt(document.getElementById('produto-quantidade').value);
    const quantidadeMinima=parseInt(document.getElementById('produto-quantidade-minima').value);
    const categoria=document.getElementById('produto-categoria').value;
    const fornecedor=document.getElementById('produto-fornecedor').value.trim();
    const msgDiv=document.getElementById('produto-mensagem');
    
    if(!nome||!codigo||isNaN(preco)||isNaN(quantidade)||isNaN(quantidadeMinima)||!categoria){mostrarMensagem(msgDiv,'Preencha todos os campos obrigatórios!','erro');return}
    if(preco<0||quantidade<0||quantidadeMinima<0){mostrarMensagem(msgDiv,'Valores não podem ser negativos!','erro');return}
    
    try {
        await apiRequest('/produtos', {
            method: 'POST',
            body: JSON.stringify({
                nome,
                codigo,
                descricao,
                preco,
                quantidade,
                quantidade_minima: quantidadeMinima,
                categoria,
                fornecedor,
                usuario_id: usuarioLogado.id
            })
        });
        
        mostrarMensagem(msgDiv,'Item adicionado ao estoque!','sucesso');
        
        ['produto-nome','produto-codigo','produto-descricao','produto-preco','produto-quantidade','produto-quantidade-minima','produto-categoria','produto-fornecedor'].forEach(id=>document.getElementById(id).value='');
        setTimeout(()=>{mostrarAba('consultar-produto');msgDiv.innerHTML=''},2000);
    } catch (error) {
        mostrarMensagem(msgDiv, error.message, 'erro');
    }
}

async function buscarProdutos(){
    const termo=document.getElementById('busca-produto').value.toLowerCase();
    const categoria=document.getElementById('filtro-categoria').value;
    const statusEstoque=document.getElementById('filtro-estoque').value;
    const div=document.getElementById('produtos-encontrados');
    
    try {
        produtos = await apiRequest(`/produtos/${usuarioLogado.id}`);
        
        let filtrados = produtos;
        if(categoria)filtrados=filtrados.filter(p=>p.categoria===categoria);
        if(termo)filtrados=filtrados.filter(p=>p.nome.toLowerCase().includes(termo)||p.codigo.toLowerCase().includes(termo)||(p.descricao && p.descricao.toLowerCase().includes(termo)));
        
        if(statusEstoque){
            if(statusEstoque==='baixo'){
                filtrados=filtrados.filter(p=>p.quantidade <= (p.quantidade_minima||5) && p.quantidade > 0);
            }else if(statusEstoque==='zerado'){
                filtrados=filtrados.filter(p=>p.quantidade === 0);
            }else if(statusEstoque==='normal'){
                filtrados=filtrados.filter(p=>p.quantidade > (p.quantidade_minima||5));
            }
        }
        
        if(filtrados.length===0){div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhum item encontrado.</p>';return}
        
        const nomesCat={eletronico:'Eletrônico',roupa:'Roupa',alimento:'Alimento',livro:'Livro',moveis:'Móveis',ferramentas:'Ferramentas',outro:'Outro'};
        
        div.innerHTML=filtrados.map(p=>{
            const statusEstoqueItem = p.quantidade === 0 ? 'zerado' : p.quantidade <= (p.quantidade_minima||5) ? 'baixo' : 'normal';
            const corStatus = statusEstoqueItem === 'zerado' ? '#f44336' : statusEstoqueItem === 'baixo' ? '#ff9800' : '#4caf50';
            const textoStatus = statusEstoqueItem === 'zerado' ? 'Sem Estoque' : statusEstoqueItem === 'baixo' ? 'Estoque Baixo' : 'Normal';
            
            return `
            <div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid ${corStatus};">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                    <h4 style="margin:0;color:#333;">${p.nome}</h4>
                    <span style="background:${corStatus};color:white;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.7rem;font-weight:bold;">${textoStatus}</span>
                </div>
                <p style="margin:0.3rem 0;color:#6c757d;font-size:0.8rem;"><strong>Código:</strong> ${p.codigo}</p>
                ${p.descricao ? `<p style="margin:0.3rem 0;color:#6c757d;font-size:0.8rem;">${p.descricao}</p>` : ''}
                ${p.fornecedor ? `<p style="margin:0.3rem 0;color:#6c757d;font-size:0.8rem;"><strong>Fornecedor:</strong> ${p.fornecedor}</p>` : ''}
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;">
                    <span style="color:#2196f3;font-weight:bold;">R$ ${p.preco.toFixed(2)}</span>
                    <span style="color:${corStatus};font-weight:bold;">Qtd: ${p.quantidade}</span>
                    <span style="background:#e3f2fd;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.8rem;color:#1976d2;">${nomesCat[p.categoria]||p.categoria}</span>
                </div>
                <div style="margin-top:0.5rem;">
                    <button onclick="editarProduto(${p.id})" style="background:#2196f3;color:white;border:none;padding:0.3rem 0.8rem;border-radius:4px;cursor:pointer;font-size:0.8rem;margin-right:0.5rem;">Editar</button>
                    <button onclick="excluirProduto(${p.id})" style="background:#f44336;color:white;border:none;padding:0.3rem 0.8rem;border-radius:4px;cursor:pointer;font-size:0.8rem;">Excluir</button>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar produtos.</p>';
        console.error('Erro ao buscar produtos:', error);
    }
}

async function carregarClientesPublicos(){
    try {
        clientes = await apiRequest('/usuarios');
    } catch (error) {
        console.error('Erro ao carregar clientes públicos:', error);
    }
}

// Funções para Clientes
async function cadastrarClienteForm(e){
    e.preventDefault();
    const nome=document.getElementById('cliente-nome').value.trim();
    const email=document.getElementById('cliente-email').value.trim();
    const telefone=document.getElementById('cliente-telefone').value.trim();
    const endereco=document.getElementById('cliente-endereco').value.trim();
    const senha=document.getElementById('cliente-senha').value;
    const confirmarSenha=document.getElementById('cliente-confirmar-senha').value;
    const msgDiv=document.getElementById('cadastro-cliente-mensagem');
    
    if(!validarEmail(email)){mostrarMensagem(msgDiv,'E-mail inválido!','erro');return}
    if(senha!==confirmarSenha){mostrarMensagem(msgDiv,'As senhas não coincidem!','erro');return}
    if(senha.length<6){mostrarMensagem(msgDiv,'Senha mínimo 6 caracteres!','erro');return}
    
    try {
        await apiRequest('/clientes/cadastrar', {
            method: 'POST',
            body: JSON.stringify({ nome, email, telefone, endereco, senha })
        });
        
        mostrarMensagem(msgDiv,'Cliente cadastrado com sucesso!','sucesso');
        
        ['cliente-nome','cliente-email','cliente-telefone','cliente-endereco','cliente-senha','cliente-confirmar-senha'].forEach(id=>document.getElementById(id).value='');
        setTimeout(()=>{mostrarAba('login-cliente');msgDiv.innerHTML=''},2000);
    } catch (error) {
        mostrarMensagem(msgDiv, error.message, 'erro');
    }
}

async function fazerLoginCliente(e){
    e.preventDefault();
    const email=document.getElementById('login-email').value.trim();
    const senha=document.getElementById('login-senha').value;
    const msgDiv=document.getElementById('login-mensagem');
    
    if(!validarEmail(email)){mostrarMensagem(msgDiv,'E-mail inválido!','erro');return}
    
    try {
        const cliente = await apiRequest('/clientes/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });
        
        clienteLogado = cliente;
        localStorage.setItem('clienteLogado', JSON.stringify(clienteLogado));
        mostrarMensagem(msgDiv,'Login realizado!','sucesso');
        setTimeout(()=>mostrarAreaCliente(),1000);
    } catch (error) {
        mostrarMensagem(msgDiv, error.message, 'erro');
    }
}

function mostrarAreaCliente(){
    // Esconder elementos de login/cadastro
    document.getElementById('tipo-usuario').style.display='none';
    document.querySelector('.tab-btn:nth-child(2)').style.display='none'; // Login
    document.querySelector('.tab-btn:nth-child(3)').style.display='none'; // Cadastro
    
    // Mostrar botões do cliente
    document.getElementById('aba-pedido').style.display='block';
    document.getElementById('aba-meus-pedidos').style.display='block';
    
    document.querySelectorAll('.form-container').forEach(form=>form.classList.remove('active'));
    const areaCliente=document.getElementById('area-cliente');
    areaCliente.style.display='block';
    areaCliente.classList.add('active');
    
    document.getElementById('dados-cliente').innerHTML=`
        <p><strong>Nome:</strong> ${clienteLogado.nome}</p>
        <p><strong>E-mail:</strong> ${clienteLogado.email}</p>
        <p><strong>Telefone:</strong> ${clienteLogado.telefone}</p>
        <p><strong>Endereço:</strong> ${clienteLogado.endereco}</p>
        <div class="botoes-usuario">
            <button onclick="mostrarAba('fazer-pedido')" class="btn-secondary">🛒 Fazer Pedido</button>
            <button onclick="mostrarAba('meus-pedidos')" class="btn-secondary">📋 Meus Pedidos</button>
        </div>`;
}

function fazerLogoutCliente(){
    clienteLogado=null;
    localStorage.removeItem('clienteLogado');
    document.getElementById('area-cliente').style.display='none';
    document.getElementById('area-cliente').classList.remove('active');
    
    // Restaurar elementos da interface
    document.getElementById('tipo-usuario').style.display='block';
    document.querySelector('.tab-btn:nth-child(2)').style.display='block'; // Login
    document.querySelector('.tab-btn:nth-child(3)').style.display='block'; // Cadastro
    
    document.getElementById('aba-pedido').style.display='none';
    document.getElementById('aba-meus-pedidos').style.display='none';
    
    mostrarAba('login');
    ['login-email','login-senha','login-mensagem'].forEach(id=>document.getElementById(id).value='');
}

// Funções para Pedidos
async function carregarProdutosParaPedido(){
    const select = document.getElementById('pedido-produto');
    
    try {
        const produtos = await apiRequest('/produtos-publicos');
        
        select.innerHTML = '<option value="">Selecione um produto</option>';
        produtos.forEach(produto => {
            select.innerHTML += `<option value="${produto.id}">${produto.nome} - R$${produto.preco.toFixed(2)} (Estoque: ${produto.quantidade})</option>`;
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

async function fazerPedido(e){
    e.preventDefault();
    const produtoId = parseInt(document.getElementById('pedido-produto').value);
    const quantidade = parseInt(document.getElementById('pedido-quantidade').value);
    const observacao = document.getElementById('pedido-observacao').value.trim();
    const msgDiv = document.getElementById('pedido-mensagem');
    
    if(!produtoId || !quantidade){
        mostrarMensagem(msgDiv,'Selecione um produto e informe a quantidade!','erro');
        return;
    }
    
    try {
        const produtos = await apiRequest('/produtos-publicos');
        const produto = produtos.find(p => p.id === produtoId);
        
        if(!produto){
            mostrarMensagem(msgDiv,'Produto não encontrado!','erro');
            return;
        }
        
        if(produto.quantidade < quantidade){
            mostrarMensagem(msgDiv,'Estoque insuficiente!','erro');
            return;
        }
        
        const pedido = await apiRequest('/pedidos', {
            method: 'POST',
            body: JSON.stringify({
                cliente_id: clienteLogado.id,
                produto_id: produtoId,
                produto_nome: produto.nome,
                quantidade,
                observacao
            })
        });
        
        mostrarMensagem(msgDiv,'Pedido realizado com sucesso!','sucesso');
        
        document.getElementById('pedido-produto').value = '';
        document.getElementById('pedido-quantidade').value = '';
        document.getElementById('pedido-observacao').value = '';
        
        setTimeout(()=>{mostrarAba('meus-pedidos');msgDiv.innerHTML=''},2000);
    } catch (error) {
        mostrarMensagem(msgDiv, error.message, 'erro');
    }
}

async function carregarMeusPedidos(){
    const div = document.getElementById('pedidos-encontrados');
    
    try {
        const pedidos = await apiRequest(`/pedidos/cliente/${clienteLogado.id}`);
        
        if(pedidos.length === 0){
            div.innerHTML = '<p style="text-align:center;color:#6c757d;">Nenhum pedido encontrado.</p>';
            return;
        }
        
        const statusCores = {
            pendente: '#ff9800',
            aprovado: '#4caf50',
            recusado: '#f44336',
            enviado: '#2196f3'
        };
        
        const statusTextos = {
            pendente: 'Pendente',
            aprovado: 'Aprovado',
            recusado: 'Recusado',
            enviado: 'Enviado'
        };
        
        div.innerHTML = pedidos.map(pedido => `
            <div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid ${statusCores[pedido.status]};">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                    <h4 style="margin:0;color:#333;">${pedido.produto_nome}</h4>
                    <span style="background:${statusCores[pedido.status]};color:white;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.7rem;font-weight:bold;">${statusTextos[pedido.status]}</span>
                </div>
                <p style="margin:0.3rem 0;color:#6c757d;"><strong>Quantidade:</strong> ${pedido.quantidade}</p>
                <p style="margin:0.3rem 0;color:#6c757d;"><strong>Preço Unitário:</strong> R$${pedido.preco_unitario.toFixed(2)}</p>
                <p style="margin:0.3rem 0;color:#6c757d;"><strong>Total:</strong> R$${pedido.total.toFixed(2)}</p>
                ${pedido.observacao ? `<p style="margin:0.3rem 0;color:#6c757d;"><strong>Observação:</strong> ${pedido.observacao}</p>` : ''}
                <p style="margin:0.5rem 0;color:#2196f3;font-size:0.8rem;"><strong>Data:</strong> ${new Date(pedido.data_pedido).toLocaleDateString('pt-BR')} ${new Date(pedido.data_pedido).toLocaleTimeString('pt-BR')}</p>
            </div>
        `).join('');
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar pedidos.</p>';
        console.error('Erro ao carregar pedidos:', error);
    }
}

// Funções para Gerenciar Pedidos (usuários)
async function carregarTodosPedidos(){
    const filtroStatus = document.getElementById('filtro-status-pedidos').value;
    const div = document.getElementById('todos-pedidos-encontrados');
    
    try {
        let pedidos = await apiRequest('/pedidos');
        
        if(filtroStatus){
            pedidos = pedidos.filter(p => p.status === filtroStatus);
        }
        
        if(pedidos.length === 0){
            div.innerHTML = '<p style="text-align:center;color:#6c757d;">Nenhum pedido encontrado.</p>';
            return;
        }
        
        const clientes = await apiRequest('/clientes');
        
        const statusCores = {
            pendente: '#ff9800',
            aprovado: '#4caf50',
            recusado: '#f44336',
            enviado: '#2196f3'
        };
        
        const statusTextos = {
            pendente: 'Pendente',
            aprovado: 'Aprovado',
            recusado: 'Recusado',
            enviado: 'Enviado'
        };
        
        div.innerHTML = pedidos.map(pedido => {
            const cliente = clientes.find(c => c.id === pedido.cliente_id);
            const nomeCliente = cliente ? cliente.nome : 'Cliente não encontrado';
            
            let botoesAcao = '';
            if(pedido.status === 'pendente'){
                botoesAcao = `
                    <button onclick="atualizarStatusPedido(${pedido.id}, 'aprovado')" style="background:#4caf50;color:white;border:none;padding:0.3rem 0.8rem;border-radius:4px;cursor:pointer;font-size:0.8rem;margin-right:0.5rem;">✅ Aprovar</button>
                    <button onclick="atualizarStatusPedido(${pedido.id}, 'recusado')" style="background:#f44336;color:white;border:none;padding:0.3rem 0.8rem;border-radius:4px;cursor:pointer;font-size:0.8rem;">❌ Recusar</button>
                `;
            } else if(pedido.status === 'aprovado'){
                botoesAcao = `
                    <button onclick="atualizarStatusPedido(${pedido.id}, 'enviado')" style="background:#2196f3;color:white;border:none;padding:0.3rem 0.8rem;border-radius:4px;cursor:pointer;font-size:0.8rem;">📦 Enviar</button>
                `;
            }
            
            return `<div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid ${statusCores[pedido.status]};">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                    <div>
                        <h4 style="margin:0;color:#333;">${pedido.produto_nome}</h4>
                        <p style="margin:0.2rem 0;color:#666;font-size:0.9rem;"><strong>Cliente:</strong> ${nomeCliente}</p>
                    </div>
                    <span style="background:${statusCores[pedido.status]};color:white;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.7rem;font-weight:bold;">${statusTextos[pedido.status]}</span>
                </div>
                <p style="margin:0.3rem 0;color:#6c757d;"><strong>Quantidade:</strong> ${pedido.quantidade}</p>
                <p style="margin:0.3rem 0;color:#6c757d;"><strong>Preço Unitário:</strong> R$${pedido.preco_unitario.toFixed(2)}</p>
                <p style="margin:0.3rem 0;color:#6c757d;"><strong>Total:</strong> R$${pedido.total.toFixed(2)}</p>
                ${pedido.observacao ? `<p style="margin:0.3rem 0;color:#6c757d;"><strong>Observação:</strong> ${pedido.observacao}</p>` : ''}
                <p style="margin:0.5rem 0;color:#2196f3;font-size:0.8rem;"><strong>Data:</strong> ${new Date(pedido.data_pedido).toLocaleDateString('pt-BR')} ${new Date(pedido.data_pedido).toLocaleTimeString('pt-BR')}</p>
                ${botoesAcao}
            </div>`;
        }).join('');
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar pedidos.</p>';
        console.error('Erro ao carregar todos os pedidos:', error);
    }
}

async function atualizarStatusPedido(pedidoId, novoStatus){
    try {
        await apiRequest(`/pedidos/${pedidoId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: novoStatus })
        });
        
        if(novoStatus === 'aprovado'){
            await registrarMovimentacaoPedido(pedidoId);
        }
        
        carregarTodosPedidos();
        
        const mensagem = novoStatus === 'aprovado' ? 'Pedido aprovado e estoque atualizado!' :
                        novoStatus === 'recusado' ? 'Pedido recusado!' :
                        'Pedido enviado!';
        
        alert(mensagem);
    } catch (error) {
        alert('Erro ao atualizar status: ' + error.message);
    }
}

async function registrarMovimentacaoPedido(pedidoId){
    try {
        const pedidos = await apiRequest('/pedidos');
        const pedido = pedidos.find(p => p.id === pedidoId);
        
        if(!pedido) return;
        
        await apiRequest('/movimentacoes', {
            method: 'POST',
            body: JSON.stringify({
                produto_id: pedido.produto_id,
                produto_nome: pedido.produto_nome,
                tipo: 'saida',
                quantidade: pedido.quantidade,
                motivo: 'Venda',
                observacao: `Pedido #${pedidoId} - Cliente: ${pedido.cliente_id}`,
                usuario_id: usuarioLogado.id
            })
        });
    } catch (error) {
        console.error('Erro ao registrar movimentação:', error);
    }
}

// Funções auxiliares
async function carregarProdutosMovimentacao(){
    try {
        produtos = await apiRequest(`/produtos/${usuarioLogado.id}`);
        const select=document.getElementById('mov-produto');
        
        select.innerHTML='<option value="">Selecione um item</option>';
        produtos.forEach(p=>{
            select.innerHTML+=`<option value="${p.id}">${p.nome} (Qtd: ${p.quantidade})</option>`;
        });
    } catch (error) {
        console.error('Erro ao carregar produtos para movimentação:', error);
    }
}

function atualizarCamposMovimentacao(){
    const tipo=document.getElementById('mov-tipo').value;
    const motivoSelect=document.getElementById('mov-motivo');
    
    const motivos={
        'entrada': ['Compra','Devolução','Ajuste de Inventário','Transferência','Produção'],
        'saida': ['Venda','Uso Interno','Perda','Dano','Transferência','Devolução'],
        'ajuste': ['Correção de Estoque','Inventário','Ajuste de Sistema']
    };
    
    motivoSelect.innerHTML='<option value="">Selecione</option>';
    if(motivos[tipo]){
        motivos[tipo].forEach(motivo=>{
            motivoSelect.innerHTML+=`<option value="${motivo}">${motivo}</option>`;
        });
    }
}

async function registrarMovimentacao(e){
    e.preventDefault();
    const produtoId=parseInt(document.getElementById('mov-produto').value);
    const tipo=document.getElementById('mov-tipo').value;
    const quantidade=parseInt(document.getElementById('mov-quantidade').value);
    const motivo=document.getElementById('mov-motivo').value;
    const observacao=document.getElementById('mov-observacao').value.trim();
    const msgDiv=document.getElementById('movimentacao-mensagem');
    
    if(!produtoId||!tipo||!quantidade||!motivo){
        mostrarMensagem(msgDiv,'Preencha todos os campos obrigatórios!','erro');
        return;
    }
    
    try {
        const produto = produtos.find(p => p.id === produtoId);
        if(!produto){
            mostrarMensagem(msgDiv,'Produto não encontrado!','erro');
            return;
        }
        
        if(tipo === 'saida' && produto.quantidade < quantidade){
            mostrarMensagem(msgDiv,'Estoque insuficiente para esta saída!','erro');
            return;
        }
        
        await apiRequest('/movimentacoes', {
            method: 'POST',
            body: JSON.stringify({
                produto_id: produtoId,
                produto_nome: produto.nome,
                tipo,
                quantidade,
                motivo,
                observacao,
                usuario_id: usuarioLogado.id
            })
        });
        
        mostrarMensagem(msgDiv,'Movimentação registrada com sucesso!','sucesso');
        
        ['mov-produto','mov-tipo','mov-quantidade','mov-motivo','mov-observacao'].forEach(id=>document.getElementById(id).value='');
        carregarProdutosMovimentacao();
        buscarMovimentacoes();
        setTimeout(()=>msgDiv.innerHTML='',2000);
    } catch (error) {
        mostrarMensagem(msgDiv, error.message, 'erro');
    }
}

async function buscarMovimentacoes(){
    const filtroData=document.getElementById('filtro-data').value;
    const div=document.getElementById('movimentacoes-encontradas');
    
    try {
        let movimentacoes = await apiRequest(`/movimentacoes/${usuarioLogado.id}`);
        
        if(filtroData){
            movimentacoes = movimentacoes.filter(m => 
                new Date(m.data_movimentacao).toDateString() === new Date(filtroData).toDateString()
            );
        }
        
        if(movimentacoes.length===0){
            div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhuma movimentação encontrada.</p>';
            return;
        }
        
        const tipoCores={
            'entrada': '#4caf50',
            'saida': '#f44336',
            'ajuste': '#ff9800'
        };
        
        div.innerHTML=movimentacoes.map(m=>`
            <div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid ${tipoCores[m.tipo]};">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                    <h4 style="margin:0;color:#333;">${m.produto_nome}</h4>
                    <span style="background:${tipoCores[m.tipo]};color:white;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.7rem;font-weight:bold;">${m.tipo.toUpperCase()}</span>
                </div>
                <p style="margin:0.3rem 0;color:#6c757d;"><strong>Quantidade:</strong> ${m.quantidade}</p>
                <p style="margin:0.3rem 0;color:#6c757d;"><strong>Motivo:</strong> ${m.motivo}</p>
                ${m.observacao ? `<p style="margin:0.3rem 0;color:#6c757d;"><strong>Observação:</strong> ${m.observacao}</p>` : ''}
                <p style="margin:0.5rem 0;color:#2196f3;font-size:0.8rem;"><strong>Data:</strong> ${new Date(m.data_movimentacao).toLocaleDateString('pt-BR')} ${new Date(m.data_movimentacao).toLocaleTimeString('pt-BR')}</p>
            </div>
        `).join('');
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar movimentações.</p>';
        console.error('Erro ao buscar movimentações:', error);
    }
}

function limparBusca(){document.getElementById('busca-produto').value='';document.getElementById('filtro-categoria').value='';document.getElementById('filtro-estoque').value='';buscarProdutos()}
function limparFiltroMovimentacoes(){document.getElementById('filtro-data').value='';buscarMovimentacoes()}

async function excluirProduto(id){
    if(confirm('Excluir este item e todas as movimentações relacionadas?')){
        try {
            await apiRequest(`/produtos/${id}`, {
                method: 'DELETE'
            });
            buscarProdutos();
        } catch (error) {
            alert('Erro ao excluir produto: ' + error.message);
        }
    }
}

async function editarProduto(id){
    alert('Função de edição em desenvolvimento!');
}

async function verUsuariosRegistrados(){
    const listaDiv = document.getElementById('lista-clientes');
    const div=document.getElementById('clientes-encontrados');
    
    try {
        const usuarios = await apiRequest('/usuarios');
        
        if(usuarios.length===0){
            div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhum usuário encontrado.</p>';
        } else {
            div.innerHTML=usuarios.map(u=>`
                <div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid #2196f3;">
                    <h4 style="margin:0 0 0.5rem 0;color:#333;">${u.nome}</h4>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>E-mail:</strong> ${u.email}</p>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>ID:</strong> ${u.id}</p>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>Data:</strong> ${new Date(u.data_cadastro).toLocaleDateString('pt-BR')}</p>
                </div>
            `).join('');
        }
        
        if (listaDiv.style.display === 'none') {
            listaDiv.style.display = 'block';
        } else {
            listaDiv.style.display = 'none';
        }
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar usuários.</p>';
        console.error('Erro ao buscar usuários:', error);
    }
}

async function verClientesRegistrados(){
    const listaDiv = document.getElementById('lista-clientes');
    const div=document.getElementById('clientes-encontrados');
    
    try {
        const clientes = await apiRequest('/clientes');
        
        if(clientes.length===0){
            div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhum cliente encontrado.</p>';
        } else {
            div.innerHTML=clientes.map(c=>`
                <div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid #4caf50;">
                    <h4 style="margin:0 0 0.5rem 0;color:#333;">${c.nome}</h4>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>E-mail:</strong> ${c.email}</p>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>Telefone:</strong> ${c.telefone}</p>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>Endereço:</strong> ${c.endereco}</p>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>ID:</strong> ${c.id}</p>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>Data:</strong> ${new Date(c.data_cadastro).toLocaleDateString('pt-BR')}</p>
                </div>
            `).join('');
        }
        
        if (listaDiv.style.display === 'none') {
            listaDiv.style.display = 'block';
        } else {
            listaDiv.style.display = 'none';
        }
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar clientes.</p>';
        console.error('Erro ao buscar clientes:', error);
    }
}
