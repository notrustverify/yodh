# Build and run Yodh

Use Node.js 24 LTS and Yarn 1.22.22. The runtime is pinned in `.nvmrc` and used by GitHub Actions.

```bash
nvm install
nvm use
yarn install --frozen-lockfile
yarn dev
```

The app defaults to testnet. Configure `.env.local` to choose the network and your existing deployed factory:

```dotenv
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_NODE_URL=https://your-fullnode
NEXT_PUBLIC_GIFT_FACTORY_ADDRESS=your-factory-address
NEXT_PUBLIC_URL=https://your-yodh-host
```

The network, node, factory, and public URL must refer to the same deployment. These public settings are embedded at build time.

```bash
yarn lint
yarn typecheck
yarn test test/frontend.test.ts --coverage=false
yarn build
```

`yarn build` (and its `yarn export` alias) produces the static site in `build/`, as configured by `distDir` with `output: 'export'`. Deploy that directory. Network-specific builds remain available as `devnet:build`, `testnet:build`, and `mainnet:build`. Webpack is selected explicitly to preserve the existing browser dependency configuration on Next.js 16.

Gift creation, redemption, cancellation, pooled contributions, passwords, time locks, QR sharing, PDF download, local gift history, and the mobile navigation are available. Wallet transactions require a wallet connected to the configured network. Gift history lives in this browser's local storage.

## Contracts

Run a compatible [Alephium devnet stack](https://github.com/alephium/alephium-stack) on `http://127.0.0.1:22973` before compilation or blockchain tests. The SDK 3.0.5 package identifies Alephium 4.6.0 as its node version.

```bash
yarn compile
yarn test
yarn devnet:deploy
```

Compilation and deployment use the locally installed, locked Alephium CLI. Deployments change blockchain state; run them only when you intend to deploy. Existing contract sources and deployment addresses are preserved. The checked-in wrappers have been adapted to the SDK's `args` test parameter name; regenerate them with `yarn compile` when changing contracts.

SDK v3 no longer supplies some transitive browser dependencies. The app imports `Buffer` explicitly for existing gift links and PDFs, and declares `bip39` directly for the mnemonic utility. `resolvePackageJsonExports: false` keeps the Alephium CLI's CommonJS types and frontend SDK types consistent while using Next.js's required bundler module resolution.

## Verify printable gift cards

`yarn pdf:verify` generates regular and password-protected sample cards in `output/pdf/` using the same document builder as the app. Samples are clearly marked as examples with no redeemable funds. The download waits for both QR preparation and PDF rendering. PDF emoji images are loaded from the Twemoji CDN and require a network connection.
