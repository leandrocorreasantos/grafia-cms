---
name: security-review
description: Performs a security review of Grafia CMS code, config, and dependencies.
argument-hint: Scan a file, folder, or the whole repository for vulnerabilities.
---

# Security Review

Use this skill to scan Grafia CMS for vulnerabilities, exposed secrets, or insecure design.

## Scope

- Scan source code, config files, scripts, Docker files, CI files, and environment-related files.
- Trace user-controlled input through HTTP handlers, application code, repositories, and outputs.
- Check dependencies for known bad versions and suspiciously old packages.

## What to look for

- Injection flaws: SQL injection, XSS, command injection, header injection, path traversal, SSRF.
- Authentication and authorization bugs: missing auth, IDOR/BOLA, weak JWT handling, privilege escalation.
- Secrets and exposure: hardcoded tokens, private keys, leaked credentials, sensitive logs, stack traces.
- Cryptography issues: weak hashes, weak randomness, bad key handling, insecure password storage.
- Business logic risks: race conditions, rate-limit gaps, unsafe state transitions.

## Detection heuristics

- Treat raw string interpolation in queries, shell commands, URLs, and HTML sinks as suspicious.
- Prefer parameterized access, allowlists, and framework-safe rendering APIs.
- Assume any secret-like constant in source is real until proven otherwise.
- Verify that auth checks happen at the resource boundary, not only at the route entry point.

## Report style

- Summarize findings by severity first.
- Group findings by vulnerability class.
- Include file, line, risk, and a concrete fix for each finding.
- State confidence for every finding.

## Safety

- Do not auto-apply fixes from the review.
- Present patches for human review only.
- If no vulnerabilities are found, say so explicitly and note what was scanned.