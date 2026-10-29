# Mini project report evidence

The final document is `Mini_Project_Report.pdf` at the project root. It follows the supplied reference's cover, typography/color direction, running header/footer, nine major sections, numbered screenshot captions and five-column verification table.

- Student: Abhyuday Sinha
- Registration: 23MIC0036
- Project: ATLAS - Beyond the Ordinary
- Final PDF: 69 pages
- Screenshot figures: 110, all distinct by SHA-256, captured from the actual running application
- Consolidated report cases: TC-01 through TC-40; 40 final passes
- Attempt history: 41 assertions, including the initial map-animation observation that was rechecked after it settled
- Automated suite rerun: 36 passed, 0 failed; retained in `node-results.tap`

`manifest.json` records each screenshot and the consolidated cases, with observed outcomes and the retained attempt history. `shot-001.jpg` through `shot-110.jpg` are original browser captures. The report groups them by feature, so figure order differs from capture filename order. `vit-logo.png` was extracted from the user-supplied academic formatting reference; it is included only for the academic cover.

The reference's course and instructor labels are retained. Its project content, author name, registration number, backend claims, public links and screenshots were not reused as ATLAS content. The report explicitly identifies local-only deployment and remaining unexecuted verification.

The report can be regenerated from the project root with `python docs/build_mini_project_report.py` using ReportLab, Pillow, PyMuPDF and the installed Windows Calibri/Cambria fonts. The browser runtime is not required to rebuild from the retained evidence.
