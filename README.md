# Expense Flow

Expense Flow is a small expense approval app. Employees submit expenses, managers review them, and finance records approved expenses as paid. It includes an Angular web app, a NestJS API, and a PostgreSQL database.

## Requirements

- Node.js and npm
- Docker Compose

## Run locally

Start PostgreSQL from the project root:

```sh
docker compose up -d
```

In a terminal, install the API dependencies, add the sample accounts and expenses, and start the API:

```sh
cd api
npm install
npm run seed
npm run start:dev
```

In a second terminal, start the web app:

```sh
cd web
npm install
npm start
```

Open <http://localhost:4200>. The API runs at <http://localhost:3001>, and its Swagger UI is at <http://localhost:3001/docs>.

The seed command creates sample expenses and three accounts. Each account uses the password `password123`:

- `employee@example.com`
- `manager@example.com`
- `finance@example.com`

To run the API unit tests, use `npm test` from the `api` directory. Build commands are `npm run build` in either the `api` or `web` directory.

## What you can do

- Employees can submit expenses and view their own submissions.
- Managers can view all expenses, approve or reject submissions, and view the dashboard.
- Finance users can view all expenses, mark approved expenses as paid, and view the dashboard.
- Status changes are recorded in an audit history. Users cannot approve, reject, or pay their own expenses.

Expenses move from `pending` to `approved` or `rejected`; approved expenses can then move to `paid`. Rejected and paid expenses are final. Amounts are stored in cents.

## API routes

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/auth/register`, `/auth/login` | Public |
| `POST` | `/expenses` | Any signed-in user |
| `GET` | `/expenses?status=&page=&pageSize=` | Employees see their own; managers and finance see all |
| `GET` | `/expenses/:id` | Owner, manager, or finance |
| `POST` | `/expenses/:id/approve` | Manager |
| `POST` | `/expenses/:id/reject` | Manager |
| `POST` | `/expenses/:id/pay` | Finance |
| `GET` | `/expenses/summary` | Manager or finance |

## Notes

The API uses TypeORM schema synchronization for local development. Use migrations before deploying to production. The default JWT secret and demo credentials are for local use only.
