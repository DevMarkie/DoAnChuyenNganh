package com.sms.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationStatusResponse {
    private boolean canRegister;
    private String studentStatus;
    private String studentCohort;
    private String studentDepartment;
    private String studentMajor;
    private String currentShiftName;
    private RegistrationWaveResponse activeWave;
    private RegistrationWaveResponse upcomingWave;
    private List<RegistrationWaveResponse> allStudentWaves;
    private int minCredits;
    private int maxCredits;
    private int currentEnrolledCredits;
    private String message;
}
