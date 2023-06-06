## utk

This service is responsible for holding the UTK application and bundling it inside `utk-bundle`. The bundle is consumed by the frontend service.

### Grammar

For more details on the grammar refer to [grammar.md](https://github.com/urban-toolkit/urbantk/blob/15-dockerize-the-application/grammar.md)

### docker-compose.yml

- `REACT_APP_BACKEND_SERVICE_URL` indicates the location of the backend service. 
- This service depends on backend to operate data inside `/data` depending on what was specified in the grammar. 