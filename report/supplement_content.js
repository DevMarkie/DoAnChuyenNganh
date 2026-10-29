// supplement_content.js
// Cung cấp các nội dung và bảng biểu bổ sung theo chuẩn phương pháp luận hàn lâm của Trường CNTT - ĐH Phenikaa
// dựa trên đối chiếu với Báo cáo ĐACN tham chiếu (Aura Court - K17).

module.exports = function(helpers) {
  const { run, b, P, H1, H2, H3, BULLETS, TABLE, ACCENT, ACCENT2, GREYBG, PageBreak, Paragraph, TextRun, AlignmentType } = helpers;

  return {
    // =========================================================================
    // 1. PHÂN CÔNG NHIỆM VỤ ĐỒ ÁN (BIỂU MẪU CHUẨN KHOA CNTT PHENIKAA)
    // =========================================================================
    buildPhanCongNhiemVu: function() {
      const items = [];
      items.push(H1('Phân công nhiệm vụ đồ án'));
      items.push(P('Đồ án do một sinh viên thực hiện độc lập, bao quát toàn diện mọi giai đoạn của vòng đời phát triển phần mềm: từ khảo sát nghiệp vụ, phân tích yêu cầu, thiết kế kiến trúc hệ thống, xây dựng cơ sở dữ liệu, hiện thực mã nguồn backend và frontend, cho đến kiểm thử đa tầng và đóng gói triển khai thực tế. Bảng dưới đây tóm tắt danh mục các nhiệm vụ chính và bảng phân công, đánh giá khối lượng thực hiện theo quy chuẩn của Trường Công nghệ Thông tin – Trường Đại học Phenikaa.'));

      items.push(...TABLE(
        ['STT', 'Danh sách các công việc / Nhiệm vụ', 'Mô tả tóm tắt công việc'],
        [
          ['1', 'Khảo sát hiện trạng và Phân tích yêu cầu', 'Nghiên cứu quy chế đào tạo tín chỉ (Thông tư 08/2021/TT-BGDĐT), khảo sát định lượng 50 sinh viên và 10 giảng viên/cán bộ, phân tích 6 quy trình nghiệp vụ (BPA), xây dựng bộ 35 quy tắc nghiệp vụ (BR) và danh mục yêu cầu chức năng (FR), phi chức năng (NFR).'],
          ['2', 'Thiết kế kiến trúc và Cơ sở dữ liệu', 'Thiết kế kiến trúc phân tầng REST API, mô hình dữ liệu quan hệ (24 bảng, 2 view, 2 trigger, ~26 chỉ mục), thiết kế bảo mật RBAC hai lớp và giải pháp khóa bi quan (Pessimistic Locking) chống race condition sĩ số.'],
          ['3', 'Hiện thực Backend REST API', 'Phát triển dịch vụ Spring Boot 3.5.6 (Java 23), tích hợp Spring Security + JWT HS512, bộ máy ràng buộc đăng ký học phần, công thức tính điểm và GPA/CPA, chốt sổ điểm có thời hạn 7 ngày, bộ lập lịch tự động và xử lý tệp Excel.'],
          ['4', 'Phát triển Frontend SPA', 'Xây dựng giao diện React 19 + Vite 8, định tuyến bảo vệ theo vai trò, quản lý trạng thái Zustand, hệ thống Design Tokens (chế độ Sáng/Tối Slate Dark), thiết kế đáp ứng đa màn hình và công thái học giao diện.'],
          ['5', 'Kiểm thử và Đo kiểm tải', 'Xây dựng 188 ca kiểm thử đơn vị JUnit 5/Mockito, kiểm thử giao diện Vitest, kiểm thử E2E Playwright và kịch bản đo tải k6 xác minh khả năng chịu tải đồng thời và tính ổn định của khóa bi quan.'],
          ['6', 'Đóng gói và Triển khai hệ thống', 'Đóng gói Docker container đa tầng cho backend/frontend, điều phối cụm dịch vụ bằng Docker Compose, thiết lập kịch bản nạp dữ liệu mẫu và tài liệu hướng dẫn vận hành.'],
          ['7', 'Viết báo cáo và hoàn thiện hồ sơ', 'Biên soạn báo cáo tổng kết đồ án chuyên ngành, hệ thống hóa 16 chức năng qua biểu đồ UML (Activity, BCE, Sequence) và sinh tài liệu API tương tác Swagger UI.'],
        ],
        [800, 3000, 5600],
        'Danh sách các nhiệm vụ chính của đồ án',
      ));

      items.push(...TABLE(
        ['STT', 'Họ và tên / MSSV', 'Tên công việc', 'Nhiệm vụ phân công', 'Nội dung đã thực hiện', 'Đánh giá hoàn thành', 'Đóng góp dự án'],
        [
          ['1', 'Nguyễn Duy Minh\n21010696', 'Kỹ sư phát triển toàn diện (Fullstack & Architect)', 'Đảm nhiệm toàn bộ các giai đoạn từ khảo sát, phân tích, thiết kế, lập trình đến kiểm thử và triển khai', 'Hoàn thành 100% các mục tiêu đồ án: Backend Spring Boot, Frontend React, CSDL MySQL, 188 unit test, đo tải k6, Docker Compose', '100%', '100%'],
        ],
        [600, 1600, 1600, 2000, 2200, 800, 600],
        'Bảng phân công chi tiết và đánh giá mức độ đóng góp',
      ));

      items.push(new Paragraph({ children: [new PageBreak()] }));
      return items;
    },

    // =========================================================================
    // 2. TÁCH RIÊNG DANH MỤC TỪ VIẾT TẮT VÀ DANH MỤC THUẬT NGỮ
    // =========================================================================
    buildDanhMucTuVietTatVaThuatNgu: function() {
      const items = [];
      items.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: 'DANH MỤC TỪ VIẾT TẮT', font: 'Times New Roman', size: 32, bold: true, color: ACCENT })] }));
      items.push(P('Bảng dưới đây giải thích các từ viết tắt kỹ thuật và công nghệ được sử dụng xuyên suốt báo cáo:'));
      items.push(...TABLE(
        ['Từ viết tắt', 'Thuật ngữ đầy đủ (Tiếng Anh)', 'Ý nghĩa và giải thích ngữ cảnh'],
        [
          ['SMS', 'Student Management System', 'Hệ thống Quản lý Sinh viên — tên sản phẩm phần mềm của đồ án.'],
          ['API', 'Application Programming Interface', 'Giao diện lập trình ứng dụng, cầu nối giao tiếp giữa client và server.'],
          ['REST', 'Representational State Transfer', 'Phong cách kiến trúc phần mềm dựa trên tài nguyên và các phương thức HTTP.'],
          ['SPA', 'Single Page Application', 'Ứng dụng web một trang, tải tài nguyên ban đầu và điều hướng phía client.'],
          ['JWT', 'JSON Web Token (RFC 7519)', 'Chuỗi mã hóa mang thông tin xác thực không trạng thái được ký số an toàn.'],
          ['RBAC', 'Role-Based Access Control', 'Mô hình điều khiển truy cập dựa trên vai trò của người dùng.'],
          ['ORM', 'Object-Relational Mapping', 'Kỹ thuật ánh xạ cấu trúc đối tượng trong mã nguồn với bảng dữ liệu quan hệ.'],
          ['JPA', 'Jakarta Persistence API', 'Đặc tả chuẩn của hệ sinh thái Java cho việc quản lý dữ liệu quan hệ.'],
          ['DTO', 'Data Transfer Object', 'Đối tượng truyền dữ liệu, tách bạch tầng giao tiếp với thực thể lưu trữ CSDL.'],
          ['CRUD', 'Create, Read, Update, Delete', 'Bốn thao tác thao tác dữ liệu cơ bản trong các hệ thống thông tin.'],
          ['CSDL', 'Cơ sở dữ liệu', 'Hệ thống lưu trữ và quản lý dữ liệu có cấu trúc (sử dụng MySQL 8).'],
          ['GPA', 'Grade Point Average', 'Điểm trung bình học tập của sinh viên trong một học kỳ (thang điểm 4.0).'],
          ['CPA', 'Cumulative Point Average', 'Điểm trung bình tích lũy toàn khóa của sinh viên tính đến thời điểm hiện tại.'],
          ['UC / FR', 'Use Case / Functional Requirement', 'Ca sử dụng hệ thống / Yêu cầu chức năng của phần mềm.'],
          ['BR', 'Business Rule', 'Quy tắc nghiệp vụ quản lý đào tạo được áp đặt và kiểm tra tự động.'],
          ['BPA', 'Business Process Analysis', 'Phân tích quy trình nghiệp vụ chi tiết theo các giai đoạn và luồng xử lý.'],
          ['TKB', 'Thời khóa biểu', 'Lịch học phân bổ theo thứ, tiết học và phòng học của các lớp học phần.'],
          ['BCrypt', 'Adaptive Password Hashing Function', 'Thuật toán băm mật khẩu một chiều có muối (salt), chống tấn công vét cạn.'],
          ['E2E', 'End-to-End Testing', 'Kiểm thử đầu-cuối mô phỏng luồng thao tác thực tế của người dùng trên hệ thống.'],
          ['RPS', 'Requests Per Second', 'Số lượng yêu cầu HTTP máy chủ xử lý thành công trong mỗi giây.'],
          ['SLA', 'Service Level Agreement', 'Cam kết mức độ dịch vụ về thời gian phản hồi và độ ổn định của hệ thống.'],
          ['BCE', 'Boundary – Control – Entity', 'Khuôn mẫu phân rã lớp phân tích hướng đối tượng thành Biên, Điều khiển, Thực thể.'],
          ['RTM', 'Requirement Traceability Matrix', 'Ma trận truy vết yêu cầu liên kết giữa Quy tắc, Yêu cầu, Mã nguồn và Kiểm thử.'],
          ['CLS', 'Cumulative Layout Shift', 'Chỉ số đo lường độ ổn định thị giác của giao diện khi tải dữ liệu.'],
          ['FOUC', 'Flash of Unstyled Content', 'Hiện tượng chớp giật giao diện sai màu sắc khi chuyển đổi chủ đề Sáng/Tối.'],
        ],
        [1600, 3400, 4400],
        'Danh mục các từ viết tắt sử dụng trong báo cáo',
      ));

      items.push(new Paragraph({ spacing: { before: 200, after: 160 }, children: [new TextRun({ text: 'DANH MỤC THUẬT NGỮ', font: 'Times New Roman', size: 32, bold: true, color: ACCENT })] }));
      items.push(P('Bảng dưới đây định nghĩa và làm rõ các khái niệm chuyên ngành liên quan đến học chế tín chỉ và kỹ thuật phần mềm:'));
      items.push(...TABLE(
        ['Thuật ngữ', 'Khái niệm và Định nghĩa ngữ cảnh trong hệ thống SMS'],
        [
          ['Học chế tín chỉ', 'Phương thức tổ chức đào tạo đại học lấy người học làm trung tâm, mềm dẻo về tiến độ và thời gian hoàn thành chương trình, cho phép sinh viên chủ động đăng ký môn học và tích lũy tín chỉ.'],
          ['Lớp học phần (Course Section)', 'Đơn vị tổ chức giảng dạy của một môn học cụ thể trong học kỳ, có mã lớp, giảng viên phụ trách, sĩ số tối đa và thời khóa biểu xác định để sinh viên đăng ký tham gia.'],
          ['Môn học tiên quyết (Prerequisite)', 'Môn học bắt buộc sinh viên phải tích lũy đạt kết quả (điểm tổng kết hệ 10 ≥ 4.0) trước khi được phép ghi danh vào môn học tiếp theo.'],
          ['Học cải thiện (Grade Improvement)', 'Việc sinh viên đăng ký học lại một học phần đã đạt điểm D hoặc D+ nhằm mục đích nâng cao điểm trung bình tích lũy (CPA).'],
          ['Điểm liệt (Disqualifying Score)', 'Ngưỡng điểm tối thiểu bắt buộc đối với bài thi cuối kỳ (dưới 3.0 điểm theo thang điểm 10). Nếu phạm điểm liệt, học phần tự động bị xếp loại F bất chấp điểm các thành phần khác.'],
          ['Cảnh báo học vụ (Academic Warning)', 'Biện pháp cảnh báo của nhà trường áp dụng cho sinh viên có kết quả học tập yếu kém (CPA hoặc GPA dưới ngưỡng quy chuẩn), nếu bị cảnh báo 3 lần liên tiếp sẽ bị buộc thôi học.'],
          ['Khóa bi quan (Pessimistic Locking)', 'Cơ chế điều khiển đồng thời ở mức dòng dữ liệu CSDL (SELECT ... FOR UPDATE) buộc các giao dịch tranh chấp cùng một tài nguyên phải xếp hàng tuần tự, triệt tiêu điều kiện tranh chấp (race condition).'],
          ['Cửa sổ ân hạn chỉnh sửa điểm', 'Khoảng thời gian 7 ngày kể từ thời điểm giảng viên chốt sổ điểm, trong đó giảng viên được phép tự hiệu chỉnh sai sót; quá 7 ngày bảng điểm bị khóa cứng và chỉ Quản trị viên mới có quyền mở khóa.'],
          ['Hệ thống biến màu (Design Tokens)', 'Các biến CSS chuẩn hóa đại diện cho các giá trị thiết kế cốt lõi (màu sắc, khoảng cách, bóng đổ) dùng chung cho cả hai chế độ hiển thị Sáng và Tối (Slate Dark).'],
          ['Hiệu ứng xương (Skeleton Shimmer)', 'Thành phần giao diện giữ cố định cấu trúc hiển thị của bảng và thẻ thông tin kèm hiệu ứng chuyển động gradient trong khi chờ API phản hồi, giúp giảm thiểu độ gián đoạn bố cục.'],
        ],
        [2400, 7000],
        'Danh mục các thuật ngữ chuyên môn sử dụng trong báo cáo',
      ));

      items.push(new Paragraph({ children: [new PageBreak()] }));
      return items;
    },

    // =========================================================================
    // 3. CHƯƠNG 1 BỔ SUNG: CĂN CỨ PHÁP LÝ, KHẢO SÁT ĐỊNH LƯỢNG, GAP ANALYSIS, USERS, MODULES
    // =========================================================================

    // =========================================================================
    // 3. CHƯƠNG 1 BỔ SUNG: CĂN CỨ PHÁP LÝ, KHẢO SÁT ĐỊNH LƯỢNG, GAP ANALYSIS, USERS, MODULES
    // =========================================================================
    buildChuong1Additions: function() {
      return {
        get phapLyTexts() {
          return [
            P([b('Bối cảnh pháp lý và định hướng chuyển đổi số giáo dục đại học. '), run('Tại Việt Nam, việc chuyển đổi và chuẩn hóa đào tạo theo học chế tín chỉ được thể chế hóa cao nhất thông qua '), b('Thông tư số 08/2021/TT-BGDĐT '), run('ngày 18/03/2021 của Bộ trưởng Bộ Giáo dục và Đào tạo ban hành Quy chế đào tạo trình độ đại học. Quy chế quy định chặt chẽ cấu trúc đánh giá kết quả học tập (điểm quá trình, điểm thi kết thúc học phần), thang điểm chữ, thang điểm 4, công thức tính GPA/CPA tích lũy, cũng như các khung điều kiện xét cảnh báo học vụ và buộc thôi học. Song song với đó, '), b('Quyết định số 131/QĐ-TTg '), run('ngày 25/01/2022 của Thủ tướng Chính phủ phê duyệt Đề án "Tăng cường ứng dụng công nghệ thông tin và chuyển đổi số trong giáo dục và đào tạo giai đoạn 2022 - 2025, định hướng đến năm 2030" đặt mục tiêu 100% các cơ sở giáo dục đại học phải số hóa toàn diện quy trình quản lý đào tạo, quản lý hồ sơ sinh viên và cung cấp dịch vụ công trực tuyến. Trong bối cảnh đó, việc xây dựng một hệ thống thông tin quản lý đào tạo và đăng ký học phần hiện đại, đáp ứng chuẩn quy chế của Bộ GD&ĐT và Trường Đại học Phenikaa là nhiệm vụ cấp thiết mang tính thực tiễn cao.')]),
          ];
        },
        get khaoSatTexts() {
          return [
            P([b('Khảo sát thực trạng quản lý và trải nghiệm đăng ký học phần. '), run('Để có cơ sở dữ liệu thực nghiệm phục vụ phân tích bài toán, tác giả đã tiến hành xây dựng hai phiếu khảo sát điều tra thực tế trong nội bộ trường đại học: (1) Khảo sát dành cho Cán bộ quản lý đào tạo và Giảng viên (quy mô mẫu: 10 người) nhằm đánh giá công tác tổ chức, nhập điểm và kiểm soát lớp học phần; (2) Khảo sát dành cho Sinh viên (quy mô mẫu: 50 sinh viên các khóa K15, K16, K17) nhằm ghi nhận trải nghiệm đăng ký học phần, tra cứu thời khóa biểu và theo dõi kết quả học tập.')]),
          ];
        },
        get khaoSatTables() {
          return [
            ...TABLE(
              ['STT', 'Nội dung khảo sát công tác quản lý đào tạo (Cán bộ / Giảng viên)', 'Số lượng ghi nhận', 'Tỷ lệ (%)'],
              [
                ['1', 'Quản lý danh sách sinh viên và bảng điểm bằng tệp Excel rời rạc', '8/10', '80.0%'],
                ['2', 'Từng gặp khó khăn khi phát hiện trùng phòng học hoặc trùng lịch giảng viên', '7/10', '70.0%'],
                ['3', 'Tốn nhiều thời gian tổng hợp điểm thành phần và quy đổi điểm hệ 4 / GPA', '8/10', '80.0%'],
                ['4', 'Lo ngại rủi ro sinh viên đăng ký vượt quá sĩ số do hệ thống xử lý đồng thời kém', '9/10', '90.0%'],
                ['5', 'Gặp khó khăn trong kiểm soát thời hạn sửa điểm và giải quyết đơn phúc khảo', '6/10', '60.0%'],
                ['6', 'Đánh giá rất cấp thiết phải có hệ thống quản lý tập trung và tự động hóa ràng buộc', '10/10', '100.0%'],
              ],
              [600, 6000, 1600, 1200],
              'Kết quả khảo sát thực trạng công tác quản lý đào tạo đối với Cán bộ đào tạo và Giảng viên',
            ),
            ...TABLE(
              ['STT', 'Nội dung khảo sát trải nghiệm của Sinh viên', 'Số lượng ghi nhận', 'Tỷ lệ (%)'],
              [
                ['1', 'Từng gặp lỗi nghẽn mạng, treo trang web lúc mở cổng đăng ký học phần', '44/50', '88.0%'],
                ['2', 'Mất trên 15 phút để hoàn thành một phiên đăng ký học phần vì hệ thống chậm', '36/50', '72.0%'],
                ['3', 'Từng bị đăng ký hụt lớp do hệ thống chậm cập nhật số chỗ trống thực tế', '39/50', '78.0%'],
                ['4', 'Gặp khó khăn khi tự kiểm tra môn tiên quyết và phát hiện xung đột lịch học', '31/50', '62.0%'],
                ['5', 'Bảng điểm chậm công bố hoặc khó theo dõi tiến độ tích lũy tín chỉ toàn khóa', '28/50', '56.0%'],
                ['6', 'Rất mong muốn hệ thống có trợ lý xếp lịch trực quan và giao diện phản hồi tức thì', '48/50', '96.0%'],
              ],
              [600, 6000, 1600, 1200],
              'Kết quả khảo sát trải nghiệm đăng ký học phần và tra cứu của Sinh viên',
            ),
          ];
        },
        get tonTaiTexts() {
          return [
            P([b('Những vấn đề tồn tại cốt lõi trong quy trình quản lý hiện nay: ')]),
            ...BULLETS([
              [b('Thứ nhất, tắc nghẽn hệ thống và tranh chấp dữ liệu (Race Condition) trong giờ cao điểm: '), run('Khi cổng đăng ký mở, hàng nghìn sinh viên cùng truy cập để giành chỗ trong các lớp học phần có khung giờ đẹp. Việc thiếu cơ chế khóa dữ liệu đồng thời ở mức giao dịch khiến hệ thống hoặc bị treo hoàn toàn, hoặc xảy ra lỗi vượt sĩ số tối đa.')],
              [b('Thứ hai, dữ liệu đào tạo bị phân mảnh và thiếu đồng bộ: '), run('Thông tin sinh viên, danh mục môn học, sổ điểm giảng viên và lịch học thường được lưu trữ rải rác trên nhiều bảng tính Excel và phần mềm đơn lẻ, gây khó khăn cho việc tra cứu và tổng hợp số liệu báo cáo.')],
              [b('Thứ ba, thiếu tự động hóa kiểm tra các ràng buộc học vụ phức tạp: '), run('Quy trình thủ công không thể kiểm tra tức thời điều kiện môn tiên quyết, xung đột lịch phòng học, trùng lịch giảng viên và hạn mức tín chỉ tối đa của sinh viên, dẫn tới nhiều sai sót phải hủy kết quả sau đó.')],
              [b('Thứ tư, quy trình nhập điểm, chốt điểm và phúc khảo thiếu cơ chế khóa có thời hạn: '), run('Giảng viên có thể tự do sửa điểm mà không có mốc thời gian chốt sổ rõ ràng, gây rủi ro sai lệch dữ liệu điểm và thiếu tính minh bạch khi sinh viên khiếu nại.')],
              [b('Thứ năm, nguy cơ sai sót cao khi tính toán GPA/CPA và xếp loại học lực: '), run('Công thức tính trung bình có trọng số tín chỉ, việc áp dụng quy tắc điểm liệt thi cuối kỳ và quy tắc chọn điểm cao nhất qua nhiều lần học (best-attempt) nếu làm thủ công bằng công thức Excel rất dễ phát sinh sai số.')],
              [b('Thứ sáu, khó khăn trong công tác cảnh báo học vụ kịp thời: '), run('Nhà trường khó phát hiện sớm các sinh viên có nguy cơ bị buộc thôi học theo từng năm đào tạo để có biện pháp tư vấn và định hướng lộ trình học tập phù hợp.')],
            ]),
            P('Nguyên nhân cốt lõi của những hạn chế trên bắt nguồn từ việc thiếu một hệ thống thông tin tập trung, hiện đại, có khả năng tự động hóa 100% "bộ máy ràng buộc nghiệp vụ" tại tầng máy chủ và được bảo vệ bằng các giải pháp điều khiển đồng thời an toàn.'),
          ];
        },
        get phamVi4CapDo() {
          return [
            P([b('Phân định phạm vi hệ thống theo 4 cấp độ: ')]),
            ...BULLETS([
              [b('1) Phạm vi chức năng cốt lõi (Core Scope): '), run('Quản lý danh mục cơ cấu đào tạo (Khoa, Lớp, Môn học, Học kỳ); Mở lớp học phần và cấu hình sĩ số; Đăng ký và hủy học phần có kiểm soát tranh chấp đồng thời bằng khóa bi quan; Nhập điểm thành phần theo trọng số, xét điểm liệt, chốt sổ điểm có cửa sổ ân hạn 7 ngày; Tra cứu bảng điểm và tính GPA/CPA theo quy chế.')],
              [b('2) Phạm vi chức năng nâng cao (Advanced Scope): '), run('Xếp thời khóa biểu tự động có phát hiện xung đột phòng học và giảng viên; Cơ chế cưỡng chế vượt sĩ số dành riêng cho Quản trị viên có ghi nhật ký kiểm toán; Tự động xét duyệt và kết xuất danh sách cảnh báo học vụ 3 mức; Nhập/xuất dữ liệu sinh viên và bảng điểm qua tệp Excel (Apache POI); Giao diện đa chế độ Sáng/Tối (Slate Dark) theo hệ thống Design Tokens.')],
              [b('3) Phạm vi chức năng mở rộng (Extended Scope): '), run('Quy trình tiếp nhận, xét duyệt và điều chỉnh điểm đơn phúc khảo trực tuyến; Bộ lập lịch tự động quét và hủy các lớp học phần không đủ sĩ số tối thiểu mở lớp đầu kỳ; Cơ chế bắt buộc đổi mật khẩu mặc định ở lần đầu đăng nhập kèm thanh đo độ mạnh trực quan.')],
              [b('4) Phạm vi ngoài hệ thống (Out of Scope): '), run('Cổng thanh toán học phí trực tuyến liên kết ngân hàng (mới mô hình hóa bảng dữ liệu học phí); Điểm danh sinh viên bằng sinh trắc học/quét mã QR trực tiếp tại giảng đường; Tích hợp cổng đăng nhập một lần (SSO) với hệ thống thông tin chung của toàn trường.')],
            ]),
          ];
        },
        get gapAnalysis() {
          return [
            P([b('Phương pháp khảo sát các giải pháp hiện có. '), run('Nhóm tác giả tiến hành khảo sát và đánh giá thực nghiệm các giải pháp quản lý đào tạo dựa trên 3 nhóm tiêu chí chính: (1) Khả năng đáp ứng nghiệp vụ học chế tín chỉ theo Thông tư 08; (2) Hiệu năng xử lý và điều khiển đồng thời dưới tải cao; (3) Tính tiện dụng, công thái học giao diện và chi phí làm chủ công nghệ.')]),
            ...TABLE(
              ['Tiêu chí đánh giá', 'Edusoft / UIS thương mại', 'Bảng tính Excel & LMS Moodle', 'Hệ thống SMS (Đề xuất)'],
              [
                ['Mô hình triển khai', 'Client-Server truyền thống / Desktop', 'File cục bộ kết hợp Web PHP', 'Client-Server tách rời (REST + SPA React)'],
                ['Kiểm tra môn tiên quyết', 'Tự động kiểm tra tại CSDL', 'Thủ công, phụ thuộc người lập', 'Tự động kiểm tra tại Service (BR-REG-02)'],
                ['Chống trùng lịch thời khóa biểu', 'Phát hiện xung đột lịch cơ bản', 'Không thể phát hiện tự động', 'Quét giao thoa thứ/tiết và phòng (BR-SEC-02/03)'],
                ['Kiểm soát tranh chấp sĩ số', 'Hàng đợi cơ sở dữ liệu nặng nề', 'Xung đột ghi đè dữ liệu (Lock file)', 'Khóa bi quan dòng PESSIMISTIC_WRITE (BR-REG-05)'],
                ['Quy tắc điểm liệt cuối kỳ', 'Có áp dụng theo quy chế', 'Dùng hàm IF phức tạp, dễ sai', 'Tự động hạ điểm chữ F khi CK < 3.0 (BR-GRD-03)'],
                ['Cửa sổ ân hạn sửa điểm', 'Có quy trình chốt sổ điểm', 'Không có kiểm soát thời hạn', 'Tự động khóa sau 7 ngày, Admin mở khóa (BR-GRD-05)'],
                ['Tính CPA (Lần học tốt nhất)', 'Tính tự động tại thủ tục CSDL', 'Dễ tính nhầm các lần học trượt', 'Hàm cửa sổ SQL và Service tối ưu (BR-WRN-01)'],
                ['Xét cảnh báo học vụ', 'Chạy batch định kỳ cuối kỳ', 'Lọc thủ công bằng bảng tính', 'Tự động tính và xuất báo cáo 3 mức (BR-WRN-02)'],
                ['Quy trình xử lý phúc khảo', 'Biểu mẫu giấy nộp tại phòng đào tạo', 'Không hỗ trợ trên hệ thống', 'Trực tuyến: PENDING → APPROVED/REJECTED'],
                ['Hủy lớp thiếu sĩ số tối thiểu', 'Cán bộ lọc và hủy bằng tay', 'Không hỗ trợ tự động', 'Bộ lập lịch tự động quét và hủy lớp (Cron task)'],
                ['Phân quyền bảo mật', 'Phân quyền theo nhóm quyền lớn', 'Chia sẻ mật khẩu tệp Excel', 'RBAC 2 lớp: Đường dẫn + Method Security'],
                ['Bắt buộc đổi MK lần đầu', 'Không bắt buộc hoặc tùy chọn', 'Không hỗ trợ', 'Rào chắn giao diện không thể đóng (BR-AUTH-04)'],
                ['Giao diện Sáng/Tối (Dark Mode)', 'Giao diện cũ, chỉ có chế độ sáng', 'Phụ thuộc giao diện Moodle', 'Chuẩn Design Tokens, hỗ trợ Slate Dark Mode'],
                ['Hỗ trợ thiết bị di động (UX)', 'Kém, phải phóng to/thu nhỏ', 'Khó thao tác lưới dữ liệu lớn', 'Responsive 3 ngưỡng: Mobile, Tablet, Desktop'],
                ['Chi phí & Khả năng làm chủ', 'Chi phí bản quyền hàng trăm triệu/năm', 'Miễn phí nhưng rủi ro dữ liệu cao', 'Mã nguồn mở, 0 đồng bản quyền, làm chủ 100%'],
              ],
              [2400, 2600, 2200, 2200],
              'Ma trận so sánh tính năng toàn diện giữa hệ thống SMS và các giải pháp hiện nay',
            ),
            P([b('Nhận xét và phân tích khoảng trống của các giải pháp (Gap Analysis): ')]),
            ...BULLETS([
              [b('1) Những chức năng các hệ thống hiện có đã giải quyết tốt: '), run('Các hệ thống thương mại (như Edusoft/UIS) đã bao quát đầy đủ danh mục đào tạo, tích lũy điểm và đáp ứng đúng quy chế đào tạo tín chỉ của Bộ GD&ĐT qua nhiều năm kiểm nghiệm thực tế.')],
              [b('2) Những hạn chế vẫn còn tồn tại: '), run('Chi phí đầu tư bản quyền và triển khai rất cao; phụ thuộc hoàn toàn vào đơn vị cung cấp phần mềm; kiến trúc nguyên khối cũ kỹ khiến việc bảo trì khó khăn; giao diện người dùng nặng nề, lỗi thời và trải nghiệm trên thiết bị di động rất hạn chế.')],
              [b('3) Các nhu cầu thực tiễn chưa được đáp ứng: '), run('Khả năng chịu tải đồng thời trong 15 phút mở cổng đăng ký học phần vẫn là "nỗi ám ảnh" tại hầu hết các trường đại học; quy trình chốt điểm và phúc khảo còn thiếu cửa sổ kiểm soát thời hạn minh bạch; giao diện thiếu các vi tương tác hiện đại (như trợ lý xếp lịch trực quan, thanh đo độ mạnh mật khẩu và chế độ hiển thị Slate Dark).')],
              [b('4) Khoảng trống mà đồ án SMS tập trung giải quyết: '), run('SMS lấp đầy khoảng trống trên bằng một giải pháp web nhẹ, hiện đại, kiến trúc client-server tách rời hoàn toàn: ứng dụng khóa bi quan ở mức dòng dữ liệu CSDL để giải quyết triệt để bài toán tranh chấp sĩ số; tự động hóa 100% bộ máy ràng buộc tại tầng máy chủ; cung cấp trải nghiệm giao diện người dùng đạt chuẩn công thái học cao cấp với chi phí bản quyền 0 đồng.')],
            ]),
          ];
        },
        get doiTuongVaNghiepVu() {
          return [
            P([b('Đối tượng sử dụng và các nhóm nghiệp vụ chính của hệ thống SMS: ')]),
            ...TABLE(
              ['Nhóm người dùng', 'Vai trò trong hệ thống', 'Nhu cầu và Chức năng sử dụng chính'],
              [
                ['Sinh viên', 'Người học đã được cấp tài khoản chính thức', 'Tra cứu khung chương trình đào tạo; tìm kiếm và đăng ký/hủy lớp học phần; xem thời khóa biểu tuần; tra cứu sổ điểm cá nhân, điểm GPA/CPA; nộp đơn phúc khảo trực tuyến; quản lý thông tin cá nhân và đổi mật khẩu.'],
                ['Giảng viên', 'Cán bộ giảng dạy phụ trách các lớp học phần', 'Xem danh sách các lớp học phần được phân công; xem và xuất danh sách sinh viên; tra cứu lịch giảng dạy tuần; nhập điểm thành phần, tính điểm tổng kết và chốt công bố điểm (cửa sổ 7 ngày); tiếp nhận và duyệt đơn phúc khảo.'],
                ['Quản trị viên / Phòng Đào tạo', 'Quản trị hệ thống và điều phối toàn bộ hoạt động đào tạo', 'Quản lý danh mục cơ cấu (Khoa, Lớp, Môn học, Môn tiên quyết, Học kỳ); mở lớp học phần và phân công giảng viên; xếp thời khóa biểu và phát hiện xung đột; mở cổng đăng ký; xử lý cưỡng chế sĩ số; mở khóa bảng điểm; quản lý tài khoản và theo dõi cảnh báo học vụ.'],
              ],
              [2000, 2400, 5000],
              'Bảng phân loại đối tượng sử dụng hệ thống SMS',
            ),
            ...TABLE(
              ['STT', 'Phân hệ nghiệp vụ', 'Nội dung và Chức năng cốt lõi'],
              [
                ['1', 'Xác thực & Phân quyền', 'Đăng nhập bảo mật JWT, rào chắn bắt buộc đổi mật khẩu mặc định, phân quyền RBAC 2 lớp, chống dò mật khẩu và giới hạn tần suất.'],
                ['2', 'Quản lý Cơ cấu & Danh mục', 'Quản trị phân cấp Khoa → Lớp sinh hoạt; Quản lý hồ sơ Sinh viên, Giảng viên; Quản lý Môn học, Tín chỉ và Học kỳ đào tạo.'],
                ['3', 'Lớp học phần & Thời khóa biểu', 'Mở lớp học phần đơn lẻ hoặc hàng loạt theo khóa; Phân bổ giảng viên; Xếp thời khóa biểu tự động có phát hiện trùng phòng/trùng lịch.'],
                ['4', 'Đăng ký học phần & Sĩ số', 'Xử lý đăng ký/hủy học phần theo thời gian thực; Kiểm tra 5 ràng buộc học vụ; Khóa bi quan chống vượt sĩ số; Cưỡng chế có ghi log.'],
                ['5', 'Sổ điểm & Chốt công bố điểm', 'Lưới nhập 4 đầu điểm thành phần; Tự động tính điểm tổng kết, hệ 4 và điểm chữ; Xét điểm liệt; Chốt sổ có cửa sổ 7 ngày; Khóa cứng.'],
                ['6', 'Bảng điểm & Cảnh báo học vụ', 'Tổng hợp bảng điểm cá nhân; Tính GPA học kỳ và CPA tích lũy (lần học tốt nhất); Tự động xét duyệt và xuất danh sách cảnh báo học vụ 3 mức.'],
                ['7', 'Phúc khảo điểm học phần', 'Tiếp nhận đơn phúc khảo trong 7 ngày sau chốt điểm; Quản lý vòng đời đơn; Cập nhật điểm mới kèm lý do và lưu vết kiểm toán.'],
                ['8', 'Xử lý dữ liệu & Báo cáo', 'Nhập/xuất danh sách sinh viên và bảng điểm qua tệp Excel (Apache POI); Dashboard thống kê số liệu đào tạo toàn trường; Tác vụ tự động hủy lớp.'],
              ],
              [600, 2800, 6000],
              'Bảng danh mục các nhóm nghiệp vụ chính của hệ thống SMS',
            ),
          ];
        },
      };
    },

    // =========================================================================
    // 4. CHƯƠNG 3 BỔ SUNG: ASSUMPTIONS, ACTORS, RESPONSIBILITIES, 6 BPA PROCESSES, 35 BR RULES
    // =========================================================================
    buildChuong3Additions: function() {
      return {
        get frTable() {
          return TABLE(
        ['Mã FR', 'Tên chức năng', 'Mô tả tóm tắt yêu cầu nghiệp vụ', 'Tác nhân'],
        [
          ['FR-ADM-01', 'Đăng nhập & Phân quyền', 'Xác thực tài khoản quản trị, cấp phát token JWT và phân quyền ROLE_ADMIN.', 'Admin'],
          ['FR-ADM-02', 'Quản lý Khoa & Lớp sinh hoạt', 'Tạo mới, cập nhật và hiển thị cây phân cấp cơ cấu Khoa và các Lớp sinh hoạt.', 'Admin'],
          ['FR-ADM-03', 'Quản lý Môn học & Tiên quyết', 'Khai báo mã môn, tên môn, số tín chỉ và thiết lập danh sách môn học tiên quyết.', 'Admin'],
          ['FR-ADM-04', 'Quản lý Hồ sơ Sinh viên / Giảng viên', 'Thêm mới, sửa thông tin, cập nhật trạng thái (Active/Suspended), cấp tài khoản tự động.', 'Admin'],
          ['FR-ADM-05', 'Cấu hình Học kỳ & Cổng ĐKHP', 'Thiết lập học kỳ hiện tại, cấu hình khung thời gian mở/đóng cổng đăng ký học phần.', 'Admin'],
          ['FR-ADM-06', 'Mở Lớp học phần', 'Mở lớp theo môn học, chỉ định giảng viên, thiết lập sĩ số tối đa (đơn lẻ hoặc theo batch).', 'Admin'],
          ['FR-ADM-07', 'Xếp Thời khóa biểu', 'Gán thứ, tiết học, phòng học cho lớp học phần kèm kiểm tra xung đột phòng và giảng viên.', 'Admin'],
          ['FR-ADM-08', 'Cưỡng chế ghi danh sĩ số', 'Xếp sinh viên vào lớp đã đầy sĩ số, bắt buộc nhập lý do và lưu vết kiểm toán AUDIT.', 'Admin'],
          ['FR-ADM-09', 'Mở khóa bảng điểm đã chốt', 'Cho phép Admin mở khóa bảng điểm đã quá hạn 7 ngày để giảng viên sửa điểm hợp lệ.', 'Admin'],
          ['FR-ADM-10', 'Xét duyệt Cảnh báo học vụ', 'Hệ thống tự động quét CPA, lọc sinh viên thuộc 3 mức cảnh báo và hỗ trợ xuất file CSV.', 'Admin'],
          ['FR-ADM-11', 'Nhập / Xuất dữ liệu Excel', 'Bóc tách file Excel sinh viên nạp vào CSDL; Xuất danh sách lớp và bảng điểm chuẩn xlsx.', 'Admin'],
          ['FR-ADM-12', 'Bộ lập lịch tự động hủy lớp', 'Tác vụ ngầm quét các lớp không đạt sĩ số tối thiểu trước ngày bắt đầu kỳ để hủy lớp.', 'Hệ thống'],
          ['FR-LEC-01', 'Xem danh sách Lớp phụ trách', 'Hiển thị các lớp học phần được phân công trong học kỳ kèm sĩ số thực tế.', 'Giảng viên'],
          ['FR-LEC-02', 'Xem & Xuất danh sách Sinh viên', 'Xem hồ sơ sinh viên trong lớp, xuất danh sách phục vụ điểm danh và đối chiếu.', 'Giảng viên'],
          ['FR-LEC-03', 'Tra cứu Lịch giảng dạy tuần', 'Hiển thị thời khóa biểu giảng dạy cá nhân theo ma trận thứ/tiết trực quan.', 'Giảng viên'],
          ['FR-LEC-04', 'Nhập điểm thành phần theo lưới', 'Nhập 4 cột điểm (CC1, CC2, GK, CK) trực tiếp trên lưới hoặc nạp từ file Excel.', 'Giảng viên'],
          ['FR-LEC-05', 'Tự động tính điểm tổng kết', 'Hệ thống tính điểm hệ 10 theo trọng số, quy đổi sang điểm chữ, hệ 4 và xét điểm liệt.', 'Hệ thống'],
          ['FR-LEC-06', 'Chốt và Công bố bảng điểm', 'Kiểm tra đủ 100% điểm, kích hoạt trạng thái công bố và mở cửa sổ chỉnh sửa 7 ngày.', 'Giảng viên'],
          ['FR-LEC-07', 'Chỉnh sửa điểm trong hạn 7 ngày', 'Cho phép sửa điểm trong cửa sổ 7 ngày; tự động cập nhật lại điểm tổng kết và GPA.', 'Giảng viên'],
          ['FR-LEC-08', 'Xử lý đơn phúc khảo', 'Xem đơn khiếu nại điểm của sinh viên, chuyển trạng thái và cập nhật điểm phúc khảo.', 'Giảng viên'],
          ['FR-STU-01', 'Đăng nhập & Bắt buộc đổi MK', 'Xác thực tài khoản sinh viên; hiển thị modal rào chắn đổi mật khẩu ở lần đăng nhập đầu.', 'Sinh viên'],
          ['FR-STU-02', 'Tra cứu Khung CTĐT & Tiến độ', 'Xem lộ trình môn học theo khối kiến thức và tỷ lệ hoàn thành tín chỉ tích lũy.', 'Sinh viên'],
          ['FR-STU-03', 'Đăng ký Lớp học phần', 'Tìm kiếm lớp mở, kiểm tra 5 ràng buộc học vụ, lấy khóa bi quan và ghi nhận chỗ học.', 'Sinh viên'],
          ['FR-STU-04', 'Hủy đăng ký Học phần', 'Hủy lớp trong thời gian cổng mở khi chưa phát sinh điểm, hoàn trả sĩ số cho lớp.', 'Sinh viên'],
          ['FR-STU-05', 'Xem Thời khóa biểu cá nhân', 'Xem ma trận thời khóa biểu tuần các môn đã đăng ký kèm thông tin phòng và giảng viên.', 'Sinh viên'],
          ['FR-STU-06', 'Tra cứu Bảng điểm & GPA/CPA', 'Xem bảng điểm các môn đã chốt theo từng kỳ, GPA học kỳ, CPA tích lũy và học lực.', 'Sinh viên'],
          ['FR-STU-07', 'Gửi đơn phúc khảo điểm', 'Nộp đơn khiếu nại điểm cho học phần đã chốt trong vòng 7 ngày kèm lý do cụ thể.', 'Sinh viên'],
        ],
        [1400, 2400, 4600, 1000],
        'Danh mục yêu cầu chức năng (Functional Requirements) phân theo phân hệ',
      );

      // 4.2 Giả định hệ thống (Assumptions);
        },
        get ucTableWithMapping() {
          return TABLE(
        ['Mã UC', 'Tên Use Case cốt lõi', 'Tác nhân chính', 'Mã FR liên quan', 'Mức ưu tiên'],
        [
          ['UC-A01', 'Quản lý Tài khoản & Phân quyền', 'Admin (ACT-04)', 'FR-ADM-01', 'Cao'],
          ['UC-A02', 'Quản lý Hồ sơ Sinh viên / Giảng viên', 'Admin (ACT-04)', 'FR-ADM-04', 'Cao'],
          ['UC-A03', 'Quản lý Cơ cấu Khoa & Lớp sinh hoạt', 'Admin (ACT-04)', 'FR-ADM-02', 'Cao'],
          ['UC-A04', 'Quản lý Môn học & Môn tiên quyết', 'Admin (ACT-04)', 'FR-ADM-03', 'Cao'],
          ['UC-A05', 'Cấu hình Học kỳ & Cổng ĐKHP', 'Admin (ACT-04)', 'FR-ADM-05', 'Cao'],
          ['UC-A06', 'Mở Lớp học phần & Phân công GV', 'Admin (ACT-04)', 'FR-ADM-06', 'Cao'],
          ['UC-A07', 'Xếp Thời khóa biểu & Xung đột', 'Admin (ACT-04)', 'FR-ADM-07', 'Cao'],
          ['UC-A08', 'Cưỡng chế ghi danh vượt sĩ số', 'Admin (ACT-04)', 'FR-ADM-08', 'Cao'],
          ['UC-A09', 'Mở khóa bảng điểm đã quá hạn', 'Admin (ACT-04)', 'FR-ADM-09', 'Cao'],
          ['UC-A10', 'Xét duyệt & Báo cáo Cảnh báo học vụ', 'Admin (ACT-04)', 'FR-ADM-10', 'Trung bình'],
          ['UC-A11', 'Nhập & Xuất dữ liệu tệp Excel', 'Admin (ACT-04)', 'FR-ADM-11', 'Cao'],
          ['UC-L01', 'Xem danh sách Lớp học phần phụ trách', 'Giảng viên (ACT-03)', 'FR-LEC-01', 'Trung bình'],
          ['UC-L02', 'Xem & Xuất danh sách Sinh viên', 'Giảng viên (ACT-03)', 'FR-LEC-02', 'Trung bình'],
          ['UC-L03', 'Tra cứu Lịch giảng dạy tuần cá nhân', 'Giảng viên (ACT-03)', 'FR-LEC-03', 'Cao'],
          ['UC-L04', 'Nhập, Chỉnh sửa & Import điểm thành phần', 'Giảng viên (ACT-03)', 'FR-LEC-04', 'Cao'],
          ['UC-L05', 'Chốt & Công bố bảng điểm (Cửa sổ 7 ngày)', 'Giảng viên (ACT-03)', 'FR-LEC-06, FR-LEC-07', 'Cao'],
          ['UC-L06', 'Tiếp nhận & Xét duyệt đơn phúc khảo', 'Giảng viên (ACT-03)', 'FR-LEC-08', 'Trung bình'],
          ['UC-S01', 'Đăng nhập & Bắt buộc đổi mật khẩu', 'Sinh viên (ACT-02)', 'FR-STU-01', 'Cao'],
          ['UC-S02', 'Tra cứu Khung CTĐT & Tiến độ tích lũy', 'Sinh viên (ACT-02)', 'FR-STU-02', 'Thấp'],
          ['UC-S03', 'Tìm kiếm & Đăng ký Lớp học phần', 'Sinh viên (ACT-02)', 'FR-STU-03', 'Cao'],
          ['UC-S04', 'Hủy đăng ký Lớp học phần', 'Sinh viên (ACT-02)', 'FR-STU-04', 'Cao'],
          ['UC-S05', 'Xem Thời khóa biểu cá nhân theo tuần', 'Sinh viên (ACT-02)', 'FR-STU-05', 'Cao'],
          ['UC-S06', 'Tra cứu Bảng điểm, Điểm GPA & CPA', 'Sinh viên (ACT-02)', 'FR-STU-06', 'Cao'],
          ['UC-S07', 'Gửi đơn phúc khảo điểm học phần', 'Sinh viên (ACT-02)', 'FR-STU-07', 'Trung bình'],
        ],
        [1100, 3600, 1800, 1900, 1000],
        'Danh mục Use Case cốt lõi của hệ thống SMS kèm ánh xạ Yêu cầu chức năng (FR)',
      );

      // 4.7 Mục Yêu cầu dữ liệu (Data Requirements);
        },
        get assumptionsTexts() {
          return [
        H3('3.3.1. Các giả định của hệ thống'),
        P('Để hệ thống quản lý đào tạo và đăng ký học phần SMS vận hành ổn định và đạt được các mục tiêu thiết kế, đồ án xác lập một số giả định nghiệp vụ và kỹ thuật cốt lõi:'),
        ...BULLETS([
          [b('Giả định về định danh người dùng: '), run('Toàn bộ sinh viên và giảng viên trước khi đưa vào hệ thống đã được nhà trường định danh và cấp mã số duy nhất (mã SV gồm 8 ký tự, mã GV gồm 6-8 ký tự) cùng địa chỉ thư điện tử tên miền trường (@st.phenikaa-uni.edu.vn hoặc @phenikaa-uni.edu.vn).')],
          [b('Giả định về đồng bộ thời gian máy chủ (NTP Synchronization): '), run('Máy chủ chứa mã nguồn backend Spring Boot và máy chủ cơ sở dữ liệu MySQL đều được đồng bộ thời gian chuẩn thông qua giao thức NTP (Network Time Protocol). Điều này bảo đảm tính chính xác tuyệt đối cho các ràng buộc phụ thuộc thời gian như mốc đóng/mở cổng đăng ký học phần và cửa sổ ân hạn 7 ngày sau khi chốt điểm.')],
          [b('Giả định về tính toàn vẹn của danh mục đầu vào: '), run('Chương trình đào tạo, danh mục khoa, ngành, danh mục môn học và điều kiện môn tiên quyết đã được Hội đồng Khoa học và Đào tạo phê duyệt chính thức trước khi mở đợt đăng ký cho sinh viên.')],
          [b('Giả định về hạ tầng mạng và trình duyệt: '), run('Hạ tầng mạng nội bộ hoặc đám mây hỗ trợ giao thức HTTPS và mạng của người dùng đáp ứng tiêu chuẩn kết nối ổn định. Người dùng truy cập hệ thống thông qua các trình duyệt web hiện đại có hỗ trợ chuẩn ECMAScript 2022+ (Google Chrome, Microsoft Edge, Firefox, Safari).')],
        ]),
      ];

      // 4.3 Bộ quy tắc nghiệp vụ tập trung (35 quy tắc mã hóa BR-xxx);
        },
        get businessRulesTable() {
          return TABLE(
        ['Mã quy tắc', 'Quy tắc nghiệp vụ chi tiết', 'Phân hệ áp dụng & Cơ chế kiểm soát'],
        [
          ['BR-AUTH-01', 'Tên đăng nhập là duy nhất trên toàn hệ thống (mã SV hoặc mã GV).', 'Xác thực: Ràng buộc UNIQUE bảng users.'],
          ['BR-AUTH-02', 'Mật khẩu phải được băm một chiều bằng BCrypt với hệ số chi phí cost = 10.', 'Bảo mật: PasswordEncoder phía server.'],
          ['BR-AUTH-03', 'Tài khoản bị khóa tự động trong 15 phút nếu đăng nhập sai quá 5 lần liên tiếp.', 'Bảo mật: LoginAttemptService in-memory.'],
          ['BR-AUTH-04', 'Người dùng có cờ mustChangePassword = true bắt buộc phải đổi mật khẩu ở lần đầu.', 'Giao diện & API: ForcePasswordChangeModal + Filter.'],
          ['BR-AUTH-05', 'Token JWT có thời hạn 24 giờ; bị thu hồi quyền truy cập tức thì khi is_active = false.', 'Bảo mật: JwtAuthFilter nạp lại CSDL mỗi request.'],
          ['BR-CAT-01', 'Mã khoa, mã môn học, mã lớp sinh hoạt phải là duy nhất trên toàn hệ thống.', 'Danh mục: existsByCode tại tầng Repository.'],
          ['BR-CAT-02', 'Số tín chỉ của một môn học phải là số nguyên dương trong khoảng từ 1 đến 10.', 'Danh mục: Validation @Min(1) @Max(10).'],
          ['BR-CAT-03', 'Môn học tiên quyết không được trùng với chính nó và không tạo chu trình phụ thuộc.', 'Danh mục: Thuật toán kiểm tra chu trình đồ thị.'],
          ['BR-CAT-04', 'Khi cập nhật danh mục môn học hoặc học kỳ, hệ thống phải làm mới bộ nhớ đệm (Cache).', 'Hiệu năng: Chú giải @CacheEvict phía Service.'],
          ['BR-SEC-01', 'Sĩ số tối đa mặc định của lớp học phần là 40 sinh viên, do Admin cấu hình.', 'Lớp học phần: Cột max_students bảng course_sections.'],
          ['BR-SEC-02', 'Một phòng học không được bố trí cho 2 lớp học phần trùng thứ và khung tiết học.', 'TKB: Truy vấn findRoomConflicts() tại ScheduleService.'],
          ['BR-SEC-03', 'Một giảng viên không được phân công dạy 2 lớp học phần trùng thời khóa biểu.', 'TKB: Truy vấn findLecturerConflicts() tại ScheduleService.'],
          ['BR-SEC-04', 'Lớp học phần chỉ được mở khi môn học, học kỳ và giảng viên đều ở trạng thái ACTIVE.', 'Lớp học phần: Kiểm tra trạng thái thực thể cha.'],
          ['BR-SEC-05', 'Chỉ được xóa lớp học phần khi chưa có sinh viên nào đăng ký (enrolled_count = 0).', 'Lớp học phần: Chặn ngoại lệ tại CourseSectionService.'],
          ['BR-REG-01', 'Sinh viên chỉ được đăng ký khi học kỳ hiện tại đang MỞ và trong khung regStartDate–EndDate.', 'Đăng ký: Kiểm tra thời gian thực tại EnrollmentService.'],
          ['BR-REG-02', 'Sinh viên phải đạt môn tiên quyết (điểm TK ≥ 4.0 hệ 10) trước khi đăng ký môn tiếp theo.', 'Đăng ký: Quét lịch sử điểm finalized của sinh viên.'],
          ['BR-REG-03', 'Lớp đăng ký mới không được trùng thứ và tiết học với bất kỳ lớp nào sinh viên đã đăng ký.', 'Đăng ký: Thuật toán quét giao thoa thời khóa biểu cá nhân.'],
          ['BR-REG-04', 'Tổng số tín chỉ đăng ký trong học kỳ chính không vượt quá 30 tín chỉ (ngưỡng trần kỹ thuật).', 'Đăng ký: Hằng số MAX_CREDITS_PER_SEMESTER = 30.'],
          ['BR-REG-05', 'Kiểm tra sĩ số phải sử dụng khóa bi quan PESSIMISTIC_WRITE trên dòng lớp học phần.', 'Đăng ký: SELECT ... FOR UPDATE chống race condition.'],
          ['BR-REG-06', 'Không được đăng ký trùng một môn học trong cùng một học kỳ (dù khác lớp học phần).', 'Đăng ký: Kiểm tra trùng mã môn trong các bản ghi ENROLLED.'],
          ['BR-REG-07', 'Sinh viên tự hủy đăng ký chỉ hợp lệ khi cổng còn mở và lớp học phần chưa phát sinh điểm.', 'Đăng ký: Kiểm tra điều kiện điểm tại EnrollmentService.'],
          ['BR-REG-08', 'Chỉ Quản trị viên mới có quyền xếp cưỡng chế vượt sĩ số và bắt buộc ghi lý do.', 'Đăng ký: Cờ forceOverride + ghi nhật ký AUDIT log.'],
          ['BR-GRD-01', 'Điểm thành phần gồm 4 cột: CC1 (5%), CC2 (5%), Giữa kỳ (30%), Cuối kỳ (60%).', 'Điểm số: Công thức tính trọng số tại GradeService.'],
          ['BR-GRD-02', 'Mọi đầu điểm thành phần phải là số thực nằm trong đoạn [0.0, 10.0].', 'Điểm số: Validation @DecimalMin("0.0") @DecimalMax("10.0").'],
          ['BR-GRD-03', 'Quy tắc điểm liệt: Nếu điểm thi cuối kỳ < 3.0, môn học tự động xếp loại F (0.0 hệ 4).', 'Điểm số: Kiểm tra điểm liệt trước khi quy đổi chữ.'],
          ['BR-GRD-04', 'Bảng điểm chỉ được phép Chốt & Công bố khi 100% sinh viên đã có đủ cả 4 đầu điểm.', 'Điểm số: Kiểm tra điều kiện đủ điểm tại GradeService.'],
          ['BR-GRD-05', 'Sau khi chốt điểm, mở cửa sổ 7 ngày cho giảng viên sửa; quá hạn chỉ Admin mở khóa.', 'Điểm số: Mốc finalizedAt + EDIT_WINDOW_DAYS (7 ngày).'],
          ['BR-GRD-06', 'Điểm tổng kết được làm tròn theo quy tắc RoundingMode.HALF_UP với 2 chữ số thập phân.', 'Điểm số: BigDecimal.setScale(2, RoundingMode.HALF_UP).'],
          ['BR-REV-01', 'Đơn phúc khảo chỉ được tạo trong vòng 7 ngày kể từ thời điểm bảng điểm được chốt.', 'Phúc khảo: Kiểm tra mốc thời gian chốt sổ của lớp HP.'],
          ['BR-REV-02', 'Mỗi môn học chỉ được phép có duy nhất 1 đơn phúc khảo đang ở trạng thái PENDING.', 'Phúc khảo: Kiểm tra trùng lặp đơn khiếu nại.'],
          ['BR-REV-03', 'Khi chấp thuận phúc khảo, bắt buộc phải nhập điểm mới; từ chối bắt buộc ghi rõ lý do.', 'Phúc khảo: Ràng buộc logic tại ReviewService.'],
          ['BR-REV-04', 'Cập nhật điểm phúc khảo tự động tính lại điểm tổng kết và làm mới bảng điểm GPA/CPA.', 'Phúc khảo: Kích hoạt tính toán lại tại GradeService.'],
          ['BR-WRN-01', 'Khi tính CPA toàn khóa, nếu học lại môn nhiều lần thì chỉ lấy điểm của lần học cao nhất.', 'CPA: Áp dụng cơ chế Best-attempt trong truy vấn view.'],
          ['BR-WRN-02', 'Cảnh báo học vụ Mức 1: CPA < 1.20 (Năm 1), < 1.40 (Năm 2), < 1.60 (Năm 3) hoặc GPA kỳ < 1.00.', 'Cảnh báo: Hàm xét duyệt tự động theo năm đào tạo.'],
          ['BR-WRN-03', 'Sinh viên bị cảnh báo học vụ 3 lần liên tiếp sẽ bị tự động chuyển trạng thái Thôi học.', 'Cảnh báo: Quy chế Bộ GD&ĐT, khóa tài khoản tự động.'],
        ],
        [1400, 5200, 2800],
        'Hệ thống 35 quy tắc nghiệp vụ tập trung (Business Rules) của hệ thống SMS',
      );

      // 4.4 Bảng Tác nhân & Phân định Giới hạn trách nhiệm;
        },
        get actorsTable() {
          return TABLE(
        ['Mã tác nhân', 'Tên tác nhân', 'Phân loại', 'Mô tả vai trò trong hệ thống'],
        [
          ['ACT-01', 'Khách vãng lai', 'Người dùng', 'Người dùng chưa đăng nhập, chỉ có quyền truy cập trang Portal Hub và chọn phân hệ đăng nhập.'],
          ['ACT-02', 'Sinh viên', 'Người dùng', 'Người học đã được cấp tài khoản, thực hiện tra cứu lộ trình, đăng ký học phần, xem điểm và nộp phúc khảo.'],
          ['ACT-03', 'Giảng viên', 'Người dùng', 'Cán bộ giảng dạy phụ trách lớp học phần, thực hiện xem danh sách lớp, nhập điểm, chốt điểm và duyệt phúc khảo.'],
          ['ACT-04', 'Quản trị viên / P. Đào tạo', 'Người dùng', 'Người quản trị cấp cao nhất, điều phối toàn bộ danh mục đào tạo, mở lớp, xếp lịch, xử lý học vụ và mở khóa điểm.'],
          ['ACT-05', 'Hệ thống gửi Mail (SMTP)', 'Hệ thống bên ngoài', 'Dịch vụ thư điện tử gửi thông báo cấp lại mật khẩu ngẫu nhiên cho người dùng khi được Admin phê duyệt.'],
          ['ACT-06', 'Bộ xử lý tệp Excel (POI)', 'Hệ thống bên trong', 'Bộ máy phân tích và kết xuất tệp bảng tính Excel (.xlsx) phục vụ nghiệp vụ nhập danh sách và xuất bảng điểm.'],
        ],
        [1200, 2200, 1800, 4200],
        'Danh mục các tác nhân (Actors) tham gia vào hệ thống SMS',
      );
        },
        get responsibilitiesTable() {
          return TABLE(
        ['Mã tác nhân', 'Trách nhiệm chính của tác nhân', 'Giới hạn trách nhiệm và Ranh giới quyền hạn'],
        [
          ['ACT-01', 'Chọn đúng cổng đăng nhập theo vai trò được phân công; cung cấp thông tin xác thực hợp lệ.', 'Không được phép gọi các điểm cuối API nghiệp vụ nội bộ; bị chặn bởi chuỗi lọc bảo mật.'],
          ['ACT-02', 'Bảo mật tài khoản; đổi mật khẩu lần đầu; tự kiểm tra điều kiện học tập; đăng ký học phần đúng hạn; chịu trách nhiệm về đơn phúc khảo.', 'Chỉ được xem và thao tác trên dữ liệu của chính mình; không thể xem điểm sinh viên khác; không được hủy học phần đã có điểm.'],
          ['ACT-03', 'Nhập điểm khách quan, chính xác; rà soát điểm trước khi chốt công bố; xử lý đơn phúc khảo công tâm; bảo mật dữ liệu lớp học.', 'Chỉ được xem và nhập điểm các lớp mình phụ trách; KHÔNG ĐƯỢC tự sửa điểm khi đã hết hạn 7 ngày; không có quyền xóa lớp học phần.'],
          ['ACT-04', 'Bảo đảm tính toàn vẹn danh mục; giám sát đợt đăng ký; phê duyệt cấp lại mật khẩu đúng quy trình; xử lý học vụ minh bạch.', 'Mọi thao tác can thiệp dữ liệu nhạy cảm (cưỡng chế sĩ số, mở khóa điểm) đều bắt buộc ghi lý do và lưu vết kiểm toán AUDIT vĩnh viễn.'],
          ['ACT-05', 'Chuyển thư chứa mật khẩu khởi tạo an toàn tới đúng địa chỉ email đã lưu trong hồ sơ.', 'Không can thiệp vào logic sinh mật khẩu; chỉ gửi tới email chính thức của người dùng.'],
          ['ACT-06', 'Phân tích chính xác dữ liệu bảng tính theo định dạng mẫu; chặn đứng các lỗi định dạng tệp.', 'Chỉ hoạt động khi dữ liệu tệp hợp lệ; nếu sai cấu trúc cột thì lập tức hủy bỏ giao dịch nạp.'],
        ],
        [1200, 4200, 4000],
        'Phân định Trách nhiệm chính và Giới hạn trách nhiệm của từng tác nhân',
      );

      // 4.5 SÁU QUY TRÌNH NGHIỆP VỤ CỐT LÕI (BPA) - CHUẨN MỰC HÀN LÂM CỦA BẠN HỌC;
        },
        get bpaProcesses() {
          const bpaProcesses = [];
      bpaProcesses.push(H3('3.4.0. Phân tích các quy trình nghiệp vụ cốt lõi (Business Process Analysis — BPA)'));
      bpaProcesses.push(P('Để làm rõ cách thức hệ thống SMS vận hành trong thực tế và khắc phục triệt để các tồn tại của phương thức thủ công, phần này chuẩn hóa và phân tích chi tiết 6 quy trình nghiệp vụ cốt lõi. Mỗi quy trình được đặc tả theo khuôn mẫu 8 thành phần chuẩn của kỹ nghệ yêu cầu: Mục đích, Phạm vi, Tác nhân tham gia, Thành phần Đầu vào/Đầu ra, Bảng các bước quy trình, Mô tả chi tiết, Bảng luồng ngoại lệ và Kết quả đạt được.'));

      // --- QUY TRÌNH 1: XÁC THỰC VÀ BẢO MẬT TÀI KHOẢN ---
      bpaProcesses.push(H3('Quy trình nghiệp vụ 1: Đăng nhập, xác thực và quản lý tài khoản người dùng'));
      bpaProcesses.push(P([b('1) Mục đích: '), run('Xác minh danh tính người dùng truy cập, cấp phát phiên làm việc không trạng thái an toàn (JWT), áp đặt rào chắn giao diện bắt buộc đổi mật khẩu mặc định ở lần đầu và bảo vệ hệ thống trước các cuộc tấn công dò quét.')]));
      bpaProcesses.push(P([b('2) Phạm vi: '), run('Áp dụng cho toàn bộ người dùng (Sinh viên, Giảng viên, Quản trị viên) khi truy cập các phân hệ của SMS.')]));
      bpaProcesses.push(...TABLE(
        ['Thành phần', 'Nội dung chi tiết'],
        [
          ['Đầu vào', 'Tên đăng nhập (Mã SV / Mã GV / Tên quản trị), Mật khẩu văn bản thô, Mã phân hệ lựa chọn tại Portal Hub.'],
          ['Hoạt động xử lý', 'Kiểm tra khóa tài khoản do brute-force; So khớp mật khẩu BCrypt; Kiểm tra trạng thái is_active; Sinh JWT HS512; Kiểm tra cờ mustChangePassword; Kích hoạt rào chắn đổi mật khẩu.'],
          ['Đầu ra', 'Token JWT hợp lệ, đối tượng LoginResponse (token, role, userId, fullName), điều hướng người dùng vào bảng điều khiển hoặc hiển thị modal đổi mật khẩu bắt buộc.'],
        ],
        [2000, 7400],
        'Thành phần Đầu vào, Xử lý và Đầu ra của Quy trình Xác thực',
      ));
      bpaProcesses.push(...TABLE(
        ['Bước', 'Giai đoạn', 'Tác nhân tham gia', 'Nội dung nghiệp vụ', 'Kết quả đạt được'],
        [
          ['1', 'Chọn phân hệ', 'Khách vãng lai (ACT-01)', 'Mở cổng Portal Hub và chọn phân hệ tương ứng (Sinh viên, Giảng viên, Quản trị)', 'Chuyển hướng đến màn hình đăng nhập đúng giao diện nhận diện'],
          ['2', 'Nhập thông tin', 'Người dùng', 'Điền tên đăng nhập và mật khẩu, nhấn nút "Đăng nhập"', 'Gửi yêu cầu HTTP POST /api/auth/login kèm thông tin xác thực'],
          ['3', 'Kiểm tra bảo vệ', 'Hệ thống SMS', 'Kiểm tra tài khoản có đang bị tạm khóa do nhập sai quá 5 lần không', 'Cho phép đi tiếp hoặc từ chối HTTP 400 nếu đang trong thời gian phạt'],
          ['4', 'Xác thực BCrypt', 'Hệ thống SMS', 'Truy vấn bảng users theo username, dùng BCrypt.matches() so khớp mật khẩu', 'Xác thực thành công hoặc ghi nhận 1 lần sai vào LoginAttemptService'],
          ['5', 'Cấp phát JWT', 'Hệ thống SMS', 'Sinh token JWT HS512 mang thông tin username, role, userId với hạn 24 giờ', 'Đóng gói LoginResponse trả về cho client'],
          ['6', 'Rào chắn đổi MK', 'Người dùng & Hệ thống', 'Nếu cờ mustChangePassword = true, giao diện kích hoạt modal khóa cứng buộc đổi MK', 'Người dùng đổi MK thành công mới được tiếp tục sử dụng hệ thống'],
        ],
        [600, 1600, 1800, 3600, 1800],
        'Các bước thực hiện Quy trình Đăng nhập và Xác thực tài khoản',
      ));
      bpaProcesses.push(...TABLE(
        ['Mã', 'Trường hợp ngoại lệ phát sinh', 'Cách xử lý nghiệp vụ của hệ thống SMS'],
        [
          ['ALT-01', 'Tên đăng nhập hoặc mật khẩu không chính xác', 'Từ chối đăng nhập, tăng bộ đếm số lần sai; trả về HTTP 400 kèm thông báo chung: "Tài khoản hoặc mật khẩu không chính xác".'],
          ['ALT-02', 'Đăng nhập sai quá 5 lần trong vòng 15 phút', 'Khóa tài khoản tạm thời 15 phút, từ chối mọi yêu cầu tiếp theo và thông báo: "Tài khoản bị tạm khóa do đăng nhập sai quá nhiều lần".'],
          ['ALT-03', 'Tài khoản ở trạng thái vô hiệu hóa (is_active = false)', 'Từ chối cấp phát token, trả về HTTP 403 Forbidden kèm thông báo: "Tài khoản đã bị đình chỉ hoặc vô hiệu hóa bởi nhà trường".'],
          ['ALT-04', 'Người dùng cố tình đóng modal bắt buộc đổi mật khẩu', 'Modal sử dụng backdrop blur cố định, chặn phím ESC và click ra ngoài; mọi API nghiệp vụ đều bị JwtAuthFilter chặn tới khi đổi MK.'],
        ],
        [1000, 3400, 5000],
        'Bảng luồng thay thế và ngoại lệ trong Quy trình Xác thực',
      ));

      // --- QUY TRÌNH 2: QUẢN LÝ DANH MỤC VÀ XẾP LỊCH ---
      bpaProcesses.push(H3('Quy trình nghiệp vụ 2: Quản lý danh mục đào tạo, mở lớp học phần và xếp thời khóa biểu'));
      bpaProcesses.push(P([b('1) Mục đích: '), run('Thiết lập khung dữ liệu đào tạo cho học kỳ, mở các lớp học phần cần thiết và phân bổ thời khóa biểu phòng học / giảng viên bảo đảm không xảy ra xung đột.')]));
      bpaProcesses.push(P([b('2) Phạm vi: '), run('Phòng Đào tạo / Quản trị viên (ACT-04) thao tác chuẩn bị trước khi mở cổng đăng ký cho sinh viên.')]));
      bpaProcesses.push(...TABLE(
        ['Thành phần', 'Nội dung chi tiết'],
        [
          ['Đầu vào', 'Thông tin môn học, học kỳ, giảng viên phụ trách, mã lớp HP, sĩ số tối đa, thứ trong tuần, tiết học và phòng học.'],
          ['Hoạt động xử lý', 'Kiểm tra tính duy nhất của mã lớp; Khởi tạo bản ghi course_sections; Kiểm tra trùng phòng findRoomConflicts(); Kiểm tra trùng lịch giảng viên findLecturerConflicts(); Lưu thời khóa biểu schedules.'],
          ['Đầu ra', 'Lớp học phần ở trạng thái OPEN với sĩ số khởi tạo 0/maxStudents; Thời khóa biểu hiển thị trên ma trận tuần toàn trường; Thông báo HTTP 200 OK.'],
        ],
        [2000, 7400],
        'Thành phần Đầu vào, Xử lý và Đầu ra của Quy trình Mở lớp và Xếp thời khóa biểu',
      ));
      bpaProcesses.push(...TABLE(
        ['Bước', 'Giai đoạn', 'Tác nhân tham gia', 'Nội dung nghiệp vụ', 'Kết quả đạt được'],
        [
          ['1', 'Khai báo môn học', 'Admin (ACT-04)', 'Khai báo mã môn, tên môn, số tín chỉ, khoa chủ quản và môn tiên quyết (nếu có)', 'Bản ghi subjects được tạo, bộ nhớ đệm @CacheEvict được làm mới'],
          ['2', 'Cấu hình học kỳ', 'Admin (ACT-04)', 'Thiết lập học kỳ hiện tại và cấu hình ngày mở/đóng cổng đăng ký học phần', 'Bản ghi semesters được kích hoạt cờ is_current = true'],
          ['3', 'Mở lớp học phần', 'Admin (ACT-04)', 'Chọn Môn–Kỳ–Giảng viên, nhập mã lớp HP và sĩ số trần (mặc định 40 sinh viên)', 'Tạo bản ghi course_sections ở trạng thái OPEN, enrolled_count = 0'],
          ['4', 'Xếp lịch & phòng', 'Admin (ACT-04)', 'Gán thứ (2–8), tiết bắt đầu–kết thúc và chọn phòng học cho lớp học phần', 'Hệ thống kích hoạt thuật toán kiểm tra xung đột thời khóa biểu'],
          ['5', 'Kiểm tra xung đột', 'Hệ thống SMS', 'Truy vấn kiểm tra phòng học đã có lớp nào học chưa và giảng viên có bị trùng giờ không', 'Xác nhận không có xung đột hoặc trả về thông báo lỗi cụ thể'],
          ['6', 'Công bố lịch học', 'Hệ thống SMS', 'Lưu bản ghi schedules, vẽ ô học phần lên lưới thời khóa biểu đào tạo toàn trường', 'Lớp học phần sẵn sàng tiếp nhận đăng ký của sinh viên'],
        ],
        [600, 1600, 1800, 3600, 1800],
        'Các bước thực hiện Quy trình Mở lớp học phần và Xếp thời khóa biểu',
      ));
      bpaProcesses.push(...TABLE(
        ['Mã', 'Trường hợp ngoại lệ phát sinh', 'Cách xử lý nghiệp vụ của hệ thống SMS'],
        [
          ['ALT-05', 'Mã lớp học phần đã tồn tại trong học kỳ', 'Hệ thống kiểm tra existsBySectionCode, từ chối yêu cầu và thông báo: "Mã lớp học phần đã tồn tại trong hệ thống".'],
          ['ALT-06', 'Phòng học bị trùng với một lớp khác cùng giờ', 'Hệ thống tìm thấy bản ghi trùng trong findRoomConflicts, trả về HTTP 400: "Phòng học [Tên phòng] đã có lớp sử dụng trong khung giờ này".'],
          ['ALT-07', 'Giảng viên bị trùng lịch dạy lớp khác', 'Hệ thống tìm thấy bản ghi trùng trong findLecturerConflicts, thông báo: "Giảng viên đã có lịch giảng dạy lớp khác vào khung giờ này".'],
          ['ALT-08', 'Tiết bắt đầu lớn hơn tiết kết thúc', 'Validation dữ liệu đầu vào chặn lại, thông báo lỗi định dạng: "Tiết bắt đầu phải nhỏ hơn hoặc bằng tiết kết thúc".'],
        ],
        [1000, 3400, 5000],
        'Bảng luồng thay thế và ngoại lệ trong Quy trình Mở lớp và Xếp lịch',
      ));

      // --- QUY TRÌNH 3: ĐĂNG KÝ HỌC PHẦN VÀ KHÓA BI QUAN ---
      bpaProcesses.push(H3('Quy trình nghiệp vụ 3: Đăng ký học phần, hủy đăng ký và xử lý tranh chấp sĩ số đồng thời'));
      bpaProcesses.push(P([b('1) Mục đích: '), run('Cho phép sinh viên chủ động đăng ký môn học theo kế hoạch cá nhân; tự động kiểm tra và áp đặt toàn bộ 5 ràng buộc học chế tín chỉ; xử lý triệt để điều kiện tranh chấp (race condition) khi nhiều sinh viên cùng đăng ký một lớp học phần sắp đầy.')]));
      bpaProcesses.push(P([b('2) Phạm vi: '), run('Sinh viên (ACT-02) thực hiện trong khoảng thời gian cổng đăng ký học phần của học kỳ đang mở.')]));
      bpaProcesses.push(...TABLE(
        ['Thành phần', 'Nội dung chi tiết'],
        [
          ['Đầu vào', 'Mã sinh viên (lấy từ JWT token); Mã lớp học phần (sectionId) được chọn đăng ký hoặc hủy.'],
          ['Hoạt động xử lý', 'Kiểm tra cổng mở; Lấy khóa bi quan SELECT ... FOR UPDATE trên dòng lớp học phần; Kiểm tra môn tiên quyết (BR-REG-02); Kiểm tra trùng lịch (BR-REG-03); Kiểm tra trần 30 tín chỉ (BR-REG-04); Kiểm tra còn chỗ sĩ số (BR-REG-05); INSERT bản ghi enrollments; Trigger CSDL tăng enrolled_count +1.'],
          ['Đầu ra', 'Bản ghi đăng ký ở trạng thái ENROLLED; Sĩ số lớp cập nhật chính xác; Môn học hiển thị tức thì trên TKB cá nhân sinh viên; Thông báo thành công HTTP 200.'],
        ],
        [2000, 7400],
        'Thành phần Đầu vào, Xử lý và Đầu ra của Quy trình Đăng ký học phần',
      ));
      bpaProcesses.push(...TABLE(
        ['Bước', 'Giai đoạn', 'Tác nhân tham gia', 'Nội dung nghiệp vụ', 'Kết quả đạt được'],
        [
          ['1', 'Tra cứu lớp mở', 'Sinh viên (ACT-02)', 'Mở màn hình Đăng ký học phần, tìm kiếm lớp theo môn học mong muốn', 'Danh sách lớp mở hiển thị kèm số chỗ còn trống thời gian thực'],
          ['2', 'Nhấn đăng ký', 'Sinh viên (ACT-02)', 'Chọn lớp học phần phù hợp và nhấn nút "Đăng ký"', 'Gửi yêu cầu HTTP POST /api/enrollments kèm sectionId'],
          ['3', 'Kiểm tra cổng', 'Hệ thống SMS', 'Đối chiếu thời điểm hiện tại với registrationStart và registrationEnd của kỳ', 'Hợp lệ thì tiếp tục, quá hạn thì từ chối ngay lập tức'],
          ['4', 'Khóa bi quan', 'Hệ thống SMS', 'Thực thi câu lệnh SELECT ... FOR UPDATE WHERE id = ? trên bảng course_sections', 'Dòng lớp học phần được khóa độc quyền (X-lock); các yêu cầu khác cùng lớp phải chờ'],
          ['5', 'Kiểm tra tiên quyết', 'Hệ thống SMS', 'Truy vấn lịch sử điểm của sinh viên đối với các môn tiên quyết của môn học này', 'Điểm các môn tiên quyết đều ≥ 4.0 hoặc ném ngoại lệ báo thiếu điều kiện'],
          ['6', 'Kiểm tra trùng lịch', 'Hệ thống SMS', 'Đối chiếu thứ/tiết của lớp mới với danh sách các lớp sinh viên đã đăng ký trong kỳ', 'Không trùng lịch học hoặc ném ngoại lệ chỉ rõ môn bị xung đột'],
          ['7', 'Kiểm tra trần tín chỉ', 'Hệ thống SMS', 'Cộng dồn số tín chỉ hiện tại với số tín chỉ môn mới và so sánh với trần 30', 'Tổng tín chỉ ≤ 30 hoặc từ chối do vượt hạn mức cho phép'],
          ['8', 'Kiểm tra sĩ số', 'Hệ thống SMS', 'So sánh enrolled_count hiện tại với max_students của lớp học phần', 'Còn ít nhất 1 chỗ trống hoặc từ chối an toàn do lớp đã đầy'],
          ['9', 'Ghi nhận đăng ký', 'Hệ thống SMS', 'INSERT bản ghi vào bảng enrollments, trigger CSDL tăng enrolled_count thêm 1', 'Giao dịch commit thành công, giải phóng khóa bi quan'],
          ['10', 'Cập nhật giao diện', 'Hệ thống SMS', 'Trả về ApiResponse thành công; giao diện sinh viên hiện toast xanh và thêm vào TKB', 'Sinh viên ghi danh chính thức thành công vào lớp học phần'],
        ],
        [600, 1600, 1800, 3600, 1800],
        'Các bước thực hiện Quy trình Đăng ký học phần và Kiểm soát tranh chấp sĩ số',
      ));
      bpaProcesses.push(...TABLE(
        ['Mã', 'Trường hợp ngoại lệ phát sinh', 'Cách xử lý nghiệp vụ của hệ thống SMS'],
        [
          ['ALT-09', 'Cổng đăng ký chưa mở hoặc đã quá hạn', 'Hệ thống từ chối yêu cầu, trả về HTTP 400 Bad Request: "Đợt đăng ký học phần chưa mở hoặc đã kết thúc".'],
          ['ALT-10', 'Sinh viên chưa hoàn thành môn tiên quyết', 'Hệ thống từ chối đăng ký, trả về HTTP 400: "Bạn chưa đạt môn tiên quyết [Tên môn tiên quyết] (yêu cầu điểm tổng kết ≥ 4.0)".'],
          ['ALT-11', 'Lớp học phần bị trùng lịch với môn đã đăng ký', 'Hệ thống từ chối đăng ký, trả về HTTP 400: "Trùng lịch học vào Thứ [X], Tiết [Y-Z] với lớp học phần [Mã Lớp]".'],
          ['ALT-12', 'Tổng tín chỉ vượt quá giới hạn 30 tín chỉ', 'Hệ thống từ chối đăng ký, trả về HTTP 400: "Vượt quá giới hạn tối đa 30 tín chỉ cho phép đăng ký trong một học kỳ".'],
          ['ALT-13', 'Lớp học phần đã hết chỗ (vừa đủ sĩ số)', 'Nhờ khóa bi quan, yêu cầu đến sau đọc được enrolled_count == max_students, hệ thống từ chối: "Lớp học phần đã hết chỗ trống".'],
          ['ALT-14', 'Hủy môn khi lớp đã có điểm thành phần', 'Sinh viên yêu cầu hủy nhưng lớp đã phát sinh điểm, hệ thống từ chối: "Không thể hủy học phần đã có điểm đánh giá".'],
        ],
        [1000, 3400, 5000],
        'Bảng luồng thay thế và ngoại lệ trong Quy trình Đăng ký học phần',
      ));

      // --- QUY TRÌNH 4: NHẬP ĐIỂM, CHỐT ĐIỂM VÀ CỬA SỔ 7 NGÀY ---
      bpaProcesses.push(H3('Quy trình nghiệp vụ 4: Nhập điểm thành phần, tính điểm tổng kết và chốt sổ điểm có thời hạn'));
      bpaProcesses.push(P([b('1) Mục đích: '), run('Cung cấp công cụ cho giảng viên nhập điểm chuyên cần, giữa kỳ, cuối kỳ; tự động tính điểm tổng kết theo trọng số và xét điểm liệt; kiểm soát quy trình chốt công bố điểm kèm cửa sổ ân hạn 7 ngày bảo đảm tính toàn vẹn học thuật.')]));
      bpaProcesses.push(P([b('2) Phạm vi: '), run('Giảng viên phụ trách lớp học phần (ACT-03) và Phòng Đào tạo (ACT-04).')]));
      bpaProcesses.push(...TABLE(
        ['Thành phần', 'Nội dung chi tiết'],
        [
          ['Đầu vào', 'Mã lớp học phần; Lưới điểm 4 cột (CC1, CC2, GK, CK) của từng sinh viên (nhập tay hoặc import từ tệp Excel).'],
          ['Hoạt động xử lý', 'Kiểm tra quyền giảng viên phụ trách; Kiểm tra miền điểm [0.0, 10.0]; Tính điểm TK = CC1×5% + CC2×5% + GK×30% + CK×60%; Xét điểm liệt CK < 3.0 (ép F); Quy đổi thang điểm chữ và hệ 4; Chốt điểm (finalize); Đặt mốc finalizedAt và đếm ngược cửa sổ 7 ngày.'],
          ['Đầu ra', 'Bản ghi grades được lưu bền vững; Điểm chữ, điểm hệ 4 và điểm TK hiển thị trên sổ điểm; Bảng điểm chuyển trạng thái ĐÃ CÔNG BỐ; Sinh viên tra cứu được điểm.']
        ],
        [2000, 7400],
        'Thành phần Đầu vào, Xử lý và Đầu ra của Quy trình Nhập và Chốt điểm',
      ));
      bpaProcesses.push(...TABLE(
        ['Bước', 'Giai đoạn', 'Tác nhân tham gia', 'Nội dung nghiệp vụ', 'Kết quả đạt được'],
        [
          ['1', 'Mở sổ điểm', 'Giảng viên (ACT-03)', 'Vào mục "Sổ điểm", chọn lớp học phần phụ trách để mở lưới nhập điểm', 'Lưới điểm hiển thị danh sách sinh viên cùng 4 cột điểm thành phần'],
          ['2', 'Nhập điểm', 'Giảng viên (ACT-03)', 'Nhập điểm trực tiếp trên từng ô hoặc bấm nút "Import Excel" để nạp từ file', 'Dữ liệu điểm được đưa vào trạng thái chỉnh sửa trên giao diện'],
          ['3', 'Tính điểm tự động', 'Hệ thống SMS', 'Thực thi hàm tính điểm tổng kết theo trọng số 5–5–30–60 và kiểm tra quy tắc điểm liệt', 'Điểm tổng kết, điểm hệ 4 và điểm chữ hiển thị tức thì trên lưới'],
          ['4', 'Lưu tạm thời', 'Giảng viên (ACT-03)', 'Bấm nút "Lưu nháp" để lưu tiến độ chấm điểm mà chưa công bố cho sinh viên', 'Bản ghi grades được lưu CSDL với cờ is_finalized = false'],
          ['5', 'Chốt công bố điểm', 'Giảng viên (ACT-03)', 'Bấm nút "Chốt & Công bố điểm" sau khi đã hoàn tất chấm 100% sinh viên', 'Hệ thống kiểm tra điều kiện đủ điểm và hiển thị hộp thoại xác nhận'],
          ['6', 'Khóa có thời hạn', 'Hệ thống SMS', 'Ghi nhận is_finalized = true, đặt finalized_at = NOW(), mở cửa sổ sửa 7 ngày', 'Điểm công bố cho sinh viên, nhãn ĐÃ CÔNG BỐ hiển thị trên sổ điểm'],
          ['7', 'Khóa cứng quá hạn', 'Hệ thống SMS', 'Khi thời gian hiện tại vượt quá finalizedAt + 7 ngày, hệ thống khóa cứng bảng điểm', 'Giảng viên không thể tự sửa điểm; chỉ Admin mới có quyền mở khóa'],
        ],
        [600, 1600, 1800, 3600, 1800],
        'Các bước thực hiện Quy trình Nhập điểm, Tính điểm và Chốt sổ điểm',
      ));
      bpaProcesses.push(...TABLE(
        ['Mã', 'Trường hợp ngoại lệ phát sinh', 'Cách xử lý nghiệp vụ của hệ thống SMS'],
        [
          ['ALT-15', 'Điểm nhập vào ngoài khoảng [0.0, 10.0]', 'Hệ thống kiểm tra validation, báo lỗi ô vi phạm và không cho phép lưu: "Điểm phải nằm trong thang điểm từ 0.0 đến 10.0".'],
          ['ALT-16', 'Chốt điểm khi vẫn còn sinh viên thiếu điểm', 'Hệ thống phát hiện còn sinh viên có điểm null, từ chối chốt: "Không thể chốt bảng điểm khi chưa nhập đủ điểm cho 100% sinh viên".'],
          ['ALT-17', 'Giảng viên sửa điểm khi đã hết hạn 7 ngày', 'Hệ thống kiểm tra isEditWindowExpired(), từ chối cập nhật: "Bảng điểm đã bị khóa cứng do quá thời hạn 7 ngày. Vui lòng liên hệ Phòng Đào tạo".'],
          ['ALT-18', 'Người dùng không phải giảng viên của lớp', 'Hệ thống kiểm tra RBAC qua @PreAuthorize, trả về HTTP 403 Forbidden: "Bạn không có quyền thao tác trên lớp học phần này".'],
        ],
        [1000, 3400, 5000],
        'Bảng luồng thay thế và ngoại lệ trong Quy trình Nhập và Chốt điểm',
      ));

      // --- QUY TRÌNH 5: PHÚC KHẢO ĐIỂM HỌC PHẦN ---
      bpaProcesses.push(H3('Quy trình nghiệp vụ 5: Tiếp nhận, xét duyệt và xử lý đơn phúc khảo điểm học phần'));
      bpaProcesses.push(P([b('1) Mục đích: '), run('Cung cấp kênh giải quyết khiếu nại điểm số minh bạch, trực tuyến cho sinh viên; hỗ trợ giảng viên và phòng đào tạo thẩm định bài thi và điều chỉnh điểm hợp lệ kèm lưu vết lý do.')]));
      bpaProcesses.push(P([b('2) Phạm vi: '), run('Sinh viên (ACT-02), Giảng viên phụ trách (ACT-03) và Quản trị viên (ACT-04).')]));
      bpaProcesses.push(...TABLE(
        ['Thành phần', 'Nội dung chi tiết'],
        [
          ['Đầu vào', 'Mã lớp học phần, cột điểm khiếu nại (CC2, GK, CK, Toàn bộ), lý do phúc khảo cụ thể của sinh viên.'],
          ['Hoạt động xử lý', 'Kiểm tra điều kiện bảng điểm đã chốt và còn trong hạn 7 ngày; Tạo bản ghi grade_appeals ở trạng thái PENDING; Giảng viên chuyển trạng thái IN_REVIEW; Thẩm định bài thi; Phê duyệt (nhập điểm mới) hoặc Từ chối (nhập lý do); Tính toán lại điểm tổng kết.'],
          ['Đầu ra', 'Đơn phúc khảo hoàn tất (APPROVED / REJECTED); Bảng điểm sinh viên tự động cập nhật điểm mới; Thông báo kết quả hiển thị trên màn hình sinh viên.'],
        ],
        [2000, 7400],
        'Thành phần Đầu vào, Xử lý và Đầu ra của Quy trình Phúc khảo điểm',
      ));
      bpaProcesses.push(...TABLE(
        ['Bước', 'Giai đoạn', 'Tác nhân tham gia', 'Nội dung nghiệp vụ', 'Kết quả đạt được'],
        [
          ['1', 'Nộp đơn phúc khảo', 'Sinh viên (ACT-02)', 'Vào Bảng điểm, chọn môn học đã chốt điểm và nhấn nút "Phúc khảo điểm"', 'Hộp thoại nộp đơn hiển thị yêu cầu chọn cột điểm và nhập lý do'],
          ['2', 'Kiểm tra điều kiện', 'Hệ thống SMS', 'Kiểm tra bảng điểm đã finalized chưa, còn trong hạn 7 ngày không và đã có đơn chờ chưa', 'Tạo bản ghi grade_appeals với trạng thái PENDING'],
          ['3', 'Tiếp nhận thụ lý', 'Giảng viên (ACT-03)', 'Mở mục "Phúc khảo", xem danh sách đơn chờ duyệt và chuyển sang IN_REVIEW', 'Sinh viên thấy trạng thái đơn chuyển sang Đang xử lý'],
          ['4', 'Thẩm định bài thi', 'Giảng viên (ACT-03)', 'Rà soát lại bài thi gốc, đối chiếu thang điểm và đưa ra kết luận đánh giá', 'Xác định giữ nguyên điểm cũ hoặc điều chỉnh điểm mới'],
          ['5', 'Ra quyết định', 'Giảng viên (ACT-03)', 'Chọn APPROVED (nhập điểm mới) hoặc REJECTED (nhập lý do giải thích cụ thể)', 'Gửi yêu cầu cập nhật trạng thái đơn phúc khảo lên máy chủ'],
          ['6', 'Cập nhật điểm mới', 'Hệ thống SMS', 'Cập nhật điểm mới vào bảng grades, tính lại điểm tổng kết, GPA/CPA và đóng đơn', 'Sinh viên nhận được thông báo kết quả phúc khảo trên giao diện'],
        ],
        [600, 1600, 1800, 3600, 1800],
        'Các bước thực hiện Quy trình Tiếp nhận và Xử lý đơn phúc khảo',
      ));
      bpaProcesses.push(...TABLE(
        ['Mã', 'Trường hợp ngoại lệ phát sinh', 'Cách xử lý nghiệp vụ của hệ thống SMS'],
        [
          ['ALT-19', 'Nộp đơn phúc khảo khi bảng điểm chưa chốt', 'Hệ thống từ chối tạo đơn, thông báo: "Học phần này chưa công bố bảng điểm chính thức, không thể phúc khảo".'],
          ['ALT-20', 'Nộp đơn khi đã quá hạn 7 ngày kể từ lúc chốt', 'Hệ thống kiểm tra thời hạn, từ chối: "Đã quá thời hạn 7 ngày cho phép gửi đơn phúc khảo kể từ ngày công bố điểm".'],
          ['ALT-21', 'Sinh viên nộp đơn trùng lặp cho cùng một môn', 'Hệ thống phát hiện đang có đơn PENDING, từ chối: "Bạn đang có một đơn phúc khảo đang chờ xử lý cho môn học này".'],
          ['ALT-22', 'Phê duyệt đơn nhưng để trống điểm mới', 'Validation nghiệp vụ chặn lại, yêu cầu: "Bắt buộc phải nhập điểm mới khi chấp thuận đơn phúc khảo".'],
        ],
        [1000, 3400, 5000],
        'Bảng luồng thay thế và ngoại lệ trong Quy trình Phúc khảo điểm',
      ));

      // --- QUY TRÌNH 6: TỔNG HỢP BẢNG ĐIỂM VÀ CẢNH BÁO HỌC VỤ ---
      bpaProcesses.push(H3('Quy trình nghiệp vụ 6: Tổng hợp bảng điểm, tính toán GPA/CPA và xét duyệt cảnh báo học vụ'));
      bpaProcesses.push(P([b('1) Mục đích: '), run('Tự động hóa hoàn toàn việc tổng hợp kết quả học tập của sinh viên theo từng học kỳ và toàn khóa; tính điểm trung bình học kỳ (GPA), điểm tích lũy (CPA) theo nguyên tắc Best-attempt; xét duyệt và phân loại cảnh báo học vụ theo đúng Quy chế đào tạo của Bộ GD&ĐT.')]));
      bpaProcesses.push(P([b('2) Phạm vi: '), run('Sinh viên (ACT-02) tra cứu cá nhân và Phòng Đào tạo (ACT-04) quản lý danh sách cảnh báo toàn trường.')]));
      bpaProcesses.push(...TABLE(
        ['Thành phần', 'Nội dung chi tiết'],
        [
          ['Đầu vào', 'Dữ liệu các học phần đã chốt điểm (is_finalized = true); Số tín chỉ từng môn; Năm đào tạo của sinh viên.'],
          ['Hoạt động xử lý', 'Lọc danh sách điểm đã chốt; Gom nhóm theo học kỳ; Tính GPA kỳ = Tổng(Điểm hệ 4 × Tín chỉ) / Tổng tín chỉ kỳ; Chọn điểm lần học cao nhất của từng môn để tính CPA tích lũy; Đối chiếu CPA/GPA với ngưỡng cảnh báo học vụ 3 mức.'],
          ['Đầu ra', 'Bảng điểm chi tiết từng học kỳ; CPA tích lũy và xếp loại học lực; Danh sách sinh viên bị cảnh báo học vụ kèm mức cảnh báo (Mức 1, Mức 2, Mức 3/Thôi học); Tệp báo cáo CSV.'],
        ],
        [2000, 7400],
        'Thành phần Đầu vào, Xử lý và Đầu ra của Quy trình Tính điểm CPA và Cảnh báo học vụ',
      ));
      bpaProcesses.push(...TABLE(
        ['Bước', 'Giai đoạn', 'Tác nhân tham gia', 'Nội dung nghiệp vụ', 'Kết quả đạt được'],
        [
          ['1', 'Tra cứu bảng điểm', 'Sinh viên (ACT-02)', 'Truy cập màn hình "Bảng điểm", hệ thống gọi GET /api/transcript/me', 'Hệ thống nạp toàn bộ lịch sử điểm các môn đã chốt của sinh viên'],
          ['2', 'Gom nhóm học kỳ', 'Hệ thống SMS', 'Phân loại các môn học theo từng học kỳ đào tạo và tính tổng số tín chỉ đăng ký', 'Dựng cấu trúc bảng điểm trực quan theo từng kỳ học'],
          ['3', 'Tính GPA học kỳ', 'Hệ thống SMS', 'Thực thi công thức trung bình có trọng số tín chỉ trên thang điểm 4 cho học kỳ đó', 'Hiển thị điểm GPA học kỳ và số tín chỉ đạt trong kỳ'],
          ['4', 'Tính CPA tích lũy', 'Hệ thống SMS', 'Áp dụng quy tắc Best-attempt: nếu học lại môn thì chỉ lấy điểm của lần học tốt nhất', 'Xác định chính xác CPA tích lũy và số tín chỉ tích lũy toàn khóa'],
          ['5', 'Quét cảnh báo tự động', 'Hệ thống SMS', 'Quản trị viên mở trang Cảnh báo học vụ, hệ thống tự động quét CPA của toàn trường', 'Đối chiếu ngưỡng CPA theo năm đào tạo (Năm 1: 1.20, Năm 2: 1.40, Năm 3: 1.60)'],
          ['6', 'Phân loại & Xuất file', 'Admin (ACT-04)', 'Xem danh sách sinh viên vi phạm, phân loại mức cảnh báo và bấm "Xuất CSV"', 'Kết xuất danh sách cảnh báo học vụ phục vụ hội đồng xét kỷ luật học vụ'],
        ],
        [600, 1600, 1800, 3600, 1800],
        'Các bước thực hiện Quy trình Tính toán GPA/CPA và Cảnh báo học vụ',
      ));
      bpaProcesses.push(...TABLE(
        ['Mã', 'Trường hợp ngoại lệ phát sinh', 'Cách xử lý nghiệp vụ của hệ thống SMS'],
        [
          ['ALT-23', 'Môn học chưa được chốt điểm chính thức', 'Môn học có is_finalized = false bị loại khỏi phép tính GPA/CPA, không làm sai lệch điểm tích lũy chính thức.'],
          ['ALT-24', 'Sinh viên chưa hoàn thành bất kỳ học phần nào', 'GPA và CPA được gán mặc định bằng 0.00, tổng tín chỉ tích lũy hiển thị 0 tín chỉ.'],
          ['ALT-25', 'Sinh viên bị cảnh báo học vụ 3 lần liên tiếp', 'Hệ thống đánh dấu mức CẢNH BÁO 3 (BUỘC THÔI HỌC); khi Admin xác nhận, tài khoản sinh viên tự động bị khóa đăng nhập.'],
        ],
        [1000, 3400, 5000],
        'Bảng luồng thay thế và ngoại lệ trong Quy trình Cảnh báo học vụ',
      ));

      // 4.6 Bảng Use Case chuẩn hóa kèm mapping FR
          return bpaProcesses;
        },
        get dataRequirements() {
          return [
        H3('3.4.11. Yêu cầu dữ liệu (Data Requirements)'),
        P('Bên cạnh các yêu cầu chức năng và mô hình hóa hành vi, hệ thống SMS xác lập các yêu cầu dữ liệu nghiêm ngặt nhằm bảo đảm tính toàn vẹn, tính lịch sử và độ tin cậy của thông tin đào tạo:'),
        ...BULLETS([
          [b('Tính toàn vẹn tham chiếu và ràng buộc khóa: '), run('Mọi quan hệ giữa Sinh viên – Lớp sinh hoạt – Khoa, và giữa Lớp học phần – Môn học – Giảng viên – Học kỳ đều được ràng buộc bởi khóa ngoại (Foreign Key) với chính sách ON DELETE RESTRICT nhằm ngăn chặn hiện tượng xóa mồ côi (orphan records).')],
          [b('Tính bất biến của dữ liệu điểm số sau khi khóa sổ: '), run('Sau khi cửa sổ chỉnh sửa 7 ngày kết thúc, bản ghi điểm thi chuyển sang trạng thái khóa cứng (read-only). Mọi yêu cầu thay đổi điểm sau đó bắt buộc phải đi qua quy trình mở khóa của Quản trị viên và được lưu vết trong nhật ký kiểm toán AUDIT.')],
          [b('Tính duy nhất và chuẩn hóa mã định danh: '), run('Mã sinh viên, mã giảng viên, mã môn học, mã lớp học phần và mã phòng học phải tuân thủ chuẩn quy ước viết hoa, không dấu, không chứa khoảng trắng và là duy nhất trên toàn hệ thống.')],
          [b('Tính lịch sử và kiểm toán (Audit Trail): '), run('Các thao tác ghi nhạy cảm (cưỡng chế vượt sĩ số, mở khóa bảng điểm, đổi mật khẩu) bắt buộc phải lưu vết thời điểm thực hiện (timestamp), định danh người thực hiện (actorId) và nội dung giải trình lý do.')],
        ]),
      ];
        },
      };
    },
  };
};
