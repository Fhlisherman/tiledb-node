# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of tiledb-node seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to the maintainers with the following information:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

You should receive a response within 48 hours. If for some reason you do not, please follow up via email.

## Security Best Practices for Users

1. **Validate all URIs** before passing them to TileDB operations, especially destructive ones (`removeDir`, `removeFile`, `removeBucket`, etc.)
2. **Never expose TileDB URIs directly from user input** without validation
3. **Use cloud storage IAM roles** instead of hardcoded credentials for S3/GCS access
4. **Keep dependencies updated** by running `pnpm audit` regularly
5. **Run with least privilege** — the Node.js process should only have access to necessary file paths and cloud storage buckets

## Known Security Considerations

- This library provides direct bindings to the TileDB C++ library, which performs file system and cloud storage operations. All URI inputs should be validated by the consuming application.
- Native addon binaries are downloaded from GitHub Releases during build. SHA-256 checksums are verified to prevent tampering.
- The library does not handle authentication credentials directly; cloud storage credentials are managed by the TileDB C++ library configuration.
