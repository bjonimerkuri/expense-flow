// Vercel serverless entry point. `npm run build` compiles the NestJS app to apps/api/dist, and
// vercel.json rewrites every /api/* request to this function. Nest routes on the original URL.
module.exports = require('../apps/api/dist/serverless').default;
