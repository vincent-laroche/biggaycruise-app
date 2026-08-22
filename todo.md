# Project TODO

- [x] Define an explicit non-production synthetic data boundary and fixture mode for all guest examples.
- [x] Add invented development-only guest, cruise, booking, pass, event, checklist, and invitation records to the Worker fixture layer.
- [x] Implement signed short-lived development QR credentials and a staff scanner validation endpoint with audit-friendly outcomes.
- [x] Connect the Expo guest app to the fixture-enabled Worker and render real API-driven upcoming cruise, pass, checklist, and guide views.
- [x] Add a minimal staff scanner interface for approved, unpaid, expired, and invalid QR outcomes.
- [x] Test fixture isolation, API contracts, mobile guest states, QR outcomes, and native/web builds.
- [x] Document the exact replacement boundary for switching from fixture mode to BGC’s authoritative booking/pass source.
- [x] Prepare a fixture-backed web preview with no production BGC data or secrets.
- [x] Expose the web mockup through a temporary clickable development URL.
- [x] Verify the external preview loads the synthetic guest experience and label it as development-only.
