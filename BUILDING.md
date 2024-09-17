# How to build

1. First, clone this repo (obviously)
2. Then, clone the Alephium stack to have be able to run a devnet. When you need to compile stuff, you will need a devnet.
3. Go in the _smartcontract_ folder, install the dependencies (using `npm` for instance), compile and test the code.

   ```bash
    cd smartcontracts
    npm install
    npm run compile
    npm run test
   ```

4. Then go in the _frontend_ folder, install the dependencies (using `npm` for instance)
