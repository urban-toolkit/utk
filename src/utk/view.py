from notebookjs import execute_js
import os 
dir_path = os.path.dirname(os.path.realpath(__file__))


def view():
    with open(dir_path + "/data/utk.js","r",encoding="utf8") as file:
        code_bundle = file.read()
    execute_js(library_list=code_bundle,
           main_function="utk.renderMap")