import sqlite3

import os
workDir = '._data_'


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

    conn.execute('''CREATE TABLE IF NOT EXISTS Operation_Execution (
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
                  Parameter_integration_scheme (
                    integration_scheme varchar,
                    spatial_relationship integer,
                    in_out integer,
                    in_out_Layers integer,
                    in_out_Layers_name integer,
                    in_out_Layers_level integer,
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
                    camera_direction integer,
                    camera_direction_right integer,
                    camera_direction_lookAt integer,
                    camera_direction_up integer,
                    camera_position integer,
                    knots integer,
                    interactions integer,
                    position integer,
                    position_width integer,
                    position_height integer
                );
                ''')
    

    conn.execute(''' CREATE TABLE IF NOT EXISTS Knots(
                 id integer PRIMARY KEY,
                 integration_scheme integer);
                 ''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS Widgets (
                    id integer PRIMARY KEY,
                    type integer,
                    title integer,
                    subtitle integer,
                    categories integer,
                    categories_category_name integer,
                    categories_elements integer,
                    categories_elements_categories integer,
                    position integer,
                    position_height integer,
                    position_width integer
                    ); 
                ''')

    print('Table Created')

    # # conn.execute("INSERT INTO COMPANY (ID,NAME,AGE,ADDRESS,SALARY) \
    # #   VALUES (1, 'Paul', 32, 'California', 20000_00 )")

    conn.close()
    return
