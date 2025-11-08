# 🧠 Smart Health Companion  
> **AI-Powered Fatigue, Emotion, and Stress Detection with Personalized Wellness Insights**

[![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![PyTorch](https://img.shields.io/badge/AI-Model-PyTorch-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📘 Overview  

**Smart Health Companion** is an AI-driven health monitoring web app that captures **voice and video inputs** alongside ambient environmental data (like noise or light levels) to evaluate user **fatigue, stress, and emotion** in real time.  

Powered by a **custom-trained PyTorch model (`best.pt`)**, the app processes short recordings locally through `FVATool.py` to infer mood and stress levels — presenting users with a **Wellness Index (0–100)** and **personalized health recommendations** such as breathing exercises, meditation, and relaxation content.  

---

## ✨ Features  

- 🎤 **Multimodal Emotion Detection**  
  Detects emotions from both **audio and video streams** using a hybrid CNN-RNN architecture in `best.pt`.  

- 🧘 **Personalized Wellness Suggestions**  
  AI dynamically recommends breathing videos, calm music, or energy activities via YouTube iframes.  

- 📊 **Wellness Index Dashboard**  
  Displays real-time emotional and fatigue scores using animated charts and smooth transitions.  

- 💡 **Environment-Aware Analysis**  
  Considers contextual parameters such as light and sound intensity to improve accuracy.  

- ⚙️ **Offline/Edge Processing**  
  Optimized for local inference using lightweight dependencies and fast model loading.  

- 💻 **Full-Stack Architecture**  
  Combines **Next.js + Tailwind** frontend with **Flask + PyTorch** backend seamlessly.  

---

## 🧩 Tech Stack  

| Layer | Technologies |
|-------|---------------|
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Flask, Python 3.10+, PyTorch, OpenCV, Librosa |
| **AI Model** | Custom Emotion Detection Model (`best.pt`) |
| **Deployment** | Vercel (frontend), Render/Railway (backend) |
| **Communication** | REST APIs (Flask → Next.js via JSON) |

---

<details>
<summary>📁 Project Structure</summary>

```
v0-health-companion/
│
├── FVATool.py                   # Core AI analysis logic (audio/video processing)
├── best.pt                      # Pretrained PyTorch model for emotion detection
├── requirements.txt              # Backend dependencies
├── package.json                  # Frontend dependencies
├── start-backend.sh / .bat       # Run backend server
├── start-frontend.sh / .bat      # Run frontend dev server
│
├── components.json               # UI component configuration
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.mjs            # Tailwind setup
│
├── HOW_TO_RUN.md                 # Quickstart guide
├── SETUP_GUIDE.md                # Extended setup instructions
└── .next/                        # Build cache directory
```
</details>

---

## ⚙️ Installation & Setup  

### 🧰 Prerequisites
Ensure the following are installed:
- 🐍 **Python 3.10+**  
- 🧱 **Node.js 18+**  
- 💡 **pip & npm**  
- 💾 (Optional) **virtualenv**

---

### 🪄 Step 1: Clone the Repository  
```bash
git clone https://github.com/yourusername/smart-health-companion.git
cd smart-health-companion
```

---

### 🧩 Step 2: Backend Setup  
```bash
cd backend
python -m venv venv
source venv/bin/activate   # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
```

Run the backend:
```bash
python FVATool.py
# or
bash start-backend.sh
```

Backend runs at **http://127.0.0.1:5000/**  

---

### 🧩 Step 3: Frontend Setup  
```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000/**  

---

### 🔗 Step 4: Connect Frontend & Backend  
Ensure the backend is running before starting the frontend.  
The frontend fetches data from Flask API endpoints configured in `.env.local`.  

---

## 🚀 How It Works  

1. The user records short audio/video samples.  
2. `FVATool.py` extracts features (MFCCs for audio, facial micro-expressions for video).  
3. The model (`best.pt`) infers emotional state and fatigue level.  
4. Flask API returns:
   ```json
   {
     "emotion": "Tired",
     "score": 74,
     "suggestions": [
       {"title": "4-7-8 Breathing", "videoUrl": "https://youtu.be/acUZdGd_3Dg"},
       {"title": "Nature Sounds", "videoUrl": "https://youtu.be/1ZYbU82GVz4"}
     ]
   }
   ```
5. The Next.js frontend renders the **Wellness Index**, suggestion cards, and embedded iframes.

---

<details>
<summary>📡 API Reference</summary>

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/analyze` | `POST` | Upload audio/video data for emotion analysis |
| `/suggestions` | `GET` | Retrieve relaxation and wellness suggestions |
| `/score` | `GET` | Fetch the latest Wellness Index |
</details>

---

## 🖥️ UI Highlights  

- 🧭 **Dashboard:** Emotion-driven chart with animation  
- 💬 **Suggestion Panel:** AI-generated recommendations with icons and YouTube embeds  
- 🪷 **Mood Cards:** Dynamic visuals that reflect emotional tone  

> *(Add screenshots or screen recordings before publishing!)*  

---

## 🧑‍💻 Development Commands  

| Command | Description |
|----------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build frontend for production |
| `python FVATool.py` | Run backend AI service |
| `bash start-frontend.sh` | Run frontend (Linux/macOS) |
| `bash start-backend.sh` | Run backend (Linux/macOS) |

---

## ☁️ Deployment  

**Frontend:** [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/)  
**Backend:** [Render](https://render.com/), [Railway](https://railway.app/), or [AWS EC2]  

To deploy the model:
- Store `best.pt` in a `/models` or `/backend` directory.
- Ensure Flask loads it via relative path (`torch.load('./best.pt')`).

---

## 🧪 Testing  

Run backend tests:
```bash
pytest
```

Run frontend tests:
```bash
npm test
```

---

## 📜 License  

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributors  

| Name | Role |
|------|------|
| **Shreyas Sangalad** | Project Lead, Full-Stack Developer, AI Model Integration |
| **OpenAI GPT-5** | Documentation & Optimization Support |

---

## 🌱 Future Enhancements  

- 🎥 Real-time camera-based stress detection  
- ☁️ Cloud-based AI emotion inference (via API)  
- 📊 Long-term wellness trend graphs  
- 🧘 Personalized wellness chatbot assistant  

---

## 🧠 Acknowledgements  

Special thanks to:  
- [PyTorch](https://pytorch.org/)  
- [Librosa](https://librosa.org/)  
- [Next.js](https://nextjs.org/)  
- [Tailwind CSS](https://tailwindcss.com/)  
- [Framer Motion](https://www.framer.com/motion/)  

---

> 💚 “Your wellness journey, guided by intelligent emotion analysis.”  
> — _Smart Health Companion Team_
