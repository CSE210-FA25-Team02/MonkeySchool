# Attendance System Documentation

## Overview

The Attendance System allows professors to create time-limited attendance polls for course sessions, and students to mark their attendance by entering unique 8-digit codes. The system includes comprehensive validation, security measures, and reporting capabilities.

## Architecture

### Database Schema

#### CourseSession
Represents individual lectures or meetings within a class.

- `id`: Unique identifier (CUID)
- `classId`: Reference to the class
- `name`: Session name (e.g., "Lecture 1", "Lab Session 3")
- `date`: Date of the session
- `startTime`: Optional start time
- `endTime`: Optional end time
- `createdAt`: Timestamp

#### AttendancePoll
Represents an active attendance poll with a unique code.

- `id`: Unique identifier (CUID)
- `sessionId`: Reference to the course session
- `createdBy`: User ID of professor who created the poll
- `code`: Unique 8-digit numeric code (zero-padded)
- `expiresAt`: Timestamp when the poll expires
- `durationMinutes`: Duration in minutes
- `active`: Boolean flag for convenience
- `createdAt`: Timestamp
- `metadata`: Optional JSON data

#### AttendanceRecord
Records student attendance submissions.

- `id`: Unique identifier (CUID)
- `studentId`: User ID of student
- `sessionId`: Reference to the course session
- `pollId`: Reference to the poll (optional, can be null if poll deleted)
- `markedAt`: Timestamp when attendance was marked
- `ipAddress`: Optional IP address for audit
- `userAgent`: Optional user agent for audit

**Unique Constraint**: `(studentId, sessionId)` - ensures one attendance record per student per session.

## API Endpoints

### Professor Endpoints

#### POST /api/attendance/poll/create
Create a new attendance poll for a session.

**Authentication**: Required (Professor role)

**Request Body**:
```json
{
  "sessionId": "clx1234567890",
  "durationMinutes": 10  // Optional, defaults to ATTENDANCE_DEFAULT_DURATION
}
```

**Response** (201 Created):
```json
{
  "pollId": "clx9876543210",
  "code": "08374211",
  "expiresAt": "2025-11-15T15:45:00Z",
  "sessionId": "clx1234567890"
}
```

**Errors**:
- `400`: Validation failed
- `401`: Authentication required
- `403`: Only professors can create polls
- `404`: Session not found

#### GET /api/attendance/session/:sessionId
Get attendance records for a session.

**Authentication**: Required (Professor role)

**Response** (200 OK):
```json
{
  "sessionId": "clx1234567890",
  "polls": [
    {
      "pollId": "clx9876543210",
      "code": "08374211",
      "expiresAt": "2025-11-15T15:45:00Z",
      "createdAt": "2025-11-15T15:35:00Z",
      "recordCount": 25
    }
  ],
  "attendance": [
    {
      "studentId": "clx1111111111",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "markedAt": "2025-11-15T15:36:00Z",
      "pollId": "clx9876543210",
      "pollCode": "08374211"
    }
  ]
}
```

#### GET /api/attendance/course/:courseId/summary
Get attendance summary for a course (all sessions).

**Authentication**: Required (Professor role)

**Response** (200 OK):
```json
{
  "courseId": "clx2222222222",
  "sessions": [
    {
      "id": "clx1234567890",
      "name": "Lecture 1",
      "date": "2025-11-15T10:00:00Z",
      "attendanceCount": 25
    }
  ],
  "students": [
    {
      "studentId": "clx1111111111",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "sessions": {
        "clx1234567890": {
          "present": true,
          "markedAt": "2025-11-15T15:36:00Z",
          "pollCode": "08374211"
        }
      },
      "totalSessions": 10,
      "presentCount": 9,
      "attendancePercentage": 90
    }
  ]
}
```

#### PATCH /api/attendance/poll/:pollId/close
Close/deactivate a poll early.

**Authentication**: Required (Professor role)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Poll closed"
}
```

### Student Endpoints

#### POST /api/attendance/submit
Submit attendance using a code.

**Authentication**: Required (Student role)

**Rate Limiting**: 10 requests per 15 minutes per IP

**Request Body**:
```json
{
  "code": "08374211"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "sessionId": "clx1234567890",
  "markedAt": "2025-11-15T15:36:00Z"
}
```

**Errors**:
- `400`: Invalid code format
- `401`: Authentication required
- `404`: Invalid code
- `410`: Code expired
- `403`: Not enrolled in course
- `409`: Already marked attendance for this session
- `429`: Too many requests (rate limited)

#### GET /api/attendance/student/me
Get student's personal attendance history.

**Authentication**: Required (Student role)

**Response** (200 OK):
```json
{
  "studentId": "clx1111111111",
  "attendance": [
    {
      "courseId": "clx2222222222",
      "courseName": "CSE 210",
      "sessionId": "clx1234567890",
      "sessionName": "Lecture 1",
      "date": "2025-11-15T10:00:00Z",
      "status": "present",
      "markedAt": "2025-11-15T15:36:00Z",
      "pollCode": "08374211"
    }
  ]
}
```

### Course Session Endpoints

#### POST /api/course-sessions
Create a new course session.

**Authentication**: Required (Professor role)

**Request Body**:
```json
{
  "classId": "clx2222222222",
  "name": "Lecture 1",
  "date": "2025-11-15T10:00:00Z",
  "startTime": "2025-11-15T10:00:00Z",  // Optional
  "endTime": "2025-11-15T11:30:00Z"    // Optional
}
```

#### GET /api/course-sessions/class/:classId
Get all sessions for a class.

**Authentication**: Required

**Response** (200 OK):
```json
[
  {
    "id": "clx1234567890",
    "classId": "clx2222222222",
    "name": "Lecture 1",
    "date": "2025-11-15T10:00:00Z",
    "startTime": "2025-11-15T10:00:00Z",
    "endTime": "2025-11-15T11:30:00Z",
    "createdAt": "2025-11-10T08:00:00Z",
    "attendancePolls": [...],
    "_count": {
      "attendanceRecords": 25
    }
  }
]
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
ATTENDANCE_DEFAULT_DURATION=10
```

- **Default**: 10 minutes
- **Range**: 1-1440 minutes (24 hours)
- **Description**: Default duration for attendance polls when not specified

## Code Generation

Attendance codes are generated using cryptographically secure random number generation:

- **Format**: 8-digit numeric string (zero-padded)
- **Example**: `08374211`
- **Uniqueness**: Guaranteed by database unique constraint with retry logic
- **Retry Limit**: 10 attempts before failure

## Security Features

1. **Authentication**: All endpoints require valid JWT authentication
2. **Authorization**: Role-based access control (professor vs student)
3. **Rate Limiting**: Submission endpoint limited to 10 requests per 15 minutes
4. **Expiration**: Server-side timestamp validation (no client manipulation)
5. **Unique Constraints**: Database-level prevention of duplicate submissions
6. **Enrollment Verification**: Students must be enrolled in the course
7. **Audit Trail**: IP address and user agent logging (optional)

## Frontend Integration

### HTMX Templates

The system includes HTMX templates for seamless integration:

- `createStartAttendanceModal()`: Modal form to start attendance
- `displayAttendanceCode()`: Display generated code with countdown timer
- `createAttendanceCodeInput()`: Student code input component
- `displayAttendanceResult()`: Success/error message display
- `displaySessionAttendance()`: Professor attendance table
- `displayCourseAttendanceSummary()`: Course-level summary matrix
- `displayStudentAttendance()`: Student personal history

### CSS Styling

Styles are located in `code/src/public/css/components/attendance.css` using BEM naming convention. The design is mobile-responsive and follows accessibility best practices.

## Testing

### Unit Tests

Located in `code/tests/attendance/attendance.service.test.js`:

- Code generator uniqueness and validation
- Poll creation and expiration checks
- Attendance submission with various scenarios
- Enrollment verification
- Duplicate prevention

### Integration Tests

Located in `code/tests/attendance/attendance.api.test.js`:

- API endpoint testing
- Authentication and authorization
- Error handling
- Rate limiting

### BDD Tests

Feature file: `code/features/attendance.feature`
Step definitions: `code/tests/attendance/attendance.steps.js`

Covers end-to-end scenarios:
- Professor creates poll
- Student submits valid code
- Expired code rejection
- Duplicate submission prevention
- Unenrolled student rejection

## Usage Examples

### Professor Workflow

1. Create a course session (or use existing)
2. Navigate to session page
3. Click "Start Attendance" button
4. Optionally adjust duration (default: 10 minutes)
5. Click "Start Attendance" to create poll
6. Share the generated 8-digit code with students
7. View attendance records in real-time
8. Export attendance data as CSV (optional)

### Student Workflow

1. Receive attendance code from professor
2. Navigate to attendance input page
3. Enter 8-digit code
4. Click "Submit"
5. View confirmation message
6. Check personal attendance history

## Error Handling

The system provides clear error messages:

- **Invalid code**: "Invalid code format. Please enter an 8-digit code."
- **Code expired**: "Code expired"
- **Already marked**: "Already marked attendance for this session"
- **Not enrolled**: "Not enrolled in course"
- **Rate limited**: "Too many attendance submission attempts, please try again later."

## Database Migrations

Run migrations to set up the attendance system:

```bash
npm run db:migrate
```

Migration file: `code/prisma/migrations/20251115003749_add_attendance_system/migration.sql`

## Future Enhancements

Potential improvements:

1. Background job to automatically deactivate expired polls
2. CSV export functionality for attendance reports
3. Email notifications for attendance reminders
4. QR code generation for easier code sharing
5. Bulk attendance marking for TAs
6. Attendance analytics and trends
7. Integration with calendar systems
8. Mobile app support

## Troubleshooting

### Common Issues

1. **Code not found**: Ensure poll is active and not expired
2. **Already marked**: Student can only mark once per session
3. **Not enrolled**: Verify student's enrollment in the class
4. **Rate limited**: Wait 15 minutes before retrying

### Debugging

Enable debug logging by setting:
```env
NODE_ENV=development
```

Check server logs for detailed error messages and stack traces.

