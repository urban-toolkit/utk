import json

def remove_elements(filepath, ids):
    file = open(filepath, mode='r')
    file_content = json.loads(file.read())

    new_data_array = []

    for index,data in enumerate(file_content['data']):
        if(index not in ids):
            new_data_array.append(data)

    file_content['data'] = new_data_array

    with open(filepath, "w") as outfile:
        json.dump(file_content, outfile)

    file.close()