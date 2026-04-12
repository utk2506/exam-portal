# AI Proctor Service

Optional FastAPI service for webcam-based proctoring.

Phase 1 ships this as a scaffold with:

- health endpoint
- frame analysis contract
- webhook helper for posting detected violations to the API

Real OpenCV/YOLO pipelines can be added behind the same `/analyze-frame` contract.
