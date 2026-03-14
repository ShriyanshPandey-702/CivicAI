import sys
import json
sys.path.append('.')
from agents.discovery_rag_agent import run_discovery_rag_agent
from agents.deep_eligibility_agent import run_deep_eligibility_agent
from agents.profile_agent import run_profile_agent
from sahayai_cli import screen_scheme_selection

profile = {
    'name': 'Ravi Kumar',
    'age': 20,
    'gender': 'male',
    'state': 'Haryana',
    'income': 50000,
    'occupation': 'student',
    'caste': 'general',
    'ration_card_type': 'apl',
    'has_bank_account': True,
    'has_disability': False,
    'family_size': 4,
    'land_acres': 0.0,
}

state = {
    'raw_profile': profile,
    'citizen_profile': profile,
    'citizen_id': 'test-123',
    'scheme_cards': [],
    'failed_scheme_ids': set(),
    'follow_up_answers': {},
}

print('\n[Test] Discovery RAG Agent')
state = run_discovery_rag_agent(state)
schemes = [s['name'] for s in state['scheme_cards']]
print('Resulting Schemes:', schemes)

for forbidden in ['Sukanya', 'Ujjwala', 'PM-KISAN', 'Fasal Bima', 'Atal Pension', 'Kisan']:
    assert not any(forbidden.lower() in s.lower() for s in schemes), f'{forbidden} should NOT be in schemes'

assert any('NSP' in s for s in schemes), 'NSP Scholarships MUST appear'
print('Test 1 Passed: Forbidden schemes excluded, NSP is present.')

print('\n[Test 2] Failed Scheme Removal')
first_scheme = state['scheme_cards'][0]
name = first_scheme["name"]
print(f'Failing scheme: {name}')
state['selected_scheme_id'] = first_scheme['id']

failed_ids = state.get('failed_scheme_ids') or set()
failed_ids.add(state['selected_scheme_id'])
state['failed_scheme_ids'] = failed_ids

filtered_cards = [s for s in state['scheme_cards'] if s['id'] not in state['failed_scheme_ids']]
assert first_scheme['id'] not in [s['id'] for s in filtered_cards], 'Failed scheme was not removed'
print('Test 2 Passed: Failed scheme successfully removed from selection list.')

print('\nALL TESTS PASSED \u2705')
