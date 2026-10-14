// Nhật ký du lịch (trang /travel/): bản đồ + sách lật trang.
// - "country": tên tiếng Anh (vd "Japan", "South Korea") → chấm của nước đó phát sáng. Nước/vùng nhỏ (Singapore, Hong Kong) vẫn có điểm đánh dấu.
// - "lat"/"lon": toạ độ thành phố · "photo": ảnh trong assets/img/travel/ (chép đè ảnh demo, giữ nguyên tên)
// - "year", "title" (câu ngắn), "note" (vài dòng kỷ niệm), "tags": để trống thì tự ẩn. Chỉ ghi năm, không ghi ngày cụ thể.
// - "photoFit": "contain" → hiện trọn ảnh (ảnh dọc/ảnh ghép), mặc định cắt cho đầy khung vuông.
// - "visits": số lần đã đến một nước (hiện trên trang sách + thống kê).
// - Thứ tự trong "trips" = thứ tự trang trong sách. Các thành phố gần nhau được gộp 1 điểm trên bản đồ.
window.SITE_DATA = window.SITE_DATA || {};
SITE_DATA.travel = {
  "home": {
    "place": "Hanoi",
    "country": "Vietnam",
    "lat": 21.03,
    "lon": 105.85
  },
  "visits": {
    "Japan": 3
  },
  "trips": [
    {
      "place": "Shanghai",
      "country": "China",
      "lat": 31.23,
      "lon": 121.47,
      "year": null,
      "title": "",
      "note": "",
      "photo": "assets/img/travel/shanghai.jpg",
      "tags": []
    },
    {
      "place": "Suzhou",
      "country": "China",
      "lat": 31.3,
      "lon": 120.58,
      "year": null,
      "title": "",
      "note": "",
      "photo": "assets/img/travel/suzhou.jpg",
      "tags": []
    },
    {
      "place": "Hong Kong",
      "country": "Hong Kong",
      "lat": 22.32,
      "lon": 114.17,
      "year": null,
      "title": "",
      "note": "",
      "photo": "assets/img/travel/hongkong.jpg",
      "tags": [],
      "photoFit": "contain"
    },
    {
      "place": "Seoul",
      "country": "South Korea",
      "lat": 37.57,
      "lon": 126.98,
      "year": null,
      "title": "Ewha Womans University",
      "note": "A summer walk through the stone halls and gardens of Ewha Womans University.",
      "photo": "assets/img/travel/seoul.jpg",
      "tags": [
        "Campus",
        "Architecture"
      ]
    },
    {
      "place": "Tokyo",
      "country": "Japan",
      "lat": 35.68,
      "lon": 139.69,
      "year": null,
      "title": "",
      "note": "",
      "photo": "assets/img/travel/tokyo.jpg",
      "tags": []
    },
    {
      "place": "Kyoto",
      "country": "Japan",
      "lat": 35.01,
      "lon": 135.77,
      "year": null,
      "title": "Momiji & the vermilion pagoda",
      "note": "November in Kyoto — red maples blazing around a three-storied pagoda under a clear autumn sky.",
      "photo": "assets/img/travel/kyoto.jpg",
      "tags": [
        "Autumn",
        "Momiji",
        "Temple"
      ]
    },
    {
      "place": "Osaka",
      "country": "Japan",
      "lat": 34.69,
      "lon": 135.5,
      "year": 2026,
      "title": "A sea of blue nemophila",
      "note": "Nemophila season by Osaka Bay — late April to early May, when the shoreline turns sky blue.",
      "photo": "assets/img/travel/osaka.jpg",
      "tags": [
        "Nemophila",
        "Spring",
        "Seaside"
      ]
    },
    {
      "place": "Nara",
      "country": "Japan",
      "lat": 34.69,
      "lon": 135.8,
      "year": null,
      "title": "",
      "note": "",
      "photo": "assets/img/travel/nara.jpg",
      "tags": []
    },
    {
      "place": "Bangkok",
      "country": "Thailand",
      "lat": 13.76,
      "lon": 100.5,
      "year": null,
      "title": "",
      "note": "",
      "photo": "assets/img/travel/bangkok.jpg",
      "tags": []
    },
    {
      "place": "Singapore",
      "country": "Singapore",
      "lat": 1.35,
      "lon": 103.82,
      "year": null,
      "title": "Marina Bay after dark",
      "note": "Night lights over Marina Bay — Marina Bay Sands and the ArtScience Museum glowing across the water.",
      "photo": "assets/img/travel/singapore.jpg",
      "tags": [
        "Night",
        "Skyline"
      ]
    }
  ]
};
