import traceback

try:
    from agents.orchestrator import analyze_graph
    print("Import successful!")
except Exception:
    traceback.print_exc()
