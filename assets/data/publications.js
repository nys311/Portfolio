// Bài báo khoa học (trang /publications/). Thêm object mới vào mảng là xong — tự sắp theo "year"/"month" (mới nhất ở trên, đánh số từ dưới lên).
// Sửa nội dung bên dưới — giữ nguyên dòng "SITE_DATA.publications =" và cú pháp JSON (dấu phẩy, ngoặc kép).
window.SITE_DATA = window.SITE_DATA || {};
SITE_DATA.publications = [
  {
    "title": "An improved hand gesture recognition system using keypoints and hand bounding boxes",
    "authors": "Tuan Linh Dang, Sy Dat Tran, Thuy Hang Nguyen, Suntae Kim, Nicolas Monet",
    "type": "Journal Article",
    "venue": "Array (Elsevier) · Open access",
    "year": 2022,
    "summary": "A study on optimizing gesture detection models by combining hand keypoints with hand bounding boxes.",
    "tags": [
      "Computer Vision",
      "Gesture Recognition",
      "Deep Learning"
    ],
    "links": [
      {
        "label": "ScienceDirect",
        "url": "https://www.sciencedirect.com/science/article/pii/S2590005622000844"
      },
      {
        "label": "DOI",
        "url": "https://doi.org/10.1016/j.array.2022.100251"
      }
    ],
    "citations": 36,
    "month": 12
  },
  {
    "title": "Traffic Collision Warning Using Deep Learning Models",
    "authors": "Tuan Linh Dang, Thuy Hang Nguyen, Gia Tuyen Nguyen, Thang Cao",
    "type": "Journal Article",
    "venue": "ICIC Express Letters · Vol. 16, No. 1, pp. 17–24",
    "year": 2022,
    "summary": "A predictive model that forecasts the locations of vehicles and pedestrians to help reduce urban traffic accidents.",
    "tags": [
      "Deep Learning",
      "Trajectory Prediction",
      "Smart Mobility"
    ],
    "links": [
      {
        "label": "ResearchGate",
        "url": "https://www.researchgate.net/publication/359709906_Traffic_Collision_Warning_Using_Deep_Learning_Models"
      }
    ],
    "month": 1
  }
];
