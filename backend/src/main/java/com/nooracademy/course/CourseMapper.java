package com.nooracademy.course;

import com.nooracademy.course.dto.CourseResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CourseMapper {
    @Mapping(target = "imageUrl", expression = "java(imageUrl(course))")
    CourseResponse toResponse(Course course);

    default String imageUrl(Course course) {
        if (course.getImageKey() == null) return null;
        String version = course.getImageKey().substring(course.getImageKey().lastIndexOf('/') + 1);
        return "/api/courses/" + course.getId() + "/image?v=" + version;
    }
}
