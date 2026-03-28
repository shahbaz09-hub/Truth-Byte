# Contributing to TruthByte

Thank you for contributing to TruthByte.

## Development setup

1. Clone the repository.
2. Start backend from `backend/`:
   - `mvn spring-boot:run`
3. Start frontend from `frontend/`:
   - `npm install`
   - `npm run dev`

## Branch and commit conventions

- Create focused branches per change, for example:
  - `feat/claim-source-filter`
  - `fix/url-parser-timeout`
- Keep commit messages clear and action-oriented:
  - `feat(search): add claim confidence filter`
  - `fix(auth): handle expired jwt token`

## Pull request checklist

- [ ] The change is scoped and avoids unrelated refactors.
- [ ] Code builds locally.
- [ ] Relevant tests/lint were run.
- [ ] Documentation is updated when behavior changes.
- [ ] PR description explains the problem and solution clearly.

## Reporting issues

When reporting issues, include:

- Reproduction steps
- Expected vs actual behavior
- Logs or screenshots when relevant
- Environment details (OS, Java version, Node version)
