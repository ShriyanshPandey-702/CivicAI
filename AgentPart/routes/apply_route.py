from fastapi import APIRouter
from pydantic import BaseModel
from tools.dummy_crawler import run_dummy_crawler

apply_router = APIRouter()

class DummyApplyRequest(BaseModel):
    citizen_profile: dict
    scheme_id: str

@apply_router.post("/apply-dummy")
async def apply_dummy(request: DummyApplyRequest):
    """
    Simulates an automated welfare scheme application submission using a Playwright crawler.
    Navigates to the dummy scheme application portal, fields are auto-filled, and the form is submitted.
    """
    result = await run_dummy_crawler(request.citizen_profile, request.scheme_id)
    return result
