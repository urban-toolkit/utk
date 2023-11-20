import sqlite3 

con = sqlite3.connect('utk.db')

cursor = con.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Grid (
        id integer PRIMARY KEY AUTOINCREMENT,
        width integer,
        height integer
    );
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Grammar_Position (
        id integer PRIMARY KEY AUTOINCREMENT,
        width text,
        height text
    );
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Position (
        id integer pk increments,
        width text,
        height text
    );
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Plots (
        id integer pk increments
        description text,
        arg text,
        arrangement text
    );
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Knots (
        id integer pk increments
    );
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Parameter_Integration_Scheme (
        id integer pk increments,
        name text,
        integration_scheme text,
        knots integer,
        foreign key (knots) references Knots (id)
    );
""")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS Camera (
        id integer pk increments,
        position text,
        direction_right text,
        direction_lookAt text,
        direction_up text
    );
""")
##############################################################
cursor.execute("""
    CREATE TABLE IF NOT EXISTS Maps (
        id integer pk increments,
        camera integer,
        last integer,
        foreign key (camera) references Camera (id)
    );
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Knots_Maps (
        id integer pk increments,
        knots integer,
        maps integer,
        foreign key (knots) references Parameter_Integration_Scheme (id),
        foreign key (maps) references Maps (id)
    );
""")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS Interactions (
        id integer pk increments,
        interaction text,
        maps integer,
        foreign key (maps) references Maps (id)
    );
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Components (
        id integer PRIMARY KEY AUTOINCREMENT,
        maps integer,
        knots integer,
        plots integer,
        position integer,
        foreign key (knots) references Knots (id),
        foreign key (plots) references Plots (id),
        foreign key (maps) references Maps (id),
        foreign key (position) references Position (id)
    );
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Widgets (
        id integer pk increments,
        type text,
        componets interger,
        foreign key (componets) references Componets (id)
    );
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Operation (
        id integer PRIMARY KEY AUTOINCREMENT, 
        time datetime,
        type text,
        grid integer,
        grammar_position integer,
        components integer,
        grammar_json text,
        foreign key (grid) references Grid (id),
        foreign key (components) references Componets (id),
        foreign key (grammar_position) references Grammar_Position (id)
    );
""")
print("Tabela criada com sucesso!")

#desconectando do bando de dados
con.close()

