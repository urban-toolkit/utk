import sqlite3 

con = sqlite3.connect('utk.db')

cursor = con.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Grammar(
        id integer PRIMARY KEY AUTOINCREMENT,
        grammar_json varchar,
        map integer,
        widgets integer);
""")

#cursor.execute("""
#    CREATE TABLE IF NOT EXISTS Operation_Execution (
#        id integer PRIMARY KEY AUTOINCREMENT,
#        start_time timestamp,
#        end_time timestamp,
#        output_message varchar,
#        error_message varchar,
#        id_grammar integer
#    );                     
#""")
#cursor.execute("""
#    CREATE TABLE IF NOT EXISTS Knots (
#        id integer PRIMARY KEY AUTOINCREMENT,
#        integration_scheme integer
#    );
#""")
#cursor.execute("""
#    CREATE TABLE IF NOT EXISTS Parameter.integration_scheme (
#        id integer PRIMARY KEY AUTOINCREMENT,
#        integration_scheme varchar,
#        spatial_relationship integer,
#        in/out integer,
#        in/out.Layers integer,
#        in/out.Layers.name integer,
#        in/out.Layers.level integer,
#        Abstract integer,
#        operation integer,
#        op integer,
#        maxDistances integer,
#        defaultValue integer
#    );
#""")
#cursor.execute("""
#    CREATE TABLE IF NOT EXISTS Plots (
#        id integer PRIMARY KEY AUTOINCREMENT,
#        name integer,
#        args integer,
#        arrangement integer,
#        plot integer,
#        knot integer
#    );
#""")
#cursor.execute("""
#    CREATE TABLE IF NOT EXISTS Visual (
#        id integer PRIMARY KEY AUTOINCREMENT,
#        visual integer,
#        camera integer,
#        camera.direction integer,
#        camera.direction.right integer,
#        camera.direction.lookAt integer,
#        camera.direction.up integer,
#        camera.position integer,
#        knots integer,
#        interactions integer,
#        position integer,
#        position.width integer,
#        position.height integer
#    );
#""")
#cursor.execute("""
#    CREATE TABLE IF NOT EXISTS Maps (
#        id integer PRIMARY KEY AUTOINCREMENT,
#        maps integer,
#        knots integer,
#        plots integer,
#        visual integer
#    );
#""")
#cursor.execute("""
#    CREATE TABLE IF NOT EXISTS Widgets (
#        id integer PRIMARY KEY AUTOINCREMENT,
#        type integer,
#        title integer,
#        subtitle integer,
#        categories integer,
#        categories.category_name integer,
#        categories.elements integer,
#        categories.elements.categories integer,
#        position integer,
#        position.height integer,
#        position.width integer
#    );      
#""")

print("Tabela criada com sucesso!")

#desconectando do bando de dados
con.close()

