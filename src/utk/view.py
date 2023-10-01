from notebookjs import execute_js
import os 
import subprocess
import threading
dir_path = os.path.dirname(os.path.realpath(__file__))

def start_server(data_path,grammar=''):
    if(grammar == ''):
        call_string = f"utk start --data {data_path}"
    else:
         call_string = f"utk start --data {data_path} --grammar {grammar}"
    print(call_string)
    subprocess.call(call_string, creationflags=subprocess.CREATE_NEW_CONSOLE)
   
        

def view(data_path,grammar=''):
    
    t = threading.Thread(target=start_server, name='Starting utk server',args=(data_path,grammar)) #< Note that I did not actually call the function, but instead sent it as a parameter
    t.daemon = True
    t.start() #< This actually starts the thread execution in the background
    with open(dir_path + "/data/utk.js","r",encoding="utf8") as file:
        code_bundle = file.read()
    execute_js(library_list=code_bundle,
           main_function="utk.renderMap")