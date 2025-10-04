# Solve Issue

Implement a solution for an existing issue using the issue documentation file.

## Issue File: $ARGUMENTS

## Execution Process

1. **Load Issue**
   - Read the specified issue file from `/docs/issues/`
   - Understand all context, requirements, and impact
   - Follow all instructions and extend research if needed
   - Ensure you have all needed context to solve the issue fully
   - Do more web searches and codebase exploration as needed

2. **ULTRATHINK**
   - Think hard before you execute the solution. Create a comprehensive plan addressing all requirements.
   - Break down complex tasks into smaller, manageable steps using your todos tools.
   - Use the TodoWrite tool to create and track your implementation plan.
   - Identify implementation patterns from existing code to follow.
   - Consider the business impact and user flow effects mentioned in the issue.

3. **Execute the solution**
   - Implement all necessary code changes
   - Follow the potential fixes and technical details from the issue
   - Address all root causes identified
   - Ensure proper error handling and edge cases

4. **Validate**
   - Run lint and typecheck commands (ruff, eslint, etc.)
   - Run relevant tests (unit, e2e, integration)
   - Test the specific scenarios mentioned in the issue
   - Verify the fix doesn't break existing functionality
   - Fix any failures and re-run until all pass

5. **Test User Journey**
   - Use test accounts to verify the complete user flow works
   - Test edge cases and error scenarios
   - Ensure WebSocket updates work if applicable
   - Verify payment flows if financial features are involved

6. **Complete**
   - Ensure all acceptance criteria are met
   - Run final validation suite
   - Update issue documentation with resolution details
   - Move solved issue to `/docs/issues/closed/`
   - Report completion status

7. **Reference the Issue**
   - You can always reference the issue again if needed
   - Document any additional findings or edge cases discovered

Note: If validation fails, use error patterns and debugging info from the issue to fix and retry.

## Quality Checklist for Solution
- [ ] All technical fixes implemented
- [ ] Root causes addressed
- [ ] Tests pass (lint, unit, e2e)
- [ ] User journey validated with test accounts
- [ ] No regressions introduced
- [ ] Issue moved to closed folder
- [ ] Solution documented in issue file