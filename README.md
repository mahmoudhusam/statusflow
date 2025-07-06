# StatusFlow Monitor
Real-time service health monitoring system

## Apps
- `apps/backend`: NestJS API
- `apps/frontend`: Next.js dashboard

## Packages
- `packages/types`: Shared TypeScript types
- `packages/config`: Shared ESLint/Prettier config




mahmoud@mahmoud-HP:~/Desktop/statusflow$ tree -I 'node_modules'
.
├── apps
│   ├── backend
│   │   ├── eslint.config.mjs
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── src
│   │   │   ├── app.controller.spec.ts
│   │   │   ├── app.controller.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.service.ts
│   │   │   └── main.ts
│   │   ├── test
│   │   │   ├── app.e2e-spec.ts
│   │   │   └── jest-e2e.json
│   │   ├── tsconfig.build.json
│   │   └── tsconfig.json
│   └── frontend
│       ├── eslint.config.mjs
│       ├── next.config.ts
│       ├── next-env.d.ts
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── public
│       │   ├── file.svg
│       │   ├── globe.svg
│       │   ├── next.svg
│       │   ├── vercel.svg
│       │   └── window.svg
│       ├── README.md
│       ├── src
│       │   └── app
│       │       ├── favicon.ico
│       │       ├── globals.css
│       │       ├── layout.tsx
│       │       └── page.tsx
│       └── tsconfig.json
├── package.json
├── package-lock.json
├── packages
│   ├── config
│   │   ├── index.js
│   │   └── package.json
│   └── types
│       ├── package.json
│       └── src
│           └── index.ts
├── README.md
└── turbo.json

13 directories, 37 files
mahmoud@mahmoud-HP:~/Desktop/statusflow$ 



