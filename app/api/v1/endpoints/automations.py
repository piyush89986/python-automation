import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.errors import NotFoundError
from app.api.deps import get_current_user
from app.models.user import User
from app.models.automation import AutomationWorkflow, TriggerType
from app.schemas.common import StandardResponse

router = APIRouter()


class WorkflowPayload(BaseModel):
    name: str = Field(..., min_length=2)
    trigger_type: str = TriggerType.DM_RECEIVED.value
    nodes_graph: Optional[List[Dict[str, Any]]] = None
    edges_graph: Optional[List[Dict[str, Any]]] = None
    is_active: bool = True


@router.get(
    "",
    summary="List Automation Workflows",
)
async def list_workflows(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    business_id = current_user.business_id
    if not business_id:
        return StandardResponse(status="success", data=[])

    query = select(AutomationWorkflow).where(AutomationWorkflow.business_id == business_id)
    workflows = (await db.execute(query)).scalars().all()

    data = [
        {
            "id": str(w.id),
            "name": w.name,
            "trigger_type": w.trigger_type,
            "nodes_graph": w.nodes_graph or [],
            "edges_graph": w.edges_graph or [],
            "is_active": w.is_active,
            "created_at": w.created_at.isoformat(),
        }
        for w in workflows
    ]

    return StandardResponse(status="success", data=data)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create Automation Workflow",
)
async def create_workflow(
    payload: WorkflowPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    business_id = current_user.business_id
    workflow = AutomationWorkflow(
        business_id=business_id,
        name=payload.name,
        trigger_type=payload.trigger_type,
        nodes_graph=payload.nodes_graph or [],
        edges_graph=payload.edges_graph or [],
        is_active=payload.is_active,
    )
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)

    return StandardResponse(
        status="success",
        message="Workflow created",
        data={"id": str(workflow.id), "name": workflow.name},
    )


@router.patch(
    "/{workflow_id}",
    summary="Save / Update Workflow Canvas",
)
async def update_workflow(
    workflow_id: uuid.UUID,
    payload: WorkflowPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AutomationWorkflow).where(
        AutomationWorkflow.id == workflow_id,
        AutomationWorkflow.business_id == current_user.business_id,
    )
    wf = (await db.execute(stmt)).scalar_one_or_none()
    if not wf:
        raise NotFoundError("Workflow not found")

    wf.name = payload.name
    wf.trigger_type = payload.trigger_type
    if payload.nodes_graph is not None:
        wf.nodes_graph = payload.nodes_graph
    if payload.edges_graph is not None:
        wf.edges_graph = payload.edges_graph
    wf.is_active = payload.is_active

    await db.commit()
    return StandardResponse(status="success", message="Workflow saved", data={"id": str(wf.id)})


@router.delete(
    "/{workflow_id}",
    summary="Delete Workflow",
)
async def delete_workflow(
    workflow_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AutomationWorkflow).where(
        AutomationWorkflow.id == workflow_id,
        AutomationWorkflow.business_id == current_user.business_id,
    )
    wf = (await db.execute(stmt)).scalar_one_or_none()
    if not wf:
        raise NotFoundError("Workflow not found")

    await db.delete(wf)
    await db.commit()
    return StandardResponse(status="success", message="Workflow deleted", data={"id": str(workflow_id)})
