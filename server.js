const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('./estoque.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        initializeDatabase();
    }
});

// Inicializar tabelas do banco de dados
function initializeDatabase() {
    // Tabela de usuários
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Erro ao criar tabela usuarios:', err.message);
    });

    // Tabela de produtos
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        codigo TEXT NOT NULL,
        descricao TEXT,
        preco REAL NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 0,
        quantidade_minima INTEGER NOT NULL DEFAULT 5,
        categoria TEXT NOT NULL,
        fornecedor TEXT,
        usuario_id INTEGER NOT NULL,
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )`, (err) => {
        if (err) console.error('Erro ao criar tabela produtos:', err.message);
    });

    // Tabela de movimentações
    db.run(`CREATE TABLE IF NOT EXISTS movimentacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        produto_nome TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
        quantidade INTEGER NOT NULL,
        motivo TEXT NOT NULL,
        observacao TEXT,
        usuario_id INTEGER NOT NULL,
        data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos (id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )`, (err) => {
        if (err) console.error('Erro ao criar tabela movimentacoes:', err.message);
    });
}

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
        db.get('SELECT id FROM usuarios WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ erro: 'Erro no servidor' });
            }

            if (row) {
                return res.status(400).json({ erro: 'E-mail já cadastrado' });
            }

            // Criar hash da senha
            bcrypt.hash(senha, 10, (err, hash) => {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao criptografar senha' });
                }

                // Inserir usuário
                db.run('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
                    [nome, email, hash],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
                        }
                        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
                    }
                );
            });
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
        db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ erro: 'Erro no servidor' });
            }

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
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

// Listar todos os usuários
apiRouter.get('/usuarios', (req, res) => {
    db.all('SELECT id, nome, email, data_cadastro FROM usuarios ORDER BY data_cadastro DESC', (err, usuarios) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar usuários' });
        }
        
        res.json(usuarios);
    });
});

// Produtos
apiRouter.get('/produtos/:usuarioId', (req, res) => {
    const usuarioId = req.params.usuarioId;
    
    db.all('SELECT * FROM produtos WHERE usuario_id = ? ORDER BY data_cadastro DESC', [usuarioId], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar produtos' });
        }
        res.json(rows);
    });
});

apiRouter.post('/produtos', (req, res) => {
    try {
        const { nome, codigo, descricao, preco, quantidade, quantidade_minima, categoria, fornecedor, usuario_id } = req.body;
        
        if (!nome || !codigo || !preco || !quantidade || !categoria || !usuario_id) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }

        db.run(`INSERT INTO produtos (nome, codigo, descricao, preco, quantidade, quantidade_minima, categoria, fornecedor, usuario_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nome, codigo, descricao, preco, quantidade, quantidade_minima, categoria, fornecedor, usuario_id],
            function(err) {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao cadastrar produto' });
                }
                
                // Registrar movimentação inicial
                db.run(`INSERT INTO movimentacoes (produto_id, produto_nome, tipo, quantidade, motivo, observacao, usuario_id) 
                        VALUES (?, ?, 'entrada', ?, 'Cadastro inicial', 'Item adicionado ao estoque', ?)`,
                    [this.lastID, nome, quantidade, usuario_id],
                    (err) => {
                        if (err) {
                            console.error('Erro ao registrar movimentação inicial:', err.message);
                        }
                    }
                );
                
                res.status(201).json({ mensagem: 'Produto cadastrado com sucesso', id: this.lastID });
            }
        );
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

apiRouter.put('/produtos/:id', (req, res) => {
    try {
        const { nome, codigo, descricao, preco, quantidade, quantidade_minima, categoria, fornecedor } = req.body;
        const produtoId = req.params.id;
        
        if (!nome || !codigo || !preco || !quantidade || !categoria) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }

        db.run(`UPDATE produtos SET nome = ?, codigo = ?, descricao = ?, preco = ?, quantidade = ?, 
                       quantidade_minima = ?, categoria = ?, fornecedor = ? WHERE id = ?`,
            [nome, codigo, descricao, preco, quantidade, quantidade_minima, categoria, fornecedor, produtoId],
            function(err) {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao atualizar produto' });
                }
                res.json({ mensagem: 'Produto atualizado com sucesso' });
            }
        );
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

apiRouter.delete('/produtos/:id', (req, res) => {
    const produtoId = req.params.id;
    
    db.run('DELETE FROM produtos WHERE id = ?', [produtoId], function(err) {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao excluir produto' });
        }
        
        // Excluir movimentações relacionadas
        db.run('DELETE FROM movimentacoes WHERE produto_id = ?', [produtoId], (err) => {
            if (err) {
                console.error('Erro ao excluir movimentações:', err.message);
            }
        });
        
        res.json({ mensagem: 'Produto excluído com sucesso' });
    });
});

// Movimentações
apiRouter.get('/movimentacoes/:usuarioId', (req, res) => {
    const usuarioId = req.params.usuarioId;
    
    db.all('SELECT * FROM movimentacoes WHERE usuario_id = ? ORDER BY data_movimentacao DESC', [usuarioId], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar movimentações' });
        }
        res.json(rows);
    });
});

apiRouter.post('/movimentacoes', (req, res) => {
    try {
        const { produto_id, produto_nome, tipo, quantidade, motivo, observacao, usuario_id } = req.body;
        
        if (!produto_id || !produto_nome || !tipo || !quantidade || !motivo || !usuario_id) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }

        // Para saídas, verificar se há estoque suficiente
        if (tipo === 'saida') {
            db.get('SELECT quantidade FROM produtos WHERE id = ?', [produto_id], (err, produto) => {
                if (err || !produto || produto.quantidade < quantidade) {
                    return res.status(400).json({ erro: 'Quantidade insuficiente em estoque' });
                }
                
                // Se for saída, subtrai do estoque
                db.run('UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?', 
                    [quantidade, produto_id], (err) => {
                        if (err) {
                            return res.status(500).json({ erro: 'Erro ao atualizar estoque' });
                        }
                        
                        // Inserir movimentação
                        db.run(`INSERT INTO movimentacoes (produto_id, produto_nome, tipo, quantidade, motivo, observacao, usuario_id) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [produto_id, produto_nome, tipo, quantidade, motivo, observacao, usuario_id],
                            function(err) {
                                if (err) {
                                    return res.status(500).json({ erro: 'Erro ao registrar movimentação' });
                                }
                                res.status(201).json({ mensagem: 'Movimentação registrada com sucesso' });
                            }
                    );
                });
            });
        } else {
            // Para entradas e ajustes
            db.run('UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?', 
                [quantidade, produto_id], (err) => {
                    if (err) {
                        return res.status(500).json({ erro: 'Erro ao atualizar estoque' });
                    }
                    
                    // Inserir movimentação
                    db.run(`INSERT INTO movimentacoes (produto_id, produto_nome, tipo, quantidade, motivo, observacao, usuario_id) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [produto_id, produto_nome, tipo, quantidade, motivo, observacao, usuario_id],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ erro: 'Erro ao registrar movimentação' });
                            }
                            res.status(201).json({ mensagem: 'Movimentação registrada com sucesso' });
                        }
                    );
                });
        }
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor' });
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
    console.log('Banco de dados SQLite: estoque.db');
});
