package com.nooracademy.material;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class MaterialValidationTests {
    @Test void acceptsOnlyGoogleHttpsLinks() {
        assertEquals("https://docs.google.com/document/d/abc/edit",MaterialService.validateUrl(" https://docs.google.com/document/d/abc/edit "));
        assertNull(MaterialService.validateUrl(""));
        for (String url : new String[]{"javascript:alert(1)","http://drive.google.com/a","https://drive.google.com.evil.test/a","https://user@drive.google.com/a","https://drive.google.com:8443/a"}) {
            assertThrows(com.nooracademy.common.exception.BadRequestException.class,() -> MaterialService.validateUrl(url));
        }
    }
}
