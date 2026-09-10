import http.server
import socketserver
import os
import sys
import json
import re

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

LIVE_RELOAD_SCRIPT = """
<!-- Live Reload by Antigravity -->
<script>
(function() {
  let lastTimestamp = null;
  setInterval(async () => {
    try {
      const res = await fetch('/__live_reload__?t=' + Date.now());
      const currentTimestamp = await res.text();
      if (lastTimestamp !== null && currentTimestamp !== lastTimestamp) {
        console.log('[LiveReload] File changes detected. Reloading...');
        window.location.reload();
      }
      lastTimestamp = currentTimestamp;
    } catch(e) {}
  }, 800);
})();
</script>
</body>
"""

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
        except Exception:
            pass
    return default_config

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
            try:
                with open(full_path, 'r', encoding='utf-8') as cf:
                    comp_content = cf.read()
                return apply_template_vars(comp_content, config)
            except Exception as err:
                return f"<!-- Error loading include {rel_path}: {err} -->"
        return match.group(0)

    # Allow nested includes if needed
    for _ in range(3):
        if '<!--#include' not in content:
            break
        content = include_pattern.sub(replacer, content)

    return apply_template_vars(content, config)

last_components_mtime = 0

def check_and_sync_components():
    global last_components_mtime
    comp_dir = os.path.join(DIRECTORY, 'components')
    if not os.path.isdir(comp_dir):
        return
    current_mtime = 0
    for f in os.listdir(comp_dir):
        fp = os.path.join(comp_dir, f)
        if os.path.isfile(fp):
            try:
                mt = os.path.getmtime(fp)
                if mt > current_mtime:
                    current_mtime = mt
            except OSError:
                pass
    if last_components_mtime != 0 and current_mtime > last_components_mtime:
        try:
            from sync_components import sync_all
            print("[AutoSync] Changes detected in components/. Synchronizing all pages...")
            sync_all()
        except Exception as err:
            print(f"[AutoSync Error] {err}")
    last_components_mtime = current_mtime

def get_latest_mtime():
    check_and_sync_components()
    max_mtime = 0
    for root, dirs, files in os.walk(DIRECTORY):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.startswith('.') or f == 'dev_server.py':
                continue
            path = os.path.join(root, f)
            try:
                mtime = os.path.getmtime(path)
                if mtime > max_mtime:
                    max_mtime = mtime
            except OSError:
                pass
    return str(max_mtime)

class LiveReloadHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/__live_reload__'):
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(get_latest_mtime().encode('utf-8'))
            return

        req_path = self.path.split('?')[0].split('#')[0]
        fs_path = self.translate_path(req_path)

        if os.path.isdir(fs_path):
            fs_path = os.path.join(fs_path, 'index.html')

        if os.path.isfile(fs_path) and fs_path.endswith('.html'):
            try:
                with open(fs_path, 'r', encoding='utf-8', errors='ignore') as f:
                    raw_content = f.read()

                config = load_config()
                content = process_includes(raw_content, config)

                if '</body>' in content:
                    content = content.replace('</body>', LIVE_RELOAD_SCRIPT, 1)
                else:
                    content += LIVE_RELOAD_SCRIPT

                data = content.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
            except Exception as e:
                pass

        super().do_GET()

def run():
    global PORT
    for p in range(8080, 8095):
        try:
            handler = LiveReloadHTTPRequestHandler
            socketserver.TCPServer.allow_reuse_address = True
            with socketserver.TCPServer(("127.0.0.1", p), handler) as httpd:
                PORT = p
                print(f"Antigravity Live Server running at http://localhost:{PORT}")
                print(f"Serving directory: {DIRECTORY}")
                sys.stdout.flush()
                httpd.serve_forever()
        except OSError as e:
            if "Address already in use" in str(e):
                continue
            else:
                raise

if __name__ == '__main__':
    run()
