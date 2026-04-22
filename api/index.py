from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import urllib.parse
from contextlib import asynccontextmanager

from moviebox_api.v2.requests import Session
from moviebox_api.v2.core import Search, Homepage
from moviebox_api.v2.helpers import get_absolute_url

# FastAPI lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="MovieBox API Wrapper", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "Content-Range", "Accept-Ranges"]
)

# The v2 download endpoint path
DOWNLOAD_URL = get_absolute_url("/wefeed-h5api-bff/subject/download")
DETAIL_URL   = get_absolute_url("/wefeed-h5api-bff/detail")

@app.get("/")
def read_root():
    return {
        "status": "operational",
        "message": "MovieBox Python API Wrapper (v2)",
        "docs": "Visit /docs for Swagger UI"
    }


@app.get("/api/homepage")
async def get_homepage():
    try:
        session = Session()
        home = Homepage(session)
        content = await home.get_content()
        return {"status": "success", "data": content}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/trending")
async def get_trending():
    try:
        session = Session()
        home = Homepage(session)
        content = await home.get_content()
        return {"status": "success", "data": content}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/search/{query}")
async def fetch_search(query: str):
    try:
        session = Session()
        search = Search(session, query=query)
        content = await search.get_content()

        # Map thumbnails and ensure detailPath is present for each item
        if content and "items" in content:
            for item in content["items"]:
                cover = item.get("cover")
                stills = item.get("stills")
                if isinstance(cover, dict) and cover.get("url"):
                    item["thumbnail"] = cover["url"]
                elif isinstance(stills, dict) and stills.get("url"):
                    item["thumbnail"] = stills["url"]

        return {"status": "success", "data": content}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/info")
async def fetch_info(detailPath: str):
    """Fetch specific item details by detailPath (e.g. movie-inception-xxxxx)"""
    try:
        session = Session()
        content = await session.get_from_api(
            DETAIL_URL, params={"detailPath": detailPath}
        )

        # Normalise thumbnail
        if content and "subject" in content:
            subj = content["subject"]
            cover = subj.get("cover")
            stills = subj.get("stills")
            if isinstance(cover, dict) and cover.get("url"):
                subj["thumbnail"] = cover["url"]
            elif isinstance(stills, dict) and stills.get("url"):
                subj["thumbnail"] = stills["url"]

        return {"status": "success", "data": content}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/sources")
async def fetch_sources(
    subjectId: str,
    detailPath: str,
    season: int = 0,
    episode: int = 0,
    request: Request = None,
):
    """
    Fetch streaming/download sources.
    Requires both subjectId and detailPath (obtained from search results).
    """
    try:
        session = Session()

        proto = "http"
        host = "localhost:5000"
        if request:
            proto = request.headers.get("x-forwarded-proto", request.url.scheme)
            host  = request.headers.get("host", request.url.netloc)
        base_url = f"{proto}://{host}"

        params = {
            "subjectId":  subjectId,
            "detailPath": detailPath,
            "se":         season,
            "ep":         episode,
        }
        content = await session.get_from_api(DOWNLOAD_URL, params=params)

        # Build processed sources list
        sources = []
        downloads = content.get("downloads") or []
        for file in downloads:
            url     = file.get("url", "")
            quality = file.get("resolution", 0)
            if not url:
                continue
            encoded = urllib.parse.quote_plus(url)
            sources.append({
                "id":          file.get("id"),
                "quality":     quality,
                "directUrl":   url,
                "downloadUrl": f"{base_url}/api/download?url={encoded}&quality={quality}",
                "streamUrl":   f"{base_url}/api/stream?url={encoded}",
                "size":        file.get("size"),
                "format":      "mp4",
            })

        content["processedSources"] = sources
        return {"status": "success", "data": content}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── Streaming helpers ─────────────────────────────────────────────────────────

async def _fetch_stream_response(url: str, request: Request, as_attachment: bool = False):
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
        "Referer":    "https://videodownloader.site/",
        "Origin":     "https://videodownloader.site",
    }

    if not as_attachment and request.headers.get("range"):
        headers["Range"] = request.headers["range"]

    client = httpx.AsyncClient(follow_redirects=True)
    req    = client.build_request("GET", url, headers=headers)
    r      = await client.send(req, stream=True)

    async def stream_generator():
        try:
            async for chunk in r.aiter_bytes():
                yield chunk
        finally:
            await r.aclose()
            await client.aclose()

    resp_headers = {
        "Content-Type":  r.headers.get("content-type", "video/mp4"),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
    }
    if "content-length" in r.headers:
        resp_headers["Content-Length"] = str(r.headers["content-length"])
    if "content-range" in r.headers:
        resp_headers["Content-Range"]  = str(r.headers["content-range"])

    if as_attachment:
        quality  = request.query_params.get("quality", "")
        filename = f"video_{quality}.mp4" if quality else "video.mp4"
        resp_headers["Content-Disposition"] = f'attachment; filename="{filename}"'

    return StreamingResponse(
        stream_generator(),
        status_code=r.status_code,
        headers=resp_headers,
    )


@app.get("/api/download")
async def download_proxy(url: str, request: Request):
    try:
        return await _fetch_stream_response(url, request, as_attachment=True)
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/stream")
async def stream_proxy(url: str, request: Request):
    try:
        return await _fetch_stream_response(url, request, as_attachment=False)
    except Exception as e:
        return {"status": "error", "message": str(e)}
