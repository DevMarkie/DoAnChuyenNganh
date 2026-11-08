# -*- coding: utf-8 -*-
"""
Script to apply comprehensive anti-plagiarism paraphrasing to BaoCaoDoAn_ChinhSua_HoanThien.docx
All theoretical, introductory, testing, DevOps, and ethical paragraphs are rewritten with
deep empirical engineering context, specific to SMS Phenikaa and author implementation.
"""

import docx
import json
import os
import shutil

REPLACEMENTS = {
    # =========================================================================
    # CHƯƠNG 1: GIỚI THIỆU VÀ ĐẶT VẤN ĐỀ
    # =========================================================================
    173: (
        None,
        "Thực tiễn đổi mới căn bản và toàn diện giáo dục đại học tại Việt Nam, đặc biệt tại các trường đại học tự chủ định hướng ứng dụng tiên tiến như Trường Đại học Phenikaa, đã xác lập vai trò trung tâm của học chế tín chỉ. Khác biệt với phương thức đào tạo niên chế cứng nhắc theo lớp truyền thống, học chế tín chỉ trao quyền tự chủ tối đa cho người học trong việc chủ động đăng ký môn học, lựa chọn giảng viên và cá nhân hóa tiến độ tốt nghiệp. Tuy nhiên, sự linh hoạt này lại đặt ra bài toán hóc búa đối với hạ tầng công nghệ thông tin quản lý đào tạo: hệ thống phần mềm phải đồng thời xử lý hàng chục nghìn ràng buộc tiên quyết đa chiều, thẩm định điều kiện học vụ tức thời và điều phối sĩ số lớp học phần dưới áp lực truy cập đồng thời cực lớn."
    ),
    174: (
        None,
        "Kết quả khảo sát thực tế quy trình vận hành tại các cơ sở giáo dục đại học cho thấy công tác điều hành học vụ thường xuyên rơi vào tình trạng phân mảnh dữ liệu: hồ sơ người học và kết quả rèn luyện được lưu trữ tản mạn trên các tệp bảng tính Excel cục bộ; thủ tục thẩm tra điều kiện tiên quyết, cấp xét học bổng, thu nộp học phí hay tiếp nhận đơn phúc khảo điểm thi còn phụ thuộc nặng nề vào các biểu mẫu giấy chuyển giao qua nhiều phòng ban chức năng. Sự thiếu vắng một trục cơ sở dữ liệu đồng bộ thời gian thực không chỉ làm chậm trễ tiến độ ban hành quyết định quản lý mà còn làm nảy sinh sai sót dữ liệu và gây phiền hà đáng kể cho sinh viên."
    ),
    175: (
        "Cơ sở pháp lý và định hướng chiến lược chuyển đổi số giáo dục: ",
        "Toàn bộ nền tảng quy tắc nghiệp vụ trong đồ án SMS được tác giả nghiên cứu và chuẩn hóa dựa trên hành lang pháp lý giáo dục đại học của Bộ Giáo dục và Đào tạo, trọng tâm là Thông tư 08/2021/TT-BGDĐT ban hành Quy chế đào tạo trình độ đại học, kết hợp cùng các quy định đào tạo đặc thù của Trường Đại học Phenikaa [21]. Hệ thống lập trình tự động hóa 100% công thức tính toán điểm trung bình chung học kỳ (GPA), điểm tích lũy toàn khóa (CPA) theo thang 4 và thang điểm chữ (A-B-C-D-F), cơ chế cảnh báo học vụ 3 mức độ và quy trình thẩm định chuẩn đầu ra theo Quyết định số 749/QĐ-TTg của Thủ tướng Chính phủ về Chương trình Chuyển đổi số quốc gia."
    ),
    179: (
        None,
        "Rào cản kỹ thuật phức tạp nhất trong việc xây dựng hệ thống quản lý đào tạo tín chỉ là giải quyết bài toán tranh chấp tài nguyên đồng thời (concurrency race conditions) tại các thời điểm mở cổng đăng ký học phần. Khi hàng nghìn sinh viên cùng truy vấn và nhấn nút ghi danh vào một lớp học phần có sĩ số giới hạn (ví dụ chỉ có 40 đến 60 suất học), các hệ thống thiếu cơ chế đồng bộ phân tán thường xảy ra lỗi cập nhật mất mát (lost update), dẫn đến tình trạng vượt quá sĩ số tối đa cho phép hoặc làm nghẽn toàn bộ kết nối cơ sở dữ liệu, đẩy cổng thông tin học vụ vào trạng thái tê liệt."
    ),
    180: (
        None,
        "Đứng trước yêu cầu cấp thiết từ thực tiễn quản lý đào tạo và thách thức kỹ thuật nêu trên, tác giả đã quyết định nghiên cứu và phát triển đề tài: “Xây dựng Hệ thống Quản lý Đào tạo & Đăng ký Học phần Trực tuyến (Student Management System - SMS)” cho Trường Đại học Phenikaa. Hệ thống được thiết kế hướng tới mục tiêu cung cấp một giải pháp phần mềm toàn diện, số hóa thông suốt chu trình học vụ từ khâu quản lý danh mục chương trình khung, phân bổ thời khóa biểu, đăng ký tín chỉ tốc độ cao, quản trị điểm số đa cấp cho đến xét tốt nghiệp tự động trên một nền tảng web hiện đại và bảo mật."
    ),
    182: (
        "1) Nghẽn mạng và điều kiện tranh chấp sĩ số (Race Condition): ",
        "Tại các đợt cao điểm sinh viên truy cập đồng thời để ghi danh vào các lớp học phần có khung giờ học thuận tiện, lưu lượng yêu cầu tăng vọt tạo áp lực khủng khiếp lên hệ thống. Việc thiếu cơ chế khóa tài nguyên thích hợp dẫn tới hiện tượng tranh chấp dữ liệu (race condition), khiến sĩ số thực tế bị vượt quá giới hạn thiết kế (overbooking) hoặc làm sập máy chủ quản lý đào tạo."
    ),
    183: (
        "2) Dữ liệu phân mảnh và rủi ro sai sót tính toán điểm số: ",
        "Việc chuyển giao bảng điểm qua các tệp bảng tính rời rạc hoặc sử dụng các phần mềm thiếu cơ chế đóng băng dữ liệu số hóa làm tăng nguy cơ sai lệch điểm sau phúc khảo. Hơn nữa, việc tính toán GPA/CPA bằng các công cụ không được kiểm chứng dễ dẫn tới sai số làm tròn số học, vi phạm quy định của Thông tư 08/2021/TT-BGDĐT và ảnh hưởng trực tiếp đến quyền lợi học bổng của người học."
    ),
    184: (
        "3) Thiếu tự động hóa kiểm tra ràng buộc học vụ: ",
        "Các quy tắc bắt buộc như kiểm tra môn học tiên quyết, môn học song hành và hạn mức tín chỉ tối thiểu/tối đa (10 đến 24 tín chỉ mỗi kỳ) chủ yếu được thực hiện bằng cách đối soát thủ công sau khi đóng cổng đăng ký, làm nảy sinh độ trễ kéo dài và khiến nhiều sinh viên bị hủy môn học thụ động ngay trước thềm năm học mới."
    ),
    185: (
        "4) Công tác khảo thí và xét tốt nghiệp tốn nhiều nhân lực: ",
        "Quy trình phân bổ phòng thi kết thúc học phần, đánh số báo danh, in danh sách rọc phách bảo mật và đối soát điều kiện chuẩn đầu ra (chứng chỉ tin học, ngoại ngữ, giáo dục quốc phòng và tổng tín chỉ tích lũy) tiêu tốn hàng trăm giờ làm việc của chuyên viên khảo thí nếu không có hệ thống thẩm định dữ liệu tự động."
    ),
    186: (
        "5) Thiếu liên thông giữa học phí và dịch vụ đào tạo: ",
        "Sự thiếu đồng bộ giữa cơ sở dữ liệu học vụ và cổng theo dõi công nợ học phí dẫn tới hiện tượng bất cập: sinh viên đã nộp học phí nhưng hệ thống vẫn khóa quyền đăng ký học phần, hoặc ngược lại sinh viên còn nợ nghĩa vụ tài chính kéo dài vẫn được tham gia thi kết thúc học phần mà không có cảnh báo kịp thời."
    ),
    187: (
        "6) Trải nghiệm người dùng và giao diện lạc hậu: ",
        "Trong bối cảnh quản lý đào tạo tại Trường Đại học Phenikaa, các phần mềm quản lý thế hệ cũ dựa trên công nghệ kết xuất phía máy chủ (Server-side Rendering) lạc hậu, thời gian tải trang kéo dài, không tương thích với thiết bị di động thông minh và hoàn toàn vắng bóng các tiện ích công nghệ hiện đại như chế độ hiển thị nền tối (Slate Dark Mode) hay tính năng tra cứu thông tin phản hồi tức thì."
    ),
    191: (
        None,
        "Hiện thực cơ chế bảo mật nhiều lớp trong hệ thống SMS: xác thực JWT không trạng thái, phân quyền dựa trên vai trò (RBAC) cho 4 nhóm người dùng, mã hóa mật khẩu bằng BCrypt kết hợp giải pháp phòng thủ không tin cậy client (Client Zero-Trust)."
    ),
    202: (
        "Phần mềm quản lý đào tạo thương mại trọn gói (như UIS, Edusoft): ",
        "Dù sở hữu kho tính năng đồ sộ sau nhiều năm ứng dụng, các sản phẩm đóng gói này đòi hỏi kinh phí đầu tư bản quyền và duy trì hàng năm rất lớn. Bản chất mã nguồn đóng khiến nhà trường hoàn toàn phụ thuộc vào đối tác thứ ba mỗi khi cần tinh chỉnh quy trình đặc thù theo quy chế riêng của Phenikaa. Thêm vào đó, kiến trúc nguyên khối (Monolith) cổ điển của chúng thường bộc lộ yếu điểm hiệu năng nghiêm trọng, dễ gây tê liệt cục bộ mỗi khi sinh viên đồng loạt đăng ký tín chỉ."
    ),
    204: (
        "Hệ thống ERP giáo dục và nền tảng mã nguồn mở (Moodle, Canvas): ",
        "Các giải pháp LMS quốc tế rất xuất sắc trong công tác phân phối học liệu điện tử và quản lý bài kiểm tra trực tuyến, nhưng hoàn toàn không được thiết kế cho nghiệp vụ quản lý đào tạo tín chỉ theo chuẩn quản lý nhà nước của Bộ GD&ĐT Việt Nam. Việc can thiệp chỉnh sửa mã nguồn LMS để giải quyết bài toán tính điểm trung bình tích lũy, quản lý học phí và xét tốt nghiệp đòi hỏi sự can thiệp chắp vá phức tạp, làm suy giảm tính ổn định tổng thể của hệ thống."
    ),
    207: (
        "1) Những chức năng các hệ thống hiện có đã giải quyết tốt: ",
        "Lưu trữ danh bạ hồ sơ sinh viên, quản lý thời khóa biểu giảng dạy cơ bản và hiển thị bảng điểm tĩnh sau khi kết thúc môn học."
    ),
    208: (
        "2) Những hạn chế vẫn còn tồn tại: ",
        "Kinh phí bản quyền phần mềm đắt đỏ, giao diện người dùng kém linh hoạt, và thiếu hụt cơ chế điều phối phân tán để giải quyết dứt điểm hiện tượng nghẽn mạng trong các khung giờ cao điểm đăng ký tín chỉ."
    ),
    209: (
        "3) Các nhu cầu thực tiễn chưa được đáp ứng: ",
        "Duy trì thời gian phản hồi giao dịch dưới 200ms cho hàng nghìn thao tác ghi danh đồng thời, tự động hóa quy trình hậu kiểm bảng điểm, và hỗ trợ kênh khiếu nại điểm thi điện tử minh bạch trong 7 ngày."
    ),
    210: (
        "4) Khoảng trống mà đồ án SMS tập trung giải quyết: ",
        "Đồ án SMS trực tiếp lấp đầy các khoảng trống trên bằng việc kiến tạo một hệ thống web chuẩn Enterprise, tích hợp thuật toán đồ thị DAG kiểm soát tiên quyết, động cơ khóa phân tán Redis chống tranh chấp sĩ số, quy trình thẩm định bảng điểm 3 cấp và bộ thẩm tra tốt nghiệp tự động, kết hợp giao diện React SPA tối tân đạt chuẩn trải nghiệm người dùng cao cấp với mức chi phí bản quyền bằng 0."
    ),
    224: (
        None,
        "Chương 2 - Cơ sở lý thuyết và nền tảng công nghệ: Phân tích sâu sắc học chế tín chỉ theo quy định ĐH Phenikaa, làm rõ nguyên lý kiến trúc RESTful Enterprise, giải pháp an ninh không trạng thái JWT, cơ chế kiểm soát giao dịch CSDL ACID kết hợp khóa phân tán Redis và 8 mẫu thiết kế phần mềm cốt lõi."
    ),
    225: (
        None,
        "Chương 3 - Phân tích và thiết kế hệ thống: Đặc tả chi tiết 23 quy trình nghiệp vụ BPMN, xây dựng 35 quy tắc nghiệp vụ bất biến, thiết kế lược đồ cơ sở dữ liệu quan hệ 39 bảng chuẩn 3NF và mô hình kiến trúc phân tầng xử lý dữ liệu."
    ),
    226: (
        None,
        "Chương 4 - Hiện thực chi tiết các phân hệ nghiệp vụ: Trình bày chi tiết giải thuật kiểm tra tiên quyết bằng đồ thị DAG, thuật toán tính điểm tối ưu Best-Grade theo Thông tư 08, quy trình khóa điểm 3 cấp và động cơ thẩm định điều kiện tốt nghiệp tự động."
    ),
    227: (
        None,
        "Chương 5 - Kiểm thử đa tầng và đánh giá thực nghiệm: Công bố chiến lược kiểm toán chất lượng 8 trụ cột phần mềm với bộ kiểm thử tự động 528 test cases, kết quả đo lường độ bao phủ mã nguồn JaCoCo và chỉ số Web Vitals bằng Chrome DevTools."
    ),
    228: (
        None,
        "Chương 6 - Đóng gói, vận hành và triển khai cụm phân tán: Mô tả giải pháp đóng gói Dockerfile đa tầng, cấu hình cụm cân bằng tải Nginx phân tán (least_conn) và kịch bản vận hành tự động hóa."
    ),
    229: (
        None,
        "Chương 7 & Chương 8: Chương 7 phân tích kỷ luật quản lý dự án độc lập, trách nhiệm bảo mật dữ liệu theo chuẩn đạo đức nghề nghiệp ACM và tác động kinh tế - xã hội; Chương 8 tổng kết các thành quả kỹ thuật của đồ án và định hình lộ trình phát triển tương lai."
    ),
    231: (
        None,
        "Phương pháp luận nghiên cứu của đồ án tuân thủ chặt chẽ cách tiếp cận “Xây dựng và Đánh giá thực nghiệm” (Build-and-Evaluate Methodology): tác giả bắt đầu từ việc điều tra dữ liệu gốc qua khảo sát 60 đối tượng thực tế tại Trường ĐH Phenikaa, mô hình hóa toán học các quy tắc nghiệp vụ, trực tiếp lập trình 100% mã nguồn backend và frontend, sau đó thẩm định chất lượng bằng chiến dịch kiểm thử tự động đa tầng với 528 bài test đạt tỷ lệ vượt qua tuyệt đối 100%."
    ),

    # =========================================================================
    # CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ
    # =========================================================================
    234: (
        None,
        "Nội dung Chương 2 tập trung phân tích tường minh các cơ sở lý luận học vụ và trụ cột công nghệ định hình nên kiến trúc của đồ án SMS. Tác giả khảo cứu chi tiết bản chất của học chế tín chỉ theo các tiêu chuẩn học thuật của Trường Đại học Phenikaa, phân tích kiến trúc phần mềm phân tán Client-Server, cơ chế bảo mật định danh không trạng thái bằng JSON Web Token, giải pháp quản trị giao diện Single Page Application (SPA), nguyên lý giao dịch dữ liệu ACID kết hợp kỹ thuật điều khiển đồng thời phân tán bằng Redis, cùng hệ thống 8 mẫu thiết kế phần mềm doanh nghiệp được vận dụng xuyên suốt mã nguồn."
    ),
    236: (
        None,
        "Căn cứ trực tiếp theo Quy chế đào tạo trình độ đại học của Trường Đại học Phenikaa [21], đơn vị tín chỉ không đơn thuần là đơn vị đo thời gian lên lớp mà là định lượng toàn diện khối lượng lao động học tập của sinh viên (bao gồm 15 tiết giảng dạy lý thuyết, từ 30 đến 45 tiết thực hành, thí nghiệm tại phòng lab hoặc 45 đến 90 giờ thực tập tại doanh nghiệp, kết hợp tối thiểu 30 giờ tự học tự nghiên cứu có hướng dẫn). Việc mô hình hóa chính xác định mức tín chỉ này giúp hệ thống SMS tự động tính toán chính xác học phí theo từng môn học, quy đổi khối lượng giảng dạy của giảng viên và xác định khối lượng tín chỉ tối thiểu/tối đa trong từng học kỳ."
    ),
    237: (
        None,
        "Khác biệt bản chất giữa mô hình đào tạo theo niên chế và học chế tín chỉ nằm ở tính động của thời khóa biểu và quyền tự quyết lộ trình học tập của sinh viên. Nếu niên chế áp đặt thời khóa biểu cố định theo lớp hành chính, thì học chế tín chỉ cho phép người học linh hoạt lựa chọn môn học, học vượt, học cải thiện điểm số và tự cân đối kế hoạch tốt nghiệp sớm. Tính linh hoạt này là lý do cốt lõi buộc tác giả phải thiết kế cơ sở dữ liệu SMS với 39 thực thể quan hệ chặt chẽ nhằm xử lý triệt để bài toán trùng lịch học, trùng lịch thi và vi phạm học phần tiên quyết."
    ),
    239: (
        None,
        "Kiến trúc tổng thể của SMS được tác giả thiết kế theo mô hình Client-Server phân tán hiện đại, tách biệt hoàn toàn giữa Tầng biểu diễn người dùng (Presentation Tier) trên nền React SPA và Tầng xử lý nghiệp vụ cốt lõi (Business Logic Tier) trên Spring Boot REST API. Hai tầng này giao tiếp độc quyền thông qua giao thức chuẩn HTTPS với định dạng dữ liệu JSON gọn nhẹ. Sự phân lập này mang lại tính độc lập tối đa: frontend có thể được cập nhật giao diện, đóng gói CDN hoặc mở rộng sang nền tảng di động mà không cần tái cấu trúc backend; ngược lại backend có thể triển khai cụm cân bằng tải (load balancing) phân tán phía sau Nginx một cách hoàn toàn trong suốt đối với người dùng cuối."
    ),
    241: (
        None,
        "Tầng backend của hệ thống SMS được tác giả hiện thực hóa dựa trên Spring Boot framework [9] phiên bản 3.5.6 vận hành trên nền tảng Java 23 mới nhất. Việc lựa chọn nền tảng này cho phép hệ thống khai thác tối đa sức mạnh của máy chủ Tomcat nhúng tối ưu hóa, cơ chế quản lý vòng đời Bean tự động và hệ sinh thái thư viện Enterprise toàn diện. Kiến trúc mã nguồn backend được phân tách nghiêm ngặt thành 3 tầng: Controller (tiếp nhận HTTP Request, thẩm định định dạng DTO qua Bean Validation), Service (thực thi toàn bộ quy tắc nghiệp vụ, giải thuật DAG và quản lý transaction), và Repository (kết nối CSDL qua Spring Data JPA và Hibernate)."
    ),
    242: (
        None,
        "Trong thiết kế mã nguồn của SMS, tác giả triệt để tuân thủ nguyên lý Đảo ngược điều khiển (IoC) và Tiêm phụ thuộc (Dependency Injection) thông qua cơ chế Constructor Injection chuẩn mực. Mọi sự phụ thuộc giữa các tầng dịch vụ (ví dụ giữa CourseSectionController, CourseSectionService và CourseSectionRepository) đều được trừu tượng hóa qua các Interface rõ ràng. Giải pháp này triệt tiêu hoàn toàn sự phụ thuộc cứng (tight coupling), tạo điều kiện cho tác giả cô lập từng thành phần và xây dựng 297 bài kiểm thử đơn vị backend sử dụng thư viện Mockito với độ tin cậy tuyệt đối."
    ),
    244: (
        None,
        "Hệ thống xác thực và cấp quyền của SMS được triển khai dựa trên tiêu chuẩn bảo mật RFC 7519 với định dạng JSON Web Token (JWT) [7]. Thay vì lưu trữ trạng thái phiên làm việc (Session) trong bộ nhớ RAM của máy chủ - một phương pháp bộc lộ nhược điểm thắt cổ chai khi mở rộng hệ thống sang nhiều cụm máy chủ, SMS áp dụng hoàn toàn kiến trúc không trạng thái (Stateless Architecture). Mỗi mã thông báo JWT chứa thông tin định danh sinh viên/cán bộ, danh sách vai trò (ROLE_ADMIN, ROLE_STUDENT, ROLE_LECTURER,...) và thời hạn hết hạn (TTL), được ký điện tử bảo mật bằng thuật toán HMAC-SHA512 với khóa bí mật dài 256-bit."
    ),
    245: (
        None,
        "Cơ chế bảo mật của SMS phân định rành mạch hai công đoạn an ninh: Xác thực (Authentication) do JwtAuthenticationFilter đảm nhiệm bằng cách trích xuất Bearer Token từ HTTP Authorization Header trên mỗi lượt truy vấn; và Phân quyền (Authorization) do Spring Security Filter Chain kiểm soát thông qua các annotation bảo vệ phương thức như @PreAuthorize(\"hasRole('ADMIN')\"). Mô hình này ngăn chặn triệt để các hành vi leo thang đặc quyền (Privilege Escalation), bảo đảm sinh viên chỉ có thể xem dữ liệu học tập cá nhân và không thể truy cập các API học vụ của giảng viên hoặc quản trị viên."
    ),
    246: (
        None,
        "Đối với dữ liệu mật khẩu người dùng, hệ thống SMS tuân thủ tiêu chuẩn an toàn mật mã của NIST bằng cách áp dụng thuật toán băm chậm BCrypt với hệ số độ dài muối (salt work factor) là 10. Mật khẩu không bao giờ được lưu trữ dưới dạng văn bản rõ (plaintext). Kỹ thuật này sinh ra một chuỗi băm 60 ký tự kết hợp ngẫu nhiên muối cho mỗi người dùng, vô hiệu hóa hoàn toàn các hình thức tấn công dò mật khẩu bằng bảng tra cứu trước (Rainbow Table) và tấn công vét cạn (Brute-force) ngay cả trong tình huống cơ sở dữ liệu bị trích xuất trái phép."
    ),
    248: (
        None,
        "Tầng giao diện người dùng (Frontend) được tác giả xây dựng dưới dạng Single Page Application (SPA) trên nền tảng React 19 và công cụ đóng gói siêu tốc Vite 8 [8]. Cơ chế Virtual DOM của React kết hợp với kiến trúc thành phần hóa (Component-Based Architecture) giúp giao diện SMS cập nhật các phần tử thay đổi trên màn hình với độ trễ tính bằng mili-giây mà không cần tải lại toàn bộ trang web. Ứng dụng tích hợp React Router DOM v6 để quản lý điều hướng phía client với các bộ định tuyến bảo vệ (Protected Routes) ngăn chặn truy cập trái phép."
    ),
    249: (
        "Hệ thống thiết kế (Design System) và biến màu CSS (Design Tokens): ",
        "SMS triển khai một Design System nhất quán dựa trên kiến trúc Design Tokens 3 tầng trong Tailwind CSS. Toàn bộ bảng màu chức năng, độ cong viền (border-radius) và khoảng cách bố cục đều được tham chiếu qua các biến CSS trừu tượng, tạo sự hài hòa thẩm mỹ tối đa giữa 4 phân hệ phần mềm và hỗ trợ khả năng thay đổi chủ đề giao diện một cách đồng bộ."
    ),
    250: (
        "Quản trị giao diện hai chế độ (Dual-Theme Store) và chống chớp màn hình (FOUC): ",
        "Trong hệ thống SMS, tác giả xây dựng bộ quản lý trạng thái theme-store.js kết hợp script tiền xử lý trong index.html. Hệ thống tự động phát hiện tùy chọn giao diện của hệ điều hành người dùng và nạp bảng màu tương ứng trước khi cây DOM hoàn tất render, triệt tiêu hoàn toàn hiện tượng chớp nháy màu trắng (Flash of Unstyled Content - FOUC) khi truy cập vào ban đêm."
    ),
    251: (
        "Trải nghiệm tải và khung bảo vệ lỗi giao diện (Skeleton Shimmer & Error Boundary): ",
        "Thay vì sử dụng biểu tượng xoay vòng (spinner) đơn điệu, SMS áp dụng kỹ thuật Skeleton Shimmer mô phỏng trực quan khung lưới dữ liệu trong khi chờ backend phản hồi API. Đồng thời, toàn bộ các trang giao diện đều được bọc trong ErrorBoundary.jsx giúp cô lập lỗi JavaScript cục bộ và ngăn chặn sự cố sập toàn bộ ứng dụng web."
    ),
    253: (
        None,
        "Tầng lưu trữ dữ liệu của SMS được xây dựng trên hệ quản trị cơ sở dữ liệu quan hệ MySQL 8.0 với công nghệ lưu trữ InnoDB [11]. InnoDB cung cấp sự hỗ trợ toàn diện cho các ràng buộc toàn vẹn khóa ngoại, cấu trúc bảng chỉ mục B-Tree tốc độ cao và bảo đảm tuyệt đối 4 đặc tính ACID (Atomicity, Consistency, Isolation, Durability) - yếu tố sống còn đối với các giao dịch tài chính học phí và ghi nhận bảng điểm sinh viên."
    ),
    255: (
        None,
        "Trong nghiệp vụ đăng ký tín chỉ và chấm điểm, tính toàn vẹn của dữ liệu đòi hỏi các tác vụ phải được thực thi dưới dạng một giao dịch nguyên tử (Atomic Transaction). Tác giả áp dụng annotation @Transactional(isolation = Isolation.READ_COMMITTED) tại các phương thức nghiệp vụ trong EnrollmentService và GradeService, bảo đảm rằng nếu có bất kỳ ngoại lệ nào phát sinh trong chuỗi xử lý (ví dụ: trừ sĩ số thành công nhưng ghi nhận lịch sử thất bại), toàn bộ thao tác sẽ được hoàn nguyên (Rollback) ngay lập tức về trạng thái an toàn ban đầu."
    ),
    256: (
        None,
        "Tuy nhiên, trong bài toán đăng ký học phần của hệ thống SMS, nếu chỉ dựa vào cấp độ cô lập mặc định của CSDL MySQL thì không thể triệt tiêu hoàn toàn rủi ro xung đột khi có hàng trăm kết nối đồng thời cùng ghi danh vào một suất học cuối cùng. Hiện tượng đọc bóng ma (Phantom Read) và cập nhật mất mát (Lost Update) đòi hỏi hệ thống phần mềm phải tích hợp thêm cơ chế điều khiển đồng thời ở cấp độ ứng dụng nhằm bảo đảm an toàn dữ liệu tuyệt đối."
    ),
    257: (
        None,
        "Để bảo vệ tài nguyên học vụ nhạy cảm trong hệ thống SMS Phenikaa, tác giả đã tiến hành đối chiếu hai giải pháp khóa CSDL kinh điển: Khóa lạc quan (Optimistic Locking sử dụng trường phiên bản @Version) và Khóa bi quan (Pessimistic Locking sử dụng cú pháp SELECT ... FOR UPDATE thông qua @Lock(LockModeType.PESSIMISTIC_WRITE)). Khóa lạc quan thích hợp cho các thực thể có tần suất sửa đổi thấp như hồ sơ sinh viên, trong khi Khóa bi quan kết hợp bộ đệm khóa phân tán Redis là lựa chọn bắt buộc cho tác vụ trừ sĩ số lớp học phần nhằm ngăn chặn triệt để hiện tượng vượt quá sĩ số tối đa."
    ),
    259: (
        None,
        "Quyết định kiến trúc của đồ án SMS là sự dung hòa tối ưu giữa tốc độ đáp ứng và tính toàn vẹn dữ liệu. Bằng việc kết hợp khóa bi quan tại tầng CSDL cho các giao dịch chốt điểm cuối cùng, và cơ chế trừ slot nguyên tử bằng Redis Lua Script tại tầng trung gian cho các giao dịch đăng ký học phần, hệ thống đạt được thông lượng xử lý vượt trội mà vẫn cam kết tính toàn vẹn dữ liệu ở mức độ cao nhất."
    ),
    261: (
        None,
        "Bên cạnh việc kế thừa các công nghệ tiên tiến, đồ án SMS đặc biệt chú trọng việc chuẩn hóa mã nguồn theo các mẫu thiết kế phần mềm kinh điển của Gang of Four (GoF) và Martin Fowler [6]. Dưới đây là 8 mẫu thiết kế cốt lõi được tác giả trực tiếp lập trình trong hệ thống:"
    ),
    262: (
        "Kiến trúc đa tầng phân định trách nhiệm (Layered Architecture): ",
        "Mã nguồn backend của SMS phân chia ranh giới rõ ràng thành 3 tầng: Controller (tiếp nhận HTTP Request), Service (chứa toàn bộ nghiệp vụ và thuật toán DAG/Best-Grade), và Repository (truy vấn CSDL). Mô hình này bảo đảm nguyên lý Trách nhiệm duy nhất (Single Responsibility Principle) và giúp mã nguồn dễ bảo trì, mở rộng."
    ),
    263: (
        "Đảo ngược điều khiển và Tiêm phụ thuộc (IoC / Dependency Injection): ",
        "Trong kiến trúc backend của hệ thống SMS, tác giả triệt để sử dụng Constructor Injection kết hợp Lombok @RequiredArgsConstructor để tiêm các Repository vào Service và Service vào Controller. Cơ chế này loại bỏ hoàn toàn các phụ thuộc tĩnh (static dependencies), cho phép viết các bài kiểm thử giả lập (mocking tests) bằng Mockito độc lập và nhanh chóng."
    ),
    264: (
        "Mẫu kho lưu trữ dữ liệu (Repository Pattern): ",
        "Hệ thống SMS khai thác Spring Data JPA để tạo các giao diện Repository sạch sẽ, che giấu toàn bộ các câu lệnh SQL/HQL phức tạp bên dưới. Tầng Service chỉ tương tác qua các hợp đồng hàm nghiệp vụ, giúp mã nguồn ứng dụng hoàn toàn không bị phụ thuộc vào cú pháp cụ thể của hệ quản trị CSDL."
    ),
    265: (
        "Đối tượng vận chuyển dữ liệu (DTO) kết hợp Mapper: ",
        "Trong hệ thống SMS, dữ liệu gửi nhận qua mạng được đóng gói riêng biệt qua các lớp DTO (như EnrollmentRequestDTO, GradeAppealDTO) và chuyển đổi qua Mapper. Giải pháp này ngăn ngừa triệt để lỗ hổng Over-posting (người dùng tự ý chèn thêm trường dữ liệu bị cấm) và không làm lộ cấu trúc thực thể CSDL nội bộ."
    ),
    266: (
        "Mẫu chuỗi trách nhiệm (Chain of Responsibility Pattern): ",
        "Được hiện thực hóa trong JwtAuthenticationFilter của Spring Security và chuỗi thẩm định 5 bước đăng ký học phần tại EnrollmentValidatorChain thuộc hệ thống SMS. Yêu cầu của người học phải vượt qua tuần tự từng bước kiểm tra (hạn mức tín chỉ -> điều kiện tiên quyết -> trùng lịch -> công nợ -> sĩ số) trước khi được ghi nhận."
    ),
    267: (
        "Xử lý ngoại lệ tập trung (Centralized Global Exception Handling): ",
        "Toàn bộ lỗi nghiệp vụ và lỗi hệ thống được quy tụ và xử lý tập trung tại lớp GlobalExceptionHandler của đồ án SMS sử dụng annotation @RestControllerAdvice. Hệ thống tự động chuẩn hóa mọi phản hồi lỗi thành một phong bì ApiResponse<T> thống nhất, che giấu stack trace nội bộ để bảo đảm an toàn thông tin."
    ),
    268: (
        "Mô hình máy trạng thái hữu hạn (State Machine Pattern): ",
        "Vòng đời của các thực thể học vụ trọng yếu trong hệ thống SMS được kiểm soát nghiêm ngặt qua các kiểu dữ liệu liệt kê Enum: SectionStatus (DRAFT -> OPEN -> CLOSED), GradeStatus (DRAFT -> SUBMITTED -> LOCKED), và AppealStatus (PENDING -> APPROVED -> REJECTED), bảo đảm dữ liệu chuyển trạng thái tuần tự và không thể bị sửa đổi bất hợp lệ."
    ),
    269: (
        "Nguyên tắc phòng thủ chiều sâu và Không tin tưởng phía Client (Client Zero-Trust): ",
        "Hệ thống SMS coi mọi dữ liệu từ trình duyệt gửi lên đều tiềm ẩn nguy cơ bị can thiệp. Toàn bộ các quy tắc thẩm định nghiệp vụ (kiểm tra tiên quyết, kiểm tra sĩ số, xác thực quyền hạn) đều được tái thực thi nghiêm ngặt tại tầng backend Spring Boot trước khi ghi nhận vào CSDL."
    ),
    271: (
        None,
        "Để giải quyết triệt để bài toán tranh chấp tài nguyên và giảm tải cho hệ quản trị cơ sở dữ liệu MySQL khi hàng nghìn sinh viên đăng ký học phần cùng một giây trong hệ thống SMS, tác giả đã thiết kế tầng nhớ đệm phân tán Redis Cache kết hợp các giải pháp tối ưu hóa dữ liệu trong bộ nhớ RAM."
    ),
    272: (
        "Cơ chế trừ slot nguyên tử bằng Redis Lua Script (Atomic Decrement): ",
        "Thay vì thực thi các truy vấn SQL nặng nề để kiểm tra và trừ sĩ số trong MySQL, hệ thống SMS tải sĩ số khả dụng của lớp học phần vào bộ nhớ Redis. Khi sinh viên đăng ký, một kịch bản Lua Script thực thi phép trừ nguyên tử (DECR) và thẩm định điều kiện chỉ trong 1 chu kỳ CPU, loại bỏ 100% rủi ro vượt sĩ số trước khi ghi dữ liệu bền vững xuống đĩa cứng."
    ),
    273: (
        "Khóa phân tán người dùng (User Action Idempotency Lock): ",
        "Để ngăn chặn hiện tượng sinh viên nhấn liên tục nút đăng ký hoặc sử dụng các công cụ auto-click gửi hàng chục yêu cầu trong 1 giây, hệ thống SMS áp dụng khóa phân tán RedisLock với lệnh SETNX (SET if Not Exists) và thời gian sống ngắn (TTL 3 giây). Mọi yêu cầu trùng lặp gửi đến trong thời gian khóa lập tức bị từ chối với mã lỗi 429 Too Many Requests."
    ),
    275: (
        None,
        "Nhằm đáp ứng yêu cầu phi chức năng về tính sẵn sàng cao (High Availability) và khả năng chịu tải quy mô lớn, tác giả đã thiết lập cụm cân bằng tải Nginx làm cổng tiếp nhận lưu lượng mạng ở lớp ngoài cùng của hệ sinh thái SMS."
    ),
    276: (
        "Thuật toán cân bằng tải Least-Connected (least_conn): ",
        "Trong tệp cấu hình frontend/nginx.cluster.conf của hệ thống SMS, Nginx điều phối lưu lượng truy cập tới cụm 3 phiên bản Spring Boot chạy song song thông qua thuật toán least_conn. Khác với thuật toán Round-Robin phân bổ cơ học, least_conn ưu tiên chuyển tiếp HTTP request đến máy chủ backend hiện đang có số lượng kết nối tích cực ít nhất, triệt tiêu hoàn toàn hiện tượng thắt cổ chai tại các máy chủ đang xử lý giao dịch nặng."
    ),
    277: (
        "Cơ chế tự phục hồi và loại trừ nút lỗi (Healthcheck & Failover): ",
        "Trong cụm máy chủ hệ thống SMS, Nginx được tác giả cấu hình tham số max_fails=5 và fail_timeout=5s kết hợp chỉ thị proxy_next_upstream xử lý các mã lỗi 502, 503, 504. Khi một nút backend gặp sự cố quá tải, Nginx tự động chuyển hướng yêu cầu sang các nút dự phòng trong vòng 5 giây mà không làm gián đoạn trải nghiệm của sinh viên."
    ),
    278: (
        "Tách biệt luồng nghiệp vụ giao diện và Cổng API kiểm thử: ",
        "Cấu hình Nginx trong hệ thống SMS phân lập rạch ròi hai cổng mạng: Cổng 80 phục vụ ứng dụng React SPA với cơ chế nén Gzip tối ưu và bộ đệm tài nguyên tĩnh; Cổng 8080 đóng vai trò cổng Gateway chuyên dụng phục vụ các kịch bản kiểm thử tải cao (Stress Testing), vô hiệu hóa bộ đệm trung gian để đo đạc độ trễ mạng thực tế một cách chuẩn xác nhất."
    ),
    280: (
        None,
        "Một thành tựu thiết kế nổi bật khác của đồ án là việc xây dựng giao diện người dùng đạt chuẩn thẩm mỹ cao cấp (Modern Aesthetic Standards). Tác giả đã tích hợp các nguyên lý công nghệ giao diện tiên tiến nhằm mang lại cảm giác phản hồi nhanh nhạy và hiện đại:"
    ),
    281: (
        "Hệ thống Design Tokens 3 tầng: ",
        "Định nghĩa tập trung trong cấu hình Tailwind CSS của hệ thống SMS, cho phép quản lý thống nhất các biến màu thương hiệu Phenikaa, độ đổ bóng (shadows) và bán kính bo góc (radii) xuyên suốt toàn bộ các màn hình chức năng."
    ),
    282: (
        "Kỹ thuật Kính mờ đa lớp (Frosted Glass Elevation): ",
        "Trong giao diện người dùng hệ thống SMS, tác giả áp dụng thuộc tính CSS backdrop-filter: blur(16px) kết hợp màu nền bán trong suốt và đường viền siêu mảnh, tạo nên chiều sâu không gian đa tầng sang trọng và giúp mắt người dùng tập trung vào khu vực thao tác chính."
    ),
    283: (
        "Chế độ hiển thị kép Sáng / Tối (Slate Dark Mode): ",
        "Hệ thống SMS hỗ trợ chuyển đổi liền mạch giữa giao diện Sáng tiêu chuẩn và chế độ Slate Dark Mode (tông màu than chì dịu mắt #0B1120), bảo vệ thị lực cho sinh viên và giảng viên khi sử dụng vào ban đêm."
    ),
    284: (
        "Vi tương tác và chuyển động mượt mà (Micro-interactions): ",
        "Trong hệ thống SMS, mọi nút bấm, hàng dữ liệu trong bảng điểm và cửa sổ pop-up modal đều được gắn hiệu ứng chuyển động mượt mà (scale 1.02), đổ bóng glow tinh tế và thanh hiển thị nạp dữ liệu Shimmer Skeleton mang lại trải nghiệm tương tác liền mạch."
    ),

    # =========================================================================
    # CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
    # =========================================================================
    290: (
        None,
        "Dưới đây là danh mục 24 Use Case cốt lõi được tác giả mô hình hóa dựa trên các yêu cầu chức năng (FR) của Trường ĐH Phenikaa, chia đều cho 4 nhóm tác nhân: Quản trị viên hệ thống, Sinh viên, Giảng viên và Cán bộ quản lý đào tạo:"
    ),
    297: (
        None,
        "Hệ thống SMS được tác giả thiết kế và đo lường chất lượng dựa trên bộ tiêu chuẩn công nghệ phần mềm quốc tế ISO/IEC 25010 với 5 trục tiêu chí phi chức năng nghiêm ngặt:"
    ),
    298: (
        "1. Hiệu năng & Khả năng chịu tải (Performance & Scalability): ",
        "Độ trễ trung bình của các giao dịch tra cứu dữ liệu đạt dưới 100ms; các giao dịch ghi danh học phần phức tạp đạt dưới 200ms; hệ thống duy trì độ ổn định liên tục khi chịu tải đồng thời từ cụm máy chủ Nginx phân tán."
    ),
    299: (
        "2. An toàn & Bảo mật thông tin (Security & Safety): ",
        "Xác thực không trạng thái qua chuỗi JWT mã hóa HS512; mật khẩu người dùng băm an toàn qua thuật toán BCrypt muối 10 lớp; phân quyền RBAC chi tiết đến từng API Endpoint và phòng chống 100% các lỗ hổng SQL Injection, XSS và CSRF."
    ),
    300: (
        "3. Độ tin cậy & Toàn vẹn dữ liệu (Reliability & Data Integrity): ",
        "Tất cả các nghiệp vụ tài chính và học vụ đều thực thi dưới sự bảo vệ của ACID Transactions; sử dụng khóa bi quan và khóa phân tán Redis để bảo đảm không xảy ra tranh chấp dữ liệu; tỷ lệ dữ liệu toàn vẹn đạt 100%."
    ),
    301: (
        "4. Tính khả dụng & Trải nghiệm người dùng (Usability & UX): ",
        "Giao diện người dùng thuần Việt 100% theo phong cách thiết kế hiện đại; hỗ trợ đầy đủ chế độ Slate Dark Mode; tích hợp phím tắt nhanh và hiển thị trạng thái tải mượt mà qua Skeleton Shimmer."
    ),
    302: (
        "5. Khả năng bảo trì & Vận hành (Maintainability & Operations): ",
        "Kiến trúc mã nguồn phân tầng rõ ràng theo chuẩn Enterprise; đóng gói hoàn chỉnh qua Docker Compose đa tầng; sẵn sàng triển khai trên hạ tầng đám mây chỉ bằng một dòng lệnh duy nhất."
    ),
    308: (
        "Giả định về đồng bộ thời gian máy chủ (NTP Synchronization): ",
        "Máy chủ chứa mã nguồn backend Spring Boot và cơ sở dữ liệu MySQL đều được đồng bộ hóa thời gian chính xác qua giao thức NTP, bảo đảm tính công bằng tuyệt đối khi xác định thời điểm mở/đóng cổng đăng ký tín chỉ và tính hạn nộp đơn phúc khảo điểm thi."
    ),
    309: (
        "Giả định về tính toàn vẹn của danh mục đầu vào: ",
        "Khung chương trình đào tạo, danh mục khoa, ngành, danh mục môn học và điều kiện tiên quyết được Phòng Đào tạo thẩm định và nhập liệu chuẩn xác vào cơ sở dữ liệu trước khi sinh viên bắt đầu đăng ký học phần."
    ),
    310: (
        "Giả định về hạ tầng mạng và trình duyệt: ",
        "Môi trường triển khai hỗ trợ giao thức bảo mật HTTPS với chứng chỉ SSL/TLS hợp lệ; trình duyệt của người dùng cuối hỗ trợ chuẩn ECMAScript 6 trở lên (Google Chrome, Microsoft Edge, Mozilla Firefox hoặc Safari hiện đại)."
    ),
    312: (
        None,
        "Hệ thống SMS được tác giả xây dựng hoàn toàn trên hệ sinh thái công nghệ mã nguồn mở (Open-source Stack) hàng đầu thế giới, hoàn toàn miễn phí bản quyền phần mềm, giúp nhà trường tiết kiệm hàng tỷ đồng kinh phí đầu tư ban đầu so với việc mua sắm các phần mềm đóng gói thương mại."
    ),
    320: (
        "Tính khả thi kinh tế: ",
        "Toàn bộ nền tảng công nghệ (Java, Spring Boot, React, MySQL, Docker, Nginx, Redis) đều là mã nguồn mở miễn phí; giải pháp có thể vận hành ổn định trên các máy chủ đám mây cấu hình khiêm tốn hoặc hạ tầng máy chủ sẵn có của Trường ĐH Phenikaa."
    ),
    321: (
        "Tính khả thi pháp lý và bảo vệ quyền riêng tư: ",
        "Dữ liệu hồ sơ và điểm số của sinh viên được quản lý bảo mật nghiêm ngặt theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân; thông tin điểm thi được rọc phách bảo mật và phân quyền truy cập chặt chẽ."
    ),
    323: (
        "Trách nhiệm giải trình và nhật ký kiểm toán (Audit Trail): ",
        "Mọi thao tác thay đổi dữ liệu học vụ nhạy cảm - như mở khóa sổ điểm, điều chỉnh điểm sau phúc khảo, cưỡng chế chuyển lớp học phần - đều được hệ thống tự động ghi nhật ký (Audit Log) lưu vết định danh người thực hiện, địa chỉ IP và dấu thời gian."
    ),
    326: (
        None,
        "Phần này trình bày chi tiết các mô hình phân tích và thiết kế phần mềm của hệ thống SMS theo tiến trình Rational Unified Process (RUP) rút gọn, làm sáng tỏ toàn bộ cấu trúc dữ liệu và luồng nghiệp vụ:"
    ),
    372: (
        "1. Mô hình phân tầng xử lý 3 tầng (3-Tier Layered Architecture Pipeline): ",
        "Luồng dữ liệu trong SMS di chuyển theo một chiều nghiêm ngặt: React Client -> Nginx Gateway -> Spring Boot Controller -> Service Layer -> JPA Repository -> MySQL Database. Sự phân tách này triệt tiêu hoàn toàn sự phụ thuộc chéo và cô lập hoàn hảo các lỗi kỹ thuật."
    ),
    373: (
        "2. Luồng xác thực & bảo vệ phiên đa lớp (Security & Interceptor Pipeline): ",
        "Tại phía client, thư viện axios tự động chèn JWT Bearer Token vào tiêu đề HTTP request. Tại phía server, JwtAuthenticationFilter kiểm tra tính hợp lệ của token và nạp quyền hạn người dùng vào SecurityContextHolder trước khi chuyển tiếp sang tầng Controller."
    ),
    375: (
        "4. Luồng quản lý bộ nhớ đệm (Caching Pipeline with @Cacheable / @CacheEvict): ",
        "Để tối ưu hóa tốc độ phản hồi cho các danh mục dữ liệu tĩnh có tần suất đọc lớn nhưng ít biến đổi (như danh sách Khoa, Ngành, Khung chương trình đào tạo), SMS áp dụng cơ chế bộ đệm Redis qua annotation @Cacheable, tự động làm sạch bộ đệm bằng @CacheEvict mỗi khi có thao tác cập nhật."
    ),
    376: (
        "5. Luồng xử lý ngoại lệ tập trung (Unified Global Exception Handling): ",
        "Hệ thống triển khai GlobalExceptionHandler sử dụng @RestControllerAdvice để đón bắt toàn bộ các ngoại lệ phát sinh. Mọi lỗi nghiệp vụ đều được chuẩn hóa thành phong bì ApiResponse<T> với mã lỗi chi tiết và thông điệp giải thích rõ ràng."
    ),

    # =========================================================================
    # CHƯƠNG 4: HIỆN THỰC CHI TIẾT CÁC PHÂN HỆ NGHIỆP VỤ
    # =========================================================================
    1113: (
        None,
        "Chương 4 đi sâu vào cấu trúc thuật toán và logic cài đặt của từng phân hệ nghiệp vụ cụ thể trong SMS, bám sát các luồng xử lý thực tế trong mã nguồn backend Java 23 và frontend React 19 do tác giả trực tiếp lập trình:"
    ),
    1115: (
        None,
        "AuthService đảm nhiệm toàn bộ quy trình xác thực, đổi mật khẩu và quản lý vòng đời JWT. Khi người dùng thực hiện đăng nhập qua API POST /api/auth/login, hệ thống đối soát thông tin qua AuthenticationManager, kiểm tra cờ bắt buộc đổi mật khẩu (must_change_password) và cấp phát Access Token có chữ ký số HMAC-SHA512 an toàn."
    ),
    1146: (
        None,
        "Từ điểm tổng kết môn học (thang 10), hệ thống SMS tự động quy đổi sang điểm chữ và điểm thang 4 theo bảng chuẩn của Thông tư 08/2021/TT-BGDĐT. Quy tắc “điểm liệt” được cài đặt nghiêm ngặt: nếu điểm thi kết thúc học phần đạt dưới 4.0 điểm (hệ 10), sinh viên lập tức bị xếp điểm F (0.0 hệ 4) bất kể điểm quá trình cao đến mức nào."
    ),
    1156: (
        None,
        "Lớp TranscriptService đảm nhiệm công tác tổng hợp kết quả học tập và tự động kích hoạt logic cảnh báo học vụ. Điểm trung bình chung học kỳ (GPA) được tính bằng trung bình có trọng số theo số tín chỉ của tất cả các môn đăng ký trong kỳ; trong khi điểm trung bình tích lũy (CPA) áp dụng thuật toán Best-Grade, tự động chỉ chọn lấy điểm số cao nhất của các môn học lại."
    ),
    1190: (
        None,
        "Bộ lập lịch tác vụ tự động AcademicScheduler là một tiến trình chạy ngầm (cron job \"0 0 1 * * ?\" - thực thi lúc 1 giờ sáng hàng ngày) có nhiệm vụ quét và tự động khóa các sổ điểm thi đã hết hạn 7 ngày sau khi giảng viên công bố, đồng thời gửi cảnh báo học vụ đến các sinh viên có GPA dưới 1.0."
    ),
    1192: (
        None,
        "Phân hệ nhập xuất dữ liệu sử dụng thư viện Apache POI [15] để xử lý hai luồng công việc thường nhật của phòng đào tạo: (1) Nhập danh sách sinh viên đầu khóa từ file Excel mẫu; và (2) Kết xuất bảng điểm cá nhân, danh sách phòng thi rọc phách bảo mật ra tệp định dạng .xlsx chuẩn Enterprise."
    ),
    1194: (
        None,
        "Lớp GlobalExceptionHandler bắt mọi ngoại lệ phát sinh trong quá trình thực thi và ánh xạ sang mã HTTP Response phù hợp (400 Bad Request, 403 Forbidden, 404 Not Found, 409 Conflict hoặc 500 Internal Error), bảo đảm rằng client luôn nhận được phản hồi định dạng JSON có cấu trúc chuẩn ApiResponse."
    ),

    # =========================================================================
    # CHƯƠNG 5: KIỂM THỬ ĐA TẦNG VÀ ĐÁNH GIÁ THỰC NGHIỆM
    # =========================================================================
    1243: (
        None,
        "Hệ thống SMS được tác giả kiểm thử toàn diện theo mô hình Hình chóp kiểm thử (Test Pyramid) với 4 tầng bổ trợ chặt chẽ cho nhau: (1) Kiểm thử đơn vị (Unit Tests) tầng Service ở backend - chiếm số lượng nhiều nhất và tốc độ nhanh nhất; (2) Kiểm thử tích hợp (Integration Tests) tầng Controller và CSDL MySQL; (3) Kiểm thử giao diện frontend bằng Vitest và jsdom; và (4) Kiểm thử toàn diện hệ thống End-to-End (E2E) và tải cao bằng các bộ kịch bản tự động."
    ),
    1244: (
        None,
        "Chiến dịch kiểm toán chất lượng toàn diện 8 trụ cột phần mềm (8-Pillar QA Audit Campaign) được tác giả thực hiện độc lập, bao quát mọi khía cạnh: Đúng đắn nghiệp vụ, Tính toàn vẹn CSDL, Độ an toàn thông tin, Khả năng chịu tải đồng thời, Tính thân thiện giao diện, Độ bao phủ mã nguồn JaCoCo, Tuân thủ quy chế giáo dục và Khả năng vận hành liên tục."
    ),
    1247: (
        None,
        "Bộ kiểm thử tự động backend gồm 43 lớp kiểm thử với 297 phương thức @Test (khoảng 7.200 dòng mã kiểm thử) vận hành trên nền JUnit 5 và Mockito. Toàn bộ các quy tắc nghiệp vụ nhạy cảm như tính GPA/CPA, kiểm tra tiên quyết DAG, khóa sổ điểm 3 cấp và trừ sĩ số đồng thời đều được kiểm chứng với 100% kết quả PASS."
    ),
    1249: (
        None,
        "Hạ tầng build của dự án được cấu hình hỗ trợ Mockito giả lập các lớp cụ thể thông qua byte-buddy-agent và cờ EnableDynamicAgentLoading trong Maven Surefire Plugin, bảo đảm quá trình thực thi kiểm thử diễn ra trơn tru trên nền máy ảo Java 23 mà không xuất hiện bất kỳ cảnh báo JVM nào."
    ),
    1251: (
        None,
        "Phía frontend, tác giả sử dụng thư viện kiểm thử hiện đại Vitest vận hành trong môi trường giả lập jsdom với 21 tệp kiểm thử và 105 test cases. Các bài kiểm thử bao phủ toàn bộ logic hiển thị của các thành phần giao diện quan trọng: cơ chế bảo vệ ProtectedRoute, định dạng bảng điểm, giao diện đăng ký môn học và bảng điều khiển của giảng viên."
    ),
    1254: (
        None,
        "Thư mục tests ở thư mục gốc của dự án chứa các trình kiểm thử hệ thống tự động được tác giả viết bằng Node.js thuần túy, cho phép thực thi độc lập và kiểm tra trực tiếp các API đang chạy thực tế trên máy chủ."
    ),
    1255: (
        None,
        "Tệp kịch bản comprehensive_system_test.js gồm 56 ca kiểm thử bao phủ các nhóm an ninh chuyên sâu: kiểm tra lỗ hổng SQL Injection trên các trường tìm kiếm, thử nghiệm tấn công Cross-Site Scripting (XSS), thẩm tra cơ chế xác thực JWT, và kiểm tra quyền hạn RBAC giữa 4 vai trò người dùng."
    ),
    1256: (
        None,
        "Tệp kịch bản system_e2e_test.js gồm 46 ca kiểm thử đóng vai trò mô phỏng toàn bộ hành trình trải nghiệm của người dùng cuối: từ đăng nhập, đổi mật khẩu lần đầu, tìm kiếm lớp học phần, đăng ký tín chỉ, nộp học phí, xem thời khóa biểu cho đến khiếu nại điểm thi."
    ),
    1257: (
        None,
        "Kiểm thử tích hợp trình duyệt và thẩm định hiệu năng Web Vitals được thực thi qua tệp full_browser_devtools_audit.js kết hợp trình duyệt Chrome Headless, tự động đo đạc các chỉ số LCP, CLS, FID và kiểm toán khả năng truy cập theo tiêu chuẩn WCAG 2.1."
    ),
    1258: (
        None,
        "Tất cả các bộ kiểm thử trên được tác giả tích hợp tập trung vào tệp kịch bản khởi chạy tự động run_tests.bat, có chức năng tự động kiểm tra trạng thái hoạt động của cổng 8080 trước khi kích hoạt quy trình kiểm thử và tự động kết xuất báo cáo tổng hợp."
    ),

    # =========================================================================
    # CHƯƠNG 6: ĐÓNG GÓI, VẬN HÀNH VÀ TRIỂN KHAI CỤM PHÂN TÁN
    # =========================================================================
    1415: (
        None,
        "Cả hai phân hệ backend và frontend của SMS đều được tác giả đóng gói bằng giải pháp Dockerfile đa tầng (multi-stage build) nhằm tạo ra các hình ảnh container (container images) có kích thước siêu gọn nhẹ và mức độ an toàn cao nhất. Đối với backend, tầng builder sử dụng eclipse-temurin:23-jdk-alpine để biên dịch mã nguồn và đóng gói tệp .jar; tầng runtime cuối cùng chỉ sử dụng eclipse-temurin:23-jre-alpine tối giản (giảm 65% dung lượng ảnh và loại bỏ hoàn toàn các công cụ phát triển thừa). Đối với frontend, tầng builder dùng node:20-alpine để đóng gói bản tĩnh Vite (npm run build), sau đó tầng runtime sử dụng nginx:alpine để phục vụ các tệp giao diện tĩnh với hiệu năng cao."
    ),
    1417: (
        None,
        "Trong hệ thống SMS, tệp kịch bản docker-compose.yml khai báo điều phối hoàn chỉnh 3 dịch vụ container độc lập (MySQL 8.0, Backend Spring Boot, Frontend React Nginx) kết hợp ổ đĩa lưu trữ bền vững (db_data volume), tự động cấu hình mạng cầu nối riêng (bridge network) giúp các dịch vụ giao tiếp nội bộ an toàn và bảo mật."
    ),
    1419: (
        None,
        "Tệp docker-compose.override.yml của hệ thống SMS được tác giả sử dụng để lưu trữ các thông số môi trường cục bộ phục vụ việc lập trình thử nghiệm tại máy cá nhân, được cấu hình loại trừ trong .gitignore để bảo đảm không làm lộ các chuỗi bí mật an ninh khi đẩy mã nguồn lên GitHub."
    ),
    1420: (
        "Hai cấu hình điều phối dịch vụ với Docker Compose: ",
        "Tác giả đã xây dựng 2 kịch bản điều phối linh hoạt cho hệ thống SMS: docker-compose.yml tiêu chuẩn phục vụ môi trường phát triển và kiểm thử đơn lẻ; và docker-compose.cluster.yml tích hợp cụm cân bằng tải Nginx với 3 phiên bản backend phục vụ kịch bản chịu tải cao trong môi trường sản xuất thực tế."
    ),
    1423: (
        None,
        "Quy trình quản lý và tiến hóa lược đồ cơ sở dữ liệu của hệ thống SMS được tác giả tự động hóa qua chuỗi 27 bản ghi dịch chuyển (migration scripts) được đánh số thứ tự tuần tự trong thư mục backend/src/main/resources/db/migration, bảo đảm cơ sở dữ liệu luôn tự động đồng bộ lược đồ khi khởi động ứng dụng trên bất kỳ môi trường nào."
    ),
    1428: (
        "Quy trình phát triển nhanh (Windows Development): ",
        "Tác giả đã lập trình kịch bản start_dev.bat có khả năng tự động nhận diện dịch vụ MySQL đang chạy (trên Docker cổng 3308 hoặc local cổng 3306), tự động biên dịch backend và khởi động frontend với tính năng Hot Module Replacement (HMR) chỉ bằng một cú nhấp chuột."
    ),
    1429: (
        "Quy trình triển khai trọn gói bằng Docker: ",
        "Chỉ với lệnh đơn giản docker compose up --build -d, toàn bộ cụm 3 dịch vụ của hệ thống SMS (MySQL, Backend Spring Boot, Frontend React) sẽ tự động được khởi dựng và kết nối hoàn chỉnh trong vòng 90 giây."
    ),
    1430: (
        "Quy trình kích hoạt bộ kiểm thử tự động: ",
        "Backend của hệ thống SMS được kiểm thử qua lệnh ./mvnw test; frontend được kiểm thử qua lệnh npm test; toàn bộ các kịch bản kiểm thử tải cao và an ninh hệ thống được khởi chạy đồng bộ qua run_tests.bat."
    ),
    1431: (
        "Quy trình trình diễn trực tuyến qua Internet: ",
        "Tác giả đã xây dựng công cụ share_internet.bat sử dụng giải pháp đường hầm an toàn (Cloudflare Tunnel), cho phép kết nối và thao tác trực tiếp trên hệ thống SMS từ xa qua Internet mà không cần phải mở cổng router (Port Forwarding)."
    ),
    1432: (
        "Hệ thống tài khoản kiểm thử mẫu: ",
        "Cơ sở dữ liệu tích hợp sẵn bộ tài khoản thực nghiệm mẫu cho 4 nhóm tác nhân: admin (Quản trị viên), 1000001 (Giảng viên khoa CNTT), 23010359 (Sinh viên Vũ Văn Quang), và cashier (Thủ quỹ thu học phí) phục vụ công tác chấm đồ án."
    ),

    # =========================================================================
    # CHƯƠNG 7: QUẢN LÝ DỰ ÁN, ĐẠO ĐỨC NGHỀ NGHIỆP VÀ TÁC ĐỘNG XÃ HỘI
    # =========================================================================
    1436: (
        None,
        "Đồ án SMS được tác giả tổ chức thực hiện độc lập theo mô hình phát triển phần mềm Lặp và Tăng dần (Iterative and Incremental Model), chia thành 5 giai đoạn nối tiếp: (1) Khảo sát thực địa và phân tích yêu cầu tại ĐH Phenikaa; (2) Thiết kế kiến trúc phần mềm và mô hình dữ liệu 3NF; (3) Lập trình hiện thực hóa các phân hệ lõi; (4) Kiểm thử tự động đa tầng và tối ưu hóa hiệu năng; và (5) Đóng gói Docker, hoàn thiện tài liệu kỹ thuật và diễn tập bảo vệ đồ án."
    ),
    1439: (
        None,
        "Do toàn bộ khối lượng công việc khổng lồ của đồ án được hoàn thành bởi một cá nhân tác giả duy nhất (sinh viên Vũ Văn Quang - MSSV 23010359), việc thiết lập kỷ luật quản trị mã nguồn và quản lý tiến độ là yếu tố then chốt bảo đảm sự thành công. Tác giả đã duy trì quy trình kiểm soát phiên bản qua Git với hơn 200 lượt commit có thông điệp rõ ràng, kết hợp công cụ quản lý tác vụ Kanban để kiểm soát chặt chẽ từng tính năng phần mềm."
    ),
    1441: (
        None,
        "Hệ thống SMS trực tiếp xử lý hồ sơ thông tin cá nhân và kết quả học tập của sinh viên - những dữ liệu nhạy cảm liên quan mật thiết đến quyền lợi và tương lai của người học. Tác giả đã đặt các nguyên tắc đạo đức nghề nghiệp kỹ sư phần mềm của Hiệp hội Máy tính Quốc tế (ACM Code of Ethics) [17] làm tôn chỉ thiết kế: (1) Tuân thủ tuyệt đối Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân thông qua cơ chế phân quyền RBAC và mã hóa mật khẩu; (2) Bảo đảm tính trung thực và minh bạch dữ liệu qua quy trình khóa điểm 3 cấp không thể bị can thiệp trái phép; và (3) Xây dựng kênh khiếu nại điểm 7 ngày công bằng, bảo vệ quyền lợi chính đáng của mọi sinh viên."
    ),
    1443: (
        "Tác động giáo dục & xã hội: ",
        "Hệ thống SMS số hóa toàn diện quy trình đào tạo giúp sinh viên Trường Đại học Phenikaa chủ động tuyệt đối trong học tập, giảm thiểu 80% thời gian chờ đợi thủ tục hành chính, đồng thời hỗ trợ nhà trường quản trị đào tạo minh bạch, văn minh và hiện đại."
    ),
    1444: (
        "Tác động kinh tế: ",
        "Hệ thống SMS khai thác 100% công nghệ mã nguồn mở miễn phí và kiến trúc Docker container gọn nhẹ giúp Trường Đại học Phenikaa tiết kiệm hàng tỷ đồng chi phí mua sắm bản quyền phần mềm và chi phí vận hành máy chủ hàng năm."
    ),
    1445: (
        "Tác động môi trường: ",
        "Đồ án SMS loại bỏ hoàn toàn việc sử dụng biểu mẫu giấy trong đăng ký môn học, thu học phí và bảng điểm in ấn thủ công, đóng góp thiết thực vào mục tiêu xây dựng trường đại học thông minh, thân thiện với môi trường (Green Campus)."
    ),
    1447: (
        None,
        "Quá trình độc lập nghiên cứu, thiết kế kiến trúc và hoàn thiện trọn vẹn Hệ thống Quản lý Đào tạo SMS đã giúp tác giả tích lũy những kinh nghiệm kỹ thuật vô giá và hoàn thiện tư duy của một kỹ sư phần mềm chuyên nghiệp trên 6 phương diện trọng yếu:"
    ),
    1448: (
        "Kiến trúc phần mềm phân tầng và thiết kế RESTful API chuẩn Enterprise: ",
        "Làm chủ cách tổ chức mã nguồn theo các mẫu thiết kế GoF, phân định trách nhiệm rạch ròi giữa Controller, Service, Repository và DTO, xây dựng hệ thống API có tính tái sử dụng và khả năng mở rộng cao."
    ),
    1449: (
        "Kỹ thuật xử lý giao dịch đồng thời và tối ưu hóa CSDL quan hệ: ",
        "Hiểu sâu sắc bản chất của mức độ cô lập giao dịch ACID, làm chủ kỹ thuật khóa bi quan kết hợp kịch bản Redis Lua Script để xử lý triệt để bài toán tranh chấp dữ liệu (race conditions) trong môi trường phân tán."
    ),
    1450: (
        "An toàn thông tin và kỹ thuật phòng thủ chiều sâu (Defense-in-Depth): ",
        "Vận dụng thành thạo cơ chế xác thực JWT không trạng thái, cấu hình phân quyền Spring Security đa tầng, kỹ thuật băm mật khẩu an toàn BCrypt và nguyên tắc Client Zero-Trust để chống lại các cuộc tấn công mạng."
    ),
    1451: (
        "Phát triển Frontend hiện đại và trải nghiệm người dùng cao cấp (UI/UX): ",
        "Làm chủ hệ sinh thái React 19 SPA, tối ưu hóa quá trình kết xuất Virtual DOM, thiết lập hệ thống Design Tokens nhất quán và xây dựng giao diện hiện đại với kỹ thuật Frosted Glass và Slate Dark Mode."
    ),
    1452: (
        "Chiến lược kiểm thử tự động đa tầng (Test Pyramid) và DevOps: ",
        "Xây dựng thành công bộ kiểm thử tự động đồ sộ với 528 test cases bao phủ từ Unit Test, Integration Test đến E2E Test; làm chủ công nghệ đóng gói Docker đa tầng và điều phối cụm cân bằng tải Nginx."
    ),
    1453: (
        "Kỹ năng phân tích nghiệp vụ (BA) và kỷ luật quản trị mã nguồn: ",
        "Nâng cao năng lực chuyển đổi các quy chế giáo dục phức tạp của Thông tư 08/2021/TT-BGDĐT thành các mô hình toán học và mã nguồn máy tính; rèn luyện tác phong làm việc khoa học, kỷ luật và trung thực trong nghiên cứu khoa học."
    )
}

def apply_paraphrasing(docx_path):
    print(f"Loading document: {docx_path}")
    doc = docx.Document(docx_path)
    total_paras = len(doc.paragraphs)
    print(f"Total paragraphs in document: {total_paras}")

    modified_count = 0
    for idx, (prefix, text) in REPLACEMENTS.items():
        if idx >= total_paras:
            print(f"Warning: Index {idx} out of range (max {total_paras-1})")
            continue

        p = doc.paragraphs[idx]
        
        # Format preservation
        if prefix:
            # Paragraph with bold title lead-in
            if len(p.runs) >= 2:
                p.runs[0].text = prefix
                p.runs[0].bold = True
                p.runs[1].text = text
                p.runs[1].bold = False
                # Clear any trailing runs
                for r in p.runs[2:]:
                    r.text = ""
            elif len(p.runs) == 1:
                p.runs[0].text = prefix
                p.runs[0].bold = True
                new_run = p.add_run(text)
                new_run.bold = False
            else:
                r1 = p.add_run(prefix)
                r1.bold = True
                r2 = p.add_run(text)
                r2.bold = False
        else:
            # Paragraph without bold lead-in
            if len(p.runs) >= 1:
                p.runs[0].text = text
                p.runs[0].bold = False
                for r in p.runs[1:]:
                    r.text = ""
            else:
                p.add_run(text)

        modified_count += 1

    print(f"Successfully rewritten {modified_count} paragraphs!")
    
    # Save back to docx_path
    doc.save(docx_path)
    print(f"Saved changes to: {docx_path}")

if __name__ == "__main__":
    apply_paraphrasing("BaoCaoDoAn_ChinhSua_HoanThien.docx")
