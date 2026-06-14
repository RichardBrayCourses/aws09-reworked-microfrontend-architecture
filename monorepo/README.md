# AWS 10 - Microfrontend Architecture

This version builds on the service architecture from versions 07 and 08 and moves the frontend into independently built route apps.

## What changed in this version

- `apps/shell` owns the CloudFront/S3 website shell and shared navigation.
- `apps/gallery` owns the gallery and upload route experience.
- `apps/analytics` owns image analytics routes.
- Shared frontend code is moved into `packages/frontend/*`.
- Backend event contracts live under `packages/backend/events`.
- The backend services remain independently deployable and keep their CDK folders beside the services.
- Rekognition and tagging are not present in this version; those changes belong to version 11.

## Deployable units

- `apps/shell`
- `apps/gallery`
- `apps/analytics`
- `services/cognito-service`
- `services/photos-service`
- `services/historic-likes-service`
- `services/realtime-likes-service`

Deploy individual frontend apps:

```bash
pnpm run shell:deploy
pnpm run gallery:deploy
pnpm run analytics:deploy
```

Deploy the full version:

```bash
pnpm run deploy-everything
pnpm run generate-env
```

## Local workflow

```bash
pnpm install
pnpm run type-check
pnpm run dev
```

The route apps read their deployed service endpoints from generated `.env` files:

```bash
pnpm run generate-env
```

## Structure

```text
apps/shell/cdk
apps/gallery
apps/analytics
packages/frontend/api-client
packages/frontend/auth
packages/frontend/ui
packages/frontend/tailwind-config
packages/frontend/tokens
packages/backend/events
services/cognito-service/cdk
services/photos-service/cdk
services/historic-likes-service/cdk
services/realtime-likes-service/cdk
scripts
```

