# Noor Academy - Architecture & Technical Blueprint

This document outlines the system architecture, technology stack, database schema, functional requirements, UI/UX design guidelines, and developer instructions for the Noor Academy platform.

## 1. Technology Stack

### Frontend: Angular
*   **Why Angular?** Since you want to learn it, Angular is a fantastic choice for this project. It is an opinionated, full-fledged framework that excels at building complex, structured enterprise applications (like an academy management dashboard). Its built-in routing, form handling, and dependency injection make it highly scalable. It pairs perfectly with a Java Spring Boot backend.
*   **Styling:** Tailwind CSS (for rapid UI development) or Angular Material (for pre-built, robust UI components).
*   **State Management:** NgRx (optional for MVP, but good for learning) or RxJS (Angular's built-in reactive programming library).

### Backend: Spring Boot (Java)
*   **Framework:** Spring Boot (REST API, Spring Security, Spring Data JPA).
*   **Database:** PostgreSQL (Robust, open-source relational database perfect for handling schedules, transactions, and user data).
*   **Email Service:** JavaMailSender integrated with a service like SendGrid or Mailgun for transactional emails.
*   **Task Scheduling:** `@Scheduled` annotations in Spring Boot for the 72-hour cancellation CRON job.

## 2. Functional Requirements (By Role)

### Visitor (Unauthenticated)
*   **Browse:** View available Courses and active Groups.
*   **Details:** See syllabus, schedules, teacher info, and remaining seats for each Group.
*   **Action:** Click "Apply/Enroll" (Prompts user to register/login).

### Student (Authenticated User)
*   **Dashboard:** View current `CONFIRMED` courses, schedules, and past enrollments.
*   **Application Management:** View `PENDING` applications and the countdown timer (72 hours).
*   **Profile:** Manage personal information.

### Teacher (Authenticated User)
*   **Dashboard:** View assigned Groups, schedules, and the specific room.
*   **Class Roster:** View the list of `CONFIRMED` students in each Group.

### Admin (Authenticated User)
*   **Course Management:** Create, edit, and delete Course templates.
*   **Group Management:** Create Groups, assign Teachers, assign Rooms, and set schedules.
*   **Enrollment Management:** Manually change student status from `PENDING` to `CONFIRMED` (upon payment receipt) or `CANCELLED`.
*   **User Management:** Create Teacher accounts and manage Student accounts.
*   **Conflict Resolution:** The system must warn/prevent the Admin from double-booking a Room at the same time.

## 3. Database Schema (Entities)

The application utilizes a relational model. See the Class Diagram for relationships.
*   **User:** `id`, `firstName`, `lastName`, `email`, `password`, `phone`, `role` (ADMIN, TEACHER, STUDENT)
*   **Course:** `id`, `title`, `description`, `syllabus`
*   **Room:** `id`, `name`, `maxCapacity` (e.g., 8)
*   **Group:** `id`, `course_id`, `teacher_id`, `room_id`, `groupName`, `startDate`, `endDate`, `status`
*   **Session:** `id`, `group_id`, `dayOfWeek`, `startTime`, `endTime`
*   **Enrollment:** `id`, `student_id`, `group_id`, `status` (PENDING, CONFIRMED, CANCELLED), `appliedAt`, `confirmedAt`

## 4. UI/UX Design & Theming

### Brand Identity & Theme
*   **Primary Color:** Deep Indigo (`#3F51B5`) - Conveys trust, professionalism, and education.
*   **Secondary Color:** Vibrant Amber (`#FFC107`) - For call-to-action buttons (Enroll, Apply) to grab attention.
*   **Background Color:** Very Light Grey/Off-White (`#F8F9FA`) - Clean and modern.
*   **Text Color:** Dark Charcoal (`#212529`) - For readability.
*   **Status Colors:** Success Green (`#28A745`), Warning Orange (`#FD7E14`), Danger Red (`#DC3545`).
*   **Typography:** Google Fonts - *Inter* or *Roboto* (Clean, modern sans-serif).

### Page Layout Suggestions
*   **Homepage:** Hero section with the Academy's value proposition. A grid of popular "Courses."
*   **Course Details Page:** Split layout. Left side: Syllabus and description. Right side: A sticky card listing available "Groups" with schedules, remaining seats (e.g., "3/8 seats left"), and an "Apply Now" button.
*   **Admin Dashboard:** Sidebar navigation (Courses, Groups, Enrollments, Users). Data tables with filtering and action buttons (Approve, Reject, Edit).
*   **Student Dashboard:** A clean calendar view showing their schedule and cards displaying their active classes.

## 5. Instructions for IDE Agent / Developer Guidelines

*These instructions are for your AI coding assistant (like Cursor, GitHub Copilot, etc.) to ensure strict adherence to the architecture.*

**Agent Guidelines:**

1.  **Strict Typing:** Ensure strict TypeScript typing in Angular and robust DTO (Data Transfer Object) mapping in Spring Boot. Do not expose internal entity structures directly to the frontend.
2.  **API First:** Before building UI components, finalize the REST API contracts (JSON structures for requests and responses) for the specific feature being developed.
3.  **Conflict Prevention Logic:** When implementing the `Group` creation endpoint, the backend MUST query the `Session` table to ensure the requested `Room` is not booked for the requested `dayOfWeek` and time block.
4.  **Security & Auth:** Implement JWT (JSON Web Tokens) for authentication. Protect routes in Angular using Route Guards and secure API endpoints in Spring Boot using `@PreAuthorize`.
5.  **State Management:** For Angular, use Services with RxJS `BehaviorSubject` to manage state (e.g., current user, active courses) before resorting to complex state libraries like NgRx unless the complexity demands it.
6.  **Reusable Components:** Build modular Angular components. For example, the "Course Card" and "Group Roster Table" should be distinct, reusable components.
