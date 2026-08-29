"""MongoDB document models for the real estate portal."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any, List, Optional
import uuid

from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field


def _uuid() -> str:
    return str(uuid.uuid4())


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


PyStr = Annotated[str, BeforeValidator(lambda v: str(v) if v is not None else v)]


class BaseDoc(BaseModel):
    """Base document with UUID id and ISO timestamps (MongoDB safe)."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str = Field(default_factory=_uuid)
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


# ---------- Auth ----------
class User(BaseDoc):
    email: EmailStr
    phone: Optional[str] = None
    name: str
    password_hash: str
    role: str = "user"  # super_admin | admin | agent | developer | owner | user
    avatar: Optional[str] = None
    office_address: Optional[str] = None
    dob: Optional[str] = None
    rera_number: Optional[str] = None
    whatsapp: Optional[str] = None
    verified: bool = False
    active: bool = True
    approved: Optional[bool] = None  # False = agent/developer/owner awaiting admin approval; None/True = approved


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str
    avatar: Optional[str] = None
    office_address: Optional[str] = None
    dob: Optional[str] = None
    rera_number: Optional[str] = None
    whatsapp: Optional[str] = None
    verified: bool = False


class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: Optional[str] = "user"


class LoginInput(BaseModel):
    email: EmailStr
    password: str


# ---------- Location ----------
class Location(BaseDoc):
    name: str
    slug: str
    type: str = "locality"  # city | locality | micro_market
    city: Optional[str] = None
    state: str = "Maharashtra"
    country: str = "India"
    lat: Optional[float] = None
    lng: Optional[float] = None
    hero_image: Optional[str] = None
    description: Optional[str] = None
    seo: dict = Field(default_factory=dict)


# ---------- Developer ----------
class Developer(BaseDoc):
    name: str
    slug: str
    logo: Optional[str] = None
    cover: Optional[str] = None
    description: Optional[str] = None
    experience_years: int = 0
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    rera_number: Optional[str] = None
    office_address: Optional[str] = None
    locations: List[str] = Field(default_factory=list)
    total_projects: int = 0
    verified: bool = True
    show_on_homepage: bool = False
    seo: dict = Field(default_factory=dict)


# ---------- Agent ----------
class Agent(BaseDoc):
    user_id: Optional[str] = None
    name: str
    slug: str
    photo: Optional[str] = None
    bio: Optional[str] = None
    experience_years: int = 0
    phone: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    locations: List[str] = Field(default_factory=list)
    specialization: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    rera_id: Optional[str] = None
    verified: bool = True
    rating: float = 4.8
    total_listings: int = 0
    seo: dict = Field(default_factory=dict)


# ---------- Property ----------
class Property(BaseDoc):
    title: str
    slug: str
    description: Optional[str] = None
    listing_type: str = "sale"  # sale | rent
    property_category: str = "residential"  # residential | commercial
    property_type: str = "apartment"  # apartment | villa | plot | office | shop | warehouse etc.
    bhk: Optional[int] = None
    bathrooms: Optional[int] = None
    balcony: Optional[int] = None
    parking: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    furnishing: Optional[str] = None  # unfurnished | semi | fully
    construction_status: Optional[str] = None  # ready | under_construction | new_launch
    possession: Optional[str] = None
    property_age: Optional[str] = None

    price: float
    price_per_sqft: Optional[float] = None
    rent: Optional[float] = None
    deposit: Optional[float] = None
    maintenance: Optional[float] = None
    negotiable: bool = False

    carpet_area: Optional[float] = None
    builtup_area: Optional[float] = None
    plot_area: Optional[float] = None
    area_unit: str = "sqft"

    city: str
    location: str  # locality slug
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

    amenities: List[str] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    video_url: Optional[str] = None
    youtube_url: Optional[str] = None
    virtual_tour_url: Optional[str] = None
    brochure_url: Optional[str] = None
    floor_plan: Optional[str] = None

    developer_id: Optional[str] = None
    project_id: Optional[str] = None
    agent_id: Optional[str] = None
    owner_id: Optional[str] = None

    rera_number: Optional[str] = None
    status: str = "active"  # draft | pending | active | sold | rented | archived
    verified: bool = True
    featured: bool = False
    views: int = 0

    # Homepage placement + marketing flags
    investor_property: bool = False
    best_resale: bool = False
    flags: List[str] = Field(default_factory=list)  # low_cost | hot_inventory | best_seller (max 2)

    # Media additions
    main_image: Optional[str] = None
    unit_plan: Optional[str] = None
    nearby_locations: List[dict] = Field(default_factory=list)  # {name, distance, category}
    google_map_link: Optional[str] = None

    tenant_preference: Optional[str] = None
    available_from: Optional[str] = None
    lease_duration: Optional[str] = None

    # Optional on-site camera/location verification (agent captures; admin verifies)
    verification: dict = Field(default_factory=dict)  # {images: [], lat, lng, captured_at}
    verified_at: Optional[str] = None
    reviewed_at: Optional[str] = None
    rejection_reason: Optional[str] = None

    seo: dict = Field(default_factory=dict)


# ---------- Project ----------
class Project(BaseDoc):
    name: str
    slug: str
    description: Optional[str] = None
    developer_id: str
    city: str
    location: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

    price_from: float
    price_to: float
    configurations: List[str] = Field(default_factory=list)  # ["1 BHK","2 BHK"]
    area_from: Optional[float] = None
    area_to: Optional[float] = None

    launch_date: Optional[str] = None
    possession_date: Optional[str] = None
    construction_status: str = "under_construction"
    rera_number: Optional[str] = None
    rera_link: Optional[str] = None

    total_towers: int = 1
    total_units: int = 0
    total_floors: Optional[str] = None  # supports multi-tower text, e.g. "Tower A: 20, Tower B: 30"
    hero_title: Optional[str] = None  # H1 shown over the main image on the public project page
    hero_description: Optional[str] = None  # short description shown under the hero H1

    amenities: List[str] = Field(default_factory=list)
    specifications: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    videos: List[str] = Field(default_factory=list)
    brochure_url: Optional[str] = None
    floor_plans: List[dict] = Field(default_factory=list)
    payment_plan: Optional[str] = None
    virtual_tour_url: Optional[str] = None

    featured: bool = False
    verified: bool = True
    hero_project: bool = False
    status: str = "active"
    owner_id: Optional[str] = None
    assigned_to: Optional[str] = None  # user this project is assigned to (Admin → Project form "User" field)
    import_source_url: Optional[str] = None

    # Homepage placement + marketing flags
    show_featured_residential: bool = False
    show_commercial_homepage: bool = False
    flags: List[str] = Field(default_factory=list)  # featured | new_launch | best_payment_plan | best_performer (max 2)

    # RERA additions
    rera_qr_url: Optional[str] = None
    # Multiple RERA entries: [{number, description, url, qr_url, certificate_url}]
    rera_entries: List[dict] = Field(default_factory=list)
    # Dedicated uploads
    master_plan: Optional[str] = None
    youtube_url: Optional[str] = None
    land_size: Optional[str] = None

    # Media + location additions
    main_image: Optional[str] = None
    property_category: str = "residential"  # residential | commercial
    nearby_locations: List[dict] = Field(default_factory=list)  # {name, distance, category}
    google_map_link: Optional[str] = None

    seo: dict = Field(default_factory=dict)


# ---------- CMS Page ----------
class Page(BaseDoc):
    title: str
    slug: str
    content: str = ""  # rich-text HTML
    published: bool = False
    seo: dict = Field(default_factory=dict)


# ---------- SEO Page (per-route meta, editable in admin) ----------
class SeoPage(BaseDoc):
    page: str  # route path, e.g. "/", "/properties", "/home-loan"
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    canonical_url: Optional[str] = None
    robots: Optional[str] = None  # e.g. "index,follow" | "noindex,nofollow"


# ---------- Lead / Enquiry ----------
class Lead(BaseDoc):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    profession: Optional[str] = None
    designation: Optional[str] = None
    company_name: Optional[str] = None
    message: Optional[str] = None
    property_finalised: Optional[bool] = None
    property_cost: Optional[float] = None
    loan_amount: Optional[float] = None
    loan_type: Optional[str] = None
    property_id: Optional[str] = None
    project_id: Optional[str] = None
    agent_id: Optional[str] = None
    developer_id: Optional[str] = None
    source: str = "website"
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    landing_page: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    bhk: Optional[int] = None
    configuration: Optional[str] = None  # e.g. "2 BHK", "Office Space"
    preferred_location: Optional[str] = None
    preferred_visit_date: Optional[str] = None
    preferred_visit_time: Optional[str] = None
    source_url: Optional[str] = None
    status: str = "new"  # new | contacted | interested | site_visit | negotiation | booking | converted | lost
    priority: str = "warm"  # hot | warm | cold
    assigned_to: Optional[str] = None
    next_follow_up: Optional[str] = None  # ISO date the agent plans to follow up
    notes: List[dict] = Field(default_factory=list)


# ---------- Site Visit ----------
class SiteVisit(BaseDoc):
    property_id: Optional[str] = None
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    name: str
    phone: str
    email: Optional[str] = None
    visit_date: str
    visit_time: str
    visitors: int = 1
    notes: Optional[str] = None
    status: str = "requested"  # requested | confirmed | rescheduled | completed | cancelled | no_show


# ---------- Favorite ----------
class Favorite(BaseDoc):
    user_id: str
    property_id: str


# ---------- Saved Search ----------
class SavedSearch(BaseDoc):
    user_id: str
    name: str
    filters: dict
    alert_frequency: str = "instant"  # instant | daily | weekly


# ---------- Blog ----------
class Blog(BaseDoc):
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    cover_image: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    author: str = "Editorial Team"
    published: bool = True
    published_at: Optional[str] = None
    related_properties: List[str] = Field(default_factory=list)
    related_projects: List[str] = Field(default_factory=list)
    seo: dict = Field(default_factory=dict)


# ---------- Testimonial ----------
class Testimonial(BaseDoc):
    name: str
    photo: Optional[str] = None
    review: str
    rating: float = 5.0
    role: Optional[str] = None
    project: Optional[str] = None
    published: bool = True
    show_on_homepage: bool = False
    seo: dict = Field(default_factory=dict)


# ---------- Amenity ----------
class Amenity(BaseDoc):
    name: str
    icon: Optional[str] = None
    category: Optional[str] = None
    active: bool = True


# ---------- Disclaimer acknowledgement ----------
class DisclaimerAck(BaseDoc):
    """Visitor acknowledgement of the listings information disclaimer (audit record)."""
    version: str = "v1"
    visitor_id: Optional[str] = None
    user_id: Optional[str] = None
    acknowledged: bool = True


# ---------- Visitor analytics ----------
class AnalyticsEvent(BaseDoc):
    """Anonymous visitor activity event. No IP, name or contact data is ever stored."""
    event: str  # page_view | property_view | project_view | whatsapp_click | call_click
    path: Optional[str] = None
    visitor_id: Optional[str] = None
    session_id: Optional[str] = None
    device: Optional[str] = None  # mobile | desktop | tablet (derived from user-agent)
    referrer: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    meta: dict = Field(default_factory=dict)


# ---------- FAQ ----------
class FAQ(BaseDoc):
    question: str
    answer: str
    category: Optional[str] = None  # buy | rent | invest | general
    order: int = 0
    published: bool = True
    seo: dict = Field(default_factory=dict)


# ---------- Site Settings (singleton) ----------
class SiteSettings(BaseDoc):
    key: str = "default"  # always "default" — singleton
    # Contact / channels
    contact_email: str = "contact@carpetadda.com"
    contact_phone: Optional[str] = "8828830707"
    whatsapp_number: str = "918828830707"
    office_address: str = "A-502, BSEL Tech Park, Sector 30A, Opp. Vashi Railway Station, Navi Mumbai, Maharashtra."
    # Socials
    instagram_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    facebook_url: Optional[str] = None
    youtube_url: Optional[str] = None
    twitter_url: Optional[str] = None
    # Homepage content
    hero_headline: str = "Every Dream Deserves an Address"
    hero_highlight: str = "Address"  # word rendered in blue
    hero_subtitle: str = "Discover residential and commercial properties, new projects, resale homes and rentals — verified listings from India's most trusted developers."
    # Hero background rotation — [{url, enabled}], ordered; only enabled images rotate on the homepage
    hero_backgrounds: list = Field(default_factory=list)
    # Footer content
    footer_tagline: str = "India's premium real estate platform. Verified listings, expert agents, and market intelligence across Mumbai, Thane, Navi Mumbai, Dombivli & Kalyan."
    # Site-wide SEO defaults
    site_title_suffix: str = "CarpetAdda"
    default_meta_description: str = "CarpetAdda — India's premium property marketplace."
    default_og_image: Optional[str] = None


# ---------- Unit (Project Inventory) ----------
UNIT_STATUSES = ["available", "hold", "token", "booked", "sold"]


class Unit(BaseDoc):
    project_id: str
    unit_no: str
    tower: Optional[str] = None
    floor: Optional[int] = None
    typology: Optional[str] = None  # Configuration: "1 BHK", "2 BHK", "Shop", "Office" ...
    carpet_area: Optional[float] = None
    builtup_area: Optional[float] = None
    balcony: Optional[int] = None
    parking: Optional[int] = None
    facing: Optional[str] = None
    price: Optional[float] = None
    unit_plan: Optional[str] = None  # uploaded unit plan image URL
    description: Optional[str] = None
    published: bool = True
    status: str = "available"  # available | hold | token | booked | sold
    buyer_name: Optional[str] = None
    buyer_phone: Optional[str] = None
    notes: Optional[str] = None
    history: List[dict] = Field(default_factory=list)  # audit log: [{from, to, at, by, note}]
