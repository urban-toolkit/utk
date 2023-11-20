import sqlite3
import json
from jsondiff import diff
import datetime

# get the current datetime and store it in a variable
currentDateTime = datetime.datetime.now()

json_file = 'examples\downtown_manhattan\grammar.json'
# Abre o arquivo JSON
with open(json_file, 'r') as file:
    data = json.load(file)

conn = sqlite3.connect('utk.db')
cursor = conn.cursor()
#cursor.execute('INSERT INTO Operation (time, type, grammar_json) VALUES (?,"creat",?)', (currentDateTime, data, ))

#INSERSÃO PARA TABELA GRID
grid = (data["grid"])
cursor.execute('INSERT INTO Grid (width, height) VALUES (?,?)', (grid["width"],grid["height"], ))

#INSERSÃO PARA TABELA GRAMMAR_POSITION
grammar_position = (data["grammar_position"])
cursor.execute('INSERT INTO Grammar_Position (width, height) VALUES (?,?)', (str(grammar_position["width"]), str(grammar_position["height"]), ))

#
components = (data["components"])
components = components[0]

#INSERSÃO PARA TABELA PLOT
plots = components["plots"]
#VERIFICAR SE ESTÁ VAZIO
if plots != []:
    plots = plots[0]
    cursor.execute('INSERT INTO Position (description, arg, arrangement, plot, knots) VALUES (?,?,?,?,?)', (plots["description"], plots["arg"], plots["arrangement"], plots["plot"], plots["knots"], ))

#INSERSÃO PARA TABELA POSITION
position = components["position"]
cursor.execute('INSERT INTO Position (width, height) VALUES (?,?)', (str(position["width"]), str(position["height"]), ))

#INSERSÃO PARA TABELA WIDGETS
widgets = components["widgets"]
c = len(widgets)
for i in range(c):
    cursor.execute('INSERT INTO Widgets (type) VALUES (?)', (widgets[i]["type"], ))


#INSERSÃO PARA TABELA MAP
maps = components["map"]
#cursor.execute('INSERT INTO Maps (camera, maps_knots, interation) VALUES (?,?,?,?,?)', (plots["description"], plots["arg"], plots["arrangement"], plots["plot"], plots["knots"] ))

#INSERSÃO PARA TABELA MAP - CAMERA
camera = maps["camera"]
direction = camera["direction"]
cursor.execute('INSERT INTO Camera (position, direction_right, direction_lookAt, direction_up) VALUES (?,?,?,?)', (str(camera["position"]), str(direction["right"]), str(direction["lookAt"]), str(direction["up"]), ))

#INSERSÃO PARA TABELA MAP - KNOTS
knots = maps["knots"]
c = len(knots)
for i in range(c):
    cursor.execute('INSERT INTO Knots_Maps (knots) VALUES (?)', (knots[i], ))

#INSERSÃO PARA TABELA MAP - INTERATION
interactions = maps["interactions"]
c = len(interactions)
for i in range(c):
    cursor.execute('INSERT INTO Interactions (interaction) VALUES (?)', (interactions[i],))

##INSERSÃO PARA TABELA MAP - KNOTS
#cursor.execute('INSERT INTO Knots (components) VALUES (?)', (ID DO COMPONENTS, ))

knots = components["knots"]
c = len(knots)
for i in range(c):
    print(str(knots[i]["integration_scheme"]))
    cursor.execute('INSERT INTO Parameter_Integration_Scheme (name,integration_scheme ) VALUES (?,?)', (knots[i]["id"], str(knots[i]["integration_scheme"])))

##print(data["components"])
##Salvar dict
##cursor.execute('INSERT INTO Components (widgets, maps, knots, plots, position) VALUES (?,?,?,?,?)', (components["widgets"], components["map"], components["knots"], components["plots"], components["position"], ))


conn.commit()
conn.close()
#
#
#
#
#
#
#
#
#

 ### Função para comparar dois arquivos JSON
##def compare_json_files(file1, file2):
##    try:
##        # Abre os arquivos JSON
##        with open(file1, 'r') as f1, open(file2, 'r') as f2:
##            # Carrega os dados JSON
##            data1 = json.load(f1)
##            data2 = json.load(f2)
##
##            # Compara os dados JSON
##            if data1 == data2:
##                print("Os arquivos JSON são iguais.")
##            else:
##                print("Os arquivos JSON são diferentes.")
##    except FileNotFoundError:
##        print("Um dos arquivos não foi encontrado.")
##    except json.JSONDecodeError as e:
##        print(f"Erro ao decodificar JSON: {e}")
##
### Caminhos para os arquivos JSON que você deseja comparar
##file_path1 = 'file1.json'
##file_path2 = 'file2.json'
##
### Chama a função de comparação
##compare_json_files(file_path1, file_path2)
##
##
##
##
##
##
##
### Função para comparar e listar as diferenças entre dois arquivos JSON
##def find_json_differences(file1, file2):
##    try:
##        # Abre os arquivos JSON
##        with open(file1, 'r') as f1, open(file2, 'r') as f2:
##            # Carrega os dados JSON
##            data1 = json.load(f1)
##            data2 = json.load(f2)
##
##            # Encontra as diferenças
##            differences = diff(data1, data2)
##
##            # Exibe as diferenças
##            print("Diferenças entre os arquivos JSON:")
##            print(json.dumps(differences, indent=2))
##    except FileNotFoundError:
##        print("Um dos arquivos não foi encontrado.")
##    except json.JSONDecodeError as e:
##        print(f"Erro ao decodificar JSON: {e}")
##
### Caminhos para os arquivos JSON que você deseja comparar
##file_path1 = 'file1.json'
##file_path2 = 'file2.json'
##
### Chama a função para encontrar as diferenças
##find_json_differences(file_path1, file_path2)




###             Acesso as informações do banco 
#conn = sqlite3.connect('utk.db')
#cursor = conn.cursor()
#cursor.execute('SELECT grammar_json from Operation WHERE id = 11')
#select = cursor.fetchall()
#print(select)


###             Salvar as informações no banco por aqui