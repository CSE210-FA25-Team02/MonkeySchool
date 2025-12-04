/**
 * Monkey School - Mock Data for UI Development
 */

export const currentUser = {
  name: "Zihan Zhou",
  email: "zihan@ucsd.edu",
  avatar: "ZZ",
  role: "Student",
};

export const courses = [
  {
    id: "cse-210",
    code: "CSE 210",
    name: "Software Engineering",
    quarter: "FA25",
    role: "Student",
    nextSession: "Today, 10:00 AM",
    location: "Room 1202",
    attendance: 92,
  },
  {
    id: "cse-202",
    code: "CSE 202",
    name: "Algorithm Design",
    quarter: "FA25",
    role: "Student",
    nextSession: "Today, 3:30 PM",
    location: "Center Hall",
    attendance: 85,
  },
];

export const activities = [
  {
    type: "punch_in",
    courseId: "cse-210",
    timestamp: "2025-11-23T09:58:00",
    relativeTime: "2h ago",
  },
  {
    type: "poll_create",
    courseId: "cse-110",
    timestamp: "2025-11-22T16:30:00",
    relativeTime: "1d ago",
  },
];
