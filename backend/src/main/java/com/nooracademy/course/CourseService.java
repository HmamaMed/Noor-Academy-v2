package com.nooracademy.course;

import com.nooracademy.common.exception.NotFoundException;
import com.nooracademy.course.dto.CourseRequest;
import com.nooracademy.course.dto.CourseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;

    public List<CourseResponse> findAll() {
        return courseRepository.findAll().stream().map(courseMapper::toResponse).toList();
    }

    public CourseResponse findById(Long id) {
        return courseMapper.toResponse(getCourseOrThrow(id));
    }

    @Transactional
    public CourseResponse create(CourseRequest request) {
        Course course = Course.builder()
                .title(request.title())
                .description(request.description())
                .syllabus(request.syllabus())
                .build();
        return courseMapper.toResponse(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse update(Long id, CourseRequest request) {
        Course course = getCourseOrThrow(id);
        course.setTitle(request.title());
        course.setDescription(request.description());
        course.setSyllabus(request.syllabus());
        return courseMapper.toResponse(course);
    }

    @Transactional
    public void delete(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new NotFoundException("Course not found: " + id);
        }
        courseRepository.deleteById(id);
    }

    Course getCourseOrThrow(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Course not found: " + id));
    }
}
