"""
Nexus API Proxy Server
Proxy server for social media API calls + server-side scraping.
Run: python server.py
"""

import json
import os
import re
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup

app = FastAPI(title="Nexus API Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RAPIDAPI_KEY = os.environ.get("VITE_RAPIDAPI_KEY", "")
YOUTUBE_API_KEY = os.environ.get("VITE_YOUTUBE_API_KEY", "")

TIMEOUT = httpx.Timeout(15.0, connect=10.0)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}

# ─── Models ─────────────────────────────────────────────────────────────────

class PlatformRequest(BaseModel):
    platform: str
    username: str

class RapidAPIRequest(BaseModel):
    host: str
    path: str
    params: dict = {}

# ─── RapidAPI Proxy ──────────────────────────────────────────────────────────

@app.post("/api/rapidapi")
async def proxy_rapidapi(req: RapidAPIRequest):
    if not RAPIDAPI_KEY:
        raise HTTPException(400, "RAPIDAPI_KEY non configurée")
    url = f"https://{req.host}{req.path}"
    params = "&".join(f"{k}={v}" for k, v in req.params.items())
    full_url = f"{url}?{params}" if params else url
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(full_url, headers={
            "x-rapidapi-host": req.host,
            "x-rapidapi-key": RAPIDAPI_KEY,
        })
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, f"RapidAPI error: {resp.text[:200]}")
        return resp.json()

# ─── TikTok Scraping ─────────────────────────────────────────────────────────

@app.post("/api/scrape/tiktok")
async def scrape_tiktok(req: PlatformRequest):
    url = f"https://www.tiktok.com/@{req.username}"
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0), headers=HEADERS, follow_redirects=True) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(404, f"TikTok profile not found ({resp.status_code})")

        html = resp.text

        # Try SIGI_STATE
        match = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">(.*?)</script>', html, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                scope = data.get("__DEFAULT_SCOPE__", {})
                ud = scope.get("webapp.user-detail", {})
                ui = ud.get("userInfo", {})
                user = ui.get("user", {})
                stats = ui.get("stats", {})
                if user and stats:
                    return {
                        "id": str(user.get("id", "")),
                        "username": str(user.get("uniqueId", req.username)),
                        "displayName": str(user.get("nickname", req.username)),
                        "avatarUrl": str(user.get("avatarLarger", user.get("avatarThumb", ""))),
                        "bio": str(user.get("signature", "")),
                        "followers": int(stats.get("followerCount", 0)),
                        "following": int(stats.get("followingCount", 0)),
                        "likes": int(stats.get("heartCount", 0)),
                        "posts": int(stats.get("videoCount", 0)),
                        "verified": bool(user.get("verified", False)),
                        "platform": "tiktok",
                        "profileUrl": f"https://tiktok.com/@{req.username}",
                    }
            except json.JSONDecodeError:
                pass

        # Fallback: regex extraction
        followers = 0; following = 0; likes = 0; posts = 0; nickname = req.username; avatar = ""; bio = ""
        for pattern, key in [(r'"followerCount"\s*:\s*(\d+)', 'followers'), (r'"followingCount"\s*:\s*(\d+)', 'following'), (r'"heartCount"\s*:\s*(\d+)', 'likes'), (r'"videoCount"\s*:\s*(\d+)', 'posts')]:
            m = re.search(pattern, html)
            if m: locals()[key] = int(m.group(1))
        m = re.search(r'"uniqueId"\s*:\s*"([^"]+)"', html)
        if m: username_val = m.group(1)
        else: username_val = req.username
        m = re.search(r'"nickname"\s*:\s*"([^"]+)"', html)
        if m: nickname = m.group(1)
        m = re.search(r'"avatarLarger"\s*:\s*"([^"]+)"', html)
        if m: avatar = m.group(1)
        m = re.search(r'"signature"\s*:\s*"([^"]*)"', html)
        if m: bio = m.group(1)

        return {
            "id": req.username,
            "username": username_val,
            "displayName": nickname,
            "avatarUrl": avatar,
            "bio": bio,
            "followers": followers,
            "following": following,
            "likes": likes,
            "posts": posts,
            "verified": False,
            "platform": "tiktok",
            "profileUrl": f"https://tiktok.com/@{req.username}",
        }

# ─── Instagram Scraping ──────────────────────────────────────────────────────

@app.post("/api/scrape/instagram")
async def scrape_instagram(req: PlatformRequest):
    url = f"https://www.instagram.com/{req.username}/"
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0), headers=HEADERS, follow_redirects=True) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(404, f"Instagram profile not found ({resp.status_code})")

        html = resp.text
        soup = BeautifulSoup(html, "html.parser")

        # Try __INITIAL_STATE__
        match = re.search(r'window\.__INITIAL_STATE__\s*=\s*({.*?});\s*</script>', html, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                profile = data.get("metadata", {}).get(req.username, {}) or data.get("profilePage", {}).get(req.username, {})
                if profile:
                    return {
                        "id": str(profile.get("id", req.username)),
                        "username": req.username,
                        "displayName": str(profile.get("full_name", req.username)),
                        "avatarUrl": str(profile.get("profile_pic_url_hd", profile.get("profile_pic_url", ""))),
                        "bio": str(profile.get("biography", "")),
                        "followers": int(profile.get("follower_count", profile.get("edge_followed_by", {}).get("count", 0))),
                        "following": int(profile.get("following_count", profile.get("edge_follow", {}).get("count", 0))),
                        "likes": 0,
                        "posts": int(profile.get("media_count", profile.get("edge_owner_to_timeline_media", {}).get("count", 0))),
                        "verified": bool(profile.get("is_verified", False)),
                        "platform": "instagram",
                        "profileUrl": f"https://instagram.com/{req.username}",
                        "isPrivate": bool(profile.get("is_private", False)),
                    }
            except json.JSONDecodeError:
                pass

        # Fallback og:description
        meta = soup.find("meta", property="og:description")
        if meta and meta.get("content"):
            parts = meta["content"].split(", ")
            return {
                "id": req.username, "username": req.username,
                "displayName": req.username, "avatarUrl": "", "bio": ", ".join(parts[3:]),
                "followers": int(re.sub(r"\D", "", parts[1])) if len(parts) > 1 and re.search(r"\d", parts[1]) else 0,
                "following": int(re.sub(r"\D", "", parts[2])) if len(parts) > 2 and re.search(r"\d", parts[2]) else 0,
                "likes": 0,
                "posts": int(re.sub(r"\D", "", parts[0])) if parts and re.search(r"\d", parts[0]) else 0,
                "verified": False, "platform": "instagram",
                "profileUrl": f"https://instagram.com/{req.username}", "isPrivate": True,
            }

        raise HTTPException(404, "Impossible d'extraire les données Instagram")

# ─── YouTube Scraping ────────────────────────────────────────────────────────

@app.post("/api/scrape/youtube")
async def scrape_youtube(req: PlatformRequest):
    url = f"https://www.youtube.com/@{req.username}"
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0), headers=HEADERS, follow_redirects=True) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(404, f"YouTube channel not found ({resp.status_code})")

        html = resp.text

        # Try ytInitialData
        match = re.search(r'var\s+ytInitialData\s*=\s*({.*?});', html, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                header = data.get("header", {}).get("c4TabbedHeaderRenderer", {})
                if header:
                    subs_text = ""
                    sub_renderer = header.get("subscriberCountText", {})
                    if isinstance(sub_renderer, dict):
                        subs_text = sub_renderer.get("simpleText", "") or sub_renderer.get("runs", [{}])[0].get("text", "")
                    return {
                        "id": str(header.get("channelId", req.username)),
                        "username": req.username,
                        "displayName": str(header.get("title", req.username)),
                        "avatarUrl": str(header.get("avatar", {}).get("thumbnails", [{}])[0].get("url", "")),
                        "bio": str(header.get("subtitle", "")),
                        "followers": int(re.sub(r"\D", "", subs_text)) if subs_text else 0,
                        "following": 0, "likes": 0, "posts": 0,
                        "verified": bool(header.get("badge", [])),
                        "platform": "youtube",
                        "profileUrl": f"https://youtube.com/@{req.username}",
                    }
            except (json.JSONDecodeError, IndexError):
                pass

        raise HTTPException(404, "Impossible d'extraire les données YouTube")

# ─── Twitter via Nitter ──────────────────────────────────────────────────────

@app.post("/api/scrape/twitter")
async def scrape_twitter(req: PlatformRequest):
    # Try multiple Nitter instances
    instances = [
        f"https://nitter.net/{req.username}",
        f"https://nitter.poast.org/{req.username}",
        f"https://nitter.cz/{req.username}",
    ]
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0), headers=HEADERS, follow_redirects=True) as client:
        for instance_url in instances:
            try:
                resp = await client.get(instance_url)
                if resp.status_code != 200:
                    continue
                html = resp.text
                soup = BeautifulSoup(html, "html.parser")

                name_el = soup.select_one("a.profile-card-fullname")
                avatar_el = soup.select_one("img.profile-card-avatar")
                bio_el = soup.select_one("div.profile-bio")
                stats_els = soup.select("span.profile-stat-number")

                stats = [int(re.sub(r"\D", "", s.get_text())) if re.search(r"\d", s.get_text()) else 0 for s in stats_els]

                return {
                    "id": req.username,
                    "username": req.username,
                    "displayName": name_el.get_text().strip() if name_el else req.username,
                    "avatarUrl": avatar_el.get("src", "") if avatar_el else "",
                    "bio": bio_el.get_text().strip() if bio_el else "",
                    "followers": stats[1] if len(stats) > 1 else 0,
                    "following": stats[2] if len(stats) > 2 else 0,
                    "likes": stats[3] if len(stats) > 3 else 0,
                    "posts": stats[0] if stats else 0,
                    "verified": False,
                    "platform": "twitter",
                    "profileUrl": f"https://twitter.com/{req.username}",
                }
            except Exception:
                continue
        raise HTTPException(404, "Twitter profile not found via Nitter")

# ─── Facebook Scraping ──────────────────────────────────────────────────────

@app.post("/api/scrape/facebook")
async def scrape_facebook(req: PlatformRequest):
    url = f"https://www.facebook.com/{req.username}"
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0), headers={**HEADERS, "Accept": "text/html"}, follow_redirects=True) as client:
        resp = await client.get(url)
        if resp.status_code not in (200, 404):
            raise HTTPException(resp.status_code, f"Facebook error")
        soup = BeautifulSoup(resp.text, "html.parser")

        title_tag = soup.find("title")
        display_name = title_tag.get_text().strip().split(" |")[0].split(" -")[0] if title_tag else req.username
        meta_img = soup.find("meta", property="og:image")
        avatar = meta_img.get("content", "") if meta_img else ""

        return {
            "id": req.username, "username": req.username,
            "displayName": display_name, "avatarUrl": avatar,
            "bio": "", "followers": 0, "following": 0, "likes": 0, "posts": 0,
            "verified": False, "platform": "facebook",
            "profileUrl": f"https://facebook.com/{req.username}",
        }

# ─── LinkedIn Scraping ──────────────────────────────────────────────────────

@app.post("/api/scrape/linkedin")
async def scrape_linkedin(req: PlatformRequest):
    url = f"https://www.linkedin.com/in/{req.username}/"
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0), headers=HEADERS, follow_redirects=True) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(404, f"LinkedIn profile not found ({resp.status_code})")
        soup = BeautifulSoup(resp.text, "html.parser")

        title_tag = soup.find("title")
        display_name = title_tag.get_text().strip().split(" |")[0].split(" -")[0] if title_tag else req.username
        meta_img = soup.find("meta", property="og:image")
        avatar = meta_img.get("content", "") if meta_img else ""

        return {
            "id": req.username, "username": req.username,
            "displayName": display_name, "avatarUrl": avatar,
            "bio": "", "followers": 0, "following": 0, "likes": 0, "posts": 0,
            "verified": False, "platform": "linkedin",
            "profileUrl": f"https://linkedin.com/in/{req.username}",
        }

# ─── Unified lookup with fallback ───────────────────────────────────────────

@app.post("/api/lookup")
async def lookup_account(req: PlatformRequest):
    errors = []
    platform = req.platform.lower()
    username = req.username

    # Map platform to scrape endpoint
    scrape_map = {
        "tiktok": "/api/scrape/tiktok",
        "instagram": "/api/scrape/instagram",
        "youtube": "/api/scrape/youtube",
        "twitter": "/api/scrape/twitter",
        "facebook": "/api/scrape/facebook",
        "linkedin": "/api/scrape/linkedin",
    }

    # Map platform to RapidAPI config
    rapid_map = {
        "tiktok": ("tiktok-api23.p.rapidapi.com", "/api/user/info", {"uniqueId": username}),
        "instagram": ("instagram-scraper-api2.p.rapidapi.com", "/v1/info", {"username_or_id_or_url": username}),
        "twitter": ("twitter241.p.rapidapi.com", "/user", {"username": username}),
        "facebook": ("facebook-scraper3.p.rapidapi.com", "/profile", {"username": username}),
        "linkedin": ("linkedin-data-api.p.rapidapi.com", "/get-profile-data-by-url", {"url": f"https://www.linkedin.com/in/{username}/"}),
    }

    # Strategy 1: RapidAPI
    if platform in rapid_map:
        try:
            host, path, params = rapid_map[platform]
            result = await proxy_rapidapi(RapidAPIRequest(host=host, path=path, params=params))
            if platform == "tiktok":
                user = result.get("userInfo", {}).get("user", {})
                stats = result.get("userInfo", {}).get("stats", {})
                if user:
                    return format_response(user, stats, username, platform)
            elif platform == "instagram":
                d = result.get("data", {})
                if d:
                    return format_response(d, {}, username, platform, extra={
                        "displayName": str(d.get("full_name", username)),
                        "avatarUrl": str(d.get("profile_pic_url", "")),
                        "bio": str(d.get("biography", "")),
                        "followers": int(d.get("follower_count", 0)),
                        "following": int(d.get("following_count", 0)),
                        "posts": int(d.get("media_count", 0)),
                        "verified": bool(d.get("is_verified", False)),
                    })
            elif platform == "twitter":
                u = result.get("result", {}).get("data", {}).get("user", {}).get("result", {})
                if u:
                    legacy = u.get("legacy", {})
                    return format_response({}, {}, username, platform, extra={
                        "id": str(u.get("rest_id", "")),
                        "displayName": str(legacy.get("name", username)),
                        "avatarUrl": str(legacy.get("profile_image_url_https", "")),
                        "bio": str(legacy.get("description", "")),
                        "followers": int(legacy.get("followers_count", 0)),
                        "following": int(legacy.get("friends_count", 0)),
                        "likes": int(legacy.get("favourites_count", 0)),
                        "posts": int(legacy.get("statuses_count", 0)),
                        "verified": bool(legacy.get("verified", False)),
                    })
            elif platform == "facebook":
                if result.get("id"):
                    return format_response({}, {}, username, platform, extra={
                        "id": str(result.get("id", "")),
                        "displayName": str(result.get("name", username)),
                        "avatarUrl": str(result.get("picture", "")),
                        "bio": str(result.get("about", "")),
                        "followers": int(result.get("followers", 0)),
                        "following": int(result.get("friends", 0)),
                        "likes": int(result.get("likes", 0)),
                        "verified": bool(result.get("verified", False)),
                    })
            elif platform == "linkedin":
                if result.get("urn"):
                    return format_response({}, {}, username, platform, extra={
                        "id": str(result.get("urn", username)),
                        "displayName": f"{result.get('firstName', '')} {result.get('lastName', '')}".strip() or username,
                        "avatarUrl": str(result.get("profilePicture", "")),
                        "bio": str(result.get("headline", "")),
                        "followers": int(result.get("followersCount", result.get("connectionsCount", 0))),
                    })
            errors.append("RapidAPI: données non trouvées")
        except HTTPException as e:
            errors.append(f"RapidAPI: {e.detail}")
        except Exception as e:
            errors.append(f"RapidAPI: {str(e)[:100]}")

    # Strategy 2: Scraping
    if platform in scrape_map:
        try:
            import importlib
            fn_name = f"scrape_{platform}"
            if fn_name in globals():
                result = await globals()[fn_name](req)
                return result
        except (HTTPException, Exception) as e:
            detail = e.detail if isinstance(e, HTTPException) else str(e)[:100]
            errors.append(f"Scraping: {detail}")

    raise HTTPException(404, f"Échec après {len(errors)} tentatives pour {platform}: {'; '.join(errors)}")


def format_response(user: dict, stats: dict, username: str, platform: str, extra: dict | None = None) -> dict:
    if extra:
        base = {
            "id": username, "username": username, "displayName": username,
            "avatarUrl": "", "bio": "", "followers": 0, "following": 0,
            "likes": 0, "posts": 0, "verified": False,
            "platform": platform, "profileUrl": f"https://{platform}.com/{username}",
        }
        base.update(extra)
        return base
    return {
        "id": str(user.get("id", user.get("uid", username))),
        "username": str(user.get("uniqueId", username)),
        "displayName": str(user.get("nickname", username)),
        "avatarUrl": str(user.get("avatarThumb", user.get("avatarLarger", ""))),
        "bio": str(user.get("signature", "")),
        "followers": int(stats.get("followerCount", 0)),
        "following": int(stats.get("followingCount", 0)),
        "likes": int(stats.get("heartCount", 0)),
        "posts": int(stats.get("videoCount", 0)),
        "verified": bool(user.get("verified", False)),
        "platform": platform,
        "profileUrl": f"https://{platform}.com/{username}",
    }

# ─── TikTok OAuth ─────────────────────────────────────────────────────────────

TIKTOK_CLIENT_KEY = os.environ.get("VITE_TIKTOK_CLIENT_ID", "")
TIKTOK_CLIENT_SECRET = os.environ.get("VITE_TIKTOK_CLIENT_SECRET", "")

class TikTokTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400
    refresh_token: str = ""
    open_id: str = ""

@app.get("/api/oauth/tiktok/url")
async def tiktok_oauth_url():
    """Generate the TikTok OAuth authorization URL."""
    if not TIKTOK_CLIENT_KEY:
        raise HTTPException(400, "TIKTOK_CLIENT_ID non configuré")
    redirect_uri = f"http://localhost:8000/api/oauth/tiktok/callback"
    url = (
        f"https://www.tiktok.com/v2/auth/authorize/"
        f"?client_key={TIKTOK_CLIENT_KEY}"
        f"&scope=user.info.basic,video.list,video.upload,user.info.profile"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
    )
    return {"url": url}

@app.get("/api/oauth/tiktok/callback")
async def tiktok_oauth_callback(code: str = "", error: str = ""):
    if error:
        raise HTTPException(400, f"TikTok OAuth error: {error}")
    if not code:
        raise HTTPException(400, "Code manquant")
    if not TIKTOK_CLIENT_KEY or not TIKTOK_CLIENT_SECRET:
        raise HTTPException(400, "TikTok credentials non configurés")

    redirect_uri = f"http://localhost:8000/api/oauth/tiktok/callback"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            data={
                "client_key": TIKTOK_CLIENT_KEY,
                "client_secret": TIKTOK_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, f"Token exchange failed: {resp.text[:200]}")
        data = resp.json()
        return TikTokTokenResponse(
            access_token=data.get("access_token", ""),
            expires_in=data.get("expires_in", 86400),
            refresh_token=data.get("refresh_token", ""),
            open_id=data.get("open_id", ""),
        )

@app.get("/api/oauth/tiktok/refresh")
async def tiktok_refresh_token(refresh_token: str = ""):
    if not refresh_token:
        raise HTTPException(400, "refresh_token requis")
    if not TIKTOK_CLIENT_KEY or not TIKTOK_CLIENT_SECRET:
        raise HTTPException(400, "TikTok credentials non configurés")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            data={
                "client_key": TIKTOK_CLIENT_KEY,
                "client_secret": TIKTOK_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, f"Refresh failed: {resp.text[:200]}")
        return resp.json()

# ─── TikTok API with Token ──────────────────────────────────────────────────

class TikTokActionRequest(BaseModel):
    access_token: str
    action: str  # like | follow | comment | upload
    video_id: str = ""
    user_id: str = ""
    text: str = ""

@app.post("/api/tiktok/action")
async def tiktok_action(req: TikTokActionRequest):
    """Execute TikTok actions using the user's OAuth token."""
    headers = {
        "Authorization": f"Bearer {req.access_token}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
        if req.action == "like":
            resp = await client.post(
                "https://open.tiktokapis.com/v2/video/like/",
                headers=headers,
                json={"video_id": req.video_id},
            )
        elif req.action == "follow":
            resp = await client.post(
                "https://open.tiktokapis.com/v2/user/follow/",
                headers=headers,
                json={"target_user_id": req.user_id},
            )
        elif req.action == "comment":
            resp = await client.post(
                "https://open.tiktokapis.com/v2/video/comment/",
                headers=headers,
                json={"video_id": req.video_id, "text": req.text},
            )
        elif req.action == "upload":
            resp = await client.post(
                "https://open.tiktokapis.com/v2/video/upload/",
                headers=headers,
                json={"source": "FILE_UPLOAD"},
            )
        else:
            raise HTTPException(400, f"Action inconnue: {req.action}")

        if resp.status_code != 200:
            raise HTTPException(resp.status_code, f"TikTok action error: {resp.text[:200]}")
        return {"success": True, "action": req.action, "data": resp.json()}

# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "rapidapi": bool(RAPIDAPI_KEY), "youtube": bool(YOUTUBE_API_KEY), "tiktok_oauth": bool(TIKTOK_CLIENT_KEY)}

# ─── Start ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Nexus Proxy Server running on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
