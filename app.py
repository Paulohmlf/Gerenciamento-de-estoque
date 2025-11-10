from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

# Pega o caminho absoluto do diretório onde este arquivo está
basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)

# Configuração do Banco de Dados
# Define o caminho para o arquivo do banco de dados (será 'database.db' na mesma pasta)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Desativa warnings desnecessários

# Inicializa a extensão do banco de dados
db = SQLAlchemy(app)

# --- Definição dos Modelos (Tabelas) ---
# Vamos criar o modelo de Produto, como planejado no escopo [cite: 17]

class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    codigo_interno = db.Column(db.String(50), unique=True)
    codigo_barras = db.Column(db.String(100), unique=True)
    descricao = db.Column(db.Text, nullable=True)
    quantidade = db.Column(db.Integer, default=0)
    localizacao = db.Column(db.String(100), nullable=True)
    categoria = db.Column(db.String(50), nullable=True)
    preco = db.Column(db.Float, nullable=True)
    fornecedor = db.Column(db.String(100), nullable=True)
    
    # Define como o objeto será exibido (útil para debug)
    def __repr__(self):
        return f'<Produto {self.nome}>'

# --- Fim dos Modelos ---


@app.route('/')
def index():
    return "Backend do Sistema de Gerenciamento de Produtos está rodando!"

if __name__ == '__main__':
    app.run(debug=True)