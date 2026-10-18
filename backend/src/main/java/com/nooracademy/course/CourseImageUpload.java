package com.nooracademy.course;

import com.nooracademy.common.exception.BadRequestException;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Locale;

/** Validate actual raster contents before allowing a course cover into storage. */
final class CourseImageUpload {
    static final long MAX_BYTES = 5L * 1024 * 1024;
    static final int MAX_DIMENSION = 4096;

    private CourseImageUpload() {}

    static Image validate(MultipartFile file) {
        if (file.isEmpty()) throw new BadRequestException("Choose a JPEG or PNG image.");
        if (file.getSize() > MAX_BYTES) throw new BadRequestException("Course images must be 5 MB or smaller.");
        try {
            byte[] bytes = file.getBytes();
            try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
                var readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) throw invalid();
                var reader = readers.next();
                try {
                    String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                    String type = switch (format) {
                        case "jpeg", "jpg" -> "image/jpeg";
                        case "png" -> "image/png";
                        default -> throw invalid();
                    };
                    reader.setInput(input, true, true);
                    int width = reader.getWidth(0);
                    int height = reader.getHeight(0);
                    if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION)
                        throw new BadRequestException("Course images must be no larger than 4096 × 4096 pixels.");
                    // A recognized header alone is insufficient: also reject corrupt pixel data.
                    var image = reader.read(0);
                    if (image == null) throw invalid();
                    image.flush();
                    return new Image(bytes, type);
                } finally {
                    reader.dispose();
                }
            }
        } catch (IOException | IllegalArgumentException ex) {
            throw invalid();
        }
    }

    private static BadRequestException invalid() {
        return new BadRequestException("Use a valid JPEG or PNG image. Other file types are not supported.");
    }

    record Image(byte[] bytes, String contentType) {}
}
