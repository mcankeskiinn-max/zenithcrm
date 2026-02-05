---
description: Perform a senior-level technical code review on the latest changes.
---

1.  **Analyze Context**: Read the latest changes and relevant files using `view_file` or `grep_search`.
2.  **Verify Security**: Check for tenant isolation, RBAC, and sensitive data handling.
3.  **Evaluate Quality**: Look for performance bottlenecks, unused code, and naming consistency.
4.  **Check Integrity**: Ensure database constraints and business logic (like user deletion rules) are respected.
5.  **Output Findings**: Provide a clear summary of issues or a "Looks Good To Me" (LGTM) if the code is production-ready.
