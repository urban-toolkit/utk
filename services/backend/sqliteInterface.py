import sqlite3

import os
workDir = './data/'


def sqlite_insert_query_executor(database_path, queryString, valuesTuple):
    conn = sqlite3.connect(database_path,
                           detect_types=sqlite3.PARSE_DECLTYPES |
                           sqlite3.PARSE_COLNAMES)
    cursor = conn.cursor()
    queryToExecute = queryString

    cursor.execute(queryToExecute, valuesTuple)
    print("table updated")
    insertedRowId = cursor.lastrowid

    conn.commit()
    cursor.close()
    conn.close()
    return insertedRowId


def sqlite_select_query_executor(database_path, queryString):
    conn = sqlite3.connect(database_path,
                           detect_types=sqlite3.PARSE_DECLTYPES |
                           sqlite3.PARSE_COLNAMES)
    cursor = conn.cursor()
    queryToExecute = queryString

    output = cursor.execute(queryToExecute).fetchone()
    print("table selected")

    conn.commit()
    cursor.close()
    conn.close()
    return


def sqlite_create_tables(database_path):
    conn = sqlite3.connect(database_path)

    # print("Opened database successfully")

    # conn.execute('''CREATE TABLE IF NOT EXISTS COMPANY
    #      (ID INT PRIMARY KEY     NOT NULL,
    #      NAME           TEXT    NOT NULL,
    #      AGE            INT     NOT NULL,
    #      ADDRESS        CHAR(50),
    #      SALARY         REAL);''')

    conn.execute('''CREATE TABLE IF NOT EXISTS Map (
                    id integer PRIMARY KEY AUTOINCREMENT,
                    maps integer,
                    knots integer,
                    plots integer,
                    visual integer);
                 ''')

    conn.execute('''CREATE TABLE IF NOT EXISTS User (
                    id integer PRIMARY KEY,
                    name varchar );
                 ''')

    conn.execute('''CREATE TABLE IF NOT EXISTS Grammar (
                    id integer PRIMARY KEY ,
                    grammar_json varchar );
                 ''')

    conn.execute('''CREATE TABLE  IF NOT EXISTS Operation_Execution (
                    id integer PRIMARY KEY,
                    start_time timestamp,
                    end_time timestamp,
                    output_message varchar,
                    error_message varchar,
                    id_user integer,
                    id_map integer,
                    id_grammar integer);
                 ''')

    conn.execute('''CREATE TABLE IF NOT EXISTS
                  Parameter.integration_scheme (
                    integration_scheme varchar,
                    spatial_relationship integer,
                    in/out integer,
                    in/out.Layers integer,
                    in/out.Layers.name integer,
                    in/out.Layers.level integer,
                    Abstract integer,
                    operation integer,
                    op integer,
                    maxDistances integer,
                    defaultValue integer
                  );
                ''')
    
    conn.execute(''' CREATE TABLE IF NOT EXISTS Visual (
                    id integer PRIMARY KEY,
                    visual integer,
                    camera integer,
                    camera.direction integer,
                    camera.direction.right integer,
                    camera.direction.lookAt integer,
                    camera.direction.up integer,
                    camera.position integer,
                    knots integer,
                    interactions integer,
                    position integer,
                    position.width integer,
                    position.height integer
                );

                ''')
    conn.execute(''' CREATE TABLE IF NOT EXISTS Knots(
                 id integer PRIMARY KEY,
                 integration_scheme integer);
                 ''')
    
    conn.execute('''CREATE TABLE Widgets (
                    id integer PRIMARY KEY,
                    type integer,
                    title integer,
                    subtitle integer,
                    categories integer,
                    categories.category_name integer,
                    categories.elements integer,
                    categories.elements.categories integer,
                    position integer,
                    position.height integer,
                    position.width integer
                    ); 
                ''')

    print('Table Created')

    # # conn.execute("INSERT INTO COMPANY (ID,NAME,AGE,ADDRESS,SALARY) \
    # #   VALUES (1, 'Paul', 32, 'California', 20000.00 )")

    conn.close()
    return
