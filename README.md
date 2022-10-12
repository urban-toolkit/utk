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

All important configuration parameters are situated in src/params.js

### Info

Web runs on the 3000 port. VR and CAVE2 runs in the 3001 port.

### Available start options

- "start:web": "cross-env REACT_APP_ENTRY=app node scripts/start.js",
- "build:web": "cross-env REACT_APP_ENTRY=app node scripts/build.js",
- "start:vr": "cross-env REACT_APP_ENTRY=vr node scripts/start.js",
- "build:vr": "cross-env REACT_APP_ENTRY=vr node scripts/build.js",
- "start:cave": "cross-env REACT_APP_ENTRY=cave node scripts/start.js",
- "start:cave:local": "cross-env REACT_APP_ENTRY=cave node scripts/start.js",
- "build": "npm run build-web && npm run build:bundle",
- "build:bundle": "webpack --config webpack.config.js",
- "test": "node scripts/test.js"

### About the data

The data used in the stages is served through the public folder.  

If one wants to change which data is being loaded the paramsMapView.environmentDataFolder has to be changed inside src/params.js
