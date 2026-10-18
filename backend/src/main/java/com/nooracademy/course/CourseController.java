package com.nooracademy.course;

import com.nooracademy.course.dto.CourseRequest;
import com.nooracademy.course.dto.CourseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.net.URI;
import org.springframework.http.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public List<CourseResponse> findAll() {
        return courseService.findAll();
    }

    @GetMapping("/{id}")
    public CourseResponse findById(@PathVariable Long id) {
        return courseService.findById(id);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse create(@Valid @RequestBody CourseRequest request) {
        return courseService.create(request);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse update(@PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        return courseService.update(id, request);
    }

    @GetMapping("/image-settings")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> imageSettings() {
        return Map.of("uploadsEnabled", courseService.imageUploadsEnabled(), "maxBytes", CourseImageUpload.MAX_BYTES,
                "maxDimension", CourseImageUpload.MAX_DIMENSION);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<Void> image(@PathVariable Long id) {
        var image = courseService.image(id);
        // Never cache the temporary redirect beyond the signed URL's lifetime.
        return ResponseEntity.status(HttpStatus.FOUND).cacheControl(CacheControl.noStore())
                .location(URI.create(image.url())).build();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse createWithImage(@Valid @RequestPart("metadata") CourseRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return courseService.create(request, image);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse updateWithImage(@PathVariable Long id, @Valid @RequestPart("metadata") CourseRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestParam(defaultValue = "false") boolean removeImage) {
        return courseService.update(id, request, image, removeImage);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        courseService.delete(id);
    }
}
