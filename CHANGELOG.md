# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **`trackStatuses` (Consulta de trackId e-CF) brought up to the published spec**:
  the service was already implemented against
  `{ambiente}/ConsultaTrackIds/api/TrackIds/Consulta`, so this is a hardening of the
  existing method rather than a new endpoint.
  - `rncEmisor` and `encf` are validated and trimmed before the request leaves the
    process, raising the same messages DGII documents (`El campo RNC Emisor es
requerido.`, `El campo ENCF es requerido.`, `La longitud del RNC Emisor es
inválida.`, `La longitud del ENCF es inválida.`) instead of spending a round trip
    on a request the service is going to reject. An issuer may be a 9 digit RNC or an
    11 digit Cédula, and an e-NCF is always 13 characters.
  - The response is normalized to `SummaryTrackingStatusResponse[]`. DGII documents a
    single `TrackingDetalle` object even though the service returns a list when
    several e-CF share the same e-NCF, mirroring the inconsistency already handled in
    `getCustomerDirectory`. A body-less response resolves to `undefined`.
  - `trackStatuses` now declares its return type explicitly and documents the
    delegation requirement plus every `estado` the service can answer.

### Added

- **Networking types are exported from the package root**: `export * from './types'`
  in `src/networking/index.ts` makes `SummaryTrackingStatusResponse`,
  `TrackStatusEnum`, `TrackingStatusResponse` and the rest of the response contracts
  importable from `dgii-ecf` instead of a deep path.
- **Unit tests for the TrackIds consultation**: eleven mocked tests covering both
  environments, the array and single-object shapes, the empty body, parameter
  trimming, each validation message, an 11 digit issuer, and the propagation of the
  "not delegated" error body.

## [1.8.3] - 2026-08-18

### Fixed

- **`getCurrentFormattedDateTime` now uses a 24-hour clock**: the formatter was
  configured with `hour12: true` but the AM/PM part was discarded when the
  timestamp was assembled, so afternoon times lost 12 hours (`13:05:06` was
  emitted as `01:05:06`) and the local midnight band rendered as `12:xx`
  instead of `00:xx`. `hour12: false` resolves to the `h23` hour cycle, giving
  the `DD-MM-YYYY HH:mm:ss` shape DGII expects in every hour band, with the
  `America/Santo_Domingo` (GMT-4) timezone unchanged. This affects
  `FechaHoraAcuseRecibo` on the acknowledgement documents built by
  `SenderReceiver`, which DGII can reject as an invalid timestamp
  ([PR #27](https://github.com/victors1681/dgii-ecf/pull/27)).
- **`getCurrentFormattedDate` clock option**: switched to `hour12: false` for
  consistency. The returned value is unchanged, since only the date parts are
  used.

### Added

- **Test coverage for the date/time helpers**: six tests covering morning and
  afternoon hours, midnight as `00`, the GMT-4 conversion including date
  rollover across UTC midnight, and the `DD-MM-YYYY` date-only output.

### Changed

- **CI tolerates pull requests from forks**: GitHub does not grant repository
  secrets to a run from a forked head, so the DGII test certificate cannot be
  downloaded there and `build-and-test` failed before installing dependencies.
  The download is now skipped on fork pull requests and the suites that need
  the certificate skip themselves, while every other run still requires the
  certificate and fails closed — a missing secret can no longer let an
  untested build reach `publish-production`
  ([PR #28](https://github.com/victors1681/dgii-ecf/pull/28)).

## [1.8.2] - 2026-08-18

Released from `main` before the `getCurrentFormattedDateTime` fix was merged,
so it carries no functional change over 1.8.1 and still contains the 12-hour
clock bug described under 1.8.3. Use 1.8.3 or later.

## [1.8.1] - 2026-08-16

### Fixed

- **Consistent `getCustomerDirectory` response shape**: The DGII directory
  service inconsistently returns either an array of directory entries or a
  single entry object depending on the environment/record (observed in
  production logs; discovered in
  [PR #24](https://github.com/victors1681/dgii-ecf/pull/24)). `getCustomerDirectory`
  and `getCustomerDirectoryApi` now normalize the response internally so they
  **always** resolve to `ServiceDirectoryResponse[]` (or `undefined` when the
  service returns no body). This keeps the public `ServiceDirectoryResponse[]`
  contract backward compatible — a single-object response is wrapped in an
  array — so consumers can iterate the result without branching on the shape.

### Added

- **Test coverage for directory normalization**: Added tests covering the
  array response, the single-object response (normalized to an array), and an
  empty-body response in `ECF.customerDirectory.test.ts`.

## [1.8.0] - 2026-04-17

### Added

- **Auto-detection of XML root elements**: The `signXml()` method now automatically detects the root element name from the XML document, making the `rootElName` parameter optional. This simplifies the API and reduces potential errors from typos.
- **Support for arbitrary XML documents**: The `Signature` class can now sign any XML document type, not just DGII electronic invoices. Tested with Postulacion documents and custom XML structures.
- **Type-safe arbitrary strings**: `DGIIDocumentType` now uses `(string & {})` pattern to preserve autocomplete for known DGII document types while allowing any custom string.
- **Parse error detection**: Added error handler to detect and report invalid XML during auto-detection, preventing signing of malformed documents.
- **Comprehensive test coverage**: Added 6 new tests for auto-detection, arbitrary XML signing, and error handling in `Signature.arbitrary.test.ts`.

### Changed

- **Renamed type**: `XMLTag` has been renamed to `DGIIDocumentType` for better clarity. `XMLTag` remains as a deprecated alias for backward compatibility.
- **Type-only export**: Changed `DGIIDocumentType` to use `export type` instead of value export to prevent runtime issues in JavaScript consumers.
- **Performance optimization**: XML is now parsed only once per `signXml()` call instead of twice when auto-detecting the root element.
- **Consistent validation**: XML parse errors are now detected for all signing paths (both explicit and auto-detected root element), not just auto-detection.
- **Enhanced JSDoc documentation**: Improved documentation for the `signXml()` method with clear examples of auto-detection and explicit root element specification.
- **Simplified README examples**: Updated all code examples to show auto-detection as the recommended approach.
- **Generic test data**: Replaced real company information in test fixtures with generic placeholder data to protect privacy.

### Fixed

- **TypeScript autocomplete**: Fixed type definition to preserve literal type suggestions while still accepting arbitrary strings.
- **Parse error handling**: Added proper error detection for invalid XML instead of silently continuing with malformed documents.

### Deprecated

- `XMLTag` type is deprecated in favor of `DGIIDocumentType`.

## [1.7.1] - Previous Release

(Previous changes not documented)

[unreleased]: https://github.com/victors1681/dgii-ecf/compare/v1.7.1...HEAD
[1.7.1]: https://github.com/victors1681/dgii-ecf/releases/tag/v1.7.1
