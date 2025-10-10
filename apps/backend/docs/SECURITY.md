# Security Guidelines for File Storage

## Overview
This document outlines the security measures implemented for the file storage system using AWS S3.

## Security Features Implemented

### 1. File Upload Security

#### Content Validation
- **Magic Number Verification**: Files are validated using magic numbers (file signatures) to ensure the actual content matches the declared MIME type
- **Malicious Content Scanning**: Files are scanned for suspicious patterns including scripts, HTML injection attempts, and other potentially harmful content
- **File Size Limits**: Strict size limits enforced per file category to prevent DoS attacks

#### File Name Sanitization
- **Path Traversal Protection**: Prevents `../` and absolute path attacks
- **Character Filtering**: Only allows safe characters `[a-zA-Z0-9._-]`
- **Reserved Name Protection**: Blocks Windows reserved names (CON, PRN, AUX, etc.)
- **Extension Filtering**: Blocks dangerous file extensions (exe, bat, script files)
- **Length Limits**: Enforces 255 character filename limit

### 2. Access Control

#### Authentication & Authorization
- **JWT-based Authentication**: All file operations require valid JWT tokens
- **User Ownership Validation**: Files can only be accessed/deleted by their owners
- **Role-based Permissions**: Different upload limits and permissions per user role

#### Rate Limiting
- **Profile Images**: 5 uploads per minute per user
- **Property Images**: 3 batch uploads per minute per user  
- **General Files**: 10 uploads per minute per user
- **Presigned URLs**: 20 generations per minute per user

### 3. S3 Security

#### Key Generation
- **UUID-based Keys**: Prevents enumeration attacks
- **User Isolation**: Files organized by user ID in key structure
- **Timestamp Inclusion**: Enables easy cleanup and organization

#### URL Security
- **Hostname Validation**: Only allows approved S3 hostnames
- **Key Pattern Validation**: Enforces expected key structure
- **SSRF Protection**: Validates and sanitizes all URLs

## File Categories and Limits

| Category | Max Size | Allowed Types | Rate Limit |
|----------|----------|---------------|------------|
| Profile Images | 5MB | JPEG, PNG, WebP, GIF | 5/min |
| Property Images | 10MB | JPEG, PNG, WebP | 3 batches/min |
| Documents | 10MB | PDF, TXT, Images | 10/min |
| General Files | 10MB | Various | 10/min |

## S3 Bucket Security Recommendations

### Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

### IAM Policy (Least Privilege)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

## Security Monitoring

### Logging
- All file operations are logged with user context
- Failed authorization attempts are logged as warnings
- Suspicious URL patterns trigger security alerts

### Metrics to Monitor
- Upload failure rates
- Rate limit violations
- File deletion patterns
- Large file uploads
- Unusual file types

## Future Security Enhancements

### Planned Features
1. **Virus Scanning Integration**: Add ClamAV or AWS VirusTotal integration
2. **Image Processing**: Automatic image optimization and metadata stripping
3. **CDN Integration**: CloudFront for secure content delivery
4. **Advanced Threat Detection**: ML-based content analysis
5. **Audit Logging**: Comprehensive file access audit trail

### Compliance Considerations
- **GDPR**: Right to deletion implemented
- **Data Retention**: Automated cleanup policies
- **Encryption**: Server-side encryption (AES-256)
- **Access Logs**: S3 access logging for compliance

## Incident Response

### File Security Incidents
1. **Malicious File Detected**: Immediate quarantine and user notification
2. **Unauthorized Access**: Lock account and audit all file access
3. **Data Breach**: Follow incident response plan and notify authorities
4. **DoS Attack**: Rate limiting and IP blocking

### Emergency Procedures
- Contact security team: security@yourcompany.com
- AWS Support: For infrastructure issues
- Incident escalation: Follow company incident response plan

## Testing Security

### Manual Testing
```bash
# Test file upload validation
curl -X POST /api/storage/upload/profile-image \
  -H "Authorization: Bearer $JWT" \
  -F "file=@malicious.exe"

# Test rate limiting  
for i in {1..10}; do
  curl -X POST /api/storage/upload/profile-image \
    -H "Authorization: Bearer $JWT" \
    -F "file=@profile.jpg"
done
```

### Automated Security Tests
- Unit tests for all validation functions
- Integration tests for file upload flows
- Penetration testing for common attack vectors
- Load testing for rate limiting effectiveness

## Security Checklist

- [ ] File content validation enabled
- [ ] Rate limiting configured
- [ ] S3 bucket policy implemented
- [ ] IAM roles configured with least privilege
- [ ] SSL/TLS enforced for all connections
- [ ] Logging and monitoring configured
- [ ] Regular security audits scheduled
- [ ] Incident response plan tested

---
**Last Updated**: 2024-01-10  
**Next Review**: 2024-04-10  
**Security Team**: security@yourcompany.com