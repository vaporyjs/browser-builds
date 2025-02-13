# vaporyjs - Browser Builds

This repository contains browser builds of the following ``vaporyjs`` libraries:

- [vaporyjs-vm](./dist/vaporyjs-vm/)
- [vaporyjs-tx](./dist/vaporyjs-tx/)
- [vaporyjs-wallet](./dist/vaporyjs-wallet/)
- [vaporyjs-wallet-hd](./dist/vaporyjs-wallet-hd/)
- [vaporyjs-wallet-thirdparty](./dist/vaporyjs-wallet-thirdparty/)
- [vaporyjs-icap](./dist/vaporyjs-icap/)
- [vaporyjs-abi](./dist/vaporyjs-abi/)
- [vaporyjs-all](./dist/vaporyjs-all/)

They are built using [browserify](browserify.org) with a known set of working dependencies.

For every library/build collection there is a larger plain source version also including the source mappings
(e.g. ``vaporyjs-vm-x.x.x.js``) and a minified version for use in production (e.g. ``vaporyjs-vm-x.x.x.min.js``).

**Note:**

This repository was just lately (October 2017) revived. Currently all builds are considered ``experimental`` in terms of API stability, functionality and security!

## Usage

In your web application, include only one of the builds from the `dist` directory. All exports will be available under the global `vaporyjs`.

**Note:** all packages expect ECMAScript 6 (ES6) as a minimum environment. From browsers lacking ES6 support, please use a shim (like [es6-shim](https://github.com/paulmillr/es6-shim)) before including any of the builds from this repo.

## Examples

Examples for usage of the browser builds can be found in the ``examples`` directory:

- [examples/](./examples/)

Start an [http-server](https://github.com/indexzero/http-server) from the main directory of the repository to run the examples in the browser.

## Build

Builds are done using the ``.js`` ``exports`` compilation files from the [src/](./src/) directory and using the
[build.js](./build.js) script from the main directory to create the build in the [dist/](./dist/) folder.

Version numbers for the builds are directly extracted from the versions installed in the local ``node_modules`` 
folder.

For creating new builds:

1. Change `package.json` to require desired/up-to-date versions of the libraries
2. Reinstall/update local ``node_modules`` packages
3. Run `npm run build` to generate new set of builds

