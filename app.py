from __future__ import annotations

import base64
import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

ROOT = Path(__file__).resolve().parent
INDEX_FILE = ROOT / "index.html"
STYLE_FILE = ROOT / "style.css"
SCRIPT_FILE = ROOT / "app.js"
AUDIO_FILE = ROOT / "win-entry.mp3"
LOSE_AUDIO_FILE = ROOT / "lose-entry.mp3"
BACKGROUND_AUDIO_FILE = ROOT / "musique-fond.mp3"
LEVER_AUDIO_FILE = ROOT / "son-machine.mp3"
METEOR_FILE = ROOT / "meteorite.avif"
IFRAME_HEIGHT = 1200


def extract_body(html: str) -> str:
    match = re.search(r"<body[^>]*>([\s\S]*)</body>", html, flags=re.IGNORECASE)
    if not match:
        raise ValueError("Balise <body> introuvable dans index.html")
    return match.group(1).strip()


def build_embedded_html() -> str:
    index_html = INDEX_FILE.read_text(encoding="utf-8")
    style_css = STYLE_FILE.read_text(encoding="utf-8")
    script_js = SCRIPT_FILE.read_text(encoding="utf-8")

    audio_b64 = base64.b64encode(AUDIO_FILE.read_bytes()).decode("ascii")
    audio_data_uri = f"data:audio/mpeg;base64,{audio_b64}"
    lose_audio_b64 = base64.b64encode(LOSE_AUDIO_FILE.read_bytes()).decode("ascii")
    lose_audio_data_uri = f"data:audio/mpeg;base64,{lose_audio_b64}"
    bg_audio_b64 = base64.b64encode(BACKGROUND_AUDIO_FILE.read_bytes()).decode("ascii")
    bg_audio_data_uri = f"data:audio/mpeg;base64,{bg_audio_b64}"
    lever_audio_b64 = base64.b64encode(LEVER_AUDIO_FILE.read_bytes()).decode("ascii")
    lever_audio_data_uri = f"data:audio/mpeg;base64,{lever_audio_b64}"
    meteor_b64 = base64.b64encode(METEOR_FILE.read_bytes()).decode("ascii")
    meteor_data_uri = f"data:image/avif;base64,{meteor_b64}"
    style_css = style_css.replace('url("meteorite.avif")', f'url("{meteor_data_uri}")')
    replacements = {
        'const WIN_AUDIO_FILE = "win-entry.mp3";': f'const WIN_AUDIO_FILE = "{audio_data_uri}";',
        'const LOSE_AUDIO_FILE = "lose-entry.mp3";': f'const LOSE_AUDIO_FILE = "{lose_audio_data_uri}";',
        'const BACKGROUND_AUDIO_FILE = "musique-fond.mp3";': f'const BACKGROUND_AUDIO_FILE = "{bg_audio_data_uri}";',
        'const LEVER_AUDIO_FILE = "son-machine.mp3";': f'const LEVER_AUDIO_FILE = "{lever_audio_data_uri}";',
    }
    for source, target in replacements.items():
        if source not in script_js:
            raise ValueError(f"Constante audio introuvable dans app.js: {source}")
        script_js = script_js.replace(source, target)

    body_inner = extract_body(index_html)
    body_inner = re.sub(r"<script\s+src=\"app\.js\"></script>", "", body_inner, flags=re.IGNORECASE)

    return f"""<!doctype html>
<html lang=\"fr\">
  <head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />
    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />
    <link
      href=\"https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Press+Start+2P&display=swap\"
      rel=\"stylesheet\"
    />
    <style>{style_css}</style>
  </head>
  <body>
    {body_inner}
    <script>{script_js}</script>
  </body>
</html>
"""


def main() -> None:
    st.set_page_config(page_title="Yuri & Neil Arcade", layout="wide", initial_sidebar_state="collapsed")
    st.markdown(
        """
        <style>
          html, body, .stApp, [data-testid="stAppViewContainer"], [data-testid="stMain"] {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            width: 100% !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            overflow: hidden !important;
          }
          section.main {
            padding: 0 !important;
            margin: 0 !important;
            height: 100dvh !important;
            overflow: hidden !important;
          }
          .block-container, [data-testid="stMainBlockContainer"] {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100dvh !important;
            overflow: hidden !important;
          }
          div[data-testid="stVerticalBlock"] {
            gap: 0 !important;
            height: 100dvh !important;
            overflow: hidden !important;
          }
          div[data-testid="stIFrame"] {
            line-height: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            min-height: 100dvh !important;
            max-height: 100dvh !important;
            overflow: hidden !important;
          }
          iframe[title="st.iframe"] {
            display: block !important;
            width: 100vw !important;
            height: 100dvh !important;
            min-height: 100dvh !important;
            max-height: 100dvh !important;
            border: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header[data-testid='stHeader'], div[data-testid='stToolbar'], div[data-testid='stDecoration'] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        </style>
        """,
        unsafe_allow_html=True,
    )

    game_html = build_embedded_html()
    components.html(game_html, height=IFRAME_HEIGHT, scrolling=False)


if __name__ == "__main__":
    main()
