let clientes = [];
let produtos = [];
let movimentacoes = [];
let usuarioLogado = localStorage.getItem('usuarioLogado') ? JSON.parse(localStorage.getItem('usuarioLogado')) : null;

// Configuração da API
const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded',()=>{
    if(usuarioLogado)mostrarAreaUsuario();
    carregarClientesPublicos();
});

function mostrarAba(aba){
    document.querySelectorAll('.tab-btn').forEach(btn=>btn.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(form=>form.classList.remove('active'));
    
    const abaMap={
        'login':()=>{document.querySelector('.tab-btn:nth-child(1)').classList.add('active');document.getElementById('login-form').classList.add('active')},
        'cadastro':()=>{document.querySelector('.tab-btn:nth-child(2)').classList.add('active');document.getElementById('cadastro-form').classList.add('active')},
        'cadastrar-produto':()=>{document.querySelector('.tab-btn:nth-child(3)').classList.add('active');document.getElementById('cadastrar-produto-form').classList.add('active')},
        'consultar-produto':()=>{document.querySelector('.tab-btn:nth-child(4)').classList.add('active');document.getElementById('consultar-produto-form').classList.add('active');buscarProdutos()},
        'movimentacoes':()=>{document.querySelector('.tab-btn:nth-child(5)').classList.add('active');document.getElementById('movimentacoes-form').classList.add('active');carregarProdutosMovimentacao();buscarMovimentacoes()},
    };
    
    if(abaMap[aba])abaMap[aba]();
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

async function cadastrarCliente(e){
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
        
        mostrarMensagem(msgDiv,'Cliente cadastrado!','sucesso');
        
        ['cadastro-nome','cadastro-email','cadastro-senha','cadastro-confirmar-senha'].forEach(id=>document.getElementById(id).value='');
        carregarClientesPublicos();
        setTimeout(()=>{mostrarAba('login');msgDiv.innerHTML=''},2000);
    } catch (error) {
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

function mostrarAreaUsuario(){
    document.querySelector('.tab-btn:nth-child(1)').style.display='none';
    document.querySelector('.tab-btn:nth-child(2)').style.display='none';
    ['aba-produto','aba-consulta','aba-movimentacoes'].forEach(id=>document.getElementById(id).style.display='block');
    
    document.querySelectorAll('.form-container').forEach(form=>form.classList.remove('active'));
    const areaUsuario=document.getElementById('area-usuario');
    areaUsuario.style.display='block';
    areaUsuario.classList.add('active');
    
    const totalItens=produtos.filter(p=>p.usuarioId===usuarioLogado.id).reduce((sum,p)=>sum+p.quantidade,0);
    const itensBaixoEstoque=produtos.filter(p=>p.usuarioId===usuarioLogado.id && p.quantidade <= (p.quantidadeMinima||5)).length;
    
    document.getElementById('dados-usuario').innerHTML=`
        <p><strong>Nome:</strong> ${usuarioLogado.nome}</p>
        <p><strong>E-mail:</strong> ${usuarioLogado.email}</p>
        <p><strong>Total de Itens:</strong> ${totalItens}</p>
        <p><strong>Alertas de Estoque:</strong> <span style="color:${itensBaixoEstoque>0?'#f44336':'#4caf50'}">${itensBaixoEstoque}</span></p>
        <div class="botoes-usuario">
            <button onclick="mostrarAba('cadastrar-produto')" class="btn-secondary">➕ Adicionar</button>
            <button onclick="mostrarAba('consultar-produto')" class="btn-secondary">� Estoque</button>
            <button onclick="mostrarAba('movimentacoes')" class="btn-secondary">� Movimentações</button>
        </div>`;
}

function fazerLogout(){
    usuarioLogado=null;
    localStorage.removeItem('usuarioLogado');
    document.getElementById('area-usuario').style.display='none';
    document.getElementById('area-usuario').classList.remove('active');
    document.querySelector('.tab-btn:nth-child(1)').style.display='block';
    document.querySelector('.tab-btn:nth-child(2)').style.display='block';
    ['aba-produto','aba-consulta','aba-movimentacoes'].forEach(id=>document.getElementById(id).style.display='none');
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
        
        // Atualizar estatísticas
        const totalItens = produtos.reduce((sum, p) => sum + p.quantidade, 0);
        const itensBaixoEstoque = produtos.filter(p=>p.quantidade <= (p.quantidade_minima||5)).length;
        
        const totalItensEl = document.getElementById('total-itens');
        const alertasEl = document.getElementById('alertas-estoque');
        if(totalItensEl) totalItensEl.textContent = totalItens;
        if(alertasEl) {
            alertasEl.textContent = itensBaixoEstoque;
            alertasEl.style.color = itensBaixoEstoque > 0 ? '#f44336' : '#4caf50';
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

async function buscarClientes(){
    const termo=document.getElementById('busca-cliente').value.toLowerCase();
    const div=document.getElementById('clientes-encontrados');
    
    try {
        clientes = await apiRequest('/usuarios');
        
        let filtrados = clientes;
        if(termo)filtrados=filtrados.filter(c=>c.nome.toLowerCase().includes(termo)||c.email.toLowerCase().includes(termo));
        
        if(filtrados.length===0){div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhum cliente encontrado.</p>';return}
        
        div.innerHTML=filtrados.map(c=>`
            <div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid #2196f3;">
                <h4 style="margin:0 0 0.5rem 0;color:#333;">${c.nome}</h4>
                <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>E-mail:</strong> ${c.email}</p>
                <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>ID:</strong> ${c.id}</p>
                <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>Data:</strong> ${new Date(c.data_cadastro).toLocaleDateString('pt-BR')}</p>
            </div>`).join('');
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao buscar clientes.</p>';
        console.error('Erro ao buscar clientes:', error);
    }
}

async function verClientesRegistrados(){
    const listaClientesDiv = document.getElementById('lista-clientes');
    const div=document.getElementById('clientes-encontrados');
    
    try {
        const clientes = await apiRequest('/usuarios');
        
        if(clientes.length===0){
            div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhum cliente encontrado.</p>';
        } else {
            div.innerHTML=clientes.map(c=>`
                <div style="background:#f8f9fa;padding:1rem;margin-bottom:1rem;border-radius:8px;border-left:4px solid #2196f3;">
                    <h4 style="margin:0 0 0.5rem 0;color:#333;">${c.nome}</h4>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>E-mail:</strong> ${c.email}</p>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>ID:</strong> ${c.id}</p>
                    <p style="margin:0.3rem 0;color:#6c757d;font-size:0.9rem;"><strong>Data:</strong> ${new Date(c.data_cadastro).toLocaleDateString('pt-BR')}</p>
                </div>
            `).join('');
        }
        
        // Mostrar/ocultar a seção de clientes
        if (listaClientesDiv.style.display === 'none') {
            listaClientesDiv.style.display = 'block';
        } else {
            listaClientesDiv.style.display = 'none';
        }
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar clientes.</p>';
        console.error('Erro ao buscar clientes:', error);
    }
}

function limparBusca(){document.getElementById('busca-produto').value='';document.getElementById('filtro-categoria').value='';document.getElementById('filtro-estoque').value='';buscarProdutos()}
function limparBuscaClientes(){document.getElementById('busca-cliente').value='';buscarClientes()}

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
    if(tipo && motivos[tipo]){
        motivos[tipo].forEach(motivo=>{
            motivoSelect.innerHTML+=`<option value="${motivo}">${motivo}</option>`;
        });
    }
}

async function registrarMovimentacao(event){
    event.preventDefault();
    
    const produtoId=parseInt(document.getElementById('mov-produto').value);
    const tipo=document.getElementById('mov-tipo').value;
    const quantidade=parseInt(document.getElementById('mov-quantidade').value);
    const motivo=document.getElementById('mov-motivo').value;
    const observacao=document.getElementById('mov-observacao').value.trim();
    const msgDiv=document.getElementById('movimentacao-mensagem');
    
    if(!produtoId||!tipo||isNaN(quantidade)||!motivo){
        mostrarMensagem(msgDiv,'Preencha todos os campos obrigatórios!','erro');
        return;
    }
    
    const produto=produtos.find(p=>p.id===produtoId && p.usuario_id===usuarioLogado.id);
    if(!produto){
        mostrarMensagem(msgDiv,'Produto não encontrado!','erro');
        return;
    }
    
    if(tipo==='saida' && quantidade>produto.quantidade){
        mostrarMensagem(msgDiv,'Quantidade insuficiente em estoque!','erro');
        return;
    }
        
    try {
        await apiRequest('/movimentacoes', {
            method: 'POST',
            body: JSON.stringify({
                produto_id: produtoId,
                produto_nome: produto.nome,
                tipo: tipo,
                quantidade: quantidade,
                motivo: motivo,
                observacao: observacao,
                usuario_id: usuarioLogado.id
            })
        });
            
        mostrarMensagem(msgDiv,'Movimentação registrada com sucesso!','sucesso');
            
        ['mov-produto','mov-tipo','mov-quantidade','mov-motivo','mov-observacao'].forEach(id=>document.getElementById(id).value='');
            
        carregarProdutosMovimentacao();
        buscarMovimentacoes();
    } catch (error) {
        mostrarMensagem(msgDiv, error.message, 'erro');
    }
}

async function buscarMovimentacoes(){
    const filtroData=document.getElementById('filtro-data').value;
    const div=document.getElementById('movimentacoes-encontradas');
    
    try {
        movimentacoes = await apiRequest(`/movimentacoes/${usuarioLogado.id}`);
        
        let filtrados = movimentacoes;
        if(filtroData){
            const dataFiltro=new Date(filtroData);
            filtrados=filtrados.filter(m=>{
                const dataMov=new Date(m.data_movimentacao);
                return dataMov.toDateString()===dataFiltro.toDateString();
            });
        }
        
        filtrados.sort((a,b)=>new Date(b.data_movimentacao)-new Date(a.data_movimentacao));
        
        if(filtrados.length===0){
            div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhuma movimentação encontrada.</p>';
            return;
        }
        
        div.innerHTML=filtrados.map(m=>{
            const corTipo=m.tipo==='entrada'?'#4caf50':m.tipo==='saida'?'#f44336':'#ff9800';
            const iconeTipo=m.tipo==='entrada'?'⬆️':m.tipo==='saida'?'⬇️':'🔄';
            
            return `
            <div style="background:#f8f9fa;padding:1rem;margin-bottom:0.8rem;border-radius:8px;border-left:4px solid ${corTipo};">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                    <h4 style="margin:0;color:#333;">${m.produto_nome}</h4>
                    <span style="background:${corTipo};color:white;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.7rem;font-weight:bold;">
                        ${iconeTipo} ${m.tipo.toUpperCase()}
                    </span>
                </div>
                <p style="margin:0.3rem 0;color:#6c757d;font-size:0.8rem;">
                    <strong>Quantidade:</strong> ${m.quantidade} | <strong>Motivo:</strong> ${m.motivo}
                </p>
                ${m.observacao ? `<p style="margin:0.3rem 0;color:#6c757d;font-size:0.8rem;"><strong>Obs:</strong> ${m.observacao}</p>` : ''}
                <p style="margin:0.3rem 0;color:#6c757d;font-size:0.8rem;">
                    <strong>Data:</strong> ${new Date(m.data_movimentacao).toLocaleString('pt-BR')}
                </p>
            </div>`;
        }).join('');
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar movimentações.</p>';
        console.error('Erro ao buscar movimentações:', error);
    }
}

function limparFiltroMovimentacoes(){
    document.getElementById('filtro-data').value='';
    buscarMovimentacoes();
}

function editarProduto(id){
    const produto=produtos.find(p=>p.id===id && p.usuarioId===usuarioLogado.id);
    if(!produto)return;
    
    const novaQuantidade=prompt(`Editar quantidade do item "${produto.nome}":`, produto.quantidade);
    if(novaQuantidade===null)return;
    
    const quantidade=parseInt(novaQuantidade);
    if(isNaN(quantidade)||quantidade<0){
        alert('Quantidade inválida!');
        return;
    }
    
    const diferenca=quantidade-produto.quantidade;
    produto.quantidade=quantidade;
    localStorage.setItem('produtos',JSON.stringify(produtos));
    
    if(diferenca!==0){
        movimentacoes.push({
            id:Date.now(),
            produtoId:produto.id,
            produtoNome:produto.nome,
            tipo:diferenca>0?'entrada':'saida',
            quantidade:Math.abs(diferenca),
            motivo:'Ajuste Manual',
            observacao:`Quantidade ajustada de ${produto.quantidade-diferenca} para ${quantidade}`,
            usuarioId:usuarioLogado.id,
            dataMovimentacao:new Date().toISOString()
        });
        localStorage.setItem('movimentacoes',JSON.stringify(movimentacoes));
    }
    
    buscarProdutos();
}

async function carregarClientesPublicos(){
    const div=document.getElementById('clientes-publicos');
    if(!div)return;
    
    try {
        clientes = await apiRequest('/usuarios');
        
        if(clientes.length===0){
            div.innerHTML='<p style="text-align:center;color:#6c757d;">Nenhum cliente cadastrado ainda.</p>';
            return;
        }
        
        const clientesOrdenados=clientes.sort((a,b)=>new Date(b.data_cadastro)-new Date(a.data_cadastro));
        
        div.innerHTML=clientesOrdenados.map(c=>`
            <div style="background:#f8f9fa;padding:0.8rem;margin-bottom:0.5rem;border-radius:6px;border-left:3px solid #2196f3;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <strong style="color:#333;">${c.nome}</strong>
                        <div style="font-size:0.8rem;color:#6c757d;">${c.email}</div>
                    </div>
                    <div style="font-size:0.7rem;color:#2196f3;">
                        ${new Date(c.data_cadastro).toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar clientes.</p>';
        console.error('Erro ao carregar clientes públicos:', error);
    }
}