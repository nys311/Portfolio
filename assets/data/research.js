// Các project nghiên cứu (trang /research/). "featured": true = thẻ lớn (image trống → terminal animation); còn lại là thẻ ngang gọn, "slides" = ảnh nhỏ bấm để tải PDF.
// Sửa nội dung bên dưới — giữ nguyên dòng "SITE_DATA.research =" và cú pháp JSON (dấu phẩy, ngoặc kép).
window.SITE_DATA = window.SITE_DATA || {};
SITE_DATA.research = [
  {
    "featured": false,
    "title": "MIND INCEPTION: Break AI Agents with a New Powerful Prompt Injection Technique",
    "type": "Research · Talk",
    "venue": "Security Bootcamp Vietnam 2026 · with Nguyen Duc Kien",
    "year": 2026,
    "description": "A new prompt injection technique against AI agents built on reasoning LLMs: a model's own self-generated traces are turned against it, steering the agent into actions it would otherwise refuse. Covers the methodology, a live demo and bypass success rates in practical deployments.",
    "tags": [
      "Prompt Injection",
      "AI Agents",
      "Reasoning LLMs",
      "gpt-oss"
    ],
    "links": [
      {
        "label": "Kaggle writeup",
        "url": "https://www.kaggle.com/competitions/openai-gpt-oss-20b-red-teaming/writeups/the-simplest-prompt-for-inappropriate-tool-use"
      }
    ],
    "slides": {
      "pdf": "assets/docs/talks/mind-inception-security-bootcamp-2026.pdf",
      "cover": "assets/img/talks/sbv-2026-mind-inception-slides.jpg",
      "label": "Slides (PDF)"
    }
  }
];
