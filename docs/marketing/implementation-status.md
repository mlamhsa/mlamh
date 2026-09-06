# Marketing approval quality implementation status

Implemented on `fix/marketing-approval-creative-quality`:

- External copy policy blocks current talent-count claims at materialization and execution.
- Editable approval messages normalize escaped line breaks before persistence.
- Creative tasks now materialize a branded image endpoint and attach the asset before creating social-publish approval.
- Social execution keeps the existing visual-readiness gate.
- Existing Production Buffer approvals without real creative assets were reset to draft/cancelled while Buffer remains disabled.

Pending before merge:

- CI + build verification.
- Preview validation of the generated creative image route and social approval preview.
- Review of first generated branded creative for Arabic rendering quality.
