import os
import hashlib
import json

def _hash_query(query):
    return hashlib.md5(query.encode("utf-8")).hexdigest()

def _save_osm_to_cache(query, response):
    filename = _hash_query(query)
    cachepath = './urbantk_cache/'
    if not os.path.exists(cachepath):
        os.makedirs(cachepath)
    response_str = str(json.dumps(response))
    with open(cachepath+filename, "w", encoding="utf-8") as cache_file:
        cache_file.write(response_str)


def _load_osm_from_cache(query):
    filename = _hash_query(query)
    cachepath = './urbantk_cache/'
    if os.path.isfile(cachepath+filename):
        with open(cachepath+filename, "r", encoding="utf-8") as cache_file:
            response = json.load(cache_file)
            return response
    else:
        return None


