#!/usr/bin/env python3
"""
Websirg - Automated Component Synchronizer
Synchronizes components/header.html, components/footer.html, and components/quote-modal.html
into all HTML files in the project root and dist/ directory.
Ensures 100% functionality whether served via HTTP, file:// (direct double-click), or Live Server.
"""

import os
import glob
import json
import re

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def load_config():
    config_path = os.path.join(DIRECTORY, 'config.json')
    default_config = {
        "siteName": "Websirg",
        "shortName": "Websirg",
        "tagline": "Empowering Your Digital Transformation",
        "phone": "9354631515",
        "phoneFormatted": "+91 9354631515",
        "email": "info@websirg.com",
        "address": "Delhi NCR, India",
        "copyrightYear": "2026"
    }
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                default_config.update(data)
        except Exception as e:
            print(f"[WARN] Error loading config.json: {e}")
    return default_config

def apply_template_vars(content, config):
    for k, v in config.items():
        if isinstance(v, str):
            content = content.replace(f"{{{{{k}}}}}", v)
    return content

def read_component(filename, config):
    filepath = os.path.join(DIRECTORY, 'components', filename)
    if not os.path.exists(filepath):
        print(f"[ERROR] Component not found: {filepath}")
        return ""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    return apply_template_vars(content, config).strip()

def sync_html_file(filepath, header_content, footer_content, modal_content, config):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # 1. Update Site Header
    # Match <div id="site-header">...</div> or comment marker
    header_pattern = re.compile(r'(<!--\s*Component:\s*Header\s*-->\s*)?<div id=["\']site-header["\']>[\s\S]*?</div>(\s*<!--\s*End Component:\s*Header\s*-->)?', re.I)
    
    # If standard pattern matches:
    # Notice we must handle nested divs safely!
    # Because <div id="site-header"> has nested divs inside header.html, regex non-greedy `.*?</div>` will stop early.
    # To avoid this, let's find the exact starting index of `<div id="site-header">` and its closing tag,
    # or use a dedicated regex or tag counter.

    def replace_container(html, container_id, component_name, new_inner):
        marker_regex = re.compile(rf'<!--\s*Component:\s*{component_name}\s*-->[\s\S]*?<!--\s*End Component:\s*{component_name}\s*-->', re.I)
        if marker_regex.search(html):
            replacement = f'<!-- Component: {component_name} -->\n    <div id="{container_id}">\n{new_inner}\n    </div>\n    <!-- End Component: {component_name} -->'
            return marker_regex.sub(replacement, html, count=1)

        # Look for <div id="{container_id}">
        pattern = re.compile(rf'<div\s+id=["\']{container_id}["\'](?:\s*class=["\'][^"\']*["\'])?\s*>', re.I)
        match = pattern.search(html)
        if not match:
            return html

        start_pos = match.start()
        open_tag_end = match.end()

        # Count nested <div> tags to find matching </div>
        depth = 1
        pos = open_tag_end
        div_tag_re = re.compile(r'<\s*(/)?\s*div(\s+[^>]*)?>', re.I)
        end_pos = None

        for div_match in div_tag_re.finditer(html, pos):
            is_close = bool(div_match.group(1))
            if is_close:
                depth -= 1
                if depth == 0:
                    end_pos = div_match.end()
                    break
            else:
                depth += 1

        if end_pos is not None:
            replacement = f'<!-- Component: {component_name} -->\n    <div id="{container_id}">\n{new_inner}\n    </div>\n    <!-- End Component: {component_name} -->'
            return html[:start_pos] + replacement + html[end_pos:]
        return html

    content = replace_container(content, 'site-header', 'Header', header_content)
    content = replace_container(content, 'site-footer', 'Footer', footer_content)
    content = replace_container(content, 'site-quote-modal', 'Quote Modal', modal_content)

    # Apply template variables across whole file
    content = apply_template_vars(content, config)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def sync_all():
    config = load_config()
    header_content = read_component('header.html', config)
    footer_content = read_component('footer.html', config)
    modal_content = read_component('quote-modal.html', config)

    html_files = [f for f in sorted(glob.glob(os.path.join(DIRECTORY, '*.html'))) if not os.path.basename(f).startswith('.') and os.path.basename(f) != 'blog-single-sidebar-right.html']

    print(f"Syncing {len(html_files)} root HTML files from components/ ...")
    for fpath in html_files:
        sync_html_file(fpath, header_content, footer_content, modal_content, config)
        print(f"  [SYNCED] {os.path.basename(fpath)}")

    # Also sync dist/*.html if dist exists
    dist_dir = os.path.join(DIRECTORY, 'dist')
    if os.path.isdir(dist_dir):
        dist_files = [f for f in sorted(glob.glob(os.path.join(dist_dir, '*.html'))) if not os.path.basename(f).startswith('.')]
        print(f"Syncing {len(dist_files)} dist HTML files...")
        for fpath in dist_files:
            sync_html_file(fpath, header_content, footer_content, modal_content, config)

    print("\n[SUCCESS] All pages synchronized with components/ (header, footer, modal)!")

if __name__ == '__main__':
    sync_all()
