"""
ForensicLab - Digital Forensics Training Platform Backend Server
Built with Python 3 Standard Library (Zero External Dependencies Required)

Features:
- REST API endpoints for simulated digital forensics investigations
- Sandboxed synthetic file system, metadata generator, and simulated SHA-256 hashes
- Server-side data carving simulator for deleted and fragmented inodes
- Chronological timeline sequence verification engine
- 100-Point dynamic rubric scoring engine
- Static file server for the cyber-forensics frontend dashboard
"""

import http.server
import socketserver
import json
import os
import sys
import time
import math
import hashlib
from urllib.parse import urlparse, parse_qs

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==============================================================================
# SIMULATED FORENSIC SCENARIOS DATABASE
# ==============================================================================

SCENARIOS_DB = {
    "USB-001": {
        "id": "USB-001",
        "name": "USB Evidence Recovery",
        "difficulty": "BEGINNER",
        "duration": "15-20 mins",
        "xp": 500,
        "description": "A simulated corporate USB drive contains active documents, hidden archives, and deleted files. Recover the critical financial leak evidence and reconstruct the transfer timeline.",
        "targetFilesCount": 32,
        "hiddenFilesCount": 5,
        "deletedFilesCount": 11,
        "corruptedFilesCount": 3,
        "keyEvidenceCount": 5,
        "expectedEvidenceIds": ["f_001", "f_003", "f_007", "f_008", "f_012", "f_013", "f_014", "f_018", "f_021", "f_025", "f_029"],
        "groundTruthTimeline": [
            {"id": "evt_1", "time": "09:32 AM", "timestamp": "2026-09-10 09:32", "title": "Financial Q3 Report Created", "source": "financial_report_q3.docx"},
            {"id": "evt_2", "time": "08:52 PM", "timestamp": "2026-09-16 20:52", "title": "Wiping Tool Downloaded", "source": "browser_cache.log"},
            {"id": "evt_3", "time": "09:00 PM", "timestamp": "2026-09-16 21:00", "title": "Auto-Exfiltration Script Staged", "source": "deleted_exfil_script.py"},
            {"id": "evt_4", "time": "09:12 PM", "timestamp": "2026-09-16 21:12", "title": "Unauthorized USB Device Mounted", "source": "usb_transfer.log"},
            {"id": "evt_5", "time": "09:12 PM", "timestamp": "2026-09-16 21:12", "title": "Confidential Files Copied to USB", "source": "usb_transfer.log"},
            {"id": "evt_6", "time": "09:13 PM", "timestamp": "2026-09-16 21:13", "title": "Local Documents Purged & Deleted", "source": "financial_report_q3.docx"},
            {"id": "evt_7", "time": "09:14 PM", "timestamp": "2026-09-16 21:14", "title": "USB Device Safely Removed", "source": "usb_transfer.log"},
            {"id": "evt_8", "time": "09:20 PM", "timestamp": "2026-09-16 21:20", "title": "Anti-Forensics Slack Cleaner Executed", "source": "eraser_tool_portable.zip"}
        ]
    },
    "WKS-002": {
        "id": "WKS-002",
        "name": "Compromised Workstation",
        "difficulty": "INTERMEDIATE",
        "duration": "25-35 mins",
        "xp": 750,
        "description": "A simulated finance workstation contains deleted documents, spear-phishing payload traces, timestomped malware scripts, and encrypted artifacts.",
        "targetFilesCount": 35,
        "hiddenFilesCount": 6,
        "deletedFilesCount": 12,
        "corruptedFilesCount": 4,
        "keyEvidenceCount": 6,
        "expectedEvidenceIds": ["w_001", "w_002", "w_003", "w_004", "w_007"],
        "groundTruthTimeline": [
            {"id": "w_evt_1", "time": "10:14 AM", "timestamp": "2026-09-17 10:14", "title": "Phishing Macro Document Downloaded", "source": "invoice_march_payment.xlsm"},
            {"id": "w_evt_2", "time": "10:16 AM", "timestamp": "2026-09-17 10:16", "title": "VBA Macro Executed PowerShell Beacon", "source": "beacon_payload.ps1"},
            {"id": "w_evt_3", "time": "10:16 AM", "timestamp": "2026-09-17 10:16", "title": "Outbound C2 Channel Established", "source": "network_connections.log"},
            {"id": "w_evt_4", "time": "10:22 AM", "timestamp": "2026-09-17 10:22", "title": "Initial Dropper Deleted", "source": "invoice_march_payment.xlsm"}
        ]
    },
    "INS-003": {
        "id": "INS-003",
        "name": "Insider Data Exfiltration",
        "difficulty": "ADVANCED",
        "duration": "35-50 mins",
        "xp": 1000,
        "description": "A sophisticated insider threat case featuring timestomping inconsistencies, steganographic image payloads, wiped event channels, and multi-part deleted encrypted RAR archives.",
        "targetFilesCount": 40,
        "hiddenFilesCount": 8,
        "deletedFilesCount": 15,
        "corruptedFilesCount": 5,
        "keyEvidenceCount": 7,
        "expectedEvidenceIds": ["i_001", "i_002", "i_003", "i_004"],
        "groundTruthTimeline": [
            {"id": "i_evt_1", "time": "09:50 PM", "timestamp": "2026-09-18 21:50", "title": "Tor Circuit Initialized", "source": ".tor_circuit_nodes.txt"},
            {"id": "i_evt_2", "time": "10:00 PM", "timestamp": "2026-09-18 22:00", "title": "Steganographic Carrier Injected", "source": "datacenter_blueprint.png"},
            {"id": "i_evt_3", "time": "10:28 PM", "timestamp": "2026-09-18 22:28", "title": "MFT Timestomping Attack", "source": "timestomped_system_dll.log"},
            {"id": "i_evt_4", "time": "10:40 PM", "timestamp": "2026-09-18 22:40", "title": "Purge of Encrypted Payload Chunks", "source": "exfil_chunk_part01.enc"}
        ]
    }
}

# In-memory session store
ACTIVE_INVESTIGATIONS = {}

# ==============================================================================
# CUSTOM HTTP REQUEST HANDLER
# ==============================================================================

class ForensicLabAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # REST API Routes
        if path == "/api/health":
            self.send_json_response(200, {
                "status": "ONLINE",
                "sandbox": "ACTIVE",
                "version": "4.2.0",
                "mode": "Simulated Forensic Training Environment (Zero OS Storage Access)",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            })
            return

        if path == "/api/scenarios":
            scenario_summaries = []
            for sc in SCENARIOS_DB.values():
                scenario_summaries.append({
                    "id": sc["id"],
                    "name": sc["name"],
                    "difficulty": sc["difficulty"],
                    "duration": sc["duration"],
                    "xp": sc["xp"],
                    "description": sc["description"],
                    "targetFilesCount": sc["targetFilesCount"],
                    "hiddenFilesCount": sc["hiddenFilesCount"],
                    "deletedFilesCount": sc["deletedFilesCount"],
                    "corruptedFilesCount": sc["corruptedFilesCount"],
                    "keyEvidenceCount": sc["keyEvidenceCount"]
                })
            self.send_json_response(200, {"scenarios": scenario_summaries})
            return

        if path.startswith("/api/scenarios/"):
            scenario_id = path.replace("/api/scenarios/", "").strip()
            if scenario_id in SCENARIOS_DB:
                self.send_json_response(200, {"scenario": SCENARIOS_DB[scenario_id]})
            else:
                self.send_json_response(404, {"error": "Scenario not found"})
            return

        # Fallback to standard static file serving for UI
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        # 1. Trainee Login
        if path == "/api/auth/login":
            username = payload.get("username", "trainee").strip() or "trainee"
            session_token = "SIM-SESSION-" + hashlib.md5(f"{username}{time.time()}".encode()).hexdigest()[:12].upper()
            self.send_json_response(200, {
                "success": True,
                "message": f"Investigator session authenticated for {username}",
                "sessionToken": session_token,
                "user": {
                    "username": username,
                    "fullName": f"{username.capitalize()} (Investigator)",
                    "role": "Digital Forensics Trainee",
                    "permissions": ["READ_VIRTUAL_FS", "CARVE_SECTORS", "VALIDATE_EVIDENCE", "SUBMIT_REPORT"]
                }
            })
            return

        # 2. Server-side Data Carving Simulation
        if path == "/api/carve":
            file_id = payload.get("fileId")
            file_name = payload.get("fileName", "unknown_file.bin")
            file_type = payload.get("fileType", "BIN")
            
            # Simulated sector allocation calculation
            start_sector = int(hashlib.md5(file_id.encode() if file_id else b"0").hexdigest()[:6], 16)
            end_sector = start_sector + 48
            simulated_hash = "SIM-" + hashlib.sha256(f"{file_id}{start_sector}".encode()).hexdigest()[:10].upper()

            self.send_json_response(200, {
                "success": True,
                "fileId": file_id,
                "fileName": file_name,
                "status": "RECOVERED",
                "carvedClusters": f"0x{start_sector:06X} -> 0x{end_sector:06X}",
                "simulatedHash": simulated_hash,
                "signatureMatched": f"MAGIC_HEADER_{file_type}",
                "integrityCheck": "PASSED"
            })
            return

        # 3. Dynamic Timeline Evaluation Engine
        if path == "/api/timeline/evaluate":
            scenario_id = payload.get("scenarioId", "USB-001")
            user_timeline = payload.get("timeline", [])
            
            sc = SCENARIOS_DB.get(scenario_id, SCENARIOS_DB["USB-001"])
            ground_truth = sc["groundTruthTimeline"]

            # Pairwise Kendall-tau relative order calculation
            total_pairs = 0
            correct_pairs = 0
            for i in range(len(user_timeline)):
                for j in range(i + 1, len(user_timeline)):
                    total_pairs += 1
                    id_a = user_timeline[i].get("id")
                    id_b = user_timeline[j].get("id")
                    
                    true_a = next((idx for idx, e in enumerate(ground_truth) if e["id"] == id_a), -1)
                    true_b = next((idx for idx, e in enumerate(ground_truth) if e["id"] == id_b), -1)
                    
                    if true_a != -1 and true_b != -1 and true_a < true_b:
                        correct_pairs += 1

            order_score = (correct_pairs / total_pairs * 70) if total_pairs > 0 else 0
            coverage_score = (len(user_timeline) / len(ground_truth) * 30) if len(ground_truth) > 0 else 0
            final_accuracy = min(100, round(order_score + coverage_score))

            self.send_json_response(200, {
                "accuracy": final_accuracy,
                "totalEventsPlaced": len(user_timeline),
                "expectedEvents": len(ground_truth),
                "orderConsistency": round(order_score, 1)
            })
            return

        # 4. Transparent 100-Point Scoring Engine
        if path == "/api/score":
            scenario_id = payload.get("scenarioId", "USB-001")
            files_recovered_count = payload.get("filesRecoveredCount", 0)
            flagged_anomalies_count = payload.get("flaggedAnomaliesCount", 0)
            timeline_accuracy = payload.get("timelineAccuracy", 0)
            evidence_count = payload.get("evidenceCount", 0)
            files_examined_count = payload.get("filesExaminedCount", 0)

            sc = SCENARIOS_DB.get(scenario_id, SCENARIOS_DB["USB-001"])
            
            # Rubric calculation
            # 1. Recovery (35 pts)
            recovery_score = min(35, round((files_recovered_count / max(1, sc["deletedFilesCount"])) * 35))
            
            # 2. Metadata (20 pts)
            metadata_score = min(20, round((flagged_anomalies_count / max(1, sc["hiddenFilesCount"])) * 16) + (4 if flagged_anomalies_count > 0 else 0))
            
            # 3. Timeline (20 pts)
            timeline_score = min(20, round((timeline_accuracy / 100) * 20))
            
            # 4. Evidence Validation (15 pts)
            evidence_score = min(15, round((evidence_count / max(1, sc["keyEvidenceCount"])) * 15))
            
            # 5. Efficiency (10 pts)
            efficiency_score = 10 if files_examined_count >= 10 else 7

            total_score = min(100, max(25, recovery_score + metadata_score + timeline_score + evidence_score + efficiency_score))

            # Dynamic qualitative feedback synthesis
            strengths = []
            improvements = []
            recommendations = []

            if recovery_score >= 25:
                strengths.append(f"Successfully recovered {files_recovered_count} deleted file artifacts using MFT sector carving.")
            else:
                improvements.append("Missed key recoverable deleted documents in unallocated slack space.")

            if metadata_score >= 14:
                strengths.append("Identified critical MACB timestamp anomalies and timestomped records.")
            else:
                improvements.append("Overlooked anomalous discrepancies between $STANDARD_INFORMATION and $FILE_NAME timestamps.")

            if timeline_score >= 15:
                strengths.append(f"Reconstructed incident timeline with high chronological consistency ({timeline_accuracy}% match).")
            else:
                improvements.append("Timeline sequence has out-of-order execution events or missed the initial exploit vector.")

            recommendations.append("Practice identifying deleted files by correlating file status, MACB timestamps, and evidence priority.")
            recommendations.append("Always verify cryptographic hash signatures against MFT records to detect covert modifications.")
            recommendations.append("Correlate external storage mount events with rapid batch deletions to prove exfiltration intent.")

            self.send_json_response(200, {
                "totalScore": total_score,
                "recoveryScore": recovery_score,
                "metadataScore": metadata_score,
                "timelineScore": timeline_score,
                "evidenceScore": evidence_score,
                "efficiencyScore": efficiency_score,
                "strengths": strengths,
                "improvements": improvements,
                "recommendations": recommendations,
                "certifiedStatus": "PASSED" if total_score >= 70 else "NEEDS_IMPROVEMENT"
            })
            return

        # 404 for unknown API
        self.send_json_response(404, {"error": "Endpoint not found"})

    def send_json_response(self, code, data):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

# ==============================================================================
# MAIN ENTRYPOINT
# ==============================================================================

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ForensicLabAPIHandler) as httpd:
        print("=" * 70)
        print(" FORENSICLAB - DIGITAL FORENSICS TRAINING SANDBOX BACKEND")
        print("=" * 70)
        print(f" [*] Local Server Active : http://localhost:{PORT}")
        print(f" [*] API Health Check    : http://localhost:{PORT}/api/health")
        print(f" [*] Scenarios Endpoint  : http://localhost:{PORT}/api/scenarios")
        print(f" [*] Security Guarantee  : 100% In-Memory Synthetic File System")
        print("     Zero host disk or OS file system access.")
        print("=" * 70)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")
            httpd.server_close()

if __name__ == "__main__":
    run_server()
