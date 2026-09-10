#!/usr/bin/env python3
"""
Websirg - Static Site Compiler & Exporter
Bakes components and config variables into the 'dist/' folder for production hosting.
"""

import os
import shutil
import json
import re

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(DIRECTORY, 'dist')

ASSET_DIRS = ['css', 'js', 'images', 'fonts', 'icon', 'revolution']

def load_config():
    config_path = os.path.join(DIRECTORY, 'config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def apply_template_vars(content, config):
    for k, v in config.items():
        if isinstance(v, str):
            content = content.replace(f"{{{{{k}}}}}", v)
    return content

def process_includes(content, config):
    include_pattern = re.compile(r'<!--#include\s+file=["\'](.*?)["\']\s*-->')
    
    def replacer(match):
        rel_path = match.group(1).strip()
        full_path = os.path.join(DIRECTORY, rel_path)
        if os.path.isfile(full_path):
            with open(full_path, 'r', encoding='utf-8') as cf:
                comp_content = cf.read()
            return apply_template_vars(comp_content, config)
        return match.group(0)

    for _ in range(3):
        if '<!--#include' not in content:
            break
        content = include_pattern.sub(replacer, content)

    return apply_template_vars(content, config)

from sync_components import sync_all

def build():
    config = load_config()
    site_name = config.get("siteName", "Websirg")
    print(f"Syncing components and baking production build for: {site_name}...")

    # First sync components across all workspace HTML files
    sync_all()

    os.makedirs(DIST_DIR, exist_ok=True)

    # Copy asset directories to dist
    for asset in ASSET_DIRS:
        src = os.path.join(DIRECTORY, asset)
        dst = os.path.join(DIST_DIR, asset)
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
            print(f"  [Asset Copied] {asset}/")

    # Copy config.json
    shutil.copy(os.path.join(DIRECTORY, 'config.json'), os.path.join(DIST_DIR, 'config.json'))

    # Bake HTML pages
    html_files = [f for f in os.listdir(DIRECTORY) if f.endswith('.html') and not f.startswith('.')]
    baked_count = 0

    for file_name in html_files:
        src_path = os.path.join(DIRECTORY, file_name)
        dst_path = os.path.join(DIST_DIR, file_name)
        with open(src_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        baked_content = process_includes(content, config)

        with open(dst_path, 'w', encoding='utf-8') as f:
            f.write(baked_content)
        baked_count += 1

    print(f"\n[SUCCESS] Exported {baked_count} static HTML pages to dist/ directory.")
    print("Ready for deployment to any web host (Netlify, Vercel, cPanel, GitHub Pages, etc.)!")

if __name__ == '__main__':
    build()
