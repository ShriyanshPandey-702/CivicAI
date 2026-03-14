"""
agents/vault_agent.py
"""
from tools.vault_store import get_vault_docs
from tools.scheme_loader import fetch_scheme


def run_vault_agent(state: dict) -> dict:
    citizen_id = state.get("citizen_id")
    scheme_id = state.get("selected_scheme_id")
    
    if not citizen_id or not scheme_id:
        return state
        
    scheme = fetch_scheme(scheme_id)
    if not scheme:
        return state
        
    required_docs = scheme.get("required_docs", [])
    
    vault_data = get_vault_docs(citizen_id)
    vault_doc_types = [doc["doc_type"] for doc in vault_data if doc.get("verified")]
    
    verified_docs = []
    missing_docs = []
    
    for doc_type in required_docs:
        if doc_type in vault_doc_types:
            verified_docs.append(doc_type)
        else:
            missing_docs.append(doc_type)
            
    vault_status = {
        "required": required_docs,
        "found": verified_docs,
        "missing": missing_docs,
        "vault_empty": len(vault_doc_types) == 0,
        "all_docs_present": len(missing_docs) == 0
    }
    
    state["vault_status"] = vault_status
    state["verified_docs"] = verified_docs
    state["missing_docs"] = missing_docs
    state["current_step"] = "vault_complete"
    
    return state
