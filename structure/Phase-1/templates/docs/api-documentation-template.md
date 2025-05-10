# SERVICE_NAME API Documentation

## Overview

The SERVICE_NAME API provides RESTful endpoints for managing RESOURCE_NAME resources in the Philosophy Service platform. This API enables applications to create, read, update, and delete RESOURCE_NAME resources, as well as perform specialized operations related to philosophical analysis and synthesis.

**Base URL**: `https://api.example.com/v1`

**API Version**: v1

## Authentication

All API requests require authentication using JWT (JSON Web Token). Include the token in the `Authorization` header of your requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

To obtain a token, use the authentication endpoint `/auth/login` with valid credentials.

### Token Lifetime

Tokens are valid for 1 hour after issuance. To continue using the API after a token expires, you need to request a new token.

### Refresh Tokens

To avoid requiring users to log in again after token expiration, use refresh tokens. Send a request to `/auth/refresh` with the refresh token to obtain a new access token.

## Authorization

This API uses role-based access control with the following roles:

- **admin**: Full access to all endpoints and operations
- **moderator**: Can read all resources, update some resources, but cannot delete
- **user**: Can create, read, update, and delete their own resources
- **guest**: Limited to read-only access for public resources

Different endpoints require different permissions. Requirements are specified in each endpoint's documentation.

## Rate Limiting

API usage is subject to rate limiting to ensure service stability. Limits are applied per API key or IP address. Current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated requests

When rate limits are exceeded, the API will respond with a `429 Too Many Requests` status code.

## Response Format

All API responses are returned in JSON format with a standardized structure:

### Success Response Format

```json
{
  "success": true,
  "data": {
    // Resource data or operation result
  },
  "meta": {
    // Metadata about the response (pagination, etc.)
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details (optional)
    }
  }
}
```

## Pagination

List endpoints support pagination through the following query parameters:

- `page`: Page number (1-based, default: 1)
- `pageSize`: Number of items per page (default: 20, max: 100)

Paginated responses include metadata in the `meta` field:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "total": 50,
      "page": 2,
      "pageSize": 10,
      "pageCount": 5
    }
  }
}
```

## Filtering and Sorting

Most list endpoints support filtering and sorting through query parameters:

- Filtering: `?field=value&otherField=otherValue`
- Sorting: `?sort=field&order=asc` (or `desc`)

Specific filtering options are documented with each endpoint.

## Common Query Parameters

- `include`: Comma-separated list of related resources to include in the response
- `fields`: Comma-separated list of fields to include in the response (partial responses)
- `filter`: Complex filtering criteria

## Endpoints

### Resource Collection Endpoints

#### List Resources

```
GET /RESOURCE_PATH
```

Retrieves a paginated list of resources.

**Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)
- `filter[FIELD]` (optional): Filter by field value
- `sort` (optional): Field to sort by
- `order` (optional): Sort order (`asc` or `desc`, default: `asc`)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Resource Name",
      // Other resource fields
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-02T00:00:00Z"
    },
    // More resources
  ],
  "meta": {
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "pageCount": 5
    }
  }
}
```

**Required Permission**: `RESOURCE_NAME:read`

#### Create Resource

```
POST /RESOURCE_PATH
```

Creates a new resource.

**Request Body**:
```json
{
  "name": "New Resource",
  "description": "Resource description",
  // Other required fields
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "New Resource",
    "description": "Resource description",
    // Other resource fields
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

**Required Permission**: `RESOURCE_NAME:create`

### Resource Instance Endpoints

#### Get Resource

```
GET /RESOURCE_PATH/{id}
```

Retrieves a specific resource by ID.

**Path Parameters**:
- `id`: Resource ID (UUID format)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Resource Name",
    "description": "Resource description",
    // Other resource fields
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-02T00:00:00Z"
  }
}
```

**Required Permission**: `RESOURCE_NAME:read`

#### Update Resource

```
PUT /RESOURCE_PATH/{id}
```

Updates an existing resource.

**Path Parameters**:
- `id`: Resource ID (UUID format)

**Request Body**:
```json
{
  "name": "Updated Resource Name",
  "description": "Updated description",
  // Other fields to update
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Updated Resource Name",
    "description": "Updated description",
    // Other resource fields
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-03T00:00:00Z"
  }
}
```

**Required Permission**: `RESOURCE_NAME:update`

#### Delete Resource

```
DELETE /RESOURCE_PATH/{id}
```

Deletes a specific resource.

**Path Parameters**:
- `id`: Resource ID (UUID format)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Resource successfully deleted"
  }
}
```

**Required Permission**: `RESOURCE_NAME:delete`

### Specialized Endpoints

#### Special Action

```
POST /RESOURCE_PATH/{id}/special-action
```

Performs a special action on the resource.

**Path Parameters**:
- `id`: Resource ID (UUID format)

**Request Body**:
```json
{
  "parameter1": "value1",
  "parameter2": "value2"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "result": "Action result",
    // Other result data
  }
}
```

**Required Permission**: `RESOURCE_NAME:special-action`

#### Get Related Resources

```
GET /RESOURCE_PATH/{id}/related-resources
```

Retrieves resources related to the specified resource.

**Path Parameters**:
- `id`: Resource ID (UUID format)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "name": "Related Resource",
      // Other resource fields
      "relationship_type": "type",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-02T00:00:00Z"
    },
    // More related resources
  ],
  "meta": {
    "pagination": {
      "total": 5,
      "page": 1,
      "pageSize": 20,
      "pageCount": 1
    }
  }
}
```

**Required Permission**: `RESOURCE_NAME:read`

## Error Codes

| Code                | HTTP Status | Description                                                  |
|---------------------|-------------|--------------------------------------------------------------|
| `UNAUTHORIZED`      | 401         | Authentication required or authentication failed             |
| `FORBIDDEN`         | 403         | Authenticated user lacks required permissions                |
| `NOT_FOUND`         | 404         | The requested resource does not exist                        |
| `VALIDATION_ERROR`  | 422         | The request data failed validation                           |
| `CONFLICT`          | 409         | The request conflicts with the current state of the resource |
| `RATE_LIMIT`        | 429         | Rate limit exceeded                                          |
| `INTERNAL_ERROR`    | 500         | Internal server error                                        |
| `SERVICE_UNAVAILABLE`| 503         | Service temporarily unavailable                              |

## Validation Errors

Validation errors provide details about which fields failed validation and why:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "validationErrors": {
        "field1": ["Error message for field1"],
        "field2": ["Error message 1 for field2", "Error message 2 for field2"]
      }
    }
  }
}
```

## Data Models

### RESOURCE_NAME Model

| Field          | Type      | Description                                   | Required |
|----------------|-----------|-----------------------------------------------|----------|
| `id`           | UUID      | Unique identifier                             | Generated|
| `name`         | String    | Name of the resource                          | Yes      |
| `description`  | String    | Description of the resource                   | No       |
| `type`         | String    | Type of the resource                          | Yes      |
| `status`       | String    | Status of the resource                        | Yes      |
| `creator_id`   | UUID      | ID of the user who created the resource       | Generated|
| `created_at`   | DateTime  | Timestamp of creation                         | Generated|
| `updated_at`   | DateTime  | Timestamp of last update                      | Generated|
| `metadata`     | Object    | Additional metadata                           | No       |

## Examples

### Example: Creating a Resource

**Request**:

```http
POST /RESOURCE_PATH HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Example Resource",
  "description": "This is an example resource",
  "type": "example",
  "status": "active",
  "metadata": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Response**:

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Example Resource",
    "description": "This is an example resource",
    "type": "example",
    "status": "active",
    "creator_id": "abcdef12-3456-7890-abcd-ef1234567890",
    "created_at": "2023-01-15T12:34:56Z",
    "updated_at": "2023-01-15T12:34:56Z",
    "metadata": {
      "key1": "value1",
      "key2": "value2"
    }
  }
}
```

### Example: Getting a Paginated List with Filters

**Request**:

```http
GET /RESOURCE_PATH?page=2&pageSize=10&filter[type]=example&sort=name&order=asc HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Example Resource A",
      "description": "This is example resource A",
      "type": "example",
      "status": "active",
      "creator_id": "abcdef12-3456-7890-abcd-ef1234567890",
      "created_at": "2023-01-14T10:34:56Z",
      "updated_at": "2023-01-15T15:34:56Z",
      "metadata": { /* ... */ }
    },
    // More resources...
  ],
  "meta": {
    "pagination": {
      "total": 45,
      "page": 2,
      "pageSize": 10,
      "pageCount": 5
    }
  }
}
```

## Changelog

### Version 1.0.0 (2023-01-01)
- Initial API release

### Version 1.1.0 (2023-06-01)
- Added `special-action` endpoint
- Extended model with `metadata` field
- Improved error responses
