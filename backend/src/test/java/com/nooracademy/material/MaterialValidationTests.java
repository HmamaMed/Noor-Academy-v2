package com.nooracademy.material;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class MaterialValidationTests {
    @Test void sanitizesDownloadFileNamesWithoutLosingTheirExtension() {
        assertEquals("attachment",MaterialService.safeFileName(null));
        assertEquals("attachment",MaterialService.safeFileName("  "));
        assertEquals("attachment",MaterialService.safeFileName(".."));
        assertEquals("folder_lesson__.pdf",MaterialService.safeFileName("folder/lesson\r\n.pdf"));
        String longName="a".repeat(250)+".pdf";
        assertEquals(200,MaterialService.safeFileName(longName).length());
        assertTrue(MaterialService.safeFileName(longName).endsWith(".pdf"));
    }
    @Test void acceptsOnlyGoogleHttpsLinks() {
        assertEquals("https://docs.google.com/document/d/abc/edit",MaterialService.validateUrl(" https://docs.google.com/document/d/abc/edit "));
        assertNull(MaterialService.validateUrl(""));
        for (String url : new String[]{"javascript:alert(1)","http://drive.google.com/a","https://drive.google.com.evil.test/a","https://user@drive.google.com/a","https://drive.google.com:8443/a"}) {
            assertThrows(com.nooracademy.common.exception.BadRequestException.class,() -> MaterialService.validateUrl(url));
        }
    }
}
