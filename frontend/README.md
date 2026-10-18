# Noor Academy frontend

Angular standalone components, reactive forms, RxJS, and Tailwind CSS.

```bash
npm ci
npm start
npm run build
npm test -- --watch=false
```

Start the Spring Boot API separately on port 8080. Development API requests use the URL in `src/environments/environment.ts`, with backend CORS enabled. For production, set `src/environments/environment.prod.ts` to your deployed backend API URL before building.

Routes include public courses, login/registration/password recovery, role dashboards, `/profile`, and `/classroom/:groupId`. Teachers/admins publish materials in the classroom; confirmed students read and download them. The API enforces these permissions.

R2 credentials and email settings belong only on the backend. See the [project README](../README.md) and [deployment and storage setup](../docs/DEPLOYMENT_FREE_TIER.md).
