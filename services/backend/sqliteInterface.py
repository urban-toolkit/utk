import sqlite3

import os
workDir = '._data_'


def sqlite_insert_query_executor(database_path, queryString, valuesTuple):
    print('query is')
    print(queryString)
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

    conn.execute('''CREATE TABLE IF NOT EXISTS Grammars (
                    id integer PRIMARY KEY ,
                    grammar_json varchar );
                 ''')

    conn.execute('''CREATE TABLE IF NOT EXISTS Maps (
                    id integer PRIMARY KEY AUTOINCREMENT,
                    grammar_id integer,
                    FOREIGN KEY(grammar_id) REFERENCES Grammars(id)
                    );
                ''')

    # conn.execute(''' CREATE TABLE IF NOT EXISTS Views (
    #                 id integer PRIMARY KEY,
    #                 camera_position varchar,
    #                 camera_direction_right varchar,
    #                 camera_direction_lookat varchar,
    #                 camera_directgion_up varchar,
    #                 map_id integer,
    #                 FOREIGN KEY(map_id) REFERENCES Maps(id));
    #             );
    #             ''')

    conn.execute(''' CREATE TABLE IF NOT EXISTS Knots(
                 id integer PRIMARY KEY AUTOINCREMENT,
                 knot_id_name varchar,
                 grammar_id integer,
                 FOREIGN KEY(grammar_id) REFERENCES Grammars(id));
                 ''')

    conn.execute('''CREATE TABLE IF NOT EXISTS
                  IntegrationSchemas (
                    id integer PRIMARY KEY AUTOINCREMENT,
                    operation varchar,
                    abstract varchar,
                    knot_id integer,
                    FOREIGN KEY(knot_id) REFERENCES Knots(id)
                  );
                ''')

    conn.execute('''CREATE TABLE IF NOT EXISTS
                  InOutOperations (
                    id integer PRIMARY KEY AUTOINCREMENT,
                    type varchar,
                    name varchar,
                    level varchar,
                    integration_schema_id integer,
                    FOREIGN KEY(integration_schema_id) REFERENCES IntegrationSchemas(id)
                  );
                ''')

    # conn.execute('''CREATE TABLE IF NOT EXISTS User (
    #                 id integer PRIMARY KEY AUTOINCREMENT,
    #                 name varchar );
    #              ''')

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

    # conn.execute('''CREATE TABLE IF NOT EXISTS Widgets (
    #                 id integer PRIMARY KEY,
    #                 type integer,
    #                 title integer,
    #                 subtitle integer,
    #                 categories integer,
    #                 categories_category_name integer,
    #                 categories_elements integer,
    #                 categories_elements_categories integer,
    #                 position integer,
    #                 position_height integer,
    #                 position_width integer
    #                 );
    #             ''')

    print('Table Created')

    # # conn.execute("INSERT INTO COMPANY (ID,NAME,AGE,ADDRESS,SALARY) \
    # #   VALUES (1, 'Paul', 32, 'California', 20000_00 )")

    conn.close()
    return
