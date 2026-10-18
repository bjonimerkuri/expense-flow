# 3. Workflow rules live on the server, and the API says what the user can do next

Status: accepted

## Decision

The status flow, the role required for each step, and separation of duties (nobody acts on their own expense) are pure
functions in `apps/api/src/expenses/expense.rules.ts`. `allowedActions(user, expense)` combines them, and every expense
returned by the API carries an `actions` array. The Angular app shows exactly those buttons.

Transitions run in a transaction with a pessimistic row lock, so two reviewers acting at once cannot both succeed: the
second sees the new status and receives `422`. An integration test fires both requests concurrently.

## Consequences

- One place to change a rule, with unit tests. The UI follows automatically.
- Money is stored as integer cents with a `CHECK (amount > 0)`, and each status change writes an `expense_events` row,
  which powers the history view.
