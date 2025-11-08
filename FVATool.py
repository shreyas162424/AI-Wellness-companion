# app_api.py — Flask API replacement for your Gradio script
import os
import time
import tempfile
import base64
from datetime import datetime
from typing import Dict, Any, List
from collections import deque

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import numpy as np
import librosa
import cv2

from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor
from ultralytics import YOLO

# -----------------------
# Config
# -----------------------
MODEL_NAME = "prithivMLmods/Speech-Emotion-Classification"
MODEL_VERSION = "v1.0-prithivMLmods"
BUFFER_SR = 16000
MAX_BUFFER_SECONDS = 5  # seconds kept in rolling buffer per session
VIDEO_MODEL_PATH = "best.pt"  # YOLO model path

# -----------------------
# Init
# -----------------------
app = Flask(__name__)
CORS(app)

print("Loading audio model & processor (may take a while)...")
audio_model = Wav2Vec2ForSequenceClassification.from_pretrained(MODEL_NAME)
audio_processor = Wav2Vec2FeatureExtractor.from_pretrained(MODEL_NAME)
audio_model.eval()

print("Loading video model (may take a while)...")
video_model = None
if os.path.exists(VIDEO_MODEL_PATH):
    try:
        # Try loading with different methods for compatibility
        try:
            # Method 1: Standard YOLO loading
            video_model = YOLO(VIDEO_MODEL_PATH)
            print(f"Video model loaded successfully from {VIDEO_MODEL_PATH}")
        except Exception as e1:
            error_msg = str(e1)
            print(f"Standard YOLO load failed: {error_msg}")
            
            # Check if it's a C3k2 or custom architecture error
            if "C3k2" in error_msg or "attribute" in error_msg.lower():
                print("\n" + "="*60)
                print("MODEL COMPATIBILITY ISSUE DETECTED")
                print("="*60)
                print("Your best.pt model was trained with a custom architecture")
                print("that includes 'C3k2' module, which is not in the current ultralytics version.")
                print("\nSOLUTIONS:")
                print("1. Use the same ultralytics version that trained the model")
                print("2. Or export/re-save the model in a compatible format")
                print("3. Or train a new model with the current ultralytics version")
                print("\nThe application will continue without video analysis.")
                print("Audio analysis will still work normally.")
                print("="*60 + "\n")
            else:
                # Try alternative loading methods
                try:
                    # Method 2: Load with explicit task
                    video_model = YOLO(VIDEO_MODEL_PATH, task='detect')
                    print(f"Video model loaded with explicit task from {VIDEO_MODEL_PATH}")
                except Exception as e2:
                    print(f"Explicit task load also failed: {e2}")
                    print("Video analysis will be unavailable")
    except Exception as e:
        print(f"Warning: Could not load video model: {e}")
        print("Video analysis will be unavailable")
        import traceback
        traceback.print_exc()
else:
    print(f"Warning: Video model file {VIDEO_MODEL_PATH} not found. Video analysis will be unavailable.")

# id2label from your model
id2label_raw = {
    "0": "Anger",
    "1": "Calm",
    "2": "Disgust",
    "3": "Fear",
    "4": "Happy",
    "5": "Neutral",
    "6": "Sad",
    "7": "Surprised"
}

# rolling buffers for sessioned chunk inference
ROLLING_BUFFERS = {}  # session_id -> deque of numpy arrays

# -----------------------
# Helpers (copied & slightly adapted)
# -----------------------
def clamp(x, a=0, b=100):
    return max(a, min(b, x))

def normalize_emotion_probs(raw_probs: Dict[str, float]) -> Dict[str, float]:
    normalized = {"happy": 0.0, "calm": 0.0, "stressed": 0.0, "tired": 0.0, "surprised": 0.0, "neutral": 0.0}
    for idx_str, prob in raw_probs.items():
        label = id2label_raw[idx_str]
        if label == "Happy":
            normalized["happy"] += prob
        elif label == "Calm":
            normalized["calm"] += prob
        elif label == "Neutral":
            normalized["neutral"] += prob
        elif label in ("Anger", "Disgust", "Fear"):
            normalized["stressed"] += prob
        elif label == "Sad":
            normalized["tired"] += prob
        elif label == "Surprised":
            normalized["surprised"] += prob
        else:
            normalized["neutral"] += prob * 0.3
    for k in normalized:
        normalized[k] = round(float(normalized[k] * 100), 2)
    return normalized

def compute_basic_audio_features(y: np.ndarray, sr: int) -> Dict[str, Any]:
    y = np.asarray(y, dtype=np.float32).flatten()
    if y.size == 0:
        return {"rms": 0.0, "zcr": 0.0, "spectral_flatness": 0.0, "median_f0_hz": None, "speech_rate_bpm": None}
    rms = float(np.mean(librosa.feature.rms(y=y)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))
    flatness = float(np.mean(librosa.feature.spectral_flatness(y=y)))
    f0 = None
    try:
        f0_candidates = librosa.yin(y, fmin=50, fmax=400, sr=sr)
        f0_vals = f0_candidates[~np.isnan(f0_candidates)]
        f0 = float(np.median(f0_vals)) if len(f0_vals) > 0 else None
    except Exception:
        f0 = None
    speech_rate = None
    try:
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo = librosa.beat.tempo(onset_envelope=onset_env, sr=sr)
        speech_rate = float(tempo[0]) if len(tempo) > 0 else None
    except Exception:
        speech_rate = None
    return {
        "rms": rms,
        "zcr": zcr,
        "spectral_flatness": flatness,
        "median_f0_hz": f0,
        "speech_rate_bpm": speech_rate
    }

def derive_health_metrics(normalized_emotions: Dict[str, float], audio_feats: Dict[str, Any], primary_emotion: str = None) -> Dict[str, Any]:
    stressed_pct = normalized_emotions.get("stressed", 0.0)
    flatness = audio_feats.get("spectral_flatness", 0.0)
    stress_level = clamp(stressed_pct + (flatness * 100) * 0.4)
    rms = audio_feats.get("rms", 0.0)
    energy_from_rms = clamp((rms / 0.08) * 100)
    happy_pct = normalized_emotions.get("happy", 0.0)
    calm_pct = normalized_emotions.get("calm", 0.0)
    energy_level = clamp((energy_from_rms * 0.6) + ((happy_pct + calm_pct) * 0.2))
    hydration_level = 55.0
    zcr = audio_feats.get("zcr", 0.0)
    clarity = clamp((1.0 - zcr) * 100 - (flatness * 30) + (energy_from_rms * 0.1))
    tired_pct = normalized_emotions.get("tired", 0.0)
    fatigue_detected = (stress_level > 65) or (energy_level < 35) or (tired_pct > 40)
    
    # Adjust wellness score based on actual primary emotion
    base_wellness_score = clamp((100 - stress_level) * 0.55 + energy_level * 0.35 + hydration_level * 0.1)
    
    # Adjust score based on primary emotion to better reflect actual emotion
    # Using exact model labels: Happy, Sad, Fear, Disgust, Surprised, Calm, Neutral, Anger
    if primary_emotion:
        emotion_lower = primary_emotion.lower()
        if emotion_lower == "happy":
            # Happy emotion boosts score
            wellness_score = clamp(base_wellness_score + 15)
        elif emotion_lower == "calm":
            # Calm emotion boosts score
            wellness_score = clamp(base_wellness_score + 10)
        elif emotion_lower == "sad":
            # Sad emotion reduces score significantly
            wellness_score = clamp(base_wellness_score - 30)
        elif emotion_lower in ("anger", "fear", "disgust"):
            # High stress emotions reduce score more
            wellness_score = clamp(base_wellness_score - 35)
        elif emotion_lower == "surprised":
            # Surprised is neutral, slight adjustment
            wellness_score = clamp(base_wellness_score - 5)
        elif emotion_lower == "neutral":
            # Neutral - no adjustment
            wellness_score = base_wellness_score
        else:
            # Unknown emotion - no adjustment
            wellness_score = base_wellness_score
    else:
        wellness_score = base_wellness_score
    
    return {
        "wellness_score": round(float(wellness_score), 2),
        "stress_level": round(float(stress_level), 2),
        "energy_level": round(float(energy_level), 2),
        "hydration_level": round(float(hydration_level), 2),
        "voice_quality": {
            "clarity": round(float(clarity), 2),
            "volume_consistency": round(float(min(100, max(0, energy_from_rms))), 2),
            "speech_rate": ("fast" if (audio_feats.get("speech_rate_bpm") or 0) > 160 else "normal" if (audio_feats.get("speech_rate_bpm") or 0) > 80 else "slow")
        },
        "health_indicators": {
            "breathing_rate": "normal",
            "voice_tone": "relaxed" if (stress_level < 40) else "tense",
            "fatigue_detected": bool(fatigue_detected)
        }
    }

def generate_recommendations(metrics: Dict[str, Any], normalized_emotions: Dict[str, float]) -> list:
    recs = []
    stress = metrics["stress_level"]
    energy = metrics["energy_level"]
    hydration = metrics["hydration_level"]
    tired = normalized_emotions.get("tired", 0.0)
    if stress >= 70:
        recs.append({"type":"breathing_exercise","priority":"high","message":"High stress detected. Try a 2-minute breathing exercise (box breathing)."})
    elif stress >= 45:
        recs.append({"type":"breathing_exercise","priority":"medium","message":"Moderate stress present. Try a 60-second guided breathing exercise."})
    if energy < 40 or tired > 40:
        recs.append({"type":"micro_nap","priority":"high" if energy < 25 else "medium","message":"Low energy / tiredness detected. Consider a 10–20 minute power nap or light movement."})
    if hydration < 50:
        recs.append({"type":"hydration","priority":"medium","message":"Hydration estimate is low. Drink a glass of water."})
    else:
        recs.append({"type":"hydration","priority":"low","message":"Stay hydrated — a small reminder to drink water."})
    if metrics["wellness_score"] < 50:
        recs.append({"type":"reduce_noise","priority":"medium","message":"Try moving to a quieter environment or reducing background noise."})
    return recs

# -----------------------
# Core processing - EXACTLY matching original Gradio code
# -----------------------
# classify_audio function kept for reference - actual processing now in _process_array_and_build_response

def _process_array_and_build_response(y: np.ndarray, sr: int, start_ts: float = None) -> Dict[str, Any]:
    """
    Process audio array and build response - now uses EXACT original logic
    """
    if start_ts is None:
        start_ts = time.time()
    
    # Validate input
    if y is None or len(y) == 0:
        raise ValueError("Audio array is empty")
    
    # Convert to numpy array and ensure it's float32 - EXACTLY as original
    speech = np.asarray(y).astype(np.float32).flatten()
    
    # Check for NaN or Inf values and handle them
    if np.any(np.isnan(speech)) or np.any(np.isinf(speech)):
        print("[Audio] Warning: NaN or Inf values detected, replacing with zeros")
        speech = np.nan_to_num(speech, nan=0.0, posinf=0.0, neginf=0.0)
    
    # Ensure audio is not all zeros (silence)
    if np.all(speech == 0):
        print("[Audio] Warning: Audio appears to be silence (all zeros)")
    
    sample_rate = sr
    
    print(f"[Audio] Processing: {len(speech)} samples, {len(speech)/sample_rate:.2f}s, SR: {sample_rate}Hz")
    
    # Normalize audio to prevent clipping and ensure consistent processing
    # Clip extreme values to prevent issues
    max_val = np.abs(speech).max()
    if max_val > 0:
        # Normalize to [-1, 1] range if needed
        if max_val > 1.0:
            speech = speech / max_val
        # Ensure values are in valid range
        speech = np.clip(speech, -1.0, 1.0)
    
    # Process audio - EXACTLY as in original classify_audio function
    inputs = audio_processor(
        speech,
        sampling_rate=sample_rate,
        return_tensors="pt",
        padding=True
    )
    
    # Debug: Check input tensor shape
    if hasattr(inputs, 'input_values'):
        print(f"[Audio] Input tensor shape: {inputs.input_values.shape}")
    
    # Model inference - EXACTLY as in original
    with torch.no_grad():
        outputs = audio_model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=1).squeeze().tolist()
        if isinstance(probs, float):
            probs = [probs]
    
    # Ensure we have the correct number of probabilities (8 emotions)
    expected_labels = len(id2label_raw)
    if len(probs) != expected_labels:
        print(f"[Audio] Warning: Expected {expected_labels} probabilities, got {len(probs)}")
        # Pad or truncate if needed
        if len(probs) < expected_labels:
            probs = probs + [0.0] * (expected_labels - len(probs))
        else:
            probs = probs[:expected_labels]
    
    # Prediction - EXACTLY as in original
    prediction = {
        id2label_raw[str(i)]: round(probs[i], 3) for i in range(len(probs))
    }
    
    # Debug: Print top predictions
    sorted_predictions = sorted(prediction.items(), key=lambda kv: kv[1], reverse=True)
    print(f"[Audio] Top predictions: {sorted_predictions[:3]}")
    
    # Convert prediction dict to raw_probs format for compatibility
    raw_probs = {}
    for label, prob in prediction.items():
        # Find the index for this label
        for idx, lbl in id2label_raw.items():
            if lbl == label:
                raw_probs[idx] = prob
                break
    
    # Keep raw copy for audio features
    raw_y = np.asarray(y).astype(np.float32).flatten()
    try:
        raw_rms = float(np.mean(librosa.feature.rms(y=raw_y)))
    except Exception:
        raw_rms = None
    
    # Use original audio (not normalized/trimmed) for features
    audio_feats = compute_basic_audio_features(raw_y, sr)
    
    # Get raw label scores (from prediction dict)
    raw_label_scores = {label: round(prob * 100, 3) for label, prob in prediction.items()}
    
    # Get primary emotion from prediction (highest probability) FIRST
    primary_emotion = max(prediction.items(), key=lambda kv: kv[1])[0]
    
    # Normalize emotions for wellness metrics
    normalized_emotions = normalize_emotion_probs(raw_probs)
    # Pass primary emotion to metrics calculation for better score alignment
    metrics = derive_health_metrics(normalized_emotions, audio_feats, primary_emotion)
    recommendations = generate_recommendations(metrics, normalized_emotions)
    
    processing_time_ms = int((time.time() - start_ts) * 1000)
    confidence_score = round(max(prediction.values()), 3) if len(prediction) > 0 else 0.0
    
    response = {
        "success": True,
        "recording_id": f"rec_{int(time.time()*1000)}",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "analysis": {
            "wellness_score": metrics["wellness_score"],
            "stress_level": metrics["stress_level"],
            "energy_level": metrics["energy_level"],
            "hydration_level": metrics["hydration_level"],
            "emotions": normalized_emotions,
            "primary_emotion": primary_emotion.lower(),  # Match original format
            "voice_quality": metrics["voice_quality"],
            "health_indicators": metrics["health_indicators"]
        },
        "recommendations": recommendations,
        "metadata": {
            "processing_time_ms": processing_time_ms,
            "model_version": MODEL_VERSION,
            "confidence_score": confidence_score,
            "audio_features": {},
            "raw_emotion_scores": raw_label_scores
        }
    }
    
    # Combine audio features with raw_rms
    audio_features_combined = {"raw_rms": raw_rms}
    audio_features_combined.update(audio_feats)
    response["metadata"]["audio_features"] = audio_features_combined
    return response

# -----------------------
# Endpoints
# -----------------------
def _process_video(video_path: str, start_ts: float = None, conf_threshold: float = 0.25) -> Dict[str, Any]:
    """
    Process video file using YOLO model for object detection/recognition
    Also extracts audio for emotion analysis
    
    Args:
        video_path: Path to video file
        start_ts: Start timestamp for processing time calculation
        conf_threshold: Confidence threshold for detections (default 0.25)
    """
    if start_ts is None:
        start_ts = time.time()
    
    if video_model is None:
        return {
            "success": False,
            "error": "VIDEO_MODEL_NOT_LOADED",
            "message": "Video model is not available. Please ensure best.pt exists."
        }
    
    try:
        # Open video file
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"success": False, "error": "VIDEO_OPEN_FAILED", "message": "Could not open video file"}
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else 0
        
        print(f"[Video] Processing: {duration:.2f}s, {frame_count} frames, {fps:.2f} fps, {width}x{height}")
        
        # Process frames - sample more frames for better detection
        # Sample 3-5 frames per second depending on video length
        if duration < 5:
            frame_skip = max(1, int(fps / 5))  # 5 fps for short videos
        elif duration < 30:
            frame_skip = max(1, int(fps / 3))  # 3 fps for medium videos
        else:
            frame_skip = max(1, int(fps / 2))  # 2 fps for long videos
        
        detected_objects = {}  # Use dict for better tracking
        frame_results = []
        total_detections = 0
        
        frame_idx = 0
        processed_frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_idx % frame_skip == 0:
                processed_frame_count += 1
                try:
                    # Run YOLO inference with confidence threshold
                    results = video_model(
                        frame,
                        conf=conf_threshold,  # Confidence threshold
                        verbose=False,
                        imgsz=640  # Standard YOLO input size
                    )
                    
                    # Extract detections
                    frame_detections = []
                    for result in results:
                        if result.boxes is not None and len(result.boxes) > 0:
                            boxes = result.boxes
                            for i in range(len(boxes)):
                                cls = int(boxes.cls[i])
                                conf = float(boxes.conf[i])
                                class_name = video_model.names[cls]
                                
                                # Only include detections above threshold
                                if conf >= conf_threshold:
                                    bbox = boxes.xyxy[i].tolist()
                                    
                                    frame_detections.append({
                                        "class": class_name,
                                        "confidence": round(conf, 3),
                                        "bbox": bbox
                                    })
                                    
                                    total_detections += 1
                                    
                                    # Track unique objects with better aggregation
                                    if class_name not in detected_objects:
                                        detected_objects[class_name] = {
                                            "count": 1,
                                            "max_confidence": conf,
                                            "min_confidence": conf,
                                            "first_seen": round(frame_idx / fps, 2),
                                            "last_seen": round(frame_idx / fps, 2),
                                            "avg_confidence": conf
                                        }
                                    else:
                                        obj_data = detected_objects[class_name]
                                        obj_data["count"] += 1
                                        obj_data["max_confidence"] = max(obj_data["max_confidence"], conf)
                                        obj_data["min_confidence"] = min(obj_data["min_confidence"], conf)
                                        obj_data["last_seen"] = round(frame_idx / fps, 2)
                                        # Update average confidence
                                        total_conf = obj_data["avg_confidence"] * (obj_data["count"] - 1) + conf
                                        obj_data["avg_confidence"] = total_conf / obj_data["count"]
                    
                    if frame_detections:
                        frame_results.append({
                            "frame": frame_idx,
                            "time": round(frame_idx / fps, 2),
                            "detections": frame_detections
                        })
                except Exception as e:
                    print(f"[Video] Error processing frame {frame_idx}: {e}")
                    continue
            
            frame_idx += 1
        
        cap.release()
        
        print(f"[Video] Processed {processed_frame_count} frames, found {total_detections} detections, {len(detected_objects)} unique objects")
        
        # Extract audio from video for emotion analysis
        audio_analysis = None
        try:
            print(f"[Video] Extracting audio from video...")
            y, sr = librosa.load(video_path, sr=BUFFER_SR, mono=True)
            if len(y) > 0:
                audio_analysis = _process_array_and_build_response(y, sr, start_ts=start_ts)
                print(f"[Video] Audio analysis successful")
            else:
                print(f"[Video] No audio track found in video")
        except Exception as e:
            print(f"[Video] Warning: Could not extract audio from video: {e}")
            import traceback
            traceback.print_exc()
        
        # detected_objects is already a dict with aggregated data
        unique_objects = detected_objects
        
        # Combine video and audio analysis
        processing_time_ms = int((time.time() - start_ts) * 1000)
        
        response = {
            "success": True,
            "recording_id": f"video_{int(time.time()*1000)}",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "analysis": {
                "video_analysis": {
                    "duration": round(duration, 2),
                    "fps": round(fps, 2),
                    "total_frames": frame_count,
                    "processed_frames": processed_frame_count,
                    "total_detections": total_detections,
                    "detected_objects": unique_objects,
                    "frame_detections": frame_results[:100],  # Limit to first 100 frames
                    "video_resolution": f"{width}x{height}",
                    "confidence_threshold": conf_threshold
                },
                "audio_analysis": audio_analysis["analysis"] if audio_analysis and audio_analysis.get("success") else None
            },
            "metadata": {
                "processing_time_ms": processing_time_ms,
                "model_version": MODEL_VERSION,
                "video_model": "YOLO",
                "audio_model": MODEL_NAME if audio_analysis else None,
                "video_stats": {
                    "frames_processed": processed_frame_count,
                    "detections_found": total_detections,
                    "unique_objects": len(unique_objects)
                }
            }
        }
        
        # Merge audio wellness metrics if available
        if audio_analysis and audio_analysis.get("success"):
            response["analysis"]["wellness_score"] = audio_analysis["analysis"]["wellness_score"]
            response["analysis"]["stress_level"] = audio_analysis["analysis"]["stress_level"]
            response["analysis"]["energy_level"] = audio_analysis["analysis"]["energy_level"]
            response["analysis"]["emotions"] = audio_analysis["analysis"]["emotions"]
            response["analysis"]["primary_emotion"] = audio_analysis["analysis"]["primary_emotion"]
            response["recommendations"] = audio_analysis.get("recommendations", [])
        else:
            # Default wellness metrics if no audio
            response["analysis"]["wellness_score"] = 70
            response["analysis"]["stress_level"] = 30
            response["analysis"]["energy_level"] = 60
            response["analysis"]["emotions"] = {"neutral": 100.0}
            response["analysis"]["primary_emotion"] = "neutral"
            response["recommendations"] = []
        
        return response
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[Video] Processing failed: {e}")
        print(f"[Video] Traceback: {error_trace}")
        return {
            "success": False,
            "error": "VIDEO_PROCESSING_FAILED",
            "message": str(e),
            "traceback": error_trace
        }

@app.route("/health", methods=["GET"])
def health():
    video_status = "loaded" if video_model is not None else "not_loaded"
    return jsonify({
        "status": "ok",
        "audio_model": MODEL_NAME,
        "video_model": video_status,
        "version": MODEL_VERSION
    }), 200

@app.route("/infer", methods=["POST"])
def infer():
    start_ts = time.time()
    tmp_name = None
    try:
        # multipart upload
        if "audio" in request.files:
            audio_file = request.files["audio"]
            fname = audio_file.filename or "upload.wav"
            file_ext = os.path.splitext(fname)[1] or ".webm"
            
            # Save uploaded file
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
                tmp_name = tmp.name
                audio_file.save(tmp_name)
            
            print(f"[Audio] Processing file: {fname}, extension: {file_ext}")
            
            # Load audio - librosa handles webm, wav, mp3, etc. and resamples to 16kHz
            try:
                # Use librosa with explicit parameters for consistent loading
                y, sr = librosa.load(
                    tmp_name, 
                    sr=BUFFER_SR,  # Resample to 16kHz
                    mono=True,      # Convert to mono
                    duration=None,  # Load entire file
                    offset=0.0      # Start from beginning
                )
                
                # Validate audio data
                if y is None or len(y) == 0:
                    raise ValueError("Audio file is empty or could not be loaded")
                
                # Ensure it's a 1D array
                y = np.asarray(y).flatten()
                
                # Check minimum length (at least 0.1 seconds)
                min_samples = int(BUFFER_SR * 0.1)
                if len(y) < min_samples:
                    raise ValueError(f"Audio too short: {len(y)} samples (minimum {min_samples})")
                
                print(f"[Audio] Loaded: {len(y)} samples, {len(y)/sr:.2f}s, sample rate: {sr}Hz")
                
            except Exception as load_error:
                print(f"[Audio] Librosa load failed: {load_error}, trying soundfile fallback...")
                # If librosa fails, try with soundfile as fallback
                try:
                    import soundfile as sf
                    y, sr = sf.read(tmp_name)
                    
                    # Validate loaded data
                    if y is None or len(y) == 0:
                        raise ValueError("Audio file is empty")
                    
                    # Convert to mono if stereo
                    if len(y.shape) > 1:
                        y = librosa.to_mono(y)
                    
                    # Resample if needed
                    if sr != BUFFER_SR:
                        y = librosa.resample(y, orig_sr=sr, target_sr=BUFFER_SR)
                        sr = BUFFER_SR
                    
                    # Ensure it's a 1D array
                    y = np.asarray(y).flatten()
                    
                    print(f"[Audio] Loaded via soundfile: {len(y)} samples, {len(y)/sr:.2f}s, sample rate: {sr}Hz")
                    
                except Exception as sf_error:
                    print(f"[Audio] Soundfile fallback also failed: {sf_error}")
                    raise ValueError(f"Could not load audio file: {load_error}, fallback error: {sf_error}")
        # base64 fallback
        elif request.form.get("audio_base64"):
            b64 = request.form.get("audio_base64")
            if b64.startswith("data:"):
                b64 = b64.split(",", 1)[1]
            audio_bytes = base64.b64decode(b64)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp_name = tmp.name
                tmp.write(audio_bytes)
            y, sr = librosa.load(tmp_name, sr=BUFFER_SR)
        else:
            return jsonify({"success": False, "error": "NO_AUDIO", "message": "Provide multipart 'audio' file or 'audio_base64'."}), 400

        resp = _process_array_and_build_response(y, sr, start_ts=start_ts)
        return jsonify(resp), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[Audio] Processing failed: {e}")
        print(f"[Audio] Traceback: {error_trace}")
        return jsonify({
            "success": False, 
            "error": "PROCESSING_FAILED", 
            "message": str(e),
            "details": error_trace.split('\n')[-2] if len(error_trace.split('\n')) > 1 else str(e)
        }), 500
    finally:
        try:
            if tmp_name and os.path.exists(tmp_name):
                os.remove(tmp_name)
        except Exception:
            pass

@app.route("/infer_chunk", methods=["POST"])
def infer_chunk():
    start_ts = time.time()
    tmp_name = None
    try:
        session_id = request.form.get("session_id", None)
        include_buffer_seconds = int(request.form.get("include_buffer_seconds", 0))

        # get chunk
        if "audio" in request.files:
            audio_file = request.files["audio"]
            fname = audio_file.filename or "chunk.wav"
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(fname)[1] or ".wav") as tmp:
                tmp_name = tmp.name
                audio_file.save(tmp_name)
            y_chunk, sr = librosa.load(tmp_name, sr=BUFFER_SR)
        elif request.form.get("audio_base64"):
            b64 = request.form.get("audio_base64")
            if b64.startswith("data:"):
                b64 = b64.split(",", 1)[1]
            audio_bytes = base64.b64decode(b64)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp_name = tmp.name
                tmp.write(audio_bytes)
            y_chunk, sr = librosa.load(tmp_name, sr=BUFFER_SR)
        else:
            return jsonify({"success": False, "error": "NO_AUDIO_CHUNK"}), 400

        # update rolling buffer
        if session_id:
            buf = ROLLING_BUFFERS.get(session_id)
            if buf is None:
                buf = deque()
                ROLLING_BUFFERS[session_id] = buf
            buf.append(y_chunk)
            # trim buffer to MAX_BUFFER_SECONDS
            total_len = sum(len(a) for a in buf)
            while (total_len / float(BUFFER_SR)) > MAX_BUFFER_SECONDS and len(buf) > 0:
                removed = buf.popleft()
                total_len = sum(len(a) for a in buf)

        # assemble input: either buffered concat or just chunk
        if session_id and include_buffer_seconds and session_id in ROLLING_BUFFERS:
            parts = list(ROLLING_BUFFERS[session_id])
            y = np.concatenate(parts) if len(parts) > 0 else y_chunk
        else:
            y = y_chunk

        resp = _process_array_and_build_response(y, sr, start_ts=start_ts)
        # add chunk id & include session_id echo
        resp["chunk_id"] = f"chunk_{int(time.time()*1000)}"
        if session_id:
            resp["session_id"] = session_id
        return jsonify(resp), 200

    except Exception as e:
        return jsonify({"success": False, "error": "CHUNK_PROCESSING_FAILED", "message": str(e)}), 500
    finally:
        try:
            if tmp_name and os.path.exists(tmp_name):
                os.remove(tmp_name)
        except Exception:
            pass

@app.route("/infer_frame", methods=["POST"])
def infer_frame():
    """
    Endpoint for analyzing a single video frame (for live camera recognition)
    Accepts image frames and returns object detection results
    """
    start_ts = time.time()
    tmp_name = None
    try:
        if "frame" not in request.files:
            return jsonify({
                "success": False,
                "error": "NO_FRAME",
                "message": "Provide multipart 'frame' file."
            }), 400
        
        # Get confidence threshold from request (default 0.25)
        conf_threshold = float(request.form.get("conf", 0.25))
        conf_threshold = max(0.0, min(1.0, conf_threshold))
        
        if video_model is None:
            return jsonify({
                "success": False,
                "error": "VIDEO_MODEL_NOT_LOADED",
                "detected_objects": {}
            }), 200  # Return 200 to not break live recording
        
        frame_file = request.files["frame"]
        
        # Save frame to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp_name = tmp.name
            frame_file.save(tmp_name)
        
        # Read frame using OpenCV
        frame = cv2.imread(tmp_name)
        if frame is None:
            return jsonify({
                "success": False,
                "error": "INVALID_FRAME",
                "detected_objects": {}
            }), 200
        
        # Run YOLO inference
        results = video_model(frame, conf=conf_threshold, verbose=False, imgsz=640)
        
        # Extract detections with bounding boxes
        detected_objects = {}
        detections = []  # List of all detections with bounding boxes
        
        for result in results:
            if result.boxes is not None and len(result.boxes) > 0:
                boxes = result.boxes
                frame_height, frame_width = frame.shape[:2]
                
                for i in range(len(boxes)):
                    cls = int(boxes.cls[i])
                    conf = float(boxes.conf[i])
                    class_name = video_model.names[cls]
                    
                    if conf >= conf_threshold:
                        # Get bounding box coordinates (x1, y1, x2, y2)
                        bbox = boxes.xyxy[i].cpu().numpy().tolist()
                        x1, y1, x2, y2 = bbox
                        
                        # Normalize coordinates to [0, 1] range for frontend scaling
                        normalized_bbox = [
                            x1 / frame_width,   # x1 normalized
                            y1 / frame_height,  # y1 normalized
                            x2 / frame_width,   # x2 normalized
                            y2 / frame_height   # y2 normalized
                        ]
                        
                        # Add detection with bounding box
                        detection = {
                            "class": class_name,
                            "confidence": round(conf, 3),
                            "bbox": normalized_bbox,  # Normalized [x1, y1, x2, y2]
                            "bbox_pixel": bbox  # Original pixel coordinates
                        }
                        detections.append(detection)
                        
                        # Aggregate for summary
                        if class_name not in detected_objects:
                            detected_objects[class_name] = {
                                "count": 1,
                                "max_confidence": conf,
                                "avg_confidence": conf
                            }
                        else:
                            obj_data = detected_objects[class_name]
                            obj_data["count"] += 1
                            obj_data["max_confidence"] = max(obj_data["max_confidence"], conf)
                            total_conf = obj_data["avg_confidence"] * (obj_data["count"] - 1) + conf
                            obj_data["avg_confidence"] = total_conf / obj_data["count"]
        
        processing_time_ms = int((time.time() - start_ts) * 1000)
        
        return jsonify({
            "success": True,
            "detected_objects": detected_objects,
            "detections": detections,  # All detections with bounding boxes
            "frame_size": {"width": frame_width, "height": frame_height},
            "processing_time_ms": processing_time_ms
        }), 200
        
    except Exception as e:
        import traceback
        print(f"[Frame] Processing failed: {e}")
        return jsonify({
            "success": False,
            "error": "FRAME_PROCESSING_FAILED",
            "message": str(e),
            "detected_objects": {}
        }), 200  # Return 200 to not break live recording
    finally:
        try:
            if tmp_name and os.path.exists(tmp_name):
                os.remove(tmp_name)
        except Exception:
            pass

@app.route("/infer_video", methods=["POST"])
def infer_video():
    """
    Endpoint for video analysis using YOLO model
    Accepts video files and returns object detection + audio emotion analysis
    
    Query parameters:
    - conf: Confidence threshold (default 0.25, range 0.0-1.0)
    """
    start_ts = time.time()
    tmp_name = None
    try:
        if "video" not in request.files:
            return jsonify({
                "success": False,
                "error": "NO_VIDEO",
                "message": "Provide multipart 'video' file."
            }), 400
        
        # Get confidence threshold from request (default 0.25)
        conf_threshold = float(request.form.get("conf", 0.25))
        conf_threshold = max(0.0, min(1.0, conf_threshold))  # Clamp between 0 and 1
        
        video_file = request.files["video"]
        fname = video_file.filename or "upload.mp4"
        file_ext = os.path.splitext(fname)[1] or ".mp4"
        
        print(f"[Video] Received video file: {fname}, confidence threshold: {conf_threshold}")
        
        # Save uploaded video to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            tmp_name = tmp.name
            video_file.save(tmp_name)
        
        # Process video with confidence threshold
        resp = _process_video(tmp_name, start_ts=start_ts, conf_threshold=conf_threshold)
        return jsonify(resp), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "PROCESSING_FAILED",
            "message": str(e)
        }), 500
    finally:
        try:
            if tmp_name and os.path.exists(tmp_name):
                os.remove(tmp_name)
        except Exception:
            pass

# -----------------------
# Run
# -----------------------
if __name__ == "__main__":
    # local dev only — for production use gunicorn/uvicorn + TLS
    # Disable dotenv loading to avoid encoding issues with binary files
    import os as os_module
    # Prevent Flask from auto-loading .env files that might be binary
    os_module.environ.setdefault('FLASK_SKIP_DOTENV', '1')
    app.run(host="0.0.0.0", port=5000, debug=False, load_dotenv=False)
