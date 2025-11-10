from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
import os
from flask_cors import CORS
from io import BytesIO # ### NOVO ###
import barcode # ### NOVO ###
from barcode.writer import SVGWriter # ### NOVO ###


# Pega o caminho absoluto do diretório onde este arquivo está
basedir = os.path.abspath(os.path.dirname(__file__))

# --- Inicialização Principal ---
app = Flask(__name__)
CORS(app) # Habilita o CORS para a aplicação

# --- Configuração do Banco de Dados ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa a extensão do banco de dados com a app configurada
db = SQLAlchemy(app)

# --- Definição dos Modelos (Tabelas) ---
class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    codigo_interno = db.Column(db.String(50), unique=True)
    # codigo_barras foi REMOVIDO
    descricao = db.Column(db.Text, nullable=True)
    quantidade = db.Column(db.Integer, default=0)
    localizacao = db.Column(db.String(100), nullable=True)
    categoria = db.Column(db.String(50), nullable=True)
    preco = db.Column(db.Float, nullable=True)
    fornecedor = db.Column(db.String(100), nullable=True)

    # Função para converter o objeto Produto em um dicionário (para JSON)
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'codigo_interno': self.codigo_interno,
            # codigo_barras foi REMOVIDO
            'descricao': self.descricao,
            'quantidade': self.quantidade,
            'localizacao': self.localizacao,
            'categoria': self.categoria,
            'preco': self.preco,
            'fornecedor': self.fornecedor
        }
    
    def __repr__(self):
        return f'<Produto {self.nome}>'

# --- Fim dos Modelos ---


@app.route('/')
def index():
    return "Backend do Sistema de Gerenciamento de Produtos está rodando!"

# --- ROTAS DA API (CRUD de Produtos) ---

# Rota para CADASTRAR um novo produto (CREATE)
@app.route('/api/produtos', methods=['POST'])
def criar_produto():
    dados = request.get_json()

    if not dados or 'nome' not in dados:
        return jsonify({'erro': 'Dados incompletos'}), 400

    novo_produto = Produto(
        nome=dados['nome'],
        codigo_interno=dados.get('codigo_interno'),
        # codigo_barras foi REMOVIDO
        descricao=dados.get('descricao'),
        quantidade=dados.get('quantidade', 0),
        localizacao=dados.get('localizacao'),
        categoria=dados.get('categoria'),
        preco=dados.get('preco'),
        fornecedor=dados.get('fornecedor')
    )

    try:
        db.session.add(novo_produto)
        db.session.commit()
        return jsonify(novo_produto.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao salvar no banco: {str(e)}'}), 500

# Rota para LISTAR todos os produtos (READ)
@app.route('/api/produtos', methods=['GET'])
def listar_produtos():
    try:
        produtos = Produto.query.all()
        lista_produtos_dict = [produto.to_dict() for produto in produtos]
        return jsonify(lista_produtos_dict), 200
    except Exception as e:
        return jsonify({'erro': f'Erro ao buscar produtos: {str(e)}'}), 500

# Rota para buscar UM produto específico (READ/DETALHE)
@app.route('/api/produtos/<int:id_produto>', methods=['GET'])
def detalhar_produto(id_produto):
    try:
        produto = Produto.query.get_or_404(id_produto)
        return jsonify(produto.to_dict()), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 404

# Rota para ATUALIZAR um produto existente (UPDATE)
@app.route('/api/produtos/<int:id_produto>', methods=['PUT'])
def atualizar_produto(id_produto):
    try:
        produto = Produto.query.get_or_404(id_produto)
        dados = request.get_json()

        produto.nome = dados.get('nome', produto.nome)
        produto.codigo_interno = dados.get('codigo_interno', produto.codigo_interno)
        # codigo_barras foi REMOVIDO
        produto.descricao = dados.get('descricao', produto.descricao)
        produto.quantidade = dados.get('quantidade', produto.quantidade)
        produto.localizacao = dados.get('localizacao', produto.localizacao)
        produto.categoria = dados.get('categoria', produto.categoria)
        produto.preco = dados.get('preco', produto.preco)
        produto.fornecedor = dados.get('fornecedor', produto.fornecedor)

        db.session.commit()
        return jsonify(produto.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao atualizar: {str(e)}'}), 500

# Rota para DELETAR um produto (DELETE)
@app.route('/api/produtos/<int:id_produto>', methods=['DELETE'])
def deletar_produto(id_produto):
    try:
        produto = Produto.query.get_or_404(id_produto)
        
        db.session.delete(produto)
        db.session.commit()
        
        return jsonify({'mensagem': 'Produto deletado com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao deletar: {str(e)}'}), 500

# --- Fim das Rotas da API ---

### NOVO: Rota para GERAR CÓDIGO DE BARRAS ###
@app.route('/api/barcode/<string:data>')
def gerar_barcode(data):
    try:
        # Usamos o formato CODE128, que é versátil e aceita letras e números
        EAN = barcode.get_barcode_class('code128')
        
        # Gera o código de barras
        # 'writer' é para salvar como imagem (PNG, SVG)
        codigo = EAN(data, writer=SVGWriter())
        
        # Salva a imagem em um "arquivo na memória" (BytesIO)
        buffer_imagem = BytesIO()
        # Usamos 'write_options' para SVG para não ter texto
        codigo.write(buffer_imagem, options={"write_text": False}) 
        buffer_imagem.seek(0) 

        return send_file(
            buffer_imagem,
            mimetype='image/svg+xml',
            as_attachment=True,  # ### NOVO: Força o download ###
            download_name=f'{data}-barcode.svg' # ### NOVO: Define o nome do arquivo ###
        )
    except Exception as e:
        return jsonify({'erro': f'Erro ao gerar código de barras: {str(e)}'}), 500

# --- Fim das Rotas de Barcode ---


if __name__ == '__main__':
    # Cria o banco de dados e tabelas (se não existirem) antes de rodar
    with app.app_context():
        db.create_all()
        
    app.run(debug=True)