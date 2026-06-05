const mongoose = require('mongoose');

const MONGO_DB = 'mongodb+srv://tranthanhanhtai2909:Tai123456@cluster0.wq6op.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Define the schema inline to avoid module path issues
const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  slug: { type: String, required: true },
  videoType: { type: String, enum: ['youtube', 'vimeo', 'bunny'], default: 'youtube' },
  videoId: { type: String, default: '' },
  duration: { type: String, default: '' },
  isFree: { type: Boolean, default: false }
});

const SectionSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  lessons: [LessonSchema]
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 4.8 },
  reviews: { type: Number, default: 0 },
  students: { type: Number, default: 0 },
  overview: { type: String, default: '' },
  description: { type: String, default: '' },
  grade: { type: Number, enum: [10, 11, 12], default: 12 },
  sections: [SectionSchema]
}, { timestamps: true });

const Course = mongoose.model('Course', CourseSchema);

// Base Section Structure for Grade 12
const getGrade12Sections = (step) => {
  const stepLabel = step === 1 ? 'Nền tảng' : step === 2 ? 'Vận dụng' : 'Vận dụng cao';
  const prefix = step === 1 ? 'Step 1' : step === 2 ? 'Step 2' : 'Step 3';
  const isFreeFirst = step === 1;

  return [
    {
      sectionTitle: "CHƯƠNG I. ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ",
      lessons: [
        {
          title: `Bài 1. Tính đơn điệu và cực trị của hàm số (${stepLabel})`,
          subtitle: step === 1 
            ? 'Cách xét dấu đạo hàm, lập bảng biến thiên và tìm điểm cực trị'
            : step === 2 
              ? 'Bài toán tìm tham số m để hàm số đơn điệu, cực trị mức độ vận dụng'
              : 'Kỹ thuật cô lập tham số m, cực trị chứa dấu giá trị tuyệt đối nâng cao',
          slug: `${prefix.toLowerCase()}-bai-1-tinh-don-dieu-va-cuc-tri`,
          videoType: 'youtube',
          videoId: '9DWqSXJ6zDg',
          duration: '45',
          isFree: isFreeFirst
        },
        {
          title: `Bài 2. Giá trị lớn nhất và giá trị nhỏ nhất của hàm số (${stepLabel})`,
          subtitle: 'Tìm GTLN, GTNN trên đoạn và trên khoảng',
          slug: `${prefix.toLowerCase()}-bai-2-gtln-gtnn`,
          videoType: 'youtube',
          videoId: 'abc123xyz45',
          duration: '40',
          isFree: false
        },
        {
          title: `Bài 3. Đường tiệm cận của đồ thị hàm số (${stepLabel})`,
          subtitle: 'Định nghĩa và cách tìm tiệm cận đứng, tiệm cận ngang',
          slug: `${prefix.toLowerCase()}-bai-3-duong-tiem-can`,
          videoType: 'youtube',
          videoId: 'def456uvw78',
          duration: '35',
          isFree: false
        },
        {
          title: `Bài 4. Khảo sát sự biến thiên và vẽ đồ thị hàm số (${stepLabel})`,
          subtitle: 'Các bước khảo sát hàm số bậc ba, phân thức bậc nhất',
          slug: `${prefix.toLowerCase()}-bai-4-khao-sat-do-thi`,
          videoType: 'youtube',
          videoId: 'ghi789rst00',
          duration: '50',
          isFree: false
        },
        {
          title: `Bài 5. Ứng dụng đạo hàm giải quyết một số bài toán thực tế (${stepLabel})`,
          subtitle: 'Tối ưu hóa chi phí, thể tích hộp và các bài toán kinh tế',
          slug: `${prefix.toLowerCase()}-bai-5-ung-dung-thuc-te`,
          videoType: 'youtube',
          videoId: 'jkl112mno33',
          duration: '45',
          isFree: false
        },
        {
          title: `Bài tập cuối chương I (${stepLabel})`,
          subtitle: 'Chữa chi tiết các dạng bài tập trọng tâm chương I',
          slug: `${prefix.toLowerCase()}-bai-tap-cuoi-chuong-1`,
          videoType: 'youtube',
          videoId: 'qrs445tuv66',
          duration: '60',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG II. VECTƠ VÀ HỆ TRỤC TOẠ ĐỘ TRONG KHÔNG GIAN",
      lessons: [
        {
          title: `Bài 6. Vectơ trong không gian (${stepLabel})`,
          subtitle: 'Quy tắc hình hộp, sự đồng phẳng của 3 vectơ',
          slug: `${prefix.toLowerCase()}-bai-6-vecto-trong-khong-gian`,
          videoType: 'youtube',
          videoId: 'wxy778zab99',
          duration: '30',
          isFree: isFreeFirst
        },
        {
          title: `Bài 7. Hệ trục toạ độ trong không gian (${stepLabel})`,
          subtitle: 'Tọa độ điểm, tọa độ vectơ hệ Oxyz',
          slug: `${prefix.toLowerCase()}-bai-7-he-truc-toa-do-oxyz`,
          videoType: 'youtube',
          videoId: 'cde001fgh22',
          duration: '25',
          isFree: false
        },
        {
          title: `Bài 8. Biểu thức toạ độ của các phép toán vectơ (${stepLabel})`,
          subtitle: 'Tích vô hướng, tích có hướng và ứng dụng',
          slug: `${prefix.toLowerCase()}-bai-8-bieu-thuc-toa-do-vecto`,
          videoType: 'youtube',
          videoId: 'ijk334lmn55',
          duration: '35',
          isFree: false
        },
        {
          title: `Bài tập cuối chương II (${stepLabel})`,
          subtitle: 'Luyện tập tổng hợp Oxyz phần cơ bản',
          slug: `${prefix.toLowerCase()}-bai-tap-cuoi-chuong-2`,
          videoType: 'youtube',
          videoId: 'opq667rst88',
          duration: '45',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG III. CÁC SỐ ĐẶC TRƯNG ĐO MỨC ĐỘ PHÂN TÁN CỦA MẪU SỐ LIỆU GHÉP NHÓM",
      lessons: [
        {
          title: `Bài 9. Khoảng biến thiên và khoảng tứ phân vị (${stepLabel})`,
          subtitle: 'Xác định R và IQR cho mẫu số liệu ghép nhóm',
          slug: `${prefix.toLowerCase()}-bai-9-khoang-bien-thien-tu-phan-vi`,
          videoType: 'youtube',
          videoId: 'uvw990xyz11',
          duration: '25',
          isFree: isFreeFirst
        },
        {
          title: `Bài 10. Phương sai và độ lệch chuẩn (${stepLabel})`,
          subtitle: 'Đánh giá mức độ phân tán của số liệu',
          slug: `${prefix.toLowerCase()}-bai-10-phuong-sai-do-lech-chuan`,
          videoType: 'youtube',
          videoId: 'abc223def44',
          duration: '30',
          isFree: false
        },
        {
          title: `Bài tập cuối chương III (${stepLabel})`,
          subtitle: 'Chữa bài tập thống kê xác suất lớp 12 mới',
          slug: `${prefix.toLowerCase()}-bai-tap-cuoi-chuong-3`,
          videoType: 'youtube',
          videoId: 'ghi556jkl77',
          duration: '40',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG IV. NGUYÊN HÀM VÀ TÍCH PHÂN",
      lessons: [
        {
          title: `Bài 11. Nguyên hàm (${stepLabel})`,
          subtitle: 'Bảng nguyên hàm cơ bản và phương pháp đổi biến số',
          slug: `${prefix.toLowerCase()}-bai-11-nguyen-ham`,
          videoType: 'youtube',
          videoId: 'mno889pqr00',
          duration: '35',
          isFree: isFreeFirst
        },
        {
          title: `Bài 12. Tích phân (${stepLabel})`,
          subtitle: 'Tính chất tích phân và phương pháp tính',
          slug: `${prefix.toLowerCase()}-bai-12-tich-phan`,
          videoType: 'youtube',
          videoId: 'stu112vwx33',
          duration: '40',
          isFree: false
        },
        {
          title: `Bài 13. Ứng dụng hình học của tích phân (${stepLabel})`,
          subtitle: 'Tính diện tích hình phẳng và thể tích khối tròn xoay',
          slug: `${prefix.toLowerCase()}-bai-13-ung-dung-tich-phan`,
          videoType: 'youtube',
          videoId: 'yza445bcd66',
          duration: '35',
          isFree: false
        },
        {
          title: `Bài tập cuối chương IV (${stepLabel})`,
          subtitle: 'Luyện đề phần Nguyên hàm - Tích phân',
          slug: `${prefix.toLowerCase()}-bai-tap-cuoi-chuong-4`,
          videoType: 'youtube',
          videoId: 'efg778hij99',
          duration: '50',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG V. PHƯƠNG PHÁP TOẠ ĐỘ TRONG KHÔNG GIAN",
      lessons: [
        {
          title: `Bài 14. Phương trình mặt phẳng (${stepLabel})`,
          subtitle: 'Vectơ pháp tuyến và phương trình tổng quát',
          slug: `${prefix.toLowerCase()}-bai-14-phuong-trinh-mat-phang`,
          videoType: 'youtube',
          videoId: 'klm001nop22',
          duration: '30',
          isFree: isFreeFirst
        },
        {
          title: `Bài 15. Phương trình đường thẳng trong không gian (${stepLabel})`,
          subtitle: 'Phương trình tham số và chính tắc của đường thẳng',
          slug: `${prefix.toLowerCase()}-bai-15-phuong-trinh-duong-thang`,
          videoType: 'youtube',
          videoId: 'qrs334tuv55',
          duration: '35',
          isFree: false
        },
        {
          title: `Bài 16. Công thức tính góc trong không gian (${stepLabel})`,
          subtitle: 'Góc giữa 2 đường thẳng, 2 mặt phẳng, đường và mặt',
          slug: `${prefix.toLowerCase()}-bai-16-cong-thuc-tinh-goc`,
          videoType: 'youtube',
          videoId: 'wxy667zab88',
          duration: '25',
          isFree: false
        },
        {
          title: `Bài 17. Phương trình mặt cầu (${stepLabel})`,
          subtitle: 'Xác định tâm, bán kính và sự tương giao',
          slug: `${prefix.toLowerCase()}-bai-17-phuong-trinh-mat-cau`,
          videoType: 'youtube',
          videoId: 'cde990fgh11',
          duration: '25',
          isFree: false
        },
        {
          title: `Bài tập cuối chương V (${stepLabel})`,
          subtitle: 'Tổng ôn Oxyz và các bài toán cực trị hình học',
          slug: `${prefix.toLowerCase()}-bai-tap-cuoi-chuong-5`,
          videoType: 'youtube',
          videoId: 'ijk223lmn44',
          duration: '55',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG VI. XÁC SUẤT CÓ ĐIỀU KIỆN",
      lessons: [
        {
          title: `Bài 18. Xác suất có điều kiện (${stepLabel})`,
          subtitle: 'Định nghĩa và bài tập tính xác suất có điều kiện',
          slug: `${prefix.toLowerCase()}-bai-18-xac-suat-co-dieu-kien`,
          videoType: 'youtube',
          videoId: 'opq556rst77',
          duration: '30',
          isFree: isFreeFirst
        },
        {
          title: `Bài 19. Công thức xác suất toàn phần và công thức Bayes (${stepLabel})`,
          subtitle: 'Phương pháp vẽ sơ đồ hình cây để giải bài tập',
          slug: `${prefix.toLowerCase()}-bai-19-cong-thuc-toan-phan-bayes`,
          videoType: 'youtube',
          videoId: 'uvw889xyz00',
          duration: '35',
          isFree: false
        },
        {
          title: `Bài tập cuối chương VI (${stepLabel})`,
          subtitle: 'Luyện tập các dạng toán Xác suất 12 trọng tâm',
          slug: `${prefix.toLowerCase()}-bai-tap-cuoi-chuong-6`,
          videoType: 'youtube',
          videoId: 'abc112def33',
          duration: '40',
          isFree: false
        }
      ]
    }
  ];
};

// Base Section Structure for Grade 11
const getGrade11Sections = (step) => {
  const stepLabel = step === 1 ? 'Nền tảng' : step === 2 ? 'Vận dụng' : 'Vận dụng cao';
  const prefix = step === 1 ? 'Step 1' : step === 2 ? 'Step 2' : 'Step 3';
  const isFreeFirst = step === 1;

  return [
    {
      sectionTitle: "CHƯƠNG I. HÀM SỐ LƯỢNG GIÁC VÀ PHƯƠNG TRÌNH LƯỢNG GIÁC",
      lessons: [
        {
          title: `Bài 1. Góc lượng giác và giá trị lượng giác (${stepLabel})`,
          subtitle: 'Khái niệm góc lượng giác, đường tròn lượng giác',
          slug: `${prefix.toLowerCase()}-g11-bai-1-goc-luong-giac`,
          videoType: 'youtube',
          videoId: 'yl101abc',
          duration: '35',
          isFree: isFreeFirst
        },
        {
          title: `Bài 2. Các công thức lượng giác cơ bản (${stepLabel})`,
          subtitle: 'Công thức cộng, công thức nhân đôi, công thức biến đổi',
          slug: `${prefix.toLowerCase()}-g11-bai-2-cong-thuc-luong-giac`,
          videoType: 'youtube',
          videoId: 'yl102def',
          duration: '45',
          isFree: false
        },
        {
          title: `Bài 3. Hàm số lượng giác và đồ thị (${stepLabel})`,
          subtitle: 'Tính tuần hoàn, tập xác định và vẽ đồ thị sin, cos, tan, cot',
          slug: `${prefix.toLowerCase()}-g11-bai-3-ham-so-luong-giac`,
          videoType: 'youtube',
          videoId: 'yl103ghi',
          duration: '40',
          isFree: false
        },
        {
          title: `Bài 4. Phương trình lượng giác cơ bản (${stepLabel})`,
          subtitle: 'Giải phương trình sin x = a, cos x = a và các bài toán thực tế',
          slug: `${prefix.toLowerCase()}-g11-bai-4-pt-luong-giac`,
          videoType: 'youtube',
          videoId: 'yl104jkl',
          duration: '45',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG II. DÃY SỐ. CẤP SỐ CỘNG VÀ CẤP SỐ NHÂN",
      lessons: [
        {
          title: `Bài 5. Dãy số (${stepLabel})`,
          subtitle: 'Định nghĩa dãy số, dãy số tăng, giảm và bị chặn',
          slug: `${prefix.toLowerCase()}-g11-bai-5-day-so`,
          videoType: 'youtube',
          videoId: 'yl201mno',
          duration: '30',
          isFree: isFreeFirst
        },
        {
          title: `Bài 6. Cấp số cộng (${stepLabel})`,
          subtitle: 'Công thức số hạng tổng quát và tổng n số hạng đầu',
          slug: `${prefix.toLowerCase()}-g11-bai-6-cap-so-cong`,
          videoType: 'youtube',
          videoId: 'yl202pqr',
          duration: '35',
          isFree: false
        },
        {
          title: `Bài 7. Cấp số nhân (${stepLabel})`,
          subtitle: 'Số hạng tổng quát và ứng dụng cấp số nhân vào lãi suất ngân hàng',
          slug: `${prefix.toLowerCase()}-g11-bai-7-cap-so-nhan`,
          videoType: 'youtube',
          videoId: 'yl203stu',
          duration: '35',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG III. GIỚI HẠN. HÀM SỐ LIÊN TỤC",
      lessons: [
        {
          title: `Bài 8. Giới hạn của dãy số (${stepLabel})`,
          subtitle: 'Giới hạn hữu hạn và giới hạn vô cực của dãy số',
          slug: `${prefix.toLowerCase()}-g11-bai-8-gioi-han-day-so`,
          videoType: 'youtube',
          videoId: 'yl301vwx',
          duration: '30',
          isFree: isFreeFirst
        },
        {
          title: `Bài 9. Giới hạn của hàm số (${stepLabel})`,
          subtitle: 'Định lý về giới hạn hàm số và cách khử các dạng vô định',
          slug: `${prefix.toLowerCase()}-g11-bai-9-gioi-han-ham-so`,
          videoType: 'youtube',
          videoId: 'yl302yz1',
          duration: '40',
          isFree: false
        },
        {
          title: `Bài 10. Hàm số liên tục (${stepLabel})`,
          subtitle: 'Khảo sát tính liên tục tại một điểm và trên một khoảng',
          slug: `${prefix.toLowerCase()}-g11-bai-10-ham-so-lien-tuc`,
          videoType: 'youtube',
          videoId: 'yl303abc',
          duration: '35',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG IV. ĐƯỜNG THẲNG VÀ MẶT PHẲNG TRONG KHÔNG GIAN. QUAN HỆ SONG SONG",
      lessons: [
        {
          title: `Bài 11. Đường thẳng và mặt phẳng trong không gian (${stepLabel})`,
          subtitle: 'Các đại lượng cơ bản và cách xác định giao tuyến',
          slug: `${prefix.toLowerCase()}-g11-bai-11-duong-mat-phang`,
          videoType: 'youtube',
          videoId: 'yl401def',
          duration: '40',
          isFree: isFreeFirst
        },
        {
          title: `Bài 12. Hai đường thẳng song song (${stepLabel})`,
          subtitle: 'Vị trí tương đối của hai đường thẳng và tính chất song song',
          slug: `${prefix.toLowerCase()}-g11-bai-12-hai-duong-song-song`,
          videoType: 'youtube',
          videoId: 'yl402ghi',
          duration: '35',
          isFree: false
        },
        {
          title: `Bài 13. Đường thẳng và mặt phẳng song song (${stepLabel})`,
          subtitle: 'Điều kiện để đường thẳng song song với mặt phẳng',
          slug: `${prefix.toLowerCase()}-g11-bai-13-duong-song-song-mat`,
          videoType: 'youtube',
          videoId: 'yl403jkl',
          duration: '35',
          isFree: false
        },
        {
          title: `Bài 14. Hai mặt phẳng song song (${stepLabel})`,
          subtitle: 'Định lý Ta-lét trong không gian và hình lăng trụ',
          slug: `${prefix.toLowerCase()}-g11-bai-14-hai-mat-song-song`,
          videoType: 'youtube',
          videoId: 'yl404mno',
          duration: '40',
          isFree: false
        }
      ]
    }
  ];
};

// Base Section Structure for Grade 10
const getGrade10Sections = (step) => {
  const stepLabel = step === 1 ? 'Nền tảng' : step === 2 ? 'Vận dụng' : 'Vận dụng cao';
  const prefix = step === 1 ? 'Step 1' : step === 2 ? 'Step 2' : 'Step 3';
  const isFreeFirst = step === 1;

  return [
    {
      sectionTitle: "CHƯƠNG I. MỆNH ĐỀ VÀ TẬP HỢP",
      lessons: [
        {
          title: `Bài 1. Mệnh đề toán học (${stepLabel})`,
          subtitle: 'Mệnh đề chứa biến, mệnh đề phủ định, kéo theo',
          slug: `${prefix.toLowerCase()}-g10-bai-1-menh-de`,
          videoType: 'youtube',
          videoId: 'yl501pqr',
          duration: '30',
          isFree: isFreeFirst
        },
        {
          title: `Bài 2. Tập hợp và các phép toán trên tập hợp (${stepLabel})`,
          subtitle: 'Giao, hợp, hiệu của hai tập hợp và biểu đồ Ven',
          slug: `${prefix.toLowerCase()}-g10-bai-2-tap-hop`,
          videoType: 'youtube',
          videoId: 'yl502stu',
          duration: '35',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG II. BẤT PHƯƠNG TRÌNH VÀ HỆ BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN",
      lessons: [
        {
          title: `Bài 3. Bất phương trình bậc nhất hai ẩn (${stepLabel})`,
          subtitle: 'Biểu diễn miền nghiệm của bất phương trình trên Oxy',
          slug: `${prefix.toLowerCase()}-g10-bai-3-bpt-bac-nhat-2-an`,
          videoType: 'youtube',
          videoId: 'yl601vwx',
          duration: '35',
          isFree: isFreeFirst
        },
        {
          title: `Bài 4. Hệ bất phương trình bậc nhất hai ẩn (${stepLabel})`,
          subtitle: 'Ứng dụng quy hoạch tuyến tính tìm giá trị tối ưu thực tế',
          slug: `${prefix.toLowerCase()}-g10-bai-4-he-bpt-bac-nhat-2-an`,
          videoType: 'youtube',
          videoId: 'yl602yz1',
          duration: '40',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG III. HÀM SỐ BẬC HAI VÀ ĐỒ THỊ",
      lessons: [
        {
          title: `Bài 5. Hàm số và đồ thị (${stepLabel})`,
          subtitle: 'Tập xác định, sự biến thiên đồng biến nghịch biến',
          slug: `${prefix.toLowerCase()}-g10-bai-5-ham-so-do-thi`,
          videoType: 'youtube',
          videoId: 'yl701abc',
          duration: '30',
          isFree: isFreeFirst
        },
        {
          title: `Bài 6. Hàm số bậc hai (${stepLabel})`,
          subtitle: 'Đồ thị parabol, đỉnh, trục đối xứng và ứng dụng cực trị',
          slug: `${prefix.toLowerCase()}-g10-bai-6-ham-so-bac-hai`,
          videoType: 'youtube',
          videoId: 'yl702def',
          duration: '35',
          isFree: false
        },
        {
          title: `Bài 7. Tam thức bậc hai (${stepLabel})`,
          subtitle: 'Định lý về dấu của tam thức bậc hai và bất phương trình bậc hai',
          slug: `${prefix.toLowerCase()}-g10-bai-7-tam-thuc-bac-hai`,
          videoType: 'youtube',
          videoId: 'yl703ghi',
          duration: '40',
          isFree: false
        }
      ]
    },
    {
      sectionTitle: "CHƯƠNG IV. HỆ THỨC LƯỢNG TRONG TAM GIÁC",
      lessons: [
        {
          title: `Bài 8. Giá trị lượng giác của một góc từ 0 đến 180 độ (${stepLabel})`,
          subtitle: 'Định nghĩa lượng giác góc tù, góc nhọn và quan hệ phụ nhau',
          slug: `${prefix.toLowerCase()}-g10-bai-8-gtlg-0-180`,
          videoType: 'youtube',
          videoId: 'yl801jkl',
          duration: '30',
          isFree: isFreeFirst
        },
        {
          title: `Bài 9. Định lí côsin và định lí sin trong tam giác (${stepLabel})`,
          subtitle: 'Công thức cosin, sin và ứng dụng đo đạc khoảng cách thực tế',
          slug: `${prefix.toLowerCase()}-g10-bai-9-dinh-li-sin-cos`,
          videoType: 'youtube',
          videoId: 'yl802mno',
          duration: '40',
          isFree: false
        },
        {
          title: `Bài 10. Giải tam giác và các công thức diện tích (${stepLabel})`,
          subtitle: 'Công thức Heron, diện tích theo bán kính R, r',
          slug: `${prefix.toLowerCase()}-g10-bai-10-dien-tich-tam-giac`,
          videoType: 'youtube',
          videoId: 'yl803pqr',
          duration: '35',
          isFree: false
        }
      ]
    }
  ];
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_DB);
    console.log('Connected to MongoDB.');

    // Course definition templates
    const coursesToSeed = [
      // Grade 12
      {
        title: "Step 1: Nền tảng toán 12",
        slug: "step-1-nen-tang-toan-12",
        price: 1450000,
        rating: 4.9,
        reviews: 1250,
        students: 18400,
        grade: 12,
        overview: "Khóa học tập trung vào các chuyên đề trọng tâm: Hàm số, Mũ - Lôgarit, Nguyên hàm, Tích phân và Hình học không gian bám sát chương trình mới.",
        description: "<h2>Không cần là thiên tài - Chỉ cần nắm chắc phương pháp và lộ trình</h2><p>Lớp 12 là năm học mang tính bước ngoặt. Với chương trình giáo dục phổ thông mới (2018), môn Toán không chỉ dừng lại ở những con số khô khan mà đòi hỏi tư duy logic, khả năng ứng dụng thực tiễn và thống kê số liệu. Khóa học <b>Toán 12 Nền tảng</b> được thiết kế như một tấm bản đồ chi tiết, dẫn dắt em đi từ con số 0 đến sự tự tin chinh phục mức điểm 8+ trong kỳ thi THPT Quốc gia.</p><h3>Khóa học này mang lại cho em những gì?</h3><ul><li><b>Quét sạch 100% dạng bài trọng tâm:</b> Lộ trình đi từ cơ bản đến nâng cao qua 6 chương cốt lõi. Đặc biệt chú trọng các chuyên đề mới như <i>Thống kê (phương sai, độ lệch chuẩn)</i> và <i>Xác suất có điều kiện (công thức Bayes)</i>.</li><li><b>Học bản chất - Nhớ lâu - Giải nhanh:</b> Anh không dạy mẹo vặt sáo rỗng. Khóa học tập trung rèn luyện tư duy toán học gốc rễ, giúp em tự suy luận hướng giải kể cả khi gặp câu hỏi lạ.</li><li><b>Môi trường học tập kỷ luật với AI Coaching:</b> Điểm khác biệt lớn nhất! Em không học một mình. Hệ thống E-learning tích hợp <i>Sổ tay kế hoạch thông minh</i> sẽ yêu cầu em lên mục tiêu hàng ngày. Trợ giảng AI và Mentor sẽ liên tục chấm điểm kỷ luật, nhắc nhở và đánh giá hiệu suất học tập của em mỗi tuần.</li></ul><p>Đừng để môn Toán trở thành rào cản cản bước chân em vào ngôi trường Đại học mơ ước. Hãy bắt đầu xây dựng nền móng vững chắc ngay hôm nay!</p>",
        sections: getGrade12Sections(1)
      },
      {
        title: "Step 2: Vận dụng toán 12",
        slug: "step-2-van-dung-toan-12",
        price: 1500000,
        rating: 4.8,
        reviews: 950,
        students: 12300,
        grade: 12,
        overview: "Khóa học Vận dụng toán 12 đi sâu vào giải quyết các bài toán phân loại điểm 8+, rèn luyện tư duy logic cao độ.",
        description: "<h2>Bứt phá giới hạn - Chinh phục điểm 8+ môn Toán</h2><p>Nếu bạn đã nắm chắc nền tảng cơ bản và muốn tiến xa hơn vào nhóm điểm cao, khóa học <b>Toán 12 Vận dụng</b> chính là bệ phóng hoàn hảo dành cho bạn. Khóa học giúp chuyển hóa lý thuyết căn bản thành khả năng nhận diện và giải quyết các bài toán phức tạp.</p><h3>Điểm nổi bật của khóa học:</h3><ul><li><b>Hệ thống chuyên đề phân loại điểm 8+:</b> Đào sâu vào các phương pháp biện luận tham số m, cực trị nâng cao, các bài toán thực tế tích phân và hình học Oxyz mức độ 3.</li><li><b>Kỹ năng xử lý bài toán đa bước:</b> Rèn luyện thói quen tư duy sâu, liên kết nhiều kiến thức để tìm ra lời giải tối ưu.</li><li><b>Hỗ trợ học tập 24/7:</b> Nhóm học tập chất lượng cao cùng Mentor chuyên môn giải đáp mọi thắc mắc của bạn nhanh chóng.</li></ul>",
        sections: getGrade12Sections(2)
      },
      {
        title: "Step 3: Vận dụng cao toán 12",
        slug: "step-3-van-dung-cao-toan-12",
        price: 1600000,
        rating: 4.9,
        reviews: 720,
        students: 8400,
        grade: 12,
        overview: "Khóa học Vận dụng cao toán 12 dành riêng cho học sinh mục tiêu điểm 9+, 10 tối ưu các phương pháp giải siêu tốc.",
        description: "<h2>Chinh phục đỉnh cao - Đạt điểm 9+, 10 môn Toán</h2><p>Khóa học <b>Toán 12 Vận dụng cao</b> được biên soạn kỹ lưỡng dành riêng cho những chiến binh đặt mục tiêu thủ khoa, á khoa. Nơi bạn làm chủ những phương pháp giải toán đỉnh cao nhất để tối ưu thời gian làm bài trắc nghiệm.</p><h3>Nội dung khóa học:</h3><ul><li><b>Tuyển tập phương pháp giải siêu tốc:</b> Ghép trục, ghép đồ thị, sơ đồ V, dồn biến, giải tích hóa hình học không gian, các kỹ thuật Casio đỉnh cao bứt tốc thời gian làm bài.</li><li><b>Hệ thống đề thi thử form chuẩn Bộ GD:</b> Thực chiến nâng cao phản xạ, rèn luyện tâm lý phòng thi vững vàng.</li></ul>",
        sections: getGrade12Sections(3)
      },

      // Grade 11
      {
        title: "Step 1: Nền tảng toán 11",
        slug: "step-1-nen-tang-toan-11",
        price: 1250000,
        rating: 4.8,
        reviews: 840,
        students: 9600,
        grade: 11,
        overview: "Khóa học xây dựng nền tảng Toán 11 vững chắc, bám sát chương trình sách giáo khoa mới.",
        description: "<h2>Nền tảng vững chắc - Khởi đầu hoàn hảo cho lớp 11</h2><p>Môn Toán lớp 11 là cầu nối cực kỳ quan trọng lên lớp 12. Khóa học này giúp học sinh nắm vững các khái niệm lượng giác, cấp số cộng/nhân, giới hạn và hình học không gian cơ bản một cách trực quan, sinh động nhất.</p>",
        sections: getGrade11Sections(1)
      },
      {
        title: "Step 2: Vận dụng toán 11",
        slug: "step-2-van-dung-toan-11",
        price: 1300000,
        rating: 4.7,
        reviews: 580,
        students: 6200,
        grade: 11,
        overview: "Khóa học Vận dụng toán 11 phát triển tư duy giải các bài toán phân loại lớp 11 đạt điểm 8, 9 trên lớp.",
        description: "<h2>Đột phá điểm số - Tự tin dẫn đầu lớp 11</h2><p>Khóa học thiết kế chuyên biệt để giải quyết các câu hỏi khó trong các kỳ thi giữa kỳ, cuối kỳ lớp 11. Giúp các em mở rộng tư duy giải toán nhanh, chính xác.</p>",
        sections: getGrade11Sections(2)
      },
      {
        title: "Step 3: Vận dụng cao toán 11",
        slug: "step-3-van-dung-cao-toan-11",
        price: 1400000,
        rating: 4.9,
        reviews: 310,
        students: 3800,
        grade: 11,
        overview: "Khóa học Vận dụng cao toán 11 giúp học sinh chinh phục điểm 10 tuyệt đối và tạo đà sớm cho kỳ thi THPTQG.",
        description: "<h2>Bứt phá tư duy - Sẵn sàng cho kỳ thi lớn</h2><p>Chinh phục các chuyên đề khó nhất của chương trình Toán 11: Tổ hợp - Xác suất phức tạp, Cực trị hình học không gian song song và vuông góc, Giới hạn vô định nâng cao.</p>",
        sections: getGrade11Sections(3)
      },

      // Grade 10
      {
        title: "Step 1: Nền tảng toán 10",
        slug: "step-1-nen-tang-toan-10",
        price: 1050000,
        rating: 4.8,
        reviews: 920,
        students: 11500,
        grade: 10,
        overview: "Khóa học Nền tảng toán 10 giúp học sinh chuyển cấp vững vàng, bám sát SGK lớp 10 mới.",
        description: "<h2>Chuyển cấp vững vàng - Làm quen phương pháp học THPT</h2><p>Học tốt toán 10 ngay từ đầu giúp các em không bị ngợp trước sự thay đổi phương pháp dạy học ở cấp ba. Khóa học phủ kín kiến thức mệnh đề, tập hợp, bất phương trình, đồ thị bậc hai và hệ thức lượng tam giác.</p>",
        sections: getGrade10Sections(1)
      },
      {
        title: "Step 2: Vận dụng toán 10",
        slug: "step-2-van-dung-toan-10",
        price: 1100000,
        rating: 4.7,
        reviews: 490,
        students: 5400,
        grade: 10,
        overview: "Khóa học Vận dụng toán 10 rèn luyện phản xạ giải bài tập nâng cao, bám sát các kỳ thi học kỳ.",
        description: "<h2>Bứt phá điểm giỏi môn Toán lớp 10</h2><p>Học cách ứng dụng hệ thức lượng đo đạc, lập mô hình bài toán quy hoạch tuyến tính và các dạng bài toán đồ thị hàm số bậc hai nâng cao.</p>",
        sections: getGrade10Sections(2)
      },
      {
        title: "Step 3: Vận dụng cao toán 10",
        slug: "step-3-van-dung-cao-toan-10",
        price: 1200000,
        rating: 4.9,
        reviews: 280,
        students: 2900,
        grade: 10,
        overview: "Khóa học Vận dụng cao toán 10 chinh phục điểm số tuyệt đối, ôn luyện học sinh giỏi.",
        description: "<h2>Ươm mầm tài năng - Tư duy Toán học đỉnh cao</h2><p>Giải quyết các bài toán cực trị hình học dùng Vectơ, các hệ bất phương trình bậc hai nâng cao chứa tham số và các bài toán tổ hợp khó bậc nhất.</p>",
        sections: getGrade10Sections(3)
      }
    ];

    // Clean up existing courses and insert fresh ones
    await mongoose.connection.db.collection('courses').deleteMany({});
    console.log('Cleared existing courses collection.');

    const result = await Course.insertMany(coursesToSeed);
    console.log(`Successfully seeded ${result.length} courses!`);
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

run();
