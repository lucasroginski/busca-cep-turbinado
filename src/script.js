let clientes=JSON.parse(localStorage.getItem('clientes'))||[];
let produtos=JSON.parse(localStorage.getItem('produtos'))||[];
let usuarioLogado=JSON.parse(localStorage.getItem('usuarioLogado'))||null;

document.addEventListener('DOMContentLoaded',()=>{if(usuarioLogado)mostrarAreaUsuario()});

function mostrarAba(aba){
    document.querySelectorAll('.tab-btn').forEach(btn=>btn.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(form=>form.classList.remove('active'));
    
    const abaMap={
        'login':()=>{document.querySelector('.tab-btn:nth-child(1)').classList.add('active');document.getElementById('login-form').classList.add('active')},
        'cadastro':()=>{document.querySelector('.tab-btn:nth-child(2)').classList.add('active');document.getElementById('cadastro-form').classList.add('active')},
        'cadastrar-produto':()=>{document.querySelector('.tab-btn:nth-child(3)').classList.add('active');document.getElementById('cadastrar-produto-form').classList.add('active')},
        'consultar-produto':()=>{document.querySelector('.tab-btn:nth-child(4)').classList.add('active');document.getElementById('consultar-produto-form').classList.add('active');buscarProdutos()},
        'consultar-clientes':()=>{document.querySelector('.tab-btn:nth-child(5)').classList.add('active');document.getElementById('consultar-clientes-form').classList.add('active');buscarClientes()}
    };
    
    if(abaMap[aba])abaMap[aba]();
}

function validarEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}

function mostrarMensagem(div,mensagem,tipo){div.innerHTML=`<p style="color: ${tipo==='erro'?'#f44336':'#4caf50'};font-weight:bold;">${mensagem}</p>`}

function cadastrarCliente(e){
    e.preventDefault();
    const nome=document.getElementById('cadastro-nome').value.trim();
    const email=document.getElementById('cadastro-email').value.trim();
    const senha=document.getElementById('cadastro-senha').value;
    const confirmarSenha=document.getElementById('cadastro-confirmar-senha').value;
    const msgDiv=document.getElementById('cadastro-mensagem');
    
    if(!validarEmail(email)){mostrarMensagem(msgDiv,'E-mail inválido!','erro');return}
    if(senha!==confirmarSenha){mostrarMensagem(msgDiv,'As senhas não coincidem!','erro');return}
    if(senha.length<6){mostrarMensagem(msgDiv,'Senha mínimo 6 caracteres!','erro');return}
    if(clientes.some(c=>c.email===email)){mostrarMensagem(msgDiv,'E-mail já cadastrado!','erro');return}
    
    clientes.push({id:Date.now(),nome,email,senha:btoa(senha),dataCadastro:new Date().toISOString()});
    localStorage.setItem('clientes',JSON.stringify(clientes));
    mostrarMensagem(msgDiv,'Cliente cadastrado!','sucesso');
    
    ['cadastro-nome','cadastro-email','cadastro-senha','cadastro-confirmar-senha'].forEach(id=>document.getElementById(id).value='');
    setTimeout(()=>{mostrarAba('login');msgDiv.innerHTML=''},2000);
}

function fazerLogin(e){
    e.preventDefault();
    const email=document.getElementById('login-email').value.trim();
    const senha=document.getElementById('login-senha').value;
    const msgDiv=document.getElementById('login-mensagem');
    
    if(!validarEmail(email)){mostrarMensagem(msgDiv,'E-mail inválido!','erro');return}
    
    const cliente=clientes.find(c=>c.email===email);
    if(!cliente){mostrarMensagem(msgDiv,'E-mail não encontrado!','erro');return}
    if(cliente.senha!==btoa(senha)){mostrarMensagem(msgDiv,'Senha incorreta!','erro');return}
    
    usuarioLogado={id:cliente.id,nome:cliente.nome,email:cliente.email};
    localStorage.setItem('usuarioLogado',JSON.stringify(usuarioLogado));
    mostrarMensagem(msgDiv,'Login realizado!','sucesso');
    setTimeout(()=>mostrarAreaUsuario(),1000);
}

function mostrarAreaUsuario(){
    document.querySelector('.tab-btn:nth-child(1)').style.display='none';
    document.querySelector('.tab-btn:nth-child(2)').style.display='none';
    ['aba-produto','aba-consulta','aba-clientes'].forEach(id=>document.getElementById(id).style.display='block');
    
    document.querySelectorAll('.form-container').forEach(form=>form.classList.remove('active'));
    const areaUsuario=document.getElementById('area-usuario');
    areaUsuario.style.display='block';
    areaUsuario.classList.add('active');
    
    document.getElementById('dados-usuario').innerHTML=`
        <p><strong>Nome:</strong> ${usuarioLogado.nome}</p>
        <p><strong>E-mail:</strong> ${usuarioLogado.email}</p>
        <p><strong>ID:</strong> ${usuarioLogado.id}</p>
        <div style="margin-top:1rem;">
            <button onclick="mostrarAba('cadastrar-produto')" class="btn-secondary" style="margin-right:0.5rem;">Cadastrar Produto</button>
            <button onclick="mostrarAba('consultar-produto')" class="btn-secondary" style="margin-right:0.5rem;">Ver Produtos</button>
            <button onclick="mostrarAba('consultar-clientes')" class="btn-secondary">Ver Clientes</button>
        </div>`;
}

function fazerLogout(){
    usuarioLogado=null;
    localStorage.removeItem('usuarioLogado');
    document.getElementById('area-usuario').style.display='none';
    document.getElementById('area-usuario').classList.remove('active');
    document.querySelector('.tab-btn:nth-child(1)').style.display='block';
    document.querySelector('.tab-btn:nth-child(2)').style.display='block';
    ['aba-produto','aba-consulta','aba-clientes'].forEach(id=>document.getElementById(id).style.display='none');
    mostrarAba('login');
    ['login-email','login-senha','login-mensagem'].forEach(id=>document.getElementById(id).value='');
}

function cadastrarProduto(e){
    e.preventDefault();
    const nome=document.getElementById('produto-nome').value.trim();
    const descricao=document.getElementById('produto-descricao').value.trim();
    const preco=parseFloat(document.getElementById('produto-preco').value);
    const quantidade=parseInt(document.getElementById('produto-quantidade').value);
    const categoria=document.getElementById('produto-categoria').value;
    const msgDiv=document.getElementById('produto-mensagem');
    
    if(!nome||!descricao||isNaN(preco)||isNaN(quantidade)||!categoria){mostrarMensagem(msgDiv,'Preencha todos os campos!','erro');return}
    if(preco<0||quantidade<0){mostrarMensagem(msgDiv,'Valores não podem ser negativos!','erro');return}
    
    produtos.push({id:Date.now(),nome,descricao,preco,quantidade,categoria,usuarioId:usuarioLogado.id,dataCadastro:new Date().toISOString()});
    localStorage.setItem('produtos',JSON.stringify(produtos));
    mostrarMensagem(msgDiv,'Produto cadastrado!','sucesso');
    
    ['produto-nome','produto-descricao','produto-preco','produto-quantidade','produto-categoria'].forEach(id=>document.getElementById(id).value='');
    setTimeout(()=>{mostrarAba('consultar-produto');msgDiv.innerHTML=''},2000);
}

function buscarProdutos(){
    const termo=document.getElementById('busca-produto').value.toLowerCase();
    const categoria=document.getElementById('filtro-categoria').value;
    const div=document.getElementById('produtos-encontrados');
    
    let filtrados=produtos.filter(p=>p.usuarioId===usuarioLogado.id);
    if(categoria)filtrados=filtrados.filter(p=>p.categoria===categoria);
    if(termo)filtrados=filtrados.filter(p=>p.nome.toLowerCase().includes(termo)||p.descricao.toLowerCase().includes(termo));
    
    if(filtrados.length===0){div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhum produto encontrado.</p>';return}
    
    const nomesCat={eletronico:'Eletrônico',roupa:'Roupa',alimento:'Alimento',livro:'Livro',outro:'Outro'};
    div.innerHTML=filtrados.map(p=>`
        <div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid #2196f3;">
            <h4 style="margin:0 0 0.5rem 0;color:#333;">${p.nome}</h4>
            <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;">${p.descricao}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;">
                <span style="color:#2196f3;font-weight:bold;">R$ ${p.preco.toFixed(2)}</span>
                <span style="color:#6c757d;">Qtd: ${p.quantidade}</span>
                <span style="background:#e3f2fd;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.8rem;color:#1976d2;">${nomesCat[p.categoria]||p.categoria}</span>
            </div>
            <div style="margin-top:0.5rem;">
                <button onclick="excluirProduto(${p.id})" style="background:#f44336;color:white;border:none;padding:0.3rem 0.8rem;border-radius:4px;cursor:pointer;font-size:0.8rem;">Excluir</button>
            </div>
        </div>`).join('');
}

function buscarClientes(){
    const termo=document.getElementById('busca-cliente').value.toLowerCase();
    const div=document.getElementById('clientes-encontrados');
    
    let filtrados=clientes;
    if(termo)filtrados=filtrados.filter(c=>c.nome.toLowerCase().includes(termo)||c.email.toLowerCase().includes(termo));
    
    if(filtrados.length===0){div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhum cliente encontrado.</p>';return}
    
    div.innerHTML=filtrados.map(c=>`
        <div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid #2196f3;">
            <h4 style="margin:0 0 0.5rem 0;color:#333;">${c.nome}</h4>
            <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>E-mail:</strong> ${c.email}</p>
            <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>ID:</strong> ${c.id}</p>
            <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>Data:</strong> ${new Date(c.dataCadastro).toLocaleDateString('pt-BR')}</p>
            <div style="margin-top:0.5rem;">
                <button onclick="excluirCliente(${c.id})" style="background:#f44336;color:white;border:none;padding:0.3rem 0.8rem;border-radius:4px;cursor:pointer;font-size:0.8rem;">Excluir</button>
            </div>
        </div>`).join('');
}

function limparBusca(){document.getElementById('busca-produto').value='';document.getElementById('filtro-categoria').value='';buscarProdutos()}
function limparBuscaClientes(){document.getElementById('busca-cliente').value='';buscarClientes()}

function excluirProduto(id){
    if(confirm('Excluir este produto?')){
        produtos=produtos.filter(p=>p.id!==id);
        localStorage.setItem('produtos',JSON.stringify(produtos));
        buscarProdutos();
    }
}

function excluirCliente(id){
    if(confirm('Excluir este cliente?')){
        clientes=clientes.filter(c=>c.id!==id);
        localStorage.setItem('clientes',JSON.stringify(clientes));
        if(usuarioLogado&&usuarioLogado.id===id){alert('Sua conta foi excluída.');fazerLogout()}else buscarClientes();
    }
}