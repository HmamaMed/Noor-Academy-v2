package com.nooracademy.course;

import com.nooracademy.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import static org.junit.jupiter.api.Assertions.*;

class CourseImageValidationTests {
    static MockMultipartFile image(String format, int width, int height) throws Exception {
        var bytes = new ByteArrayOutputStream();
        var image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ImageIO.write(image, format, bytes); image.flush();
        return new MockMultipartFile("image", "cover." + format, "image/" + format, bytes.toByteArray());
    }
    @Test void usesDecodedTypeInsteadOfFilenameOrClientMime() throws Exception {
        var png = image("png", 12, 8);
        var renamed = new MockMultipartFile("image", "fake.jpg", "image/jpeg", png.getBytes());
        var checked = CourseImageUpload.validate(renamed);
        assertEquals("image/png", checked.contentType()); assertArrayEquals(png.getBytes(), checked.bytes());
        assertEquals("image/jpeg", CourseImageUpload.validate(image("jpeg", 12, 8)).contentType());
    }
    @Test void rejectsNonImagesUnsupportedFormatsAndCorruption() throws Exception {
        for (String invalid : new String[]{"<svg><script>alert(1)</script></svg>", "<html>not an image</html>", "PNG", ""})
            assertThrows(BadRequestException.class, () -> CourseImageUpload.validate(new MockMultipartFile("image", "cover.png", "image/png", invalid.getBytes())));
        assertThrows(BadRequestException.class, () -> CourseImageUpload.validate(image("gif", 8, 8)));
        byte[] png = image("png", 8, 8).getBytes();
        assertThrows(BadRequestException.class, () -> CourseImageUpload.validate(new MockMultipartFile("image", "bad.png", "image/png", java.util.Arrays.copyOf(png, 33))));
    }
    @Test void boundsBytesAndDecodedDimensions() throws Exception {
        assertThrows(BadRequestException.class, () -> CourseImageUpload.validate(new MockMultipartFile("image", "large.png", "image/png", new byte[5 * 1024 * 1024 + 1])));
        assertThrows(BadRequestException.class, () -> CourseImageUpload.validate(image("png", 4097, 1)));
    }
}
