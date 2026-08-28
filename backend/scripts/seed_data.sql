-- Noor Academy seed data
--
-- Run this ONCE against a fresh database, after the backend has started at
-- least once (so Flyway has created the schema via V1__init_schema.sql).
--
--   psql -h localhost -U noor_academy -d noor_academy -f backend/scripts/seed_data.sql
--
-- All seeded users share the password: password123
-- (bcrypt hash below was generated with the project's own BCryptPasswordEncoder)

-- ============ USERS ============
INSERT INTO users (first_name, last_name, email, password, phone, role)
VALUES
    ('Admin', 'User', 'admin@noor.academy', '$2a$10$4hAXW4R3qak8y.OtCqbg8.PLJlgJ.o5bH.QT/XyKMsHGYfX.QMhNO', '+212600000001', 'ADMIN'),
    ('Yusuf', 'Ibrahim', 'teacher1@noor.academy', '$2a$10$4hAXW4R3qak8y.OtCqbg8.PLJlgJ.o5bH.QT/XyKMsHGYfX.QMhNO', '+212600000002', 'TEACHER'),
    ('Maryam', 'Khalil', 'teacher2@noor.academy', '$2a$10$4hAXW4R3qak8y.OtCqbg8.PLJlgJ.o5bH.QT/XyKMsHGYfX.QMhNO', '+212600000003', 'TEACHER'),
    ('Ahmed', 'Hassan', 'student1@noor.academy', '$2a$10$4hAXW4R3qak8y.OtCqbg8.PLJlgJ.o5bH.QT/XyKMsHGYfX.QMhNO', '+212600000004', 'STUDENT'),
    ('Fatima', 'Ali', 'student2@noor.academy', '$2a$10$4hAXW4R3qak8y.OtCqbg8.PLJlgJ.o5bH.QT/XyKMsHGYfX.QMhNO', '+212600000005', 'STUDENT'),
    ('Omar', 'Said', 'student3@noor.academy', '$2a$10$4hAXW4R3qak8y.OtCqbg8.PLJlgJ.o5bH.QT/XyKMsHGYfX.QMhNO', '+212600000006', 'STUDENT'),
    ('Layla', 'Youssef', 'student4@noor.academy', '$2a$10$4hAXW4R3qak8y.OtCqbg8.PLJlgJ.o5bH.QT/XyKMsHGYfX.QMhNO', '+212600000007', 'STUDENT'),
    ('Bilal', 'Nasser', 'student5@noor.academy', '$2a$10$4hAXW4R3qak8y.OtCqbg8.PLJlgJ.o5bH.QT/XyKMsHGYfX.QMhNO', '+212600000008', 'STUDENT')
ON CONFLICT (email) DO NOTHING;

-- ============ ROOMS ============
INSERT INTO rooms (name, max_capacity)
VALUES
    ('Room A', 20),
    ('Room B', 15),
    ('Room C', 10)
ON CONFLICT (name) DO NOTHING;

-- ============ COURSES ============
INSERT INTO courses (title, description, syllabus)
SELECT * FROM (VALUES
    ('Quran Memorization', 'Structured Hifz program with weekly revision.', 'Juz Amma -> Juz Tabarak -> full memorization plan.'),
    ('Arabic Language Fundamentals', 'Reading, writing and grammar basics for beginners.', 'Alphabet, vocabulary, sentence structure, conversation practice.'),
    ('Islamic Studies', 'Core aqeedah, fiqh and seerah topics.', 'Pillars of Islam, life of the Prophet, daily fiqh rulings.'),
    ('Tajweed Mastery', 'Correct Quranic recitation rules and practice.', 'Makharij, noon/meem rules, madd rules, guided recitation.')
) AS v(title, description, syllabus)
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.title = v.title);

-- ============ GROUPS ============
INSERT INTO groups (course_id, teacher_id, room_id, group_name, start_date, end_date, status)
SELECT c.id, u.id, r.id, g.group_name, g.start_date::date, g.end_date::date, g.status
FROM (VALUES
    ('Quran Memorization', 'teacher1@noor.academy', 'Room A', 'Quran Memorization - Morning', '2026-09-01', '2026-12-15', 'ACTIVE'),
    ('Arabic Language Fundamentals', 'teacher2@noor.academy', 'Room B', 'Arabic Fundamentals - Evening', '2026-09-01', '2026-12-15', 'ACTIVE'),
    ('Islamic Studies', 'teacher1@noor.academy', 'Room C', 'Islamic Studies - Weekend', '2026-09-05', '2026-12-20', 'DRAFT'),
    ('Tajweed Mastery', 'teacher2@noor.academy', 'Room A', 'Tajweed Mastery - Intensive', '2026-01-10', '2026-04-10', 'COMPLETED'),
    ('Quran Memorization', 'teacher1@noor.academy', 'Room B', 'Quran Memorization - Evening', '2026-09-01', '2026-12-15', 'FULL')
) AS g(course_title, teacher_email, room_name, group_name, start_date, end_date, status)
JOIN courses c ON c.title = g.course_title
JOIN users u ON u.email = g.teacher_email
JOIN rooms r ON r.name = g.room_name
WHERE NOT EXISTS (SELECT 1 FROM groups gr WHERE gr.group_name = g.group_name);

-- ============ SESSIONS ============
INSERT INTO sessions (group_id, day_of_week, start_time, end_time)
SELECT g.id, s.day_of_week, s.start_time::time, s.end_time::time
FROM (VALUES
    ('Quran Memorization - Morning', 'MONDAY', '09:00', '11:00'),
    ('Quran Memorization - Morning', 'WEDNESDAY', '09:00', '11:00'),
    ('Arabic Fundamentals - Evening', 'TUESDAY', '17:00', '19:00'),
    ('Arabic Fundamentals - Evening', 'THURSDAY', '17:00', '19:00'),
    ('Islamic Studies - Weekend', 'SATURDAY', '10:00', '12:00'),
    ('Tajweed Mastery - Intensive', 'TUESDAY', '08:00', '10:00'),
    ('Tajweed Mastery - Intensive', 'THURSDAY', '08:00', '10:00'),
    ('Quran Memorization - Evening', 'MONDAY', '18:00', '20:00'),
    ('Quran Memorization - Evening', 'WEDNESDAY', '18:00', '20:00')
) AS s(group_name, day_of_week, start_time, end_time)
JOIN groups g ON g.group_name = s.group_name
WHERE NOT EXISTS (
    SELECT 1 FROM sessions se
    WHERE se.group_id = g.id AND se.day_of_week = s.day_of_week AND se.start_time = s.start_time::time
);

-- ============ ENROLLMENTS ============
INSERT INTO enrollments (student_id, group_id, status, applied_at, confirmed_at)
SELECT u.id, g.id, e.status,
       now() - (e.applied_days_ago || ' days')::interval,
       CASE WHEN e.status = 'CONFIRMED' THEN now() - (e.applied_days_ago || ' days')::interval + interval '1 day' ELSE NULL END
FROM (VALUES
    ('student1@noor.academy', 'Quran Memorization - Morning', 'CONFIRMED', 10),
    ('student2@noor.academy', 'Quran Memorization - Morning', 'CONFIRMED', 9),
    ('student3@noor.academy', 'Quran Memorization - Morning', 'PENDING', 1),
    ('student3@noor.academy', 'Arabic Fundamentals - Evening', 'PENDING', 1),
    ('student4@noor.academy', 'Arabic Fundamentals - Evening', 'CONFIRMED', 7),
    ('student5@noor.academy', 'Quran Memorization - Evening', 'CONFIRMED', 14),
    ('student1@noor.academy', 'Arabic Fundamentals - Evening', 'PENDING', 2),
    ('student2@noor.academy', 'Islamic Studies - Weekend', 'CANCELLED', 20)
) AS e(student_email, group_name, status, applied_days_ago)
JOIN users u ON u.email = e.student_email
JOIN groups g ON g.group_name = e.group_name
ON CONFLICT (student_id, group_id) DO NOTHING;
