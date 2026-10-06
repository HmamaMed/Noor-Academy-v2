package com.nooracademy.storage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import com.nooracademy.common.exception.BadRequestException;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
class DriveStorageTests {
    DriveStorage drive; MockRestServiceServer server;
    @BeforeEach void setup() {
        var builder=RestClient.builder(); server=MockRestServiceServer.bindTo(builder).build(); drive=new DriveStorage(builder);
        ReflectionTestUtils.setField(drive,"clientId","test-client"); ReflectionTestUtils.setField(drive,"clientSecret","test-secret");
        ReflectionTestUtils.setField(drive,"refreshToken","test-refresh"); ReflectionTestUtils.setField(drive,"folderId","test-folder");
    }
    void token() {
        server.expect(requestTo("https://oauth2.googleapis.com/token")).andExpect(method(HttpMethod.POST))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("grant_type=refresh_token")))
            .andRespond(withSuccess("{\"access_token\":\"test-access\",\"expires_in\":3600}",MediaType.APPLICATION_JSON));
    }
    @Test void uploadUsesOAuthAndPrivateParentAndReusesTokenForDownload() {
        token();
        server.expect(requestTo("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true"))
            .andExpect(header("Authorization","Bearer test-access"))
            .andExpect(content().json("{\"name\":\"lesson.pdf\",\"parents\":[\"test-folder\"]}"))
            .andRespond(withStatus(HttpStatus.OK).header("Location","https://www.googleapis.com/upload/session"));
        server.expect(requestTo("https://www.googleapis.com/upload/session")).andExpect(method(HttpMethod.PUT))
            .andExpect(content().bytes("pdf".getBytes())).andRespond(withSuccess("{\"id\":\"file123\"}",MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://www.googleapis.com/drive/v3/files/file123?alt=media&supportsAllDrives=true"))
            .andExpect(header("Authorization","Bearer test-access")).andRespond(withSuccess("pdf".getBytes(),MediaType.APPLICATION_OCTET_STREAM));
        assertEquals("file123",drive.upload("lesson.pdf","application/pdf","pdf".getBytes()));
        assertArrayEquals("pdf".getBytes(),drive.download("file123")); server.verify();
    }
    @Test void disabledStorageDoesNotMakeExternalRequests() {
        ReflectionTestUtils.setField(drive,"refreshToken",""); assertFalse(drive.enabled());
        assertThrows(BadRequestException.class,() -> drive.upload("a","application/pdf",new byte[]{1})); server.verify();
    }
    @Test void driveErrorsReturnUsefulMessageWithoutExposingGoogleResponse() {
        server.expect(requestTo("https://oauth2.googleapis.com/token")).andRespond(withStatus(HttpStatus.BAD_REQUEST).body("private credential error"));
        var exception=assertThrows(BadRequestException.class,() -> drive.upload("a","application/pdf",new byte[]{1}));
        assertFalse(exception.getMessage().contains("private credential")); server.verify();
    }
}
