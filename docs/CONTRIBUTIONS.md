# Making contributions

If you would like to modify UTK's core code and/or make contributions, you won't be able to use the ``utk`` command (since it points to the utk pip installation). Alternatively, you will have to:
1. Clone the repository with ``git clone git@github.com:urban-toolkit/utk.git``.
1. Install Node.js, either using [conda](https://anaconda.org/conda-forge/nodejs), [package managers](https://nodejs.org/en/download/package-manager), or [pre-built installers](https://nodejs.org/en/download).
2. Build the utk-ts bundle. Inside ``src/utk-ts``, you should run the following in the terminal: ``npm install && npm run build``. After that, a bundle will be created.
3. Build the utk-frontend bundle. Inside ``src/utk-frontend``, you should run the following in the terminal: ``npm install && npm run build:web``. After that, another bundle will be created.
4. Run the UTK server. Inside the ``src``, run the following in the terminal: ``python utk_server.py start --bundle utk-frontend/build/utk-app/``, and with the other appropriate arguments (e.g., ``--data`` with the path to your data folder).

To automatically build the bundles (steps 2 and 3) when you make changes to the source code, you can run ``utk_server.py`` with the ``--watch`` argument.

The following documents pertain to the Curio project but are also relevant to UTK:

1. [Code guidelines](https://github.com/urban-toolkit/curio/blob/main/docs/CODE-GUIDELINES.md)  
2. [How to fork](https://github.com/urban-toolkit/curio/blob/main/docs/HOW-TO-FORK.md)  
3. [How to make pull requests](https://github.com/urban-toolkit/curio/blob/main/docs/HOW-TO-MAKE-PULL-REQUESTS.md)  
4. [How to create issues](https://github.com/urban-toolkit/curio/blob/main/docs/HOW-TO-CREATE-ISSUES.md)  