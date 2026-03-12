# Legal Guardrails for Competitor-Informed Development

## Non-Negotiables
1. No copying proprietary source code.
2. No reverse-engineering closed binaries/services beyond permitted interoperability.
3. No using leaked/internal competitor artifacts.
4. No brand/trademark imitation in UX or naming.

## Allowed
- Public feature benchmarking.
- Clean-room reimplementation from specs and observed behavior.
- Permissive OSS usage with license compliance and attribution.

## Clean-Room Workflow
1. Research notes team documents capabilities and UX outcomes (no code).
2. Implementation team builds from internal specs only.
3. Reviewer validates no proprietary snippets or suspicious similarity.

## OSS Compliance Checklist
- Record package name/version/license in `web/oss-components.json`.
- Ensure license compatibility with commercial deployment.
- Preserve required copyright and NOTICE files.
- Add attribution section in project docs as needed.

## CI Gate
- Run `npm run audit:licenses` pre-merge.
- Block deploy if any disallowed license is detected.

## Escalation
If license ambiguity appears, pause merge and request legal review before deploy.

