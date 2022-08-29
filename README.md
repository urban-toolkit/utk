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
   - to see web version `npm run start-web`
   - to see the VR version `npm run start-vr`

## About this branch (caveIntegration)

The purpose of this is branch is to run the urbantk-react in the Cave using the [CAVE2D-Display-Test](https://github.com/FarahKamleh/CAVE2-Display-Test/tree/main)