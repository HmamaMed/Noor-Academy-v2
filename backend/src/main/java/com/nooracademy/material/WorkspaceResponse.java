package com.nooracademy.material;
import java.util.List;
import com.nooracademy.group.dto.GroupResponse;
public record WorkspaceResponse(GroupResponse group, boolean canManage, boolean uploadsEnabled, List<MaterialResponse> materials) {}
