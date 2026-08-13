"""Seed demo data for the real estate portal."""
from __future__ import annotations

import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")

from auth import hash_password  # noqa: E402
from models import (  # noqa: E402
    Agent,
    Amenity,
    Blog,
    Developer,
    Location,
    Project,
    Property,
    Testimonial,
    User,
)

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

CITIES = [
    {"name": "Mumbai", "slug": "mumbai", "lat": 19.076, "lng": 72.8777, "hero": "https://images.unsplash.com/photo-1620372177236-03c33d977675?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHw0fHxtdW1iYWklMjBza3lsaW5lJTIwc3Vuc2V0fGVufDB8fHx8MTc4NjQyNTI0Nnww&ixlib=rb-4.1.0&q=85"},
    {"name": "Thane", "slug": "thane", "lat": 19.2183, "lng": 72.9781, "hero": "https://images.pexels.com/photos/8135492/pexels-photo-8135492.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Navi Mumbai", "slug": "navi-mumbai", "lat": 19.0330, "lng": 73.0297, "hero": "https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Dombivli", "slug": "dombivli", "lat": 19.2183, "lng": 73.0864, "hero": "https://images.pexels.com/photos/31240564/pexels-photo-31240564.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"name": "Kalyan", "slug": "kalyan", "lat": 19.2437, "lng": 73.1355, "hero": "https://images.unsplash.com/photo-1621831337128-35676ca30868?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMGZhY2FkZXxlbnwwfHx8fDE3ODY0MjUyNDZ8MA&ixlib=rb-4.1.0&q=85"},
]

LOCALITIES = [
    ("Dombivli East", "dombivli-east", "dombivli", 19.2143, 73.0964),
    ("Dombivli West", "dombivli-west", "dombivli", 19.2183, 73.0764),
    ("Kalyan East", "kalyan-east", "kalyan", 19.2437, 73.1455),
    ("Kalyan West", "kalyan-west", "kalyan", 19.2337, 73.1255),
    ("Thane West", "thane-west", "thane", 19.2183, 72.9681),
    ("Ghodbunder Road", "ghodbunder-road", "thane", 19.2683, 72.9581),
    ("Vashi", "vashi", "navi-mumbai", 19.0770, 72.9990),
    ("Kharghar", "kharghar", "navi-mumbai", 19.0473, 73.0665),
    ("Andheri West", "andheri-west", "mumbai", 19.1197, 72.8464),
    ("Bandra West", "bandra-west", "mumbai", 19.0596, 72.8295),
    ("Powai", "powai", "mumbai", 19.1176, 72.9060),
    ("Worli", "worli", "mumbai", 19.0176, 72.8158),
]

IMG = [
    "https://images.pexels.com/photos/8135492/pexels-photo-8135492.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/31240564/pexels-photo-31240564.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.unsplash.com/photo-1621831337128-35676ca30868?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMGZhY2FkZXxlbnwwfHx8fDE3ODY0MjUyNDZ8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=940",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=940",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=940",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=940",
]

DEVELOPERS = [
    ("Meridian Estates", "meridian-estates", "Award-winning developer with 25+ years crafting luxury residences across MMR.", 25),
    ("Sunrise Realty Group", "sunrise-realty-group", "Trusted name in affordable luxury with 40+ delivered projects.", 18),
    ("Hariyali Constructions", "hariyali-constructions", "Sustainable, RERA-approved homes in Kalyan-Dombivli belt.", 15),
    ("Skyline Ventures", "skyline-ventures", "Premium high-rise specialists in Navi Mumbai & Thane.", 22),
    ("Aksh Group", "aksh-group", "Boutique developer known for elegant mid-segment projects.", 12),
]

AGENTS = [
    ("Rohan Deshmukh", "rohan-deshmukh", "+919820011122", "Dombivli specialist. 12+ years."),
    ("Priya Iyer", "priya-iyer", "+919820033344", "Luxury Bandra/Andheri broker."),
    ("Aakash Shah", "aakash-shah", "+919820055566", "Thane & Ghodbunder Road expert."),
    ("Neha Kulkarni", "neha-kulkarni", "+919820077788", "Kalyan-Kharghar residential."),
    ("Vikram Menon", "vikram-menon", "+919820099900", "Commercial & office space consultant."),
]

AMENITIES = [
    "Swimming Pool", "Gym", "Clubhouse", "Landscaped Garden", "Children's Play Area",
    "Jogging Track", "24x7 Security", "CCTV Surveillance", "Covered Parking", "Power Backup",
    "EV Charging", "Fire Safety", "Indoor Games", "Yoga Deck", "Senior Citizen Area",
    "Multipurpose Hall", "Amphitheatre", "Rainwater Harvesting", "Sewage Treatment", "Lift"
]

PROJECT_NAMES = [
    "Meridian Skyline", "Sunrise Grand Vista", "Hariyali Greens Phase 1", "Skyline Horizon",
    "Aksh Estate", "Meridian Coastal Heights", "Sunrise Serenity", "Skyline Marina",
    "Hariyali Elysium", "Aksh Boulevard",
]


async def clear_all():
    for coll in ["users", "locations", "developers", "agents", "properties", "projects",
                 "blogs", "testimonials", "amenities", "leads", "site_visits", "favorites", "saved_searches"]:
        await db[coll].delete_many({})


async def seed():
    print("Clearing existing seed data...")
    await clear_all()

    # Users
    admin = User(name="Admin", email="admin@estatehub.in", password_hash=hash_password("Admin@123"), role="super_admin", verified=True)
    user = User(name="Demo User", email="user@estatehub.in", password_hash=hash_password("User@123"), role="user", verified=True)
    agent_user = User(name="Rohan Deshmukh", email="agent@estatehub.in", password_hash=hash_password("Agent@123"), role="agent", verified=True)
    dev_user = User(name="Meridian", email="developer@estatehub.in", password_hash=hash_password("Developer@123"), role="developer", verified=True)
    await db.users.insert_many([admin.model_dump(), user.model_dump(), agent_user.model_dump(), dev_user.model_dump()])

    # Cities
    city_docs = []
    for c in CITIES:
        loc = Location(name=c["name"], slug=c["slug"], type="city", city=c["name"], lat=c["lat"], lng=c["lng"],
                       hero_image=c["hero"],
                       description=f"Explore properties, new projects and premium developers in {c['name']}.",
                       seo={"title": f"Properties in {c['name']} | CarpetAdda", "description": f"Buy, rent or invest in {c['name']} with verified listings and expert agents."})
        city_docs.append(loc.model_dump())
    await db.locations.insert_many(city_docs)

    # Localities
    loc_docs = []
    for name, slug, city, lat, lng in LOCALITIES:
        loc = Location(name=name, slug=slug, type="locality", city=city, lat=lat, lng=lng,
                       hero_image=IMG[hash(slug) % len(IMG)],
                       description=f"Homes, projects and prices in {name}.",
                       seo={"title": f"Properties in {name} | CarpetAdda", "description": f"Flats, resale and rentals in {name}."})
        loc_docs.append(loc.model_dump())
    await db.locations.insert_many(loc_docs)

    # Developers
    dev_ids = {}
    dev_docs = []
    for i, (name, slug, desc, yrs) in enumerate(DEVELOPERS):
        d = Developer(name=name, slug=slug, description=desc, experience_years=yrs,
                      logo=IMG[i % len(IMG)], cover=IMG[(i + 1) % len(IMG)],
                      locations=["mumbai", "thane", "dombivli"], total_projects=8 + i,
                      phone="+918828830707", email=f"contact@{slug}.in",
                      seo={"title": f"{name} | Projects & Developer Profile"})
        dev_ids[slug] = d.id
        dev_docs.append(d.model_dump())
    await db.developers.insert_many(dev_docs)

    # Agents
    agent_ids = {}
    agent_docs = []
    for i, (name, slug, phone, bio) in enumerate(AGENTS):
        a = Agent(name=name, slug=slug, phone=phone, whatsapp=phone,
                  email=f"{slug}@estatehub.in",
                  photo=f"https://i.pravatar.cc/300?img={i + 10}",
                  bio=bio, experience_years=8 + i,
                  locations=["dombivli", "kalyan", "thane"],
                  specialization=["Residential", "Investment"],
                  languages=["English", "Hindi", "Marathi"],
                  rating=4.6 + (i * 0.05), total_listings=15 + i * 3,
                  seo={"title": f"{name} | Real Estate Agent"})
        agent_ids[slug] = a.id
        agent_docs.append(a.model_dump())
    await db.agents.insert_many(agent_docs)

    # Amenities
    await db.amenities.insert_many([Amenity(name=a, category="Community").model_dump() for a in AMENITIES])

    # Projects
    project_ids = []
    project_docs = []
    dev_slugs = list(dev_ids.keys())
    city_slugs = ["dombivli", "kalyan", "thane", "navi-mumbai", "mumbai"]
    loc_slugs = [l[1] for l in LOCALITIES]
    for i, pname in enumerate(PROJECT_NAMES):
        dev_slug = dev_slugs[i % len(dev_slugs)]
        city = city_slugs[i % len(city_slugs)]
        loc = [l[1] for l in LOCALITIES if l[2] == city][0]
        p = Project(
            name=pname, slug=pname.lower().replace(" ", "-"),
            description=f"{pname} is a premium new-launch offering carefully curated 1, 2 and 3 BHK residences with world-class amenities.",
            developer_id=dev_ids[dev_slug], city=city, location=loc,
            lat=[l[3] for l in LOCALITIES if l[1] == loc][0],
            lng=[l[4] for l in LOCALITIES if l[1] == loc][0],
            price_from=4500000 + i * 500000, price_to=15000000 + i * 800000,
            configurations=["1 BHK", "2 BHK", "3 BHK"],
            area_from=450, area_to=1450,
            possession_date="Dec 2026" if i % 2 else "Jun 2027",
            construction_status="under_construction" if i % 2 else "new_launch",
            rera_number=f"P51700{10000 + i}",
            total_towers=3 + (i % 3), total_units=180 + i * 40, total_floors=22 + (i % 6),
            amenities=AMENITIES[: 12 + (i % 5)],
            images=[IMG[(i + k) % len(IMG)] for k in range(5)],
            featured=i < 4,
            brochure_url="https://example.com/brochure.pdf",
            payment_plan="20:80 with pre-approved bank finance.",
            seo={"title": f"{pname} — 1/2/3 BHK from ₹{45 + i}L | RERA"},
        )
        project_ids.append(p.id)
        project_docs.append(p.model_dump())
    await db.projects.insert_many(project_docs)

    # Properties
    prop_docs = []
    listing_types = ["sale", "rent", "sale", "sale", "rent"]
    prop_types = ["apartment", "apartment", "villa", "office", "shop"]
    for i in range(48):
        city = city_slugs[i % len(city_slugs)]
        loc = [l[1] for l in LOCALITIES if l[2] == city][i % 2 if len([l for l in LOCALITIES if l[2] == city]) > 1 else 0]
        lat = [l[3] for l in LOCALITIES if l[1] == loc][0]
        lng = [l[4] for l in LOCALITIES if l[1] == loc][0]
        listing = listing_types[i % len(listing_types)]
        pt = prop_types[i % len(prop_types)]
        bhk = [1, 2, 3, 2, 4][i % 5]
        carpet = 400 + (i * 25) % 1600
        price = (3500000 + (i * 850000)) if listing == "sale" else (25000 + i * 3500)
        cat = "commercial" if pt in ("office", "shop", "warehouse") else "residential"
        title_pref = "Luxurious" if i % 3 == 0 else ("Spacious" if i % 3 == 1 else "Modern")
        loc_name = next(l[0] for l in LOCALITIES if l[1] == loc)
        title = f"{title_pref} {bhk if cat=='residential' else ''} {'BHK' if cat=='residential' else ''} {pt.title()} in {loc_name}".strip()
        p = Property(
            title=title,
            slug=f"{title.lower().replace(' ', '-').replace('/', '-')}-{i}",
            description=f"A beautifully designed {title.lower()} offering premium amenities, ample natural light and easy access to schools, malls and transit.",
            listing_type=listing, property_category=cat, property_type=pt,
            bhk=bhk if cat == "residential" else None,
            bathrooms=max(1, bhk - 1) if cat == "residential" else 2,
            balcony=(bhk - 1) if cat == "residential" and bhk > 1 else 0,
            parking=1 if bhk < 3 else 2, floor=(i % 20) + 1, total_floors=22,
            furnishing=["unfurnished", "semi", "fully"][i % 3],
            construction_status="ready" if i % 3 else "under_construction",
            possession="Ready to move" if i % 3 else "Dec 2026",
            price=price if listing == "sale" else price * 100,
            rent=price if listing == "rent" else None,
            deposit=price * 3 if listing == "rent" else None,
            price_per_sqft=round(price / max(carpet, 1)) if listing == "sale" else None,
            carpet_area=carpet, builtup_area=carpet * 1.2,
            city=city, location=loc,
            address=f"Plot {100 + i}, {loc_name}, {next(c['name'] for c in CITIES if c['slug']==city)}",
            lat=lat + (i % 5) * 0.001, lng=lng + (i % 4) * 0.001,
            amenities=AMENITIES[: 6 + (i % 8)],
            features=["Vaastu compliant", "Corner unit", "East facing"][: (i % 3) + 1],
            images=[IMG[(i + k) % len(IMG)] for k in range(4)],
            developer_id=list(dev_ids.values())[i % len(dev_ids)],
            project_id=project_ids[i % len(project_ids)] if i % 3 == 0 else None,
            agent_id=list(agent_ids.values())[i % len(agent_ids)],
            rera_number=f"P51700{20000 + i}" if i % 2 else None,
            featured=i < 8, verified=True, status="active", views=100 + i * 17,
            seo={"title": f"{title} | ₹{int(price/100000)}L | CarpetAdda"},
        )
        prop_docs.append(p.model_dump())
    await db.properties.insert_many(prop_docs)

    # Blogs
    blogs = [
        ("Top 10 Localities to Buy 2 BHK in Dombivli in 2026", "top-10-localities-2bhk-dombivli-2026",
         "Discover the most promising Dombivli micro-markets with detailed price trends, connectivity and lifestyle insights."),
        ("Home Loan EMI vs Rent: When to Buy in Mumbai", "home-loan-emi-vs-rent-mumbai",
         "A financial deep-dive into the classic Mumbai dilemma with worked examples."),
        ("Complete Guide to MahaRERA: What Buyers Must Know", "maharera-buyer-guide",
         "Everything you need to verify before booking a new-launch project in Maharashtra."),
        ("Thane vs Navi Mumbai: Where Should NRIs Invest?", "thane-vs-navi-mumbai-nri-investment",
         "Comparing rental yields, capital appreciation and infrastructure roadmaps."),
    ]
    blog_docs = []
    for i, (title, slug, excerpt) in enumerate(blogs):
        b = Blog(title=title, slug=slug, excerpt=excerpt,
                 content=f"<p>{excerpt}</p><p>In this comprehensive guide we walk through everything a serious buyer or investor must consider before making a decision.</p><h3>Key Insights</h3><ul><li>Locality-wise price movement</li><li>Upcoming infrastructure</li><li>Rental yield expectations</li></ul>",
                 cover_image=IMG[i % len(IMG)], category="Market Insights",
                 tags=["mumbai", "investment", "guide"],
                 published_at="2026-02-15T10:00:00+00:00",
                 seo={"title": f"{title} | CarpetAdda Blog"})
        blog_docs.append(b.model_dump())
    await db.blogs.insert_many(blog_docs)

    # Testimonials
    tst = [
        ("Rajesh & Meera Patil", "Bought a 2 BHK in Dombivli", "CarpetAdda made the search and negotiation seamless. The agent knew Dombivli inside out.", 5.0),
        ("Ananya Sharma", "Rented Andheri West", "Zero brokerage stress. Verified listings, honest visits, done in a week.", 4.8),
        ("Karan Bhatia", "Investor, 3 units in Thane", "Best market intel and post-sale support I've had across four cities.", 5.0),
        ("Deepika Nair", "First-time buyer", "The EMI calculator and comparison tool literally saved us ₹8L.", 4.9),
    ]
    await db.testimonials.insert_many([
        Testimonial(name=n, role=r, review=rv, rating=rt,
                    photo=f"https://i.pravatar.cc/200?img={20+i}").model_dump()
        for i, (n, r, rv, rt) in enumerate(tst)
    ])

    print(f"✅ Seed complete: {await db.properties.count_documents({})} properties, "
          f"{await db.projects.count_documents({})} projects, "
          f"{await db.developers.count_documents({})} developers, "
          f"{await db.agents.count_documents({})} agents, "
          f"{await db.locations.count_documents({})} locations, "
          f"{await db.blogs.count_documents({})} blogs.")


if __name__ == "__main__":
    asyncio.run(seed())
