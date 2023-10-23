import sqlite3
import json
from jsondiff import diff

# Função para criar a tabela no banco de dados
#def create_table(cursor):
#    cursor.execute('''
#        CREATE TABLE IF NOT EXISTS minha_tabela (
#            id INTEGER PRIMARY KEY,
#            campo1 TEXT,
#            campo2 INTEGER,
#            campo3 REAL
#        )
#    ''')

# Função para inserir dados na tabela
def insert_data(cursor, data):
    cursor.execute('''
        INSERT INTO minha_tabela (campo1, campo2, campo3)
        VALUES (?, ?, ?)
    ''', (data['campo1'], data['campo2'], data['campo3']))

# Nome do arquivo JSON
json_file = 'dados.json'

# Nome do arquivo SQLite
sqlite_file = 'dados.db'

# Abre o arquivo JSON
with open(json_file, 'r') as file:
    data = json.load(file)

# Conecta ao banco de dados SQLite
conn = sqlite3.connect(sqlite_file)
cursor = conn.cursor()

# Cria a tabela se ela não existir
create_table(cursor)

# Insere os dados na tabela
for item in data:
    insert_data(cursor, item)

# Commit para salvar as alterações
conn.commit()

# Fecha a conexão com o banco de dados
conn.close()







# Função para comparar dois arquivos JSON
def compare_json_files(file1, file2):
    try:
        # Abre os arquivos JSON
        with open(file1, 'r') as f1, open(file2, 'r') as f2:
            # Carrega os dados JSON
            data1 = json.load(f1)
            data2 = json.load(f2)

            # Compara os dados JSON
            if data1 == data2:
                print("Os arquivos JSON são iguais.")
            else:
                print("Os arquivos JSON são diferentes.")
    except FileNotFoundError:
        print("Um dos arquivos não foi encontrado.")
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")

# Caminhos para os arquivos JSON que você deseja comparar
file_path1 = 'file1.json'
file_path2 = 'file2.json'

# Chama a função de comparação
compare_json_files(file_path1, file_path2)







# Função para comparar e listar as diferenças entre dois arquivos JSON
def find_json_differences(file1, file2):
    try:
        # Abre os arquivos JSON
        with open(file1, 'r') as f1, open(file2, 'r') as f2:
            # Carrega os dados JSON
            data1 = json.load(f1)
            data2 = json.load(f2)

            # Encontra as diferenças
            differences = diff(data1, data2)

            # Exibe as diferenças
            print("Diferenças entre os arquivos JSON:")
            print(json.dumps(differences, indent=2))
    except FileNotFoundError:
        print("Um dos arquivos não foi encontrado.")
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")

# Caminhos para os arquivos JSON que você deseja comparar
file_path1 = 'file1.json'
file_path2 = 'file2.json'

# Chama a função para encontrar as diferenças
find_json_differences(file_path1, file_path2)