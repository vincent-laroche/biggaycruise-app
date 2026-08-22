# Guest Data Integration Contract

The mobile app must read only normalized, authorized data from the BGC API. The integration source may begin as a controlled import and later move to a provider API or webhook, but it must provide stable booking and guest identifiers.

| Entity | Required fields | Source-of-truth rule |
|---|---|---|
| Guest | Stable guest ID, authorized contact identity, consent state | Do not match only by display name |
| Cruise booking | Booking ID, cruise ID, group/cabin context, booking state | New or amended bookings are idempotent updates |
| BGC pass | Pass ID, booking ID, payment/activation status, revocation state | Store payment state only; never card data |
| Task/reminder | Task ID, target guest/cruise, due rule, completion state | Guest completion is audited and reversible by operations |
| QR credential | Guest/pass/cruise relationship, expiry, signature, scan context | Generate server-side; validate server-side; record scan outcome |

The data source must also state which system may update paid-pass status, what latency is acceptable for new bookings, and how BGC resolves duplicate guests or bookings.
