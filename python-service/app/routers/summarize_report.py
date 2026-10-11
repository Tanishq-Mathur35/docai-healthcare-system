from fastapi import APIRouter, HTTPException
from app.models.schemas import SummarizeReportRequest, SummarizeReportResponse

router = APIRouter(prefix="", tags=["Report Summarization"])


@router.post("/summarize-report", response_model=SummarizeReportResponse)
async def summarize_report_endpoint(request: SummarizeReportRequest):
    if not request.clinicalText.strip():
        raise HTTPException(status_code=400, detail="clinicalText cannot be empty")

    text = request.clinicalText
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    key_findings = [line for line in lines if any(k in line.lower() for k in ["diagnos", "abnormal", "findings", "impression", "positive"])]
    if not key_findings:
        key_findings = lines[:3]

    risk_indicators = [line for line in lines if any(k in line.lower() for k in ["acute", "severe", "critical", "urgent", "malignant"])]

    summary = f"Clinical document review completed. Analyzed {len(lines)} structured sections. Identified {len(key_findings)} pertinent clinical observations."

    return SummarizeReportResponse(
        success=True,
        summary=summary,
        keyFindings=key_findings[:5],
        riskIndicators=risk_indicators[:5],
    )
