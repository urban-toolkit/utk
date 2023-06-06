## backend

The backend service is responsible for providing interfaces to access and manipulate the data stored in `/data`.  

The service provided by this container is centered in the `server.py` that exposes a number of routes:

- `/linkLayers`: process one step of an integration_scheme in the grammar. Generates `_joined.json` files describing the links.
- `/clearLinks`: clear all links created using `/linkLayers` (TODO: to be implemented).
- `/files/<path:path>` serve any file under `/data/DATA_FOLDER`.
- `/getGrammar` get the grammar under `/data/DATA_FOLDER`. (TODO: obsolete. Replace by `/files/grammar.json`).
- `/getLayer` get a .json layer under `/data/DATA_FOLDER`. (TODO: obsolete. Replace by `files/<path:path>`).
- `solveNominatim` solve nominatim using the Nominatim module of geopy.
- `/updateGrammar` updates the grammar under `/data/DATA_FOLDER`. (TODO: create a generic `/write_file/<path:path>`).

### docker-compose.yml

- The service is acessible through `localhost:5004`.
- `DATA_FOLDER` must contain the name of a folder inside `/data`