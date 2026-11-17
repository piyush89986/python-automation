import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.errors import BadRequestError, NotFoundError
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.schemas.common import StandardResponse

router = APIRouter()


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    currency: str = "USD"
    image_url: str = Field(..., min_length=5)
    link_url: str = Field(..., min_length=5)
    in_stock: bool = True
    category: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    in_stock: Optional[bool] = None
    category: Optional[str] = None


@router.get(
    "",
    summary="List E-Commerce Products",
    description="Fetch products for the business catalog to display in visual Instagram DM carousels.",
)
async def list_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    in_stock_only: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    business_id = current_user.business_id
    if not business_id:
        return StandardResponse(status="success", data=[])

    query = select(Product).where(Product.business_id == business_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.where(or_(Product.name.ilike(s), Product.description.ilike(s)))
    if category:
        query = query.where(Product.category == category)
    if in_stock_only is not None:
        query = query.where(Product.in_stock == in_stock_only)

    query = query.order_by(Product.created_at.desc())
    products = (await db.execute(query)).scalars().all()

    data = [
        {
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "currency": p.currency,
            "image_url": p.image_url,
            "link_url": p.link_url,
            "in_stock": p.in_stock,
            "category": p.category,
            "created_at": p.created_at.isoformat(),
        }
        for p in products
    ]

    return StandardResponse(status="success", data=data)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create Product",
)
async def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    business_id = current_user.business_id
    if not business_id:
        raise BadRequestError("Workspace required")

    product = Product(
        business_id=business_id,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        price=payload.price,
        currency=payload.currency.upper(),
        image_url=payload.image_url.strip(),
        link_url=payload.link_url.strip(),
        in_stock=payload.in_stock,
        category=payload.category.strip() if payload.category else None,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)

    return StandardResponse(
        status="success",
        message="Product created successfully",
        data={
            "id": str(product.id),
            "name": product.name,
            "price": product.price,
            "image_url": product.image_url,
            "link_url": product.link_url,
            "in_stock": product.in_stock,
        },
    )


@router.patch(
    "/{product_id}",
    summary="Update Product",
)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).where(
        Product.id == product_id,
        Product.business_id == current_user.business_id,
    )
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise NotFoundError("Product not found")

    data = payload.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(product, field, val)

    await db.commit()
    await db.refresh(product)

    return StandardResponse(
        status="success",
        message="Product updated",
        data={
            "id": str(product.id),
            "name": product.name,
            "price": product.price,
            "in_stock": product.in_stock,
        },
    )


@router.delete(
    "/{product_id}",
    summary="Delete Product",
)
async def delete_product(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).where(
        Product.id == product_id,
        Product.business_id == current_user.business_id,
    )
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise NotFoundError("Product not found")

    await db.delete(product)
    await db.commit()

    return StandardResponse(
        status="success",
        message="Product deleted",
        data={"id": str(product_id)},
    )
