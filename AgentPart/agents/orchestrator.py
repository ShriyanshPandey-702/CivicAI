"""
agents/orchestrator.py
"""
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END

from agents.profile_agent import run_profile_agent
from agents.discovery_rag_agent import run_discovery_rag_agent
from agents.deep_eligibility_agent import run_deep_eligibility_agent
from agents.vault_agent import run_vault_agent
from agents.executor_narrator_agent import run_executor_narrator_agent

class SahayAIState(TypedDict, total=False):
    # Input
    raw_profile: dict
    
    # After Profile Agent
    citizen_profile: Optional[dict]
    citizen_id: Optional[str]
    
    # After Discovery + RAG Agent
    scheme_cards: Optional[List[dict]]
    
    # After Deep Eligibility Agent
    selected_scheme_id: Optional[str]
    selected_scheme: Optional[dict]
    eligibility_result: Optional[dict]
    follow_up_answers: Optional[dict]
    
    # After Vault Agent
    vault_status: Optional[dict]
    verified_docs: Optional[List[str]]
    missing_docs: Optional[List[str]]
    
    # After Executor + Narrator Agent
    application_result: Optional[dict]
    audit_trail: Optional[dict]
    benefit_score: Optional[float]
    
    # Control
    error: Optional[str]
    current_step: Optional[str]


def build_analyze_graph():
    graph = StateGraph(SahayAIState)
    graph.add_node("profile_agent", run_profile_agent)
    graph.add_node("discovery_rag", run_discovery_rag_agent)
    
    graph.add_edge("profile_agent", "discovery_rag")
    graph.add_edge("discovery_rag", END)
    graph.set_entry_point("profile_agent")
    
    return graph.compile()

def build_submit_graph():
    graph = StateGraph(SahayAIState)
    graph.add_node("deep_eligibility", run_deep_eligibility_agent)
    graph.add_node("vault_agent", run_vault_agent)
    graph.add_node("executor_narrator", run_executor_narrator_agent)
    
    graph.add_edge("deep_eligibility", "vault_agent")
    graph.add_edge("vault_agent", "executor_narrator")
    graph.add_edge("executor_narrator", END)
    graph.set_entry_point("deep_eligibility")
    
    return graph.compile()


analyze_graph = build_analyze_graph()
submit_graph = build_submit_graph()
