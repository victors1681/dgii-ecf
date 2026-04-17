# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
