# -*- coding: utf-8 -*-
import os

files_to_check = [
    ('.tools/ui_captures/ui_83.png', 'Fig 83'),
    ('.tools/ui_captures/ui_84.png', 'Fig 84'),
    ('.tools/ui_captures/ui_85.png', 'Fig 85'),
    ('.tools/ui_captures/ui_86.png', 'Fig 86'),
    ('.tools/ui_captures/ui_87.png', 'Fig 87'),
    ('.tools/ui_captures/ui_88.png', 'Fig 88'),
    ('.tools/ui_captures/ui_89.png', 'Fig 89'),
    ('.tools/ui_captures/ui_90.png', 'Fig 90'),
    ('.tools/ui_captures/ui_91.png', 'Fig 91'),
    ('.tools/ui_captures/ui_92.png', 'Fig 92'),
    ('.tools/ui_captures/ui_93.png', 'Fig 93'),
    ('.tools/ui_captures/ui_94.png', 'Fig 94'),
    ('.tools/ui_captures/ui_95.png', 'Fig 95'),
    ('.tools/ui_captures/ui_96.png', 'Fig 96'),
    ('.tools/ui_captures/ui_97.png', 'Fig 97'),
    ('.tools/ui_captures/ui_98.png', 'Fig 98'),
    ('.tools/ui_captures/ui_99.png', 'Fig 99'),
    ('.tools/ui_captures/ui_100.png', 'Fig 100'),
    ('.tools/ui_captures/ui_101.png', 'Fig 101'),
    ('.tools/ui_captures/ui_102.png', 'Fig 102'),
    ('.tools/ui_captures/ui_103.png', 'Fig 103'),
    ('.tools/ui_captures/ui_104.png', 'Fig 104'),
    ('.tools/ui_captures/ui_105.png', 'Fig 105'),
    ('.tools/ui_captures/ui_106.png', 'Fig 106'),
    ('.tools/ui_captures/ui_107.png', 'Fig 107'),
    ('.tools/ui_captures/ui_108.png', 'Fig 108'),
    ('.tools/ui_captures/ui_109.png', 'Fig 109'),
    ('.tools/ui_captures/ui_110.png', 'Fig 110'),
    ('.tools/ui_captures/ui_111.png', 'Fig 111'),
    ('.tools/ui_captures/ui_112.png', 'Fig 112'),
    ('.tools/ui_captures/ui_113.png', 'Fig 113'),
    ('.tools/ui_captures/ui_114.png', 'Fig 114'),
    ('.tools/ui_captures/ui_115.png', 'Fig 115'),
    ('.tools/ui_captures/ui_116.png', 'Fig 116'),
    ('.tools/ui_captures/ui_117.png', 'Fig 117'),
    ('.tools/ui_captures/ui_118.png', 'Fig 118'),
    ('.tools/ui_captures/ui_119.png', 'Fig 119'),
    ('.tools/ui_captures/ui_120.png', 'Fig 120'),
    ('.tools/ui_captures/ui_121.png', 'Fig 121'),
    ('.tools/ui_captures/ui_122.png', 'Fig 122'),
    ('.tools/ui_captures/ui_123.png', 'Fig 123'),
    ('.tools/ui_captures/ui_124.png', 'Fig 124'),
    ('.tools/ui_captures/ui_125.png', 'Fig 125'),
    ('.tools/ui_captures/ui_126.png', 'Fig 126'),
    ('.tools/ui_captures/ui_127a.png', 'Fig 126a'),
    ('.tools/ui_captures/ui_127b.png', 'Fig 126b'),
    ('.tools/ui_captures/ui_127c.png', 'Fig 126c'),
    ('.tools/ui_captures/ui_127d.png', 'Fig 126d'),
    ('.tools/ui_captures/ui_127e.png', 'Fig 126e'),
    ('.tools/ui_captures/ui_127f.png', 'Fig 126f'),
    ('.tools/ui_captures/ui_127.png', 'Fig 127'),
    ('tests/test-results/chrome-devtools/01_portal_hub_light.png', 'Fig 134'),
    ('tests/test-results/chrome-devtools/02_admin_dashboard.png', 'Fig 135'),
    ('tests/test-results/chrome-devtools/02_admin_subjects.png', 'Fig 136'),
    ('tests/test-results/chrome-devtools/02_admin_sections.png', 'Fig 137'),
    ('tests/test-results/chrome-devtools/03_academic_dashboard.png', 'Fig 138'),
    ('tests/test-results/chrome-devtools/03_academic_graduation_audit.png', 'Fig 139'),
    ('tests/test-results/chrome-devtools/03_grade_amendments.png', 'Fig 140'),
    ('tests/test-results/chrome-devtools/04_lecturer_dashboard.png', 'Fig 141'),
    ('tests/test-results/chrome-devtools/04_lecturer_schedule.png', 'Fig 142'),
    ('tests/test-results/chrome-devtools/04_lecturer_grades.png', 'Fig 143'),
    ('tests/test-results/chrome-devtools/05_student_dashboard.png', 'Fig 144'),
    ('tests/test-results/chrome-devtools/05_student_enrollment.png', 'Fig 145'),
    ('tests/test-results/chrome-devtools/05_student_schedule.png', 'Fig 146'),
    ('tests/test-results/chrome-devtools/05_student_transcript.png', 'Fig 147'),
    ('tests/test-results/chrome-devtools/05_student_roadmap_dag.png', 'Fig 148'),
]

missing = []
for p, desc in files_to_check:
    if not os.path.exists(p):
        missing.append((p, desc))
    else:
        sz = os.path.getsize(p)
        if sz == 0:
            missing.append((p, f"{desc} (0 bytes)"))

if missing:
    print(f"FAILED: {len(missing)} files missing or empty:")
    for p, d in missing:
        print(f"  - {d}: {p}")
else:
    print(f"SUCCESS: All {len(files_to_check)} required images exist and are non-empty!")

