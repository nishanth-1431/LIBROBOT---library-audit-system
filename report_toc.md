# TABLE OF CONTENTS
## LIBRARY AUDIT ROBOT USING BARCODE
### Department of [Your Department Name] — [Your College Name]

---

> **Report Structure Reference**: Modelled on the FLORAPEDE Engineering Project Report format.  
> **Target**: 60 pages | 12pt Times New Roman | 1.5 Line Spacing | A4

---

## PRELIMINARY PAGES

| Section | Page No. |
|---|---|
| Title Page | i |
| Bonafide Certificate | ii |
| Declaration | iii |
| Acknowledgements | iv |
| Abstract | v |
| Table of Contents | vi |
| List of Figures | vii |
| List of Tables | viii |
| List of Abbreviations | ix |

---

## CHAPTER 1: INTRODUCTION ........................................................1

- 1.1 Overview of Library Management Challenges
- 1.2 The Need for Automation in Library Inventory
- 1.3 Motivation Behind the Project
- 1.4 Project Scope and Objectives
- 1.5 Overview of the Proposed System
- 1.6 Significance and Real-world Impact
- 1.7 Organization of the Report

## CHAPTER 2: LITERATURE REVIEW .............................................8

- 2.1 Introduction to Library Automation Systems
- 2.2 Survey of Manual Auditing Methods and Their Limitations
- 2.3 Review of RFID-Based Library Systems
- 2.4 Barcode Technology vs. RFID — A Comparative Study
- 2.5 Mobile Robotics in Indoor Inventory Tasks
- 2.6 Computer Vision Applications in Barcode Recognition
- 2.7 Real-Time Web Dashboards for Industrial Monitoring
- 2.8 Existing Commercially Available Library Robots
- 2.9 Research Gap and Our Proposed Contribution

## CHAPTER 3: PROBLEM STATEMENT & OBJECTIVES .................15

- 3.1 Problem Statement
- 3.2 Existing System Analysis and Drawbacks
- 3.3 Proposed Solution
- 3.4 Primary Objectives
- 3.5 Secondary Objectives (Scalability and Extensibility)
- 3.6 Constraints and Assumptions

## CHAPTER 4: SYSTEM ARCHITECTURE & METHODOLOGY .......18

- 4.1 System Overview and Architecture
- 4.2 Three-Tier Architecture Description (Perception, Processing, Presentation)
- 4.3 Data Flow Diagram (DFD Level 0 and Level 1)
- 4.4 System Workflow — Step-by-Step Operational Cycle
    - 4.4.1 Phase 1: Initialization and Boot
    - 4.4.2 Phase 2: Real-Time Scanning Cycle
    - 4.4.3 Phase 3: Audit Reporting and Export
- 4.5 Selection Criteria for Hardware and Software Components
- 4.6 WebSocket-Based Real-Time Communication Protocol

## CHAPTER 5: HARDWARE DESIGN & IMPLEMENTATION ..............25

- 5.1 Overview of the Hardware Platform
- 5.2 Rover Platform — Robo Race Rover
    - 5.2.1 Chassis Specifications and Dimensions
    - 5.2.2 Drive System — Johnson DC Motors
- 5.3 Motor Control System
    - 5.3.1 Electronic Speed Controller (PowerMax ESC)
    - 5.3.2 SBUS Receiver Module
    - 5.3.3 BSE RF Transmitter
- 5.4 Power System — 3S LiPo Battery (11.1V)
    - 5.4.1 Battery Specifications
    - 5.4.2 Power Distribution to ESC and Raspberry Pi
- 5.5 Computing Unit — Raspberry Pi
    - 5.5.1 Raspberry Pi 3B / 4B Specifications
    - 5.5.2 Headless Configuration and Wi-Fi Setup
- 5.6 Vision System — USB Webcam
    - 5.6.1 Camera Specifications and Field of View
    - 5.6.2 Optimal Distance and Focal Range for Barcode Detection
- 5.7 Circuit Design and Wiring Schematic
- 5.8 Assembly and Integration

## CHAPTER 6: SOFTWARE IMPLEMENTATION ................................34

- 6.1 Overview of the Software Architecture
- 6.2 Backend Development — Flask & Socket.io
    - 6.2.1 Flask Application Structure
    - 6.2.2 Camera Worker Thread (OpenCV Integration)
    - 6.2.3 Vision Worker — Real-Time Barcode Decoding (PyZbar)
    - 6.2.4 Excel Database Synchronization (openpyxl)
    - 6.2.5 WebSocket Event Broadcasting (new_scan Event)
    - 6.2.6 REST API Endpoints Reference Table
- 6.3 Frontend Development — React Dashboard
    - 6.3.1 Dashboard Component Architecture
    - 6.3.2 Live Video Streaming Display
    - 6.3.3 Real-Time Scan History Table
    - 6.3.4 Missing Books Table
    - 6.3.5 Session Summary and Export Module
- 6.4 Analytics Intelligence Module (Recharts)
    - 6.4.1 Scan Results Pie Chart
    - 6.4.2 Scanning Velocity Area Chart
    - 6.4.3 Departmental Distribution Bar Chart
- 6.5 Admin Panel — Database Management
    - 6.5.1 Book Import via Excel Upload
    - 6.5.2 Manual Book Entry and CRUD Operations
- 6.6 Headless Auto-Start Service Configuration (systemd)
- 6.7 Key Source Code Listings

## CHAPTER 7: RESULTS & DISCUSSION ........................................47

- 7.1 Experimental Setup and Test Environment
- 7.2 Scanning Accuracy Results
    - 7.2.1 Test Conditions: Lighting, Distance, and Speed
    - 7.2.2 Scan Success Rate Table
    - 7.2.3 Comparison: Streaming vs. On-Device Processing
- 7.3 System Latency and WebSocket Performance
- 7.4 Dashboard Functionality Verification
    - 7.4.1 Live Feed Responsiveness
    - 7.4.2 Analytics Chart Accuracy
- 7.5 Power Consumption Analysis
- 7.6 Discussion of Observed Anomalies and Mitigation

## CHAPTER 8: CONCLUSION & FUTURE SCOPE ............................53

- 8.1 Summary of Achievements
- 8.2 Project Outcomes vs. Stated Objectives
- 8.3 Limitations of the Current Implementation
- 8.4 Future Scope
    - 8.4.1 Autonomous Navigation with LiDAR
    - 8.4.2 RFID Upgrade Path
    - 8.4.3 Cloud-Based Multi-Branch Audit System
    - 8.4.4 Voice Command Interface for Librarians
- 8.5 Closing Remarks

## REFERENCES ..................................................................................57

## APPENDIX A: COMPLETE SOURCE CODE .................................58

- A.1 Backend: [app.py](file:///d:/projects/final_lib/backend/app.py) (Flask + OpenCV + Socket.io)
- A.2 Frontend: [Dashboard.jsx](file:///d:/projects/final_lib/frontend/src/pages/Dashboard.jsx) (React Main Component)
- A.3 Pi Streaming Script: `stream_cam.py`

---

# IMAGE IDEAS — 60+ PAGE REPORT

| # | Chapter | Image Description | Source |
|---|---|---|---|
| 1 | Cover / Abstract | High-quality 3D render of robot in a library aisle | Google: "inventory robot library shelf" |
| 2 | Ch. 1 | Photo of a librarian manually scanning — "before" state | Stock photo |
| 3 | Ch. 2 | Tory Robot (existing system) by MetraLabs | Google: "MetraLabs Tory library robot" |
| 4 | Ch. 2 | Infographic comparing Barcode vs. RFID vs. NFC | Create or Google |
| 5 | Ch. 4 | Full System Block Diagram (3-tier architecture) | Use our [system_architecture.md](file:///C:/Users/HP/.gemini/antigravity/brain/e55396bd-c375-4a6f-a463-1a0f279f3717/system_architecture.md) |
| 6 | Ch. 4 | Data Flow Diagram Level 0 and Level 1 | Export mermaid diagram |
| 7 | Ch. 5 | Robo Race Rover — actual photo of your chassis | Your own photo |
| 8 | Ch. 5 | Johnson DC Motor close-up photo | Google: "Johnson DC motor" |
| 9 | Ch. 5 | PowerMax ESC unit — as seen in wiring diagram | Provided wiring image |
| 10 | Ch. 5 | SBUS Receiver + BSE Transmitter photo | Provided wiring image / Google |
| 11 | Ch. 5 | 3S LiPo Battery 11.1V — photo | Google: "3S LiPo battery 11.1V" |
| 12 | Ch. 5 | Raspberry Pi 3B/4 — pin layout photo | raspberrypi.com or Google |
| 13 | Ch. 5 | USB Webcam mounted on rover — actual photo | Your own photo |
| 14 | Ch. 5 | Full wiring schematic photo/diagram | Use the provided connection image |
| 15 | Ch. 6 | Screenshot: Live Dashboard with Camera Feed | Screenshot of your app |
| 16 | Ch. 6 | Screenshot: Scan History Table on Dashboard | Screenshot of your app |
| 17 | Ch. 6 | Screenshot: Admin Panel for book management | Screenshot of your app |
| 18 | Ch. 6 | Screenshot: Intelligence/Analytics Charts | Screenshot of your app |
| 19 | Ch. 6 | OpenCV frame: raw vs. detected barcode bounding box | Export from your vision stream |
| 20 | Ch. 7 | Bar chart: Scan accuracy under different lighting | Create in Excel/Google Sheets |
| 21 | Ch. 7 | Line graph: WebSocket latency over session time | Create from test data |
| 22 | Ch. 7 | Photos: Robot being tested on a mock shelf | Your own testing photos |
| 23 | Ch. 8 | Future concept: LiDAR-equipped robot | Google: "autonomous library robot LiDAR" |
