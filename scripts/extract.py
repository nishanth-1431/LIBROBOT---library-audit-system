import os
import sys
from pypdf import PdfReader

# Setup portable paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
PDF_PATH = os.path.join(PROJECT_ROOT, "resources", "downloaded_document.pdf")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "resources", "pdf_text.txt")

try:
    reader = PdfReader(PDF_PATH)
    text = ""
    for idx, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            text += f"--- PAGE {idx+1} ---\n{page_text}\n"
    
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(text)
    print("Done")
except Exception as e:
    print(f"Error: {e}")
