"""Build the ATLAS report in the supplied academic PDF's visual/section pattern.

Run from the project root: python docs/build_mini_project_report.py
Requires reportlab, Pillow and PyMuPDF. Uses captured evidence, never mock screenshots.
"""
from pathlib import Path
from collections import Counter
from html import escape
import json
import re

import pymupdf
from PIL import Image as PillowImage
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    NextPageTemplate, Table, TableStyle, Image, KeepTogether, Flowable,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'docs/report-evidence'
OUTPUT = ROOT / 'Mini_Project_Report.pdf'
MANIFEST = json.loads((EVIDENCE / 'manifest.json').read_text(encoding='utf-8'))
PHOTOS = json.loads((ROOT / 'js/data.js').read_text(encoding='utf-8').split('window.ATLAS_PHOTOS = ', 1)[1].rstrip().rstrip(';'))
PAGE_W, PAGE_H = 595.32, 841.92
LEFT, RIGHT = 62.424, 60.0
WIDTH = PAGE_W - LEFT - RIGHT
NAVY, TEAL = colors.HexColor('#142B50'), colors.HexColor('#00857B')
GRAY, RULE = colors.HexColor('#526071'), colors.HexColor('#CAD4DE')

for name, filename in [('Calibri', 'calibri.ttf'), ('Calibri-Bold', 'calibrib.ttf'), ('Calibri-Italic', 'calibrii.ttf'), ('Cambria-Bold', 'cambriab.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / filename)))
pdfmetrics.registerFontFamily('Calibri', normal='Calibri', bold='Calibri-Bold', italic='Calibri-Italic', boldItalic='Calibri-Bold')

styles = {
    'Contents': ParagraphStyle('Contents', fontName='Calibri-Bold', fontSize=15, leading=19, spaceAfter=10, textColor=colors.black),
    'Body': ParagraphStyle('Body', fontName='Calibri', fontSize=10.56, leading=14.4, spaceAfter=8, alignment=TA_JUSTIFY),
    'Section': ParagraphStyle('Section', fontName='Calibri-Bold', fontSize=18, leading=22, textColor=NAVY, spaceBefore=17, spaceAfter=12, keepWithNext=True),
    'Subsection': ParagraphStyle('Subsection', fontName='Calibri-Bold', fontSize=12, leading=16, textColor=TEAL, spaceBefore=15, spaceAfter=8, keepWithNext=True),
    'Label': ParagraphStyle('Label', fontName='Calibri-Bold', fontSize=10.56, leading=14, spaceBefore=7, spaceAfter=5, keepWithNext=True),
    'Cell': ParagraphStyle('Cell', fontName='Calibri', fontSize=8.4, leading=10.8, spaceAfter=0),
    'HeadCell': ParagraphStyle('HeadCell', fontName='Calibri-Bold', fontSize=8.4, leading=10.8, textColor=colors.white),
    'Caption': ParagraphStyle('Caption', fontName='Calibri-Bold', fontSize=8.5, leading=10.5, textColor=NAVY, alignment=TA_CENTER, spaceBefore=5, spaceAfter=2),
    'FigureNote': ParagraphStyle('FigureNote', fontName='Calibri-Italic', fontSize=8.5, leading=11, textColor=GRAY, alignment=TA_CENTER, spaceAfter=10),
    'Small': ParagraphStyle('Small', fontName='Calibri', fontSize=9, leading=12, spaceAfter=7),
    'Bullet': ParagraphStyle('Bullet', fontName='Calibri', fontSize=10.56, leading=14.4, leftIndent=18, firstLineIndent=-10, spaceAfter=5),
}

def clean(text):
    return str(text).replace('\u2011', '-').replace('\u2013', '-').replace('\u2014', '-').replace('’', "'").replace('“', '"').replace('”', '"')

def p(text, style='Body'):
    return Paragraph(clean(text), styles[style])

def table(headers, rows, widths=None):
    data = [[p(escape(v), 'HeadCell') for v in headers]]
    data += [[p(escape(clean(v)), 'Cell') for v in row] for row in rows]
    t = Table(data, colWidths=widths or [WIDTH / len(headers)] * len(headers), repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F2F5F7')]),
        ('GRID', (0, 0), (-1, -1), .35, RULE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4), ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    return t

class Architecture(Flowable):
    def __init__(self):
        super().__init__(); self.width = WIDTH; self.height = 176
    def draw(self):
        c = self.canv
        boxes = [(0, 112, 140, 44, 'HTML + CSS', 'Semantic and responsive UI'),
                 (166, 112, 140, 44, 'app.js state + events', 'Rendering and dialog lifecycle'),
                 (332, 112, 140, 44, 'data.js + logic.js', '18 places; pure selection'),
                 (0, 24, 140, 44, 'Browser localStorage', 'Validated favorite IDs'),
                 (166, 24, 140, 44, 'Photo / guide / comparison', 'Native dialogs; slideshow'),
                 (332, 24, 140, 44, 'Remote resources', 'Commons + OpenStreetMap')]
        for x,y,w,h,title,subtitle in boxes:
            c.setFillColor(colors.HexColor('#F2F7F7')); c.setStrokeColor(TEAL)
            c.roundRect(x,y,w,h,4,fill=1,stroke=1)
            c.setFillColor(NAVY);c.setFont('Calibri-Bold',9);c.drawCentredString(x+w/2,y+27,title)
            c.setFillColor(GRAY);c.setFont('Calibri',7.5);c.drawCentredString(x+w/2,y+12,subtitle)
        c.setStrokeColor(GRAY);c.setLineWidth(.8)
        for x1,y1,x2,y2 in [(140,134,166,134),(306,134,332,134),(70,112,70,68),(236,112,236,68),(402,112,402,68)]:
            c.line(x1,y1,x2,y2)
        c.setFont('Calibri-Italic',8);c.setFillColor(GRAY);c.drawCentredString(WIDTH/2,4,'Static browser application - no backend, authentication server or database')

def cover(canvas, doc):
    canvas.saveState()
    canvas.setTitle('Mini Project Report - ATLAS - Beyond the Ordinary')
    canvas.setAuthor('Abhyuday Sinha - 23MIC0036')
    canvas.setFillColor(NAVY);canvas.setFont('Cambria-Bold',20.04)
    canvas.drawCentredString(PAGE_W/2, PAGE_H-132, 'VELLORE INSTITUTE OF TECHNOLOGY, VELLORE')
    canvas.setStrokeColor(TEAL);canvas.setLineWidth(1.1);canvas.line(61, PAGE_H-162, 534.5, PAGE_H-162)
    canvas.drawImage(str(EVIDENCE/'vit-logo.png'),178.6,PAGE_H-354.25,width=238.1,height=134.5,mask='auto')
    canvas.setFillColor(TEAL)
    text=canvas.beginText();text.setFont('Calibri-Bold',14.04);text.setCharSpace(1.65)
    title='MINI PROJECT REPORT ON';text.setTextOrigin(193,PAGE_H-427);text.textOut(title);text.setCharSpace(0);canvas.drawText(text)
    canvas.setFillColor(NAVY);canvas.setFont('Cambria-Bold',44.04);canvas.drawCentredString(PAGE_W/2,PAGE_H-482,'ATLAS')
    canvas.setFillColor(TEAL);canvas.setFont('Calibri-Italic',17.04);canvas.drawCentredString(PAGE_W/2,PAGE_H-518,'Beyond the Ordinary')
    canvas.setFont('Calibri-Italic',12);canvas.drawCentredString(PAGE_W/2,PAGE_H-540,'An Interactive Worldwide Photography Gallery')
    canvas.setStrokeColor(RULE);canvas.setLineWidth(.5);canvas.line(61,PAGE_H-626,534.5,PAGE_H-626)
    details=[('Course:','CSI3029 - Front End Design and Testing'),('Submitted By:','Abhyuday Sinha'),('Registration Number:','23MIC0036'),('Submitted To:','Dr. ArulKumar V')]
    for n,(label,value) in enumerate(details):
        y=PAGE_H-(650+n*28.5)
        canvas.setFillColor(GRAY);canvas.setFont('Calibri',13.56);canvas.drawRightString(241.4,y,label)
        canvas.setFillColor(NAVY);canvas.setFont('Calibri-Bold',13.56);canvas.drawString(252.05,y,value)
    canvas.setStrokeColor(RULE);canvas.line(61,PAGE_H-765,534.5,PAGE_H-765)
    canvas.restoreState()

def body_page(canvas, doc):
    canvas.saveState();canvas.setFillColor(GRAY);canvas.setFont('Calibri',8.52)
    canvas.drawString(LEFT,PAGE_H-35,'ATLAS - Mini Project Report   |   CSI3029 Front End Design and Testing')
    canvas.setStrokeColor(RULE);canvas.setLineWidth(.45);canvas.line(61,PAGE_H-38,534.5,PAGE_H-38)
    canvas.setFont('Calibri',9);canvas.drawCentredString(PAGE_W/2,23,str(doc.page));canvas.restoreState()

class Report(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'Section':
            title=flowable.getPlainText();key='section-'+title.split()[0]
            self.canv.bookmarkPage(key);self.canv.addOutlineEntry(title,key,level=0,closed=False)
            self.notify('TOCEntry',(0,title,self.page,key))

def build():
    shots=MANIFEST['screenshots'];assert len(shots)>=100
    cases=MANIFEST['testCases'];assert len(cases)==40 and cases[-1]['id']=='TC-40'
    doc=Report(str(OUTPUT),pagesize=(PAGE_W,PAGE_H),leftMargin=LEFT,rightMargin=RIGHT,topMargin=58,bottomMargin=52,title='Mini Project Report - ATLAS',author='Abhyuday Sinha')
    frame=Frame(LEFT,52,WIDTH,PAGE_H-110,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id='Cover',frames=[frame],onPage=cover),PageTemplate(id='Body',frames=[frame],onPage=body_page)])
    story=[NextPageTemplate('Body'),PageBreak(),p('Contents','Contents')]
    toc=TableOfContents();toc.levelStyles=[ParagraphStyle('TOC',fontName='Calibri',fontSize=10.56,leading=15,spaceBefore=4,textColor=colors.black)];toc.dotsMinLevel=0
    story += [toc,Spacer(1,20),p('1  Abstract and Project Overview','Section'),p('Abstract','Label')]
    story += [p('ATLAS - Beyond the Ordinary is a static, interactive travel photography application built with HTML5, CSS3 and vanilla JavaScript. It presents 18 destinations across five continents through a responsive gallery, combined search and category filters, sorting, browser-local favorites, and a keyboard-accessible photograph viewer. The expanded version adds sourced destination guides, an interactive location map, two/three-place comparison, random discovery and an explicitly controlled slideshow. This report documents the implemented interface with 110 distinct screenshots captured from the running application and records 40 consolidated verification cases through TC-40. The project emphasizes frontend composition, meaningful mouse and keyboard events, state synchronization and evidence-based testing.'),p('Problem statement','Label'),p('A passive photograph grid provides little help in finding a place, understanding its context, comparing interests or keeping a personal collection of favorites. Independent controls can produce inconsistent counts or lose user selections. A visual overlay can also become difficult to use when its keyboard focus, navigation boundaries and lifecycle are not managed explicitly.'),p('Objectives','Label')]
    for text in ['Create a premium editorial photography interface with a consistent dark/blue/lime design system.', 'Support meaningful mouse and keyboard exploration, accessible dialogs and responsive phone/tablet layouts.', 'Connect discovery, guides, maps, comparison, favorites and playback through understandable browser state.', 'Verify implementation with executable pure-logic tests and observed browser outcomes; report remaining coverage honestly.']:
        story.append(p('• '+text,'Bullet'))
    story += [p('Scope','Label'),p('The implementation is a build-free static frontend. Its single destination array supplies photographs, country/category metadata, editorial guides, source credits and representative map coordinates. Favorites persist in localStorage; comparison and filter state last for the current visit. Wikimedia Commons supplies remote photography and an on-demand OpenStreetMap embed supplies map interaction. Accounts, a backend database, uploads, bookings, personal travel journals and shareable destination links are outside this version.'),table(['Measure (from the implementation)','Value'],[
        ['Destinations / continents','18 destinations / 5 continents'],['Categories','6: Mountains, Beaches, Cities, Nature, Architecture, Culture'],['Core technology','HTML5, CSS3 and 3 vanilla JavaScript files; no build framework'],['Guide and map coverage','18 detailed guides and 18 sourced coordinate pairs'],['Screenshot evidence','110 distinct browser screenshots in Section 4'],['Report verification','40 consolidated cases, TC-01 through TC-40'],['Automated suite','36 Node tests passed in the report preparation run']],[170,WIDTH-170])]
    story += [p('2  Project Links','Section'),table(['Resource','Location / current status'],[
        ['Local running application','http://127.0.0.1:8000 (start the local server first)'],['Application entry point','index.html in the submitted project folder'],['Project documentation','README.md and docs/PROJECT_DOCUMENTATION.md'],['Source and image attribution','docs/DESTINATION_SOURCES.md and docs/IMAGE_CREDITS.md'],['Screenshots and test evidence','docs/report-evidence/manifest.json and node-results.tap'],['GitHub repository / public deployment','No public repository or hosted application URL has been supplied or verified.'],['Implementation video','Not supplied; no video link is claimed.']],[150,WIDTH-150])]
    story += [p('3  Technology Stack and System Architecture','Section'),table(['Layer','Technology and implementation'],[
        ['Frontend structure','Semantic HTML landmarks, headings, native form controls, anchors and two dialog elements [1, 2].'],['Visual design','CSS Grid/Flexbox, custom-property tokens, clamp typography, image aspect ratios and responsive breakpoints.'],['Application logic','Vanilla JavaScript DOM construction, delegated clicks, individual mouse-enter/leave handlers and a centralized state object.'],['Data and persistence','data.js is the single source of destination/guide metadata. logic.js contains pure helpers; validated favorite IDs use browser localStorage [3].'],['External resources','Source-credited Commons thumbnails and an on-demand OpenStreetMap embed with visible contributor attribution [6, 7].'],['Verification and report','Node built-in test runner; actual browser actions; Python/ReportLab for this PDF. No browser package was added to the application.']],[105,WIDTH-105]),Spacer(1,12),Architecture(),p('Figure 3.1: ATLAS system architecture','Caption'),p('Browser data and application flow','Label'),p('The browser loads data.js, logic.js and app.js as ordered deferred scripts. User input updates search, category, sort, favorites or layout state. Pure selection logic returns a new eligible array; rendering updates cards, counters and pressed states without mutating the source data. Comparison choices remain independent of gallery filters. Opening the viewer snapshots the eligible order; a guide opened from comparison instead follows the selected comparison order. No application server or database is involved.'),p('Mouse and keyboard event handling','Label'),p('Delegated card clicks distinguish photograph, favorite, guide and comparison controls. Native buttons provide Enter/Space activation. Mouse enter and leave apply restrained image feedback. One document key handler supports viewer arrows, F for saving, P for playback, modal Tab wrapping, Ctrl/Cmd+K for search and menu Escape. Editable fields and selects are excluded from shortcuts. Native dialog behavior makes background content inert; Close/Escape restore focus to an appropriate trigger.'),p('Playback, maps and error handling','Label'),p('Playback is opt-in, requires two eligible photographs and uses a single interval with 3/5/8-second choices. Manual navigation, guide expansion, image failure, closing and tab backgrounding pause it. The map loads only on request, uses validated representative coordinates and preserves pan/zoom across unrelated state changes. Failed images use local labeled SVG artwork. Storage JSON is parsed defensively and invalid IDs are rejected; denied storage leaves current-visit favorites usable.')]

    story += [p('4  Feature-Wise Implementation and Screenshots','Section'),p('Every figure below is a screenshot captured from the running ATLAS application in the available Chromium-based in-app browser. The account label is [Visitor] because ATLAS does not implement authentication. Captures cover distinct destination or interaction states; responsive widths are emulated browser viewports, not claims of real-device testing. Photograph and map attributions appear in the application and are consolidated in Section 9. The evidence manifest retains all 110 image filenames and the associated verification record.')]
    groups=[
        ('Landing and navigation','Landing Page, Collections and Footer','The wordmark and primary links lead to real sections. The cinematic hero introduces the edit, while lower collection shortcuts select meaningful categories. The footer links to documentation and genuine source credits.'),
        ('Destination gallery','Dynamic Destination Gallery','All 18 destination records are rendered as native photo buttons with separate saving, guide and comparison controls. These searched-card captures show actual destination-specific results and retain the same card/data structure across continents.'),
        ('Search and empty states','Search, Combined Selection and Empty States','Search matches destination, country, category and description without case sensitivity or surrounding-space sensitivity. It combines with the selected category, favorites-only mode and sort order. No-match states explain how to recover without disabling the rest of the application.'),
        ('Category filters','Destination Category Filters','Six functional categories update aria-pressed state, result counts and eligible cards. All destinations removes only the category restriction, preserving other user selections.'),
        ('Sorting and layouts','Sorting and Gallery Layout Controls','Featured, destination A-Z and Z-A operate on the eligible collection. Large and compact desktop layouts share the same source records and use responsive grids; layout does not alter filtering or favorites.'),
        ('Photography viewer','Interactive Photograph Viewer','The shared native dialog displays the selected image, country, category, description, creator credit and collection position. Manual arrows stop at the filtered boundaries. Favorite controls remain independent, the background is inert and Escape restores the opening trigger.'),
        ('Destination guides','Detailed Destination Guides','Each place has an original overview, three highlights, three interests, cultural context, a planning suggestion and geographic/map references. The guide lives inside the viewer, can be collapsed, and pauses slideshow playback. Tips are general guidance rather than live schedules or travel advisories.'),
        ('Favorites and persistence','Favorites, Saved Collections and Persistence','Cards and the viewer share one Set of valid favorite IDs. Hearts and the header count update together. localStorage preserves favorites after refresh; the saved-only view combines with categories and search. Comparison selection is deliberately separate.'),
        ('Keyboard accessibility','Keyboard Navigation and Focus Handling','Native activation, visible focus indicators, explicit modal wrapping and return focus support keyboard operation. The figure shows a visible focus state. This targeted evidence is not a complete screen-reader or WCAG audit.'),
        ('Destination comparison','Two/Three-Destination Comparison','A selection tray accepts up to three destinations, requires two before comparison and provides removal/clear actions. The separate native comparison dialog presents landscape, highlights, interests and context. Hidden-by-filter selections remain available, and their guides open with the selected comparison order.'),
        ('Interactive destination maps','Interactive Destination Maps and Nearby Exploration','The map chooser reflects the currently eligible destinations and loads a representative OpenStreetMap pin. Native map controls support zoom and pan. A larger-map link and explicit attribution remain available. Each location below was captured after the embedded map reflected the selected longitude, avoiding screenshots of the previous location.'),
        ('Random discovery','Filtered Random Discovery','Surprise me chooses within the eligible collection and opens a guide. It avoids an immediate repeat when alternatives exist, permits a single eligible destination and is disabled for an empty edit.'),
        ('Slideshow playback','Photography Slideshow and Playback Controls','Play this edit starts the current eligible sequence. Explicit play/pause, the P shortcut and slide-duration control support user-directed playback. Automatic navigation loops; manual navigation remains bounded. The captures show starting, automatic advance and paused states.'),
        ('Responsive layouts','Responsive Layouts, Phone Navigation and Dialogs','The interface was inspected at 1440, 1024, 768, 390 and 320 CSS pixels. Categories wrap, grid columns adapt and phone navigation becomes a disclosure menu. Guides and comparison details stack on phones. Scrollable dialogs retain visible close controls.')]
    figure_number=0
    for group_index,(group,title,description) in enumerate(groups,1):
        story += [p(f'4.{group_index}  {title}','Subsection'),p(description)]
        selected=[s for s in shots if s['group']==group]
        n=0
        while n<len(selected):
            shot=selected[n];path=EVIDENCE/shot['file'];iw,ih=PillowImage.open(path).size
            if iw/ih<.9 and n+1<len(selected):
                other=selected[n+1];ow,oh=PillowImage.open(EVIDENCE/other['file']).size
                if ow/oh<.9:
                    cells=[]
                    for s in [shot,other]:
                        figure_number+=1;impath=EVIDENCE/s['file'];sw,sh=PillowImage.open(impath).size
                        factor=min((WIDTH/2-12)/sw,460/sh)
                        cells.append([Image(str(impath),width=sw*factor,height=sh*factor),p(f'Figure 4.{figure_number}: {escape(s["title"])} <font color="#00857B">[Visitor]</font>','Caption'),p(escape(s['note']),'FigureNote')])
                    pair=Table([[cells[0],cells[1]]],colWidths=[WIDTH/2,WIDTH/2]);pair.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),3),('RIGHTPADDING',(0,0),(-1,-1),3)]))
                    story += [KeepTogether([pair]),Spacer(1,7)];n+=2;continue
            figure_number+=1;factor=min(WIDTH/iw,300/ih)
            story.append(KeepTogether([Image(str(path),width=iw*factor,height=ih*factor),p(f'Figure 4.{figure_number}: {escape(shot["title"])} <font color="#00857B">[Visitor]</font>','Caption'),p(escape(shot['note']),'FigureNote')]))
            n+=1
    assert figure_number==110

    story += [p('5  Testing and Verification','Section'),p('The report preparation run executed the existing dependency-free Node suite and fresh browser checks while capturing the application. Node reported 36 executed tests, 36 passed and zero failed. The table below consolidates 40 report cases, TC-01 through TC-40, with observed outcomes. Browser cases use actual click, fill, select and key actions with DOM observations; TC-40 records the executable Node suite. These consolidated cases overlap the earlier project test records and must not be added to them as independent totals.'),p('Test environment and execution record','Label'),p('Environment: Windows PowerShell; Node.js v22.18.0; Python 3.14.7; a static server at http://127.0.0.1:8000; the available Chromium-based in-app browser. Screen widths included 1440, 1024, 768, 390 and 320 px. The source evidence is docs/report-evidence/manifest.json and node-results.tap. No external browser-testing package was installed.'),p('All 40 final consolidated cases passed. The attempt history contains 41 records because an immediate map-zoom observation initially sampled the animation before it settled. TC-35 was observed again after the map updated and passed; that earlier attempt is retained rather than hidden. This is a timing/observation correction, not an invented pass. Eleven broader manual scenarios in the project documentation remain open, including screen readers, other browser engines, forced failures and background-tab playback pause.')]
    rows=[]
    for case in cases:
        rows.append([case['id'],case['module'],case['scenario']+' Observed: '+case['actual'],case['result'],case['type']])
    story += [table(['ID','Module','Scenario','Result','Type'],rows,[42,77,WIDTH-42-77-49-57,49,57]),Spacer(1,10),p('Verification boundaries','Label'),p('The test run establishes the listed behavior in the available browser, not complete cross-browser, assistive-technology or performance conformance. Invalid stored-data parsing is covered by the Node tests; actual denied-storage and image-host failure injection were not executed in this report session. Map zoom was observed; native map panning is available but was not separately asserted. The screenshot count is 110 distinct image files, verified by content hashes, and is separate from the count of test cases.')]
    story += [p('6  Deployment','Section'),p('ATLAS is delivered locally as a static website and can be hosted by GitHub Pages or any static server. No public deployment or repository URL has been supplied or verified; this report does not claim a live hosted service. All application paths are relative and there is no framework build, environment secret, backend process or database migration.'),table(['Item','Configuration / procedure'],[
        ['Entry point','index.html at the project root'],['Local server','From the project folder: python -m http.server 8000 --bind 127.0.0.1'],['Local address','http://127.0.0.1:8000'],['Runtime prerequisites','A modern JavaScript-enabled browser supporting native dialog; Python is only a local-server convenience.'],['Static-host files','index.html, css/, js/, assets/, favicon.ico and docs/'],['GitHub Pages option','Commit the source, select Settings > Pages > Deploy from a branch, and select the repository root. This is a deployment procedure, not evidence of a completed deployment.'],['External network needs','Wikimedia photography and optional OpenStreetMap embed; guide text and source coordinates are bundled.'],['Persistence','Favorites use localStorage for the same origin/browser; other view settings and comparison are session-only.']],[125,WIDTH-125]),p('Local demonstration workflow','Label'),p('Start the server, open the local address, browse a card and its guide, combine a country query with a category, save a place and refresh, compare two destinations, open a representative map, and run a two-place Architecture slideshow at three seconds. Demonstrate Tab/Shift+Tab, Enter/Space, arrows, F, P, Escape and Ctrl/Cmd+K. Stop the server with Ctrl+C after evaluation.')]
    story += [p('7  Limitations and Future Scope','Section'),p('Limitations','Label')]
    for text in ['Photographs and interactive map tiles depend on external connectivity and service availability. The local fallback does not cache the whole image collection.', 'Favorites are browser/origin-local and can be cleared or restricted. No account or cloud synchronization is present.', 'Search is a literal substring over the original destination metadata, without fuzzy ranking or multilingual matching.', 'Map pins identify representative landmarks or viewpoints, not precise visitor entrances, routes or the boundary of an entire region.', 'Guides contain editorial context and general suggestions; live entry schedules, prices, weather, visa rules and travel advisories are not supplied.', 'Comparison is qualitative, session-only and limited to three places. No cost estimator, upload, booking service, personal travel journal or shareable destination link is implemented.', 'Testing does not constitute a full WCAG audit, real-device certification, performance benchmark or Firefox/Safari pass. Remaining manual scenarios are retained in the project test documents.']:
        story.append(p('• '+text,'Bullet'))
    story.append(p('Future scope','Label'))
    for text in ['Add a backend and authenticated, cloud-synchronized favorites when a real multi-device requirement arises.', 'Extend the map with an all-destination marker layer, optional route planning and richer geographic filters.', 'Introduce reviewed multilingual content, advanced search and a small destination-content management workflow.', 'Add license-aware image optimization/caching, optional PWA support, visual regression checks and systematic accessibility/cross-browser testing.']:
        story.append(p('• '+text,'Bullet'))
    story += [p('8  Conclusion','Section'),p('ATLAS demonstrates how a small static frontend can support a coherent discovery experience without a framework or backend. The completed interface combines photography, contextual guides, maps, favorites, comparison, random exploration and controlled playback through clear browser state. Native controls, semantic markup, restrained styling and responsive layouts support its academic frontend-design objectives. Mouse and keyboard events perform real tasks, while explicit dialog and timer lifecycles reduce inconsistent behavior. This report follows the supplied academic structure, documents the implemented states with 110 actual screenshots, and records TC-01 through TC-40 with final observed outcomes. The source, evidence and remaining verification gaps are retained for demonstration and review.')]
    story += [p('9  References','Section')]
    refs=[('MDN Web Docs: HTML elements and semantic structure','https://developer.mozilla.org/en-US/docs/Web/HTML'),('MDN Web Docs: The dialog element','https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog'),('MDN Web Docs: Window localStorage','https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'),('W3C WAI: Dialog (Modal) Pattern','https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/'),('Node.js: Built-in test runner','https://nodejs.org/api/test.html'),('Wikimedia Commons: Reusing content outside Wikimedia','https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia'),('OpenStreetMap: Copyright and license','https://www.openstreetmap.org/copyright'),('OpenStreetMap Wiki: Export and embedding','https://wiki.openstreetmap.org/wiki/Export'),('W3C: Web Content Accessibility Guidelines 2.2','https://www.w3.org/TR/WCAG22/')]
    for i,(title,url) in enumerate(refs,1):story.append(p(f'[{i}] {escape(title)}. <link href="{escape(url)}" color="#00857B">{escape(url)}</link>','Small'))
    story += [p('Geographic sources and image attribution','Label'),p('The following source-linked credits cover the photographs appearing throughout the interface screenshots. The project does not claim ownership of these works. Screenshots include interface overlays/crops; original file descriptions and license terms are linked. OpenStreetMap data and embedded map screenshots are credited to OpenStreetMap contributors under the Open Database License. The VIT mark on the cover is reproduced from the supplied formatting reference for this academic report.')]
    credit_rows=[]
    for photo in PHOTOS:
        credit_rows.append([photo['destination'],photo['credit'],photo['sourceUrl'],photo['licenseUrl'],photo['guide']['sourceUrl']])
    for destination,credit,source,license_url,guide_url in credit_rows:
        story.append(p(f'<b>{escape(destination)}</b> - {escape(credit)}. <link href="{escape(source)}" color="#00857B">Original Commons file</link>; <link href="{escape(license_url)}" color="#00857B">license terms</link>; <link href="{escape(guide_url)}" color="#00857B">geographic guide source</link>.','Small'))
    story.append(p('Project evidence and technical references were consulted during implementation and report preparation on 29 October 2026. Source-verified metadata is retained in js/data.js, docs/IMAGE_CREDITS.md and docs/DESTINATION_SOURCES.md. Screenshots and current report test outcomes are retained in docs/report-evidence/.','Small'))
    doc.multiBuild(story,maxPasses=5)
    pdf=pymupdf.open(OUTPUT)
    all_text='\n'.join(page.get_text() for page in pdf)
    assert 'Abhyuday Sinha' in all_text and '23MIC0036' in all_text
    assert len(re.findall(r'Figure 4\.\d+:',all_text))==110
    assert all(f'TC-{i:02}' in all_text for i in range(1,41))
    print(f'Created {OUTPUT.name}: {len(pdf)} pages, 110 screenshot figures, TC-01 through TC-40.')

if __name__=='__main__':build()
