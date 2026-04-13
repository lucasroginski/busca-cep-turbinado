const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

class Database {
    constructor() {
        this.data = null;
    }

    async loadData() {
        try {
            const fileContent = await fs.readFile(DATA_FILE, 'utf8');
            this.data = JSON.parse(fileContent);
        } catch (error) {
            // Se o arquivo não existir ou estiver vazio, cria estrutura inicial
            this.data = {
                usuarios: [],
                clientes: [],
                produtos: [],
                movimentacoes: [],
                pedidos: []
            };
            await this.saveData();
        }
        return this.data;
    }

    async saveData() {
        try {
            await fs.writeFile(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            throw error;
        }
    }

    async getNextId(collection) {
        await this.loadData();
        if (this.data[collection].length === 0) {
            return 1;
        }
        const maxId = Math.max(...this.data[collection].map(item => item.id));
        return maxId + 1;
    }

    // Usuários
    async createUsuario(usuario) {
        await this.loadData();
        usuario.id = await this.getNextId('usuarios');
        usuario.data_cadastro = new Date().toISOString();
        this.data.usuarios.push(usuario);
        await this.saveData();
        return usuario;
    }

    async getUsuarioByEmail(email) {
        await this.loadData();
        return this.data.usuarios.find(usuario => usuario.email === email);
    }

    async getUsuarioById(id) {
        await this.loadData();
        return this.data.usuarios.find(usuario => usuario.id === parseInt(id));
    }

    async getAllUsuarios() {
        await this.loadData();
        return this.data.usuarios.sort((a, b) => new Date(b.data_cadastro) - new Date(a.data_cadastro));
    }

    // Produtos
    async createProduto(produto) {
        await this.loadData();
        produto.id = await this.getNextId('produtos');
        produto.data_cadastro = new Date().toISOString();
        if (!produto.quantidade_minima) produto.quantidade_minima = 5;
        if (!produto.quantidade) produto.quantidade = 0;
        this.data.produtos.push(produto);
        await this.saveData();
        return produto;
    }

    async getProdutosByUsuario(usuarioId) {
        await this.loadData();
        return this.data.produtos
            .filter(produto => produto.usuario_id === parseInt(usuarioId))
            .sort((a, b) => new Date(b.data_cadastro) - new Date(a.data_cadastro));
    }

    async getProdutoById(id) {
        await this.loadData();
        return this.data.produtos.find(produto => produto.id === parseInt(id));
    }

    async updateProduto(id, produtoData) {
        await this.loadData();
        const index = this.data.produtos.findIndex(produto => produto.id === parseInt(id));
        if (index === -1) return null;
        
        this.data.produtos[index] = { ...this.data.produtos[index], ...produtoData };
        await this.saveData();
        return this.data.produtos[index];
    }

    async deleteProduto(id) {
        await this.loadData();
        const index = this.data.produtos.findIndex(produto => produto.id === parseInt(id));
        if (index === -1) return false;
        
        this.data.produtos.splice(index, 1);
        
        // Remover movimentações relacionadas
        this.data.movimentacoes = this.data.movimentacoes.filter(mov => mov.produto_id !== parseInt(id));
        
        await this.saveData();
        return true;
    }

    async updateProdutoQuantidade(id, quantidade) {
        await this.loadData();
        const produto = this.data.produtos.find(produto => produto.id === parseInt(id));
        if (produto) {
            produto.quantidade = quantidade;
            await this.saveData();
        }
        return produto;
    }

    // Movimentações
    async createMovimentacao(movimentacao) {
        await this.loadData();
        movimentacao.id = await this.getNextId('movimentacoes');
        movimentacao.data_movimentacao = new Date().toISOString();
        this.data.movimentacoes.push(movimentacao);
        await this.saveData();
        return movimentacao;
    }

    async getMovimentacoesByUsuario(usuarioId) {
        await this.loadData();
        return this.data.movimentacoes
            .filter(mov => mov.usuario_id === parseInt(usuarioId))
            .sort((a, b) => new Date(b.data_movimentacao) - new Date(a.data_movimentacao));
    }

    // Clientes
    async createCliente(cliente) {
        await this.loadData();
        cliente.id = await this.getNextId('clientes');
        cliente.data_cadastro = new Date().toISOString();
        this.data.clientes.push(cliente);
        await this.saveData();
        return cliente;
    }

    async getClienteByEmail(email) {
        await this.loadData();
        return this.data.clientes.find(cliente => cliente.email === email);
    }

    async getClienteById(id) {
        await this.loadData();
        return this.data.clientes.find(cliente => cliente.id === parseInt(id));
    }

    async getAllClientes() {
        await this.loadData();
        return this.data.clientes.sort((a, b) => new Date(b.data_cadastro) - new Date(a.data_cadastro));
    }

    // Pedidos
    async createPedido(pedido) {
        await this.loadData();
        pedido.id = await this.getNextId('pedidos');
        pedido.data_pedido = new Date().toISOString();
        pedido.status = 'pendente'; // pendente, aprovado, recusado, enviado
        this.data.pedidos.push(pedido);
        await this.saveData();
        return pedido;
    }

    async getPedidosByCliente(clienteId) {
        await this.loadData();
        return this.data.pedidos
            .filter(pedido => pedido.cliente_id === parseInt(clienteId))
            .sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido));
    }

    async getAllPedidos() {
        await this.loadData();
        return this.data.pedidos
            .sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido));
    }

    async updatePedidoStatus(id, status) {
        await this.loadData();
        const index = this.data.pedidos.findIndex(pedido => pedido.id === parseInt(id));
        if (index === -1) return null;
        
        this.data.pedidos[index].status = status;
        await this.saveData();
        return this.data.pedidos[index];
    }

    async getProdutosPublicos() {
        await this.loadData();
        return this.data.produtos
            .filter(produto => produto.quantidade > 0)
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }
}

module.exports = new Database();
