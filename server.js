const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar sistema de dados
db.loadData().then(() => {
    console.log('Sistema de dados JSON inicializado.');
}).catch(err => {
    console.error('Erro ao inicializar sistema de dados:', err.message);
});


// Middleware para logging de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Servir arquivos estáticos da pasta src
app.use(express.static(path.join(__dirname, 'src')));

// Rotas da API
const apiRouter = express.Router();

// Usuários
apiRouter.post('/usuarios/cadastrar', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        
        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });
        }

        // Verificar se email já existe
        const existingUser = await db.getUsuarioByEmail(email);
        if (existingUser) {
            return res.status(400).json({ erro: 'E-mail já cadastrado' });
        }

        // Criar hash da senha
        bcrypt.hash(senha, 10, async (err, hash) => {
            if (err) {
                return res.status(500).json({ erro: 'Erro ao criptografar senha' });
            }

            try {
                // Inserir usuário
                await db.createUsuario({ nome, email, senha: hash });
                res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
            } catch (error) {
                res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
            }
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

apiRouter.post('/usuarios/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário
        const user = await db.getUsuarioByEmail(email);
        if (!user) {
            return res.status(401).json({ erro: 'E-mail não encontrado' });
        }

        // Verificar senha
        bcrypt.compare(senha, user.senha, (err, result) => {
            if (err) {
                return res.status(500).json({ erro: 'Erro ao verificar senha' });
            }

            if (!result) {
                return res.status(401).json({ erro: 'Senha incorreta' });
            }

            // Retornar dados do usuário (sem a senha)
            res.json({
                id: user.id,
                nome: user.nome,
                email: user.email,
                data_cadastro: user.data_cadastro
            });
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

// Listar todos os usuários
apiRouter.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await db.getAllUsuarios();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }
});

// Produtos
apiRouter.get('/produtos/:usuarioId', async (req, res) => {
    const usuarioId = req.params.usuarioId;
    
    try {
        const produtos = await db.getProdutosByUsuario(usuarioId);
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar produtos' });
    }
});

apiRouter.post('/produtos', async (req, res) => {
    try {
        const { nome, codigo, descricao, preco, quantidade, quantidade_minima, categoria, fornecedor, usuario_id } = req.body;
        
        if (!nome || !codigo || !preco || !quantidade || !categoria || !usuario_id) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }

        const produto = await db.createProduto({
            nome, codigo, descricao, preco, quantidade, quantidade_minima, categoria, fornecedor, usuario_id
        });
        
        // Registrar movimentação inicial
        await db.createMovimentacao({
            produto_id: produto.id,
            produto_nome: nome,
            tipo: 'entrada',
            quantidade: quantidade,
            motivo: 'Cadastro inicial',
            observacao: 'Item adicionado ao estoque',
            usuario_id: usuario_id
        });
        
        res.status(201).json({ mensagem: 'Produto cadastrado com sucesso', id: produto.id });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

apiRouter.put('/produtos/:id', async (req, res) => {
    try {
        const { nome, codigo, descricao, preco, quantidade, quantidade_minima, categoria, fornecedor } = req.body;
        const produtoId = req.params.id;
        
        if (!nome || !codigo || !preco || !quantidade || !categoria) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }

        const updatedProduto = await db.updateProduto(produtoId, {
            nome, codigo, descricao, preco, quantidade, quantidade_minima, categoria, fornecedor
        });
        
        if (!updatedProduto) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }
        
        res.json({ mensagem: 'Produto atualizado com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

apiRouter.delete('/produtos/:id', async (req, res) => {
    const produtoId = req.params.id;
    
    try {
        const deleted = await db.deleteProduto(produtoId);
        if (!deleted) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }
        
        res.json({ mensagem: 'Produto excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir produto' });
    }
});

// Movimentações
apiRouter.get('/movimentacoes/:usuarioId', async (req, res) => {
    const usuarioId = req.params.usuarioId;
    
    try {
        const movimentacoes = await db.getMovimentacoesByUsuario(usuarioId);
        res.json(movimentacoes);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar movimentações' });
    }
});

apiRouter.post('/movimentacoes', async (req, res) => {
    try {
        const { produto_id, produto_nome, tipo, quantidade, motivo, observacao, usuario_id } = req.body;
        
        if (!produto_id || !produto_nome || !tipo || !quantidade || !motivo || !usuario_id) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }

        // Para saídas, verificar se há estoque suficiente
        if (tipo === 'saida') {
            const produto = await db.getProdutoById(produto_id);
            if (!produto || produto.quantidade < quantidade) {
                return res.status(400).json({ erro: 'Quantidade insuficiente em estoque' });
            }
            
            // Subtrair do estoque
            await db.updateProdutoQuantidade(produto_id, produto.quantidade - quantidade);
        } else {
            // Para entradas e ajustes, adicionar ao estoque
            const produto = await db.getProdutoById(produto_id);
            if (produto) {
                await db.updateProdutoQuantidade(produto_id, produto.quantidade + quantidade);
            }
        }
        
        // Registrar movimentação
        await db.createMovimentacao({
            produto_id, produto_nome, tipo, quantidade, motivo, observacao, usuario_id
        });
        
        res.status(201).json({ mensagem: 'Movimentação registrada com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

// Clientes
apiRouter.post('/clientes/cadastrar', async (req, res) => {
    try {
        const { nome, email, telefone, endereco, senha } = req.body;
        
        if (!nome || !email || !telefone || !endereco || !senha) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });
        }

        // Verificar se email já existe
        const existingClient = await db.getClienteByEmail(email);
        if (existingClient) {
            return res.status(400).json({ erro: 'E-mail já cadastrado' });
        }

        // Criar hash da senha
        bcrypt.hash(senha, 10, async (err, hash) => {
            if (err) {
                return res.status(500).json({ erro: 'Erro ao criptografar senha' });
            }

            try {
                // Inserir cliente
                await db.createCliente({ nome, email, telefone, endereco, senha: hash });
                res.status(201).json({ mensagem: 'Cliente cadastrado com sucesso' });
            } catch (error) {
                res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
            }
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

apiRouter.post('/clientes/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }

        // Buscar cliente
        const cliente = await db.getClienteByEmail(email);
        if (!cliente) {
            return res.status(401).json({ erro: 'E-mail não encontrado' });
        }

        // Verificar senha
        bcrypt.compare(senha, cliente.senha, (err, result) => {
            if (err) {
                return res.status(500).json({ erro: 'Erro ao verificar senha' });
            }

            if (!result) {
                return res.status(401).json({ erro: 'Senha incorreta' });
            }

            // Retornar dados do cliente (sem a senha)
            res.json({
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
                telefone: cliente.telefone,
                endereco: cliente.endereco,
                data_cadastro: cliente.data_cadastro
            });
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

apiRouter.get('/clientes', async (req, res) => {
    try {
        const clientes = await db.getAllClientes();
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar clientes' });
    }
});

// Pedidos
apiRouter.post('/pedidos', async (req, res) => {
    try {
        const { cliente_id, produto_id, produto_nome, quantidade, observacao } = req.body;
        
        if (!cliente_id || !produto_id || !quantidade) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }

        // Verificar se produto existe e tem estoque suficiente
        const produto = await db.getProdutoById(produto_id);
        if (!produto) {
            return res.status(400).json({ erro: 'Produto não encontrado' });
        }

        if (produto.quantidade < quantidade) {
            return res.status(400).json({ erro: 'Estoque insuficiente' });
        }

        // Criar pedido
        const pedido = await db.createPedido({
            cliente_id,
            produto_id,
            produto_nome,
            quantidade,
            observacao,
            preco_unitario: produto.preco,
            total: produto.preco * quantidade
        });
        
        res.status(201).json({ mensagem: 'Pedido realizado com sucesso', id: pedido.id });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

apiRouter.get('/pedidos/cliente/:clienteId', async (req, res) => {
    const clienteId = req.params.clienteId;
    
    try {
        const pedidos = await db.getPedidosByCliente(clienteId);
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar pedidos' });
    }
});

apiRouter.get('/pedidos', async (req, res) => {
    try {
        const pedidos = await db.getAllPedidos();
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar pedidos' });
    }
});

apiRouter.put('/pedidos/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const pedidoId = req.params.id;
        
        if (!status || !['pendente', 'aprovado', 'recusado', 'enviado'].includes(status)) {
            return res.status(400).json({ erro: 'Status inválido' });
        }

        const updatedPedido = await db.updatePedidoStatus(pedidoId, status);
        if (!updatedPedido) {
            return res.status(404).json({ erro: 'Pedido não encontrado' });
        }
        
        res.json({ mensagem: 'Status atualizado com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

// Produtos Públicos (para clientes)
apiRouter.get('/produtos-publicos', async (req, res) => {
    try {
        const produtos = await db.getProdutosPublicos();
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar produtos' });
    }
});

// Usar as rotas da API
app.use('/api', apiRouter);

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('API REST disponível em http://localhost:3000/api');
    console.log('Banco de dados JSON: data.json');
});
