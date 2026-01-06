## Description
<!-- Provide a clear and concise description of what this PR does -->

## Type of Change
<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (code improvement without changing functionality)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Security fix
- [ ] Dependency update

## Scope
<!-- Mark all that apply -->

- [ ] Client (Chrome Extension)
- [ ] Server (Backend API)
- [ ] Database (Schema/Migrations)
- [ ] Infrastructure (Docker/CI)
- [ ] Documentation

## Changes Made
<!-- List the specific changes in bullet points -->

-
-
-

## Related Issues
<!-- Link related issues using: Fixes #123, Closes #456, Relates to #789 -->

Fixes #

## Testing Checklist
<!-- Mark completed items with an "x" -->

- [ ] All existing tests pass (`npm run test`)
- [ ] Added new tests for new functionality
- [ ] Manual testing completed
- [ ] Tested in Chrome browser (if client changes)
- [ ] Database migrations tested (if applicable)
- [ ] Integration tests pass (if server changes)

### Test Coverage
<!-- For server changes, ensure coverage meets thresholds -->
- [ ] Branches: 75%+
- [ ] Functions: 100%
- [ ] Lines: 90%+
- [ ] Statements: 90%+

## Code Quality Checklist
<!-- Mark completed items with an "x" -->

- [ ] Code follows project coding standards (CLAUDE.md)
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] Linting passes (`npm run lint`)
- [ ] All functions have explicit return types
- [ ] Security: Input validation and sanitization implemented
- [ ] Security: No XSS, SQL injection, or OWASP vulnerabilities introduced
- [ ] Error handling follows project patterns (AppError, error middleware)
- [ ] No console.log or debug statements left in code
- [ ] Code is self-documenting (comments only where logic isn't self-evident)

## Extension-Specific Checklist
<!-- Only for client changes -->

- [ ] Manifest V3 compliance maintained
- [ ] Minimal permissions (no new permissions added without justification)
- [ ] DOM manipulation uses safety checks (`isValidDOMElement()`)
- [ ] Chrome message validation (`isValidMessageSender()`)
- [ ] No remote code execution
- [ ] Content script tested on real websites

## API Changes
<!-- Only if API endpoints were modified -->

- [ ] API documentation updated
- [ ] Rate limiting considered
- [ ] Zod validation schemas added/updated
- [ ] Backward compatibility maintained (or breaking change documented)

## Database Changes
<!-- Only if schema was modified -->

- [ ] Migration file created and tested
- [ ] Schema changes documented
- [ ] Seed data updated if necessary
- [ ] Rollback plan documented

## Screenshots
<!-- For UI changes, add before/after screenshots -->

### Before
<!-- Screenshot or N/A -->

### After
<!-- Screenshot or N/A -->

## Additional Notes
<!-- Any additional information reviewers should know -->

## Deployment Notes
<!-- Special instructions for deployment, if any -->

---

**Checklist before requesting review:**
- [ ] Self-review completed
- [ ] Code is rebased on latest main branch
- [ ] Commit messages are clear and descriptive
- [ ] No merge conflicts
