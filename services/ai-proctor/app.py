from datetime import datetime, timezone
from io import BytesIO
import base64
from typing import Any

import httpx
import numpy as np
from fastapi import FastAPI
from PIL import Image
from pydantic import BaseModel, Field

# MediaPipe for face detection and head pose
try:
    import mediapipe as mp  # type: ignore

    _mp_face_detection = mp.solutions.face_detection
    _mp_face_mesh = mp.solutions.face_mesh
    MEDIAPIPE_AVAILABLE = True
except (ImportError, AttributeError):
    MEDIAPIPE_AVAILABLE = False


class FrameAnalysisRequest(BaseModel):
    session_id: str
    image_base64: str
    posted_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class DetectionResult(BaseModel):
    session_id: str
    status: str
    cheating_score: float
    violations: list[dict[str, Any]]
    analyzed_at: datetime


app = FastAPI(title="Exam Platform AI Proctor", version="2.0.0")


def decode_frame(image_base64: str) -> np.ndarray:
    """Decode base64 JPEG into an RGB numpy array."""
    raw = base64.b64decode(image_base64)
    image = Image.open(BytesIO(raw)).convert("RGB")
    return np.array(image)


def analyze_with_mediapipe(frame: np.ndarray) -> list[dict[str, Any]]:
    """Run face detection and head-pose estimation on a single frame."""
    violations: list[dict[str, Any]] = []

    with _mp_face_detection.FaceDetection(
        model_selection=0, min_detection_confidence=0.5
    ) as detector:
        results = detector.process(frame)
        detections = results.detections or []

        face_count = len(detections)

        if face_count == 0:
            violations.append({"type": "no_face", "severity": "warning"})
        elif face_count > 1:
            violations.append({"type": "multiple_faces", "severity": "critical"})

    # Head pose / looking-away via face mesh
    if len(violations) == 0:
        with _mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        ) as mesh:
            mesh_results = mesh.process(frame)
            if mesh_results.multi_face_landmarks:
                landmarks = mesh_results.multi_face_landmarks[0].landmark
                # Estimate left/right yaw from nose tip (1) vs left/right temple (234, 454)
                nose = landmarks[1]
                left_temple = landmarks[234]
                right_temple = landmarks[454]
                midpoint_x = (left_temple.x + right_temple.x) / 2
                deviation = abs(nose.x - midpoint_x)
                # If nose is significantly offset from midpoint, candidate may be looking away
                if deviation > 0.09:
                    violations.append({"type": "looking_away", "severity": "info"})

    return violations


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "mediapipe": "available" if MEDIAPIPE_AVAILABLE else "unavailable"}


@app.post("/analyze-frame", response_model=DetectionResult)
async def analyze_frame(payload: FrameAnalysisRequest) -> DetectionResult:
    cheating_score = 0.0
    violations: list[dict[str, Any]] = []

    if MEDIAPIPE_AVAILABLE and payload.image_base64:
        try:
            frame = decode_frame(payload.image_base64)
            violations = analyze_with_mediapipe(frame)
        except Exception:
            # If decoding or inference fails, fall back gracefully
            violations = []

    # Also honour explicit metadata flags (from legacy callers)
    if payload.metadata.get("multiple_faces"):
        violations.append({"type": "multiple_faces", "severity": "critical"})
    if payload.metadata.get("phone_detected"):
        violations.append({"type": "phone_detected", "severity": "critical"})
    if payload.metadata.get("looking_away"):
        violations.append({"type": "looking_away", "severity": "warning"})
    if payload.metadata.get("no_face"):
        violations.append({"type": "no_face", "severity": "warning"})

    # Score: critical = 0.75, warning = 0.25, info = 0.1
    severity_weights = {"critical": 0.75, "warning": 0.25, "info": 0.1}
    cheating_score = min(1.0, sum(severity_weights.get(v.get("severity", "info"), 0.1) for v in violations))

    return DetectionResult(
        session_id=payload.session_id,
        status="ok",
        cheating_score=cheating_score,
        violations=violations,
        analyzed_at=datetime.now(timezone.utc),
    )


async def post_violation(api_url: str, token: str, violation: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{api_url}/api/violations/ai",
            headers={"Authorization": f"Bearer {token}"},
            json=violation,
        )
        response.raise_for_status()
        return response.json()
