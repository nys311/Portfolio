// Hội nghị đã làm diễn giả (trang /speaking/).
// "slides": { "pdf": file PDF trong assets/docs/talks/, "cover": ảnh trang đầu, "label": chữ hiển thị } — bấm vào là tải PDF về.
// Sửa nội dung bên dưới — giữ nguyên dòng "SITE_DATA.talks =" và cú pháp JSON (dấu phẩy, ngoặc kép).
window.SITE_DATA = window.SITE_DATA || {};
SITE_DATA.talks = [
  {
    "event": "Security Bootcamp Vietnam",
    "year": 2026,
    "location": "Buôn Ma Thuột",
    "title": "MIND INCEPTION: Break AI Agents with a New Powerful Prompt Injection Technique",
    "role": "Speaker",
    "description": "How a reasoning model's own self-generated traces can be turned against it: an attack methodology on reasoning LLMs (gpt-oss, Harmony format), a live demo, and bypass success rates in practical deployments.",
    "images": [],
    "links": [],
    "slides": {
      "pdf": "assets/docs/talks/mind-inception-security-bootcamp-2026.pdf",
      "cover": "assets/img/talks/sbv-2026-mind-inception-slides.jpg",
      "label": "Slides · PDF · 27 pages"
    },
    "coSpeakers": "with Nguyen Duc Kien"
  },
  {
    "event": "Security Bootcamp Vietnam",
    "year": 2025,
    "location": "Huế",
    "title": "",
    "role": "Speaker",
    "description": "",
    "images": [
      "assets/img/talks/sbv-2025-hue-1.jpg",
      "assets/img/talks/sbv-2025-hue-2.jpg"
    ],
    "links": [],
    "slides": null
  }
];
