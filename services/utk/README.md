## utk

This service is responsible for holding the UTK application and bundling it inside `utk-bundle`. The bundle is consumed by the frontend service.

### docker-compose.yml

- `REACT_APP_BACKEND_SERVICE_URL` indicates the location of the backend service. 
- This service depends on backend to operate data inside `/data` depending on what was specified in the grammar. 