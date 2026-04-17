# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Auto-detection of XML root elements**: The `signXml()` method now automatically detects the root element name from the XML document, making the `rootElName` parameter optional. This simplifies the API and reduces potential errors from typos.
- **Support for arbitrary XML documents**: The `Signature` class can now sign any XML document type, not just DGII electronic invoices. Tested with Postulacion documents and custom XML structures.
- **New type export**: `DGIIDocumentType` is now exported from the main package for better TypeScript support.
- **Comprehensive test coverage**: Added tests for auto-detection and arbitrary XML signing in `Signature.arbitrary.test.ts`.

### Changed

- **Renamed type**: `XMLTag` has been renamed to `DGIIDocumentType` for better clarity. `XMLTag` remains as a deprecated alias for backward compatibility.
- **Enhanced JSDoc documentation**: Improved documentation for the `signXml()` method with clear examples of auto-detection and explicit root element specification.
- **Simplified README examples**: Updated all code examples to show auto-detection as the recommended approach.

### Deprecated

- `XMLTag` type is deprecated in favor of `DGIIDocumentType`.

## [1.7.1] - Previous Release

(Previous changes not documented)

[unreleased]: https://github.com/victors1681/dgii-ecf/compare/v1.7.1...HEAD
[1.7.1]: https://github.com/victors1681/dgii-ecf/releases/tag/v1.7.1
