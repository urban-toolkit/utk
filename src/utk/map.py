import os

from IPython.display import HTML

def get_html(map_id, width, height):
    filepath = os.path.dirname(os.path.realpath(__file__))
    # urbanmaptk = open(filepath+'/ts/dist/urbantkmap.iife.js',mode='r').read()
    print(filepath)
    urbanmaptk = open('../../../dist/build/bundle.min.js',mode='r').read() # load urbantk-react bundle

    width = str(width)
    height = str(height)
    if ('px' not in width) and ('%' not in width):
        width = width+'px'
    if ('px' not in height) and ('%' not in height):
        height = height+'px'

    html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <title>urbantkmap widget</title>
        </head>

        <style>
        #{mapid} {{
            width: {width};
            height: {height};
            margin: 0px;

            overflow: hidden;
        }}
        </style>

        <body>
        <div id="root"></div>
        <script>
            {urbanmaptk}
        </script>
        <script>
            var el = document.getElementById('{mapid}');
            var comm_manager = Jupyter.notebook.kernel.comm_manager;
            comm_manager.register_target('{mapid}_initMapView', function (comm, data) {{
               window.comm_handle = comm;
               comm.on_msg(function (data) {{ console.log(data['content']['data']); window.data = data['content']['data']; window.JupyterReact.init('#root', window.data);}});
            }});
        </script>
        
        </body>
        </html>
    """.format(width=width, height=height, urbanmaptk=urbanmaptk, mapid=map_id)

    return HTML(html)