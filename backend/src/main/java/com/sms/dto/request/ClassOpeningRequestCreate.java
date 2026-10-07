package com.sms.dto.request;

import com.sms.entity.ClassOpeningRequest;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClassOpeningRequestCreate {
    @NotNull
    private Integer subjectId;
    @NotNull
    private Integer semesterId;
    @NotNull
    private ClassOpeningRequest.RequestType requestType;
}
