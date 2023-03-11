# Request/Response Router

## Setup

```bash
# Prerequisite: rr-router is developed against NodeJS v18.15.0 and NPM v9.5.0
git clone git@github.com:bever1337/rr-router.git # Clone the repository
cd rr-router # Move into repository
npm install # Install dependencies
npx tsc # Build and emit lib to `dist/`
```

### Testing

```bash
# Prerequisite: Install webdrivers to the dev machine
touch .env
echo 'PATH_GECKODRIVER="./relative-path/from-root/to-gecko-driver"' > .env

# create HTTPS certificates for testing with Caches API
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout cert.key -out cert.pem -sha256

# Build with `npx tsc`, see above
npx tsc

# Test runner
node --test
# Same as
npm run test
```
