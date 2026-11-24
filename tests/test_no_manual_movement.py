"""
Automated Verification: Ensure Manual Movement Controls and Embedded Dashboard Are Removed
"""

import os
import re

def verify_desktop_companion():
    print("Verifying Desktop Companion UI constraints...")
    overlay_path = "VCamp/desktop/src/components/CompanionOverlay.tsx"
    with open(overlay_path, "r", encoding="utf-8") as f:
        content = f.read()

    forbidden_buttons = [
        "Return Home",
        "Walk Across",
        "Run Across",
        "Hop / Jump",
        "Wander",
        "Movement Speed",
        "DashboardModal"
    ]

    for btn in forbidden_buttons:
        assert btn not in content, f"Forbidden manual movement / embedded control '{btn}' found in CompanionOverlay.tsx!"
        print(f"  [PASS] No '{btn}' in desktop companion.")

    # Check dashboard
    print("\nVerifying Website Dashboard UI constraints...")
    dashboard_app = "VCamp/dashboard/src/App.tsx"
    with open(dashboard_app, "r", encoding="utf-8") as f:
        dash_content = f.read()

    forbidden_dash = [
        "Robot Actions & Poses",
        "Walk",
        "Run Across",
        "Jump",
        "Fly"
    ]
    for btn in forbidden_dash:
        assert btn not in dash_content, f"Forbidden movement control '{btn}' found in dashboard App.tsx!"
        print(f"  [PASS] No '{btn}' in website dashboard.")

    print("\n[ALL PASS] Zero manual movement controls in both desktop companion and website dashboard!")

if __name__ == "__main__":
    verify_desktop_companion()
