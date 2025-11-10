from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
import os
from flask_cors import CORS
from io import BytesIO
import barcode
from barcode.writer import SVGWriter
import secrets
from datetime import datetime, timedelta
from functools import wraps

# Pega o caminho absoluto do diretório onde este arquivo está
basedir = os.path.abspath(os.path.dirname(__file__))

# --- Inicialização Principal ---
app = Flask(__name__)
CORS(app)  # Habilita o CORS para a aplicação

# --- Configuração do Banco de Dados ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa a extensão do banco de dados com a app configurada
db = SQLAlchemy(app)

# --- Definição dos Modelos (Tabelas) ---

class Usuario(db.Model):
    """Modelo para armazenar usuários do sistema"""
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(50), unique=True, nullable=False)
    senha = db.Column(db.String(100), nullable=False)  # Em produção, use hash de senha
    nome_completo = db.Column(db.String(100))
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    ativo = db.Column(db.Boolean, default=True)

class Token(db.Model):
    """Modelo para armazenar tokens de autenticação"""
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(100), unique=True, nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_expiracao = db.Column(db.DateTime)
    
    # Relacionamento
    usuario = db.relationship('Usuario', backref='tokens')

class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    codigo_interno = db.Column(db.String(50), unique=True)
    descricao = db.Column(db.Text)
    quantidade = db.Column(db.Integer, default=0)
    localizacao = db.Column(db.String(100))
    categoria = db.Column(db.String(50))
    preco = db.Column(db.Float)
    fornecedor = db.Column(db.String(100))

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'codigo_interno': self.codigo_interno,
            'descricao': self.descricao,
            'quantidade': self.quantidade,
            'localizacao': self.localizacao,
            'categoria': self.categoria,
            'preco': self.preco,
            'fornecedor': self.fornecedor
        }

# --- Funções de Autenticação ---

def gerar_token():
    """Gera um token único"""
    return secrets.token_urlsafe(32)

def verificar_token(token_string):
    """Verifica se um token é válido e não expirou"""
    token = Token.query.filter_by(token=token_string).first()
    
    if not token:
        return None
    
    # Verifica se o token expirou
    if token.data_expiracao and datetime.utcnow() > token.data_expiracao:
        db.session.delete(token)
        db.session.commit()
        return None
    
    return token.usuario

def token_obrigatorio(f):
    """Decorator para proteger rotas que exigem autenticação"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'mensagem': 'Token não fornecido!'}), 401
        
        # Remove "Bearer " se existir
        if token.startswith('Bearer '):
            token = token[7:]
        
        usuario = verificar_token(token)
        
        if not usuario:
            return jsonify({'mensagem': 'Token inválido ou expirado!'}), 401
        
        return f(usuario, *args, **kwargs)
    
    return decorated

# --- Rotas de Autenticação ---

@app.route('/api/login', methods=['POST'])
def login():
    """Rota para fazer login"""
    dados = request.json
    
    usuario_input = dados.get('usuario')
    senha_input = dados.get('senha')
    
    if not usuario_input or not senha_input:
        return jsonify({'mensagem': 'Usuário e senha são obrigatórios!'}), 400
    
    # Busca o usuário no banco
    usuario = Usuario.query.filter_by(usuario=usuario_input).first()
    
    # Verifica se existe e se a senha está correta
    if not usuario or usuario.senha != senha_input:
        return jsonify({'mensagem': 'Usuário ou senha incorretos!'}), 401
    
    # Verifica se o usuário está ativo
    if not usuario.ativo:
        return jsonify({'mensagem': 'Usuário desativado!'}), 403
    
    # Gera um novo token
    token_string = gerar_token()
    data_expiracao = datetime.utcnow() + timedelta(days=7)  # Token válido por 7 dias
    
    novo_token = Token(
        token=token_string,
        usuario_id=usuario.id,
        data_expiracao=data_expiracao
    )
    
    db.session.add(novo_token)
    db.session.commit()
    
    return jsonify({
        'mensagem': 'Login realizado com sucesso!',
        'token': token_string,
        'usuario': usuario.usuario,
        'nome_completo': usuario.nome_completo
    }), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    """Rota para fazer logout (invalida o token)"""
    token_string = request.headers.get('Authorization')
    
    if token_string and token_string.startswith('Bearer '):
        token_string = token_string[7:]
    
    if token_string:
        token = Token.query.filter_by(token=token_string).first()
        if token:
            db.session.delete(token)
            db.session.commit()
    
    return jsonify({'mensagem': 'Logout realizado com sucesso!'}), 200

@app.route('/api/usuario/criar', methods=['POST'])
def criar_usuario():
    """Rota para criar um novo usuário (apenas para testes - remova em produção!)"""
    dados = request.json
    
    usuario = dados.get('usuario')
    senha = dados.get('senha')
    nome_completo = dados.get('nome_completo', '')
    
    if not usuario or not senha:
        return jsonify({'mensagem': 'Usuário e senha são obrigatórios!'}), 400
    
    # Verifica se o usuário já existe
    if Usuario.query.filter_by(usuario=usuario).first():
        return jsonify({'mensagem': 'Usuário já existe!'}), 409
    
    # Cria o novo usuário
    novo_usuario = Usuario(
        usuario=usuario,
        senha=senha,  # Em produção, use hash!
        nome_completo=nome_completo
    )
    
    db.session.add(novo_usuario)
    db.session.commit()
    
    return jsonify({
        'mensagem': 'Usuário criado com sucesso!',
        'id': novo_usuario.id,
        'usuario': novo_usuario.usuario
    }), 201

# --- Rotas de Produtos (AGORA PROTEGIDAS) ---

@app.route('/api/produtos', methods=['POST'])
@token_obrigatorio
def criar_produto(usuario):
    dados = request.json
    
    novo_produto = Produto(
        nome=dados.get('nome'),
        codigo_interno=dados.get('codigo_interno'),
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
        return jsonify({'erro': str(e)}), 400

@app.route('/api/produtos', methods=['GET'])
@token_obrigatorio
def listar_produtos(usuario):
    produtos = Produto.query.all()
    return jsonify([produto.to_dict() for produto in produtos]), 200

@app.route('/api/produtos/<int:id>', methods=['GET'])
@token_obrigatorio
def obter_produto(usuario, id):
    produto = Produto.query.get_or_404(id)
    return jsonify(produto.to_dict()), 200

@app.route('/api/produtos/<int:id>', methods=['PUT'])
@token_obrigatorio
def atualizar_produto(usuario, id):
    produto = Produto.query.get_or_404(id)
    dados = request.json
    
    produto.nome = dados.get('nome', produto.nome)
    produto.codigo_interno = dados.get('codigo_interno', produto.codigo_interno)
    produto.descricao = dados.get('descricao', produto.descricao)
    produto.quantidade = dados.get('quantidade', produto.quantidade)
    produto.localizacao = dados.get('localizacao', produto.localizacao)
    produto.categoria = dados.get('categoria', produto.categoria)
    produto.preco = dados.get('preco', produto.preco)
    produto.fornecedor = dados.get('fornecedor', produto.fornecedor)
    
    try:
        db.session.commit()
        return jsonify(produto.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 400

@app.route('/api/produtos/<int:id>', methods=['DELETE'])
@token_obrigatorio
def deletar_produto(usuario, id):
    produto = Produto.query.get_or_404(id)
    
    try:
        db.session.delete(produto)
        db.session.commit()
        return jsonify({'mensagem': 'Produto deletado com sucesso!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 400

@app.route('/api/barcode/<data>')
@token_obrigatorio
def gerar_barcode(usuario, data):
    CODE128 = barcode.get_barcode_class('code128')
    codigo = CODE128(data, writer=SVGWriter())
    
    buffer = BytesIO()
    codigo.write(buffer)
    buffer.seek(0)
    
    return send_file(buffer, mimetype='image/svg+xml')

# --- Inicialização do Banco ---
with app.app_context():
    db.create_all()
    print("✅ Banco de dados inicializado!")
    
    # Cria usuário padrão se não existir
    if not Usuario.query.filter_by(usuario='admin').first():
        usuario_admin = Usuario(
            usuario='admin',
            senha='admin123',  # TROQUE ISSO EM PRODUÇÃO!
            nome_completo='Administrador do Sistema'
        )
        db.session.add(usuario_admin)
        db.session.commit()
        print("✅ Usuário admin criado! (usuário: admin, senha: admin123)")

if __name__ == '__main__':
    app.run(debug=True)
