package com.nooracademy.course;

import com.nooracademy.course.dto.CourseResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CourseMapper {
    CourseResponse toResponse(Course course);
}
