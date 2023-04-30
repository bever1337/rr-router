# Request/Response Router

A dependency-free, semi-isomorphic router for JS environments with Request, Response, and URL globals as-defined by whatwg.

## Motivation

Inspired by this [discussion](https://github.com/kwhitley/itty-router/discussions/107) on the `itty-router` project, `rr-router` is a synchronous, request matching API.

## Setup

```bash
# Prerequisite: rr-router is developed against NodeJS v18.15.0 and NPM v9.5.0
git clone git@github.com:bever1337/rr-router.git # Clone the repository
cd rr-router # Move into repository
npm install # Install dependencies
```

Going forward, directions assume the working directory is the project root as described above.

### Building

```bash
npx tsc # Build and emit lib to `dist/`
```

### Testing

```bash
npx tsc # see above
npm run test # web-test-runner coordinates playwright test environments
```
