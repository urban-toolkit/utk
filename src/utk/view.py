from notebookjs import execute_js
import os
import threading
import utk_server

dir_path = os.path.dirname(os.path.realpath(__file__))

def view(work_dir, 
         grammar_path='',
         server_address='localhost',
         server_port='5001'):
    
   
   #########init############
    if(grammar_path == ''):
        grammar_path= f"{work_dir}/grammar.json"
    else:
        grammar_path = grammar_path

    # t = threading.Thread(target=start_server, name='Starting utk server',args=(address,port,)) #< Note that I did not actually call the function, but instead sent it as a parameter
    # t.daemon = True
    # t.start() #< This actually starts the thread execution in the background
    # #########init############
    # time.sleep(10)

    threading.Thread(target=utk_server.web,args=(work_dir,grammar_path,server_address,server_port), daemon=True).start()

    with open(dir_path + "/data/utk.js","r",encoding="utf8") as file:
        code_bundle = file.read()
    execute_js(library_list=code_bundle,
           main_function="utk.renderMap")
    

def check_threads():
    for thread in threading.enumerate(): 
        print(thread.name)