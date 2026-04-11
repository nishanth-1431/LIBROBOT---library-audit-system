from pptx import Presentation
from pptx.util import Inches, Pt

prs = Presentation()

def add_slide(prs, title_text, bullet_points):
    slide_layout = prs.slide_layouts[1] # Title and Content
    slide = prs.slides.add_slide(slide_layout)
    title = slide.shapes.title
    title.text = title_text
    
    body_shape = slide.shapes.placeholders[1]
    tf = body_shape.text_frame
    
    if bullet_points:
        tf.text = bullet_points[0]
        for point in bullet_points[1:]:
            p = tf.add_paragraph()
            p.text = point
            
    return slide

def add_title_slide(prs, title_text, subtitle_text):
    slide_layout = prs.slide_layouts[0] # Title Slide
    slide = prs.slides.add_slide(slide_layout)
    title = slide.shapes.title
    subtitle = slide.placeholders[1]
    title.text = title_text
    subtitle.text = subtitle_text
    return slide

# Slide 1
add_title_slide(prs, "Libro-Bot: Library Audit & Inventory Robot", "Team Members: [Your Names]\nGuide: [Guide Name]\nDate: [Date]")

# Slide 3: Introduction
add_slide(prs, "Introduction", [
    "What is Libro-Bot?",
    "  • A robotic library audit and stock-checking system.",
    "  • Designed to eliminate the slow, error-prone process of manual library audits.",
    "Core Components:",
    "  • Hardware (In Development): A mechanized sliding camera system designed to navigate library aisles and scan books row by row.",
    "  • Software (Fully Developed): A robust backend and a modern web dashboard that processes barcode scans in real-time, cross-referencing physical stock with the library database."
])

# Slides 4-5
add_slide(prs, "Problem Identification, Scope, and Objective", [
    "Problem Identification:",
    "  • Manual inventory tracking in large libraries is labor-intensive and consumes days or weeks.",
    "  • High probability of human error leading to 'lost' but actually misplaced books.",
    "Scope:",
    "  • To automate the scanning of standard library barcodes across varying shelf conditions using a mechanized camera system.",
    "  • To provide administrators with a real-time tracking dashboard.",
    "Objective:",
    "  • Build a digital twin software system capable of instantaneous stock verification.",
    "  • Develop a hardware slider that systematically moves a camera across bookshelves.",
    "  • Accurately categorize books as 'Available', 'Missing', or 'Misplaced'."
])

# Slides 6-10
add_slide(prs, "Literature Survey", [
    "Paper 1: Automated Inventory Systems using RFID vs. Barcodes",
    "  • Takeaway: While RFID is faster, standard barcode scanning with improved camera mechanisms is significantly more cost-effective.",
    "Paper 2: Computer Vision in Robotic Navigation",
    "  • Takeaway: Techniques for stabilizing camera feeds while in motion, which influenced our sliding camera design.",
    "Paper 3: Real-Time Data Processing in Web Dashboards",
    "  • Takeaway: Utilizing WebSockets for instant UI updates, ensuring the dashboard reflects scans immediately."
])

# Slides 11-12
add_slide(prs, "Existing Technology of the Project", [
    "Software Stack (Completed):",
    "  • Frontend: React.js (Vite), Tailwind CSS for a modern, responsive UI.",
    "  • Backend: Python (Flask/FastAPI), OpenCV, PyZbar for barcode decoding.",
    "  • Communication: REST APIs and WebSockets for real-time live-scan telemetry.",
    "Hardware Stack (In Development):",
    "  • Microcontrollers (e.g., ESP32, Raspberry Pi or Arduino) for motor control.",
    "  • Stepper/Servo motors for the sliding rail mechanism.",
    "  • High-definition camera module for barcode capture."
])

# Slides 13-14
add_slide(prs, "Methodology & Time Line", [
    "Phase 1: Software Architecture & Development (100% Complete)",
    "  • Database design, API development, UI/UX design, and simulated scanning logic.",
    "Phase 2: Hardware Prototyping (Ongoing - Current Phase)",
    "  • Designing the sliding rail system.",
    "  • Selecting motors and testing camera focal lengths at shelf distances.",
    "Phase 3: System Integration (Upcoming)",
    "  • Connecting the physical camera feed to the software backend.",
    "Phase 4: Real-world Testing & Calibration (Upcoming)"
])

# Slides 15-16
add_slide(prs, "Design & Experimentation Carried During Review Period", [
    "Software Design Achieved:",
    "  • Built a sleek, futuristic admin dashboard.",
    "  • Developed the logic to compare scanned barcodes against the master database array continuously to detect missing books.",
    "  • Handled edge cases (unrecognized barcodes, rapid consecutive scans).",
    "Hardware Experimentation:",
    "  • Conceptualized the sliding mechanism to ensure 100% row coverage.",
    "  • Determining the optimal traversal speed to prevent motion blur during barcode capture."
])

# Slides 17-18
add_slide(prs, "Results Obtained Till Date", [
    "Software is Fully Operational:",
    "  • The web interface successfully receives barcode data and handles real-time verification.",
    "  • Advanced Configuration System: Implemented a 'System Settings' menu for full control.",
    "    - Audio Tuning: Success/Error volume sliders & Mute toggle.",
    "    - Visual Toggles: Control over 'Scan Flash' and 'Live Telemetry' (FPS/Ping).",
    "    - Detection Tuning: Adjustable scan cooldown delay for various shelf environments.",
    "    - Dynamic Hardware: Real-time switching between camera devices and resolution settings.",
    "  • Achieved theoretical 100% software accuracy on simulated video feeds."
])

# Slide 19
add_slide(prs, "Works to be Carried Out", [
    "Hardware Fabrication: Assembling the physical rail and sliding camera system.",
    "Motor Control Integration: Programming the microcontroller to move the camera smoothly across the X and Y axes of the shelves.",
    "Physical Integration: Merging the hardware prototype with our completed software system to replace the simulated video feed with a live mechanical feed.",
    "Environment Testing: Testing the robot under varying library lighting conditions."
])

# Slide 20
add_slide(prs, "Proposed Outcome of the Projects", [
    "Final Product: A fully integrated, hybrid hardware-software robotic system.",
    "Impact:",
    "  • Reduction in inventory audit time by over 90%.",
    "  • Elimination of manual stock-taking errors.",
    "  • Providing libraries with a modern, scalable, and cost-effective inventory solution without needing expensive RFID tags for every book."
])

# Slide 21
add_slide(prs, "Participation in Events", [
    "Hackathon: [Name of Hackathon] - [Status/Prize]",
    "Paper Publication: Pending / Drafting"
])

# Slide 22
add_slide(prs, "References", [
    "OpenCV Documentation (Computer Vision techniques).",
    "React UI/UX Guidelines.",
    "Existing literature on warehouse inventory robotics.",
    "[Add specific links or textbooks your team referred to]"
])

prs.save("Libro_Bot_Presentation.pptx")
print("Presentation generated successfully.")
