import os
import glob
import re

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

TITLES = {
    "index.html": "{{siteName}} | Digital Agency & IT Services",
    "about.html": "About Us | {{siteName}}",
    "contact.html": "Contact Us | {{siteName}}",
    "portfolio.html": "Portfolio | {{siteName}}",
    "case-studies.html": "Case Studies | {{siteName}}",
    "case-studies-details.html": "Case Study Details | {{siteName}}",
    "website-development.html": "Website Development | {{siteName}}",
    "mobile-app-development.html": "Mobile App Development | {{siteName}}",
    "logo-and-branding.html": "Logo & Branding | {{siteName}}",
    "seo.html": "Search Engine Optimization | {{siteName}}",
    "pay-per-click.html": "Pay-Per-Click Advertising | {{siteName}}",
    "social-media-marketing.html": "Social Media Marketing | {{siteName}}",
    "blog.html": "Blog | {{siteName}}",
    "blog-version-2.html": "Blog | {{siteName}}",
    "blog-details.html": "Blog Details | {{siteName}}",
    "blog-details-version-2.html": "Blog Details | {{siteName}}",
    "blog-media-gallery.html": "Blog Media Gallery | {{siteName}}",
    "blog-video-post.html": "Blog Video Post | {{siteName}}",
    "privacy-policy.html": "Privacy Policy | {{siteName}}",
    "terms-conditions.html": "Terms & Conditions | {{siteName}}"
}

HEADER_RE = re.compile(r'<!--\s*most top information\s*-->[\s\S]*?</nav>\s*(?:</div>)?\s*<!--\s*end navigation\s*-->', re.I)
FOOTER_RE = re.compile(r'(<!--\s*(?:\+{1,4}\s*)?footer\s*(?:\+{1,4}\s*)?-->\s*)?<footer id=\"footer\">[\s\S]*?</footer>\s*(?:<!--\s*end footer\s*-->)?', re.I)
MODAL_RE  = re.compile(r'(<!--\s*get a quote modal\s*-->\s*)?<div class=\"modal fade verticl-center-modal\" id=\"getAQuoteModal\"[\s\S]*?<!--\s*end get a quote modal\s*-->', re.I)
TITLE_RE  = re.compile(r'<title>.*?</title>', re.I)

HEADER_REPLACEMENT = """<div id="site-header">
<!--#include file="components/header.html"-->
</div>"""

FOOTER_REPLACEMENT = """<div id="site-footer">
<!--#include file="components/footer.html"-->
</div>"""

MODAL_REPLACEMENT = """<div id="site-quote-modal">
<!--#include file="components/quote-modal.html"-->
</div>"""

def refactor():
    html_files = [f for f in sorted(glob.glob('*.html')) if f != 'blog-single-sidebar-right.html']
    print(f"Refactoring {len(html_files)} HTML files...")

    for fname in html_files:
        with open(fname, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # 1. Replace Title
        page_title = TITLES.get(fname, "{{siteName}} | Digital Agency")
        content = TITLE_RE.sub(f"<title>{page_title}</title>", content, count=1)

        # 2. Replace Header
        if HEADER_RE.search(content):
            content = HEADER_RE.sub(HEADER_REPLACEMENT, content, count=1)
        else:
            print(f"[WARN] Header pattern not matched in {fname}")

        # 3. Replace Footer
        if FOOTER_RE.search(content):
            content = FOOTER_RE.sub(FOOTER_REPLACEMENT, content, count=1)
        else:
            print(f"[WARN] Footer pattern not matched in {fname}")

        # 4. Replace Modal
        if MODAL_RE.search(content):
            content = MODAL_RE.sub(MODAL_REPLACEMENT, content, count=1)
        else:
            print(f"[WARN] Modal pattern not matched in {fname}")

        # 5. Add site-config.js before </body> if not present
        if 'site-config.js' not in content:
            script_tag = '    <!-- site config & dynamic components -->\n    <script type="text/javascript" src="js/site-config.js"></script>\n</body>'
            if '</body>' in content:
                content = content.replace('</body>', script_tag, 1)

        # 6. Specific tweaks for contact.html info cards
        if fname == 'contact.html':
            content = re.sub(
                r'<a href="tel:[^"]*">.*?</a>',
                r'<a href="tel:{{phone}}" class="site-phone-link site-phone">{{phoneFormatted}}</a>',
                content
            )
            content = re.sub(
                r'<a href="mailto:[^"]*">.*?</a>',
                r'<a href="mailto:{{email}}" class="site-email-link site-email">{{email}}</a>',
                content
            )

        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"[OK] Refactored {fname}")

if __name__ == '__main__':
    refactor()
