# Create Issue Documentation

## Issue Description: $ARGUMENTS

Create structured issue documentation in `/docs/issues/open/` directory following established patterns from existing issues.

## Research Process

1. **Issue Classification**
   - Analyze the issue type and severity
   - Review similar existing issues for patterns
   - Determine appropriate template structure
   - Identify related files and components

2. **Context Gathering**
   - Search codebase for related functionality
   - Review logs and error patterns if applicable
   - Check existing documentation and TODOs
   - Identify stakeholders and impact scope

3. **Documentation Creation**
   - Use established naming convention: `[type]-[descriptive-slug].md`
   - Follow structure from existing issues
   - Include actionable steps and clear acceptance criteria
   - Add relevant file references and code snippets

## Issue Documentation Structure


### For Bug Reports
```markdown
# Bug Report: [Title]

## Issue Description
[Clear problem description]

## Test Case / Steps to Reproduce
1. [Step 1]
2. [Step 2] 
3. **Expected**: [Expected behavior]
4. **Actual**: [Actual behavior]

## Root Cause Analysis

### Backend Status: ✅/❌ [Status]
[Backend investigation findings]

### Frontend Status: ✅/❌ [Status]  
[Frontend investigation findings]

## Technical Details
[Code snippets, logs, error messages]

## Potential Fixes
[Numbered list of solutions with code examples]

## Impact
[Business impact and user flow effects]

## Priority: [Critical/High/Medium/Low]
[Justification]

## Related Files
[List of relevant files with paths]

## Workaround
[Temporary solution if available]
```

### For Implementation Plans
```markdown
# [Feature/Enhancement]: [Title]

## Executive Summary
[High-level overview and approach]

## Current State Analysis
[What exists today]

## Implementation Plan
[Detailed steps and phases]

## Technical Implementation Details
[Code patterns and architecture]

## Testing Strategy
[Testing approach and scenarios]

## Timeline
[Phases and milestones]

## Success Metrics
[How to measure completion]
```

## Quality Checklist
- [ ] Clear problem/goal statement
- [ ] Actionable implementation steps
- [ ] Relevant file references
- [ ] Test cases or scenarios
- [ ] Priority and impact assessment
- [ ] Follow existing naming patterns

## Output
Save as: `docs/issues/open/[type]-[descriptive-slug].md`
At the end of the file write: "IF THIS ISSUE IS SOLVED MOVE IT TO THE SUBFOLDER /doc/issues/closed"

Remember: Create comprehensive documentation that enables immediate action by any team member.