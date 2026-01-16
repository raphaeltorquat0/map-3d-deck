# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of @meuorg/map-3d-deck
- Core `Map3D` class wrapping Deck.gl + MapLibre
- Layer factories: `createZoningLayer`, `createBuildingLayer`,
  `createSubsurfaceLayer`
- `ElevationController` for managing vertical level visibility
- Utility functions for colors and geometry
- TypeScript types for all features
- Comprehensive test suite with 80%+ coverage
- GitHub Actions CI/CD pipeline
- Semantic Release for automated versioning
- TypeDoc API documentation
- Enterprise-grade configuration (ESLint, Prettier, Husky, Commitlint)

### Security

- npm audit integration in CI
- Dependabot configuration for automated dependency updates
- Security policy for vulnerability reporting

---

_This changelog is automatically updated by semantic-release._
