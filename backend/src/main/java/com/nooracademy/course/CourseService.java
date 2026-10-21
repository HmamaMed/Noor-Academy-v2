package com.nooracademy.course;

import com.nooracademy.common.exception.BadRequestException;
import com.nooracademy.common.exception.NotFoundException;
import com.nooracademy.course.dto.CourseRequest;
import com.nooracademy.course.dto.CourseResponse;
import com.nooracademy.storage.R2Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {
    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final R2Storage storage;

    public List<CourseResponse> findAll() {
        return courseRepository.findAll().stream().map(courseMapper::toResponse).toList();
    }

    public CourseResponse findById(Long id) {
        return courseMapper.toResponse(getCourseOrThrow(id));
    }

    public boolean imageUploadsEnabled() { return storage.enabled(); }

    public R2Storage.DownloadLink image(Long id) {
        Course course = getCourseOrThrow(id);
        if (course.getImageKey() == null) throw new NotFoundException("This course has no image.");
        return storage.courseImage(course.getImageKey(), course.getImageContentType());
    }

    @Transactional
    public CourseResponse create(CourseRequest request) { return create(request, null); }

    @Transactional
    public CourseResponse create(CourseRequest request, MultipartFile image) {
        Course course = Course.builder().title(request.title()).description(request.description())
                .syllabus(request.syllabus()).price(request.price()).totalSessions(request.totalSessions()).build();
        changeImage(course, image, false);
        return courseMapper.toResponse(courseRepository.saveAndFlush(course));
    }

    @Transactional
    public CourseResponse update(Long id, CourseRequest request) { return update(id, request, null, false); }

    @Transactional
    public CourseResponse update(Long id, CourseRequest request, MultipartFile image, boolean removeImage) {
        // Serialize image replacement/removal so competing admins cannot orphan an upload.
        Course course = lockedCourse(id);
        changeImage(course, image, removeImage);
        course.setTitle(request.title());
        course.setDescription(request.description());
        course.setSyllabus(request.syllabus());
        course.setPrice(request.price());
        course.setTotalSessions(request.totalSessions());
        return courseMapper.toResponse(courseRepository.saveAndFlush(course));
    }

    private void changeImage(Course course, MultipartFile file, boolean remove) {
        if (file != null && remove) throw new BadRequestException("Choose either a new image or remove the current image.");
        if (file == null && !remove) return;
        String previous = course.getImageKey();
        if (file != null) {
            if (!storage.enabled()) throw new BadRequestException("Course image uploads are unavailable. Configure R2 storage first.");
            var validated = CourseImageUpload.validate(file);
            String key = storage.uploadCourseImage(validated.bytes(), validated.contentType());
            // Compensate the external upload if persistence/commit subsequently fails.
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) storage.delete(key);
                }
            });
            course.setImageKey(key);
            course.setImageContentType(validated.contentType());
        } else {
            course.setImageKey(null);
            course.setImageContentType(null);
        }
        deleteAfterCommit(previous);
    }

    private void deleteAfterCommit(String key) {
        if (key != null) TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { storage.delete(key); }
        });
    }

    @Transactional
    public void delete(Long id) {
        Course course = lockedCourse(id);
        courseRepository.delete(course);
        courseRepository.flush(); // Reject dependent groups before deleting any R2 object.
        deleteAfterCommit(course.getImageKey());
    }

    private Course lockedCourse(Long id) {
        return courseRepository.findByIdForUpdate(id).orElseThrow(() -> new NotFoundException("Course not found: " + id));
    }

    Course getCourseOrThrow(Long id) {
        return courseRepository.findById(id).orElseThrow(() -> new NotFoundException("Course not found: " + id));
    }
}
