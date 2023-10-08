from notebookjs import execute_js
import os
import threading
import utk_server

thead_active = False
thread = None
event = threading.Event()

dir_path = os.path.dirname(os.path.realpath(__file__))

def view(work_dir, 
         grammar_path='',
         server_address='localhost',
         server_port='5001'):
    
    global thead_active
    global thread
    global event

    if(grammar_path == ''):
        grammar_path= f"{work_dir}/grammar.json"
    else:
        grammar_path = grammar_path

    if(thead_active == False):
        
        thread = threading.Thread(target=utk_server.web,args=(event,work_dir,grammar_path,server_address,server_port), daemon=True)
        thead_active = True
        thread.start()

    else:
        event.set() 
        thread = threading.Thread(target=utk_server.web,args=(work_dir,grammar_path,server_address,server_port), daemon=True)
        
        
    with open(dir_path + "/data/utk.js","r",encoding="utf8") as file:
        code_bundle = file.read()
    execute_js(library_list=code_bundle,
           main_function="utk.renderMap")
    

def check_threads():
    for thread in threading.enumerate(): 
        print(thread.name)