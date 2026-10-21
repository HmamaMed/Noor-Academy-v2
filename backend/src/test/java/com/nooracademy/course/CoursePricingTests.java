package com.nooracademy.course;

import com.nooracademy.course.dto.CourseRequest;
import com.nooracademy.storage.R2Storage;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import tools.jackson.databind.json.JsonMapper;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CoursePricingTests {
    @Test void validatesMoneyPrecisionAndBoundsWithoutTurningMissingPricesIntoFreeCourses() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(new CourseRequest("Arabic", "", "", null, null)).isEmpty());
            assertTrue(validator.validate(new CourseRequest("Arabic", "", "", BigDecimal.ZERO, 1)).isEmpty());
            assertTrue(validator.validate(new CourseRequest("Arabic", "", "", new BigDecimal("1234.50"), 24)).isEmpty());
            for (String amount : new String[]{"-1", "1.234", "100000000"}) {
                assertFalse(validator.validate(new CourseRequest("Arabic", "", "", new BigDecimal(amount), 24)).isEmpty(), amount);
            }
            for (int sessions : new int[]{-1, 0, 10001}) {
                assertFalse(validator.validate(new CourseRequest("Arabic", "", "", null, sessions)).isEmpty());
            }
        }
    }
    @Test void fractionalSessionCountsAreNotSilentlyRoundedByJsonBinding() {
        var mapper = JsonMapper.builder().build();
        assertThrows(Exception.class, () -> mapper.readValue("{\"title\":\"Arabic\",\"totalSessions\":12.5}", CourseRequest.class));
    }
    @Test void createsAndEditsPriceAndLengthWithoutDependingOnImageStorage() {
        var repository = mock(CourseRepository.class);
        var storage = mock(R2Storage.class);
        var service = new CourseService(repository, Mappers.getMapper(CourseMapper.class), storage);
        when(repository.saveAndFlush(any())).thenAnswer(call -> { Course course = call.getArgument(0); course.setId(1L); return course; });
        var terms = new CourseRequest("Arabic", "Learn", "Reading", new BigDecimal("1234.50"), 24);
        var created = service.create(terms);
        assertEquals(new BigDecimal("1234.50"), created.price()); assertEquals(24, created.totalSessions());
        var existing = Course.builder().id(1L).title("Arabic").price(terms.price()).totalSessions(24).imageKey("course-images/keep").build();
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(existing));
        var free = service.update(1L, new CourseRequest("Arabic", "Learn", "Reading", BigDecimal.ZERO, 12));
        assertEquals(BigDecimal.ZERO, free.price()); assertEquals(12, free.totalSessions());
        assertNotNull(free.imageUrl());
        var unpublished = service.update(1L, new CourseRequest("Arabic", "Learn", "Reading", null, null));
        assertNull(unpublished.price()); assertNull(unpublished.totalSessions()); verifyNoInteractions(storage);
    }
    @Test void olderJsonRequestsStillSupportUnpublishedTerms() throws Exception {
        var request = JsonMapper.builder().build().readValue("{\"title\":\"Arabic\"}", CourseRequest.class);
        assertNull(request.price()); assertNull(request.totalSessions());
    }
    @Test void invalidJsonAndNegativePricesReturnBadRequestWithoutSaving() throws Exception {
        var service = mock(CourseService.class);
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new CourseController(service))
                .setControllerAdvice(new com.nooracademy.common.exception.GlobalExceptionHandler()).build();
        for (String body : new String[]{"{\"title\":\"Arabic\",\"totalSessions\":12.5}", "{\"title\":\"Arabic\",\"price\":-1}"}) {
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/courses")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
        }
        verifyNoInteractions(service);
    }
}
