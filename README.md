# Getting Started with this project

1. Clone the repository, initialize submodule and pull submodule

`git clone --recurse-submodule https://github.com/urban-toolkit/urbantk-react-ts.git`

2. Copy remote branch (v1.0 - most recent till now) to a local branch

   - go to urbantk-react-ts/src/urbantk-map/
   - copy remote v1.0 branch to a local git branch
   - got to ts folder
   - run `npm install`
   - run `npm run build`

3. Frontend configuration
   - go back to urbantk-react-ts folder
   - run `npm install`
   - to see web version `npm run start:web`
   - to see the VR version `npm run start:vr`
   - to see the CAVE2 version `npm run start:cave`

### Configuration

All important configuration parameters are situated in src/params.js.  

### Info

Web runs on the 3000 port. VR and CAVE2 runs in the 3001 port.  

### Available start options

- "start:web": Starts the web version
- "build:web": Builds the bundle for web version (broken)
- "start:vr": Starts the VR version
- "build:vr": Builds the bundle for the VR version (broken)
- "start:cave": Starts the CAVE2 version
- "start:cave:local": Starts the CAVE2 version locally (for testing purposes) (not implemented)
- "build": Build web version and bundle (broken)
- "build:bundle": Build webpack bundle
- "test": Run tests (not implemented)

### About the data

The data used in the stages is served through the public folder.  

If one wants to change which data is being loaded the paramsMapView.environmentDataFolder has to be changed inside src/params.js  

Obs: Currently it is only possible to load public/data/example_mesh_nyc, because it is the only example that uses the projection 3395 instead of lat/lng.

### To load project into the CAVE2

### TODO

- Merge build loading with the other layers (change projection to 3395)

- Give support to fixed resolution in urbantk-map (for CAVE2)
- Initialize all dependent servers with `npm run start:cave`
- Finalize the start:vr:local (for local testing purposes)
- Fix dependency issues with urbantk-react
- Fix coastline mesh loading (dataLoading)
- Merge ShadowRayTracing with urbantk-react (dataLoading)
- Unify node dependancies
- Change repository name, delete all other branches except master, delete all other repositories except `urbantk-map` and `urbantk-react`
- Add CAVE2 Unity side as a sub-module
- Clean code
- Clean big files of repo
- Make shaders pretty [link](https://www.kpf.com/about/innovation)
- Dont try to connect to unity or order server when the web server is executed
- Prevent the need of starting web server 
- Make the data be loaded from UrbanComponnent communication with Jupyter not from what I choose in MapView

- Because of a package used in urban-tk some rules from typescript were disabled (in order to build urbantk-react). The best solution is to enable them again and use the source code of the library as a sub-module. They were disabled by inserting comments in the file.Disabled rules:
   - @typescript-eslint/no-empty-function
      - /* eslint-disable @typescript-eslint/no-empty-function */
   - no-cond-assign
      - /* eslint-disable no-cond-assign */
   - require-yield
      - /* eslint-disable require-yield */

