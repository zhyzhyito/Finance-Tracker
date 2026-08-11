from flask import Blueprint, request, jsonify 
import os
from supabase import create_client, Client
from .analytics import calculate_financial_health, calculate_round_up


api = Blueprint('api', __name__)

#Supabase client setup
url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(url, key) if url and key else None

@api.route('/health-score', methods=['POST'])
def get_health_score():
    """
    Computes the Financial Health Score of a user.
    Expects JSON: { "user_id": "UUID-HERE" }
    """
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id or not supabase:
        return jsonify({"error": "Missing user_id or Supabase configuration."}), 400

    try:
        # Fetch user's financial profile from ft_profiles
        profile_res = supabase.table('ft_profiles').select('*').eq('id', user_id).execute()
        profile = profile_res.data[0] if profile_res.data else {}

        monthly_income = float(profile.get('monthly_income', 0))
        emergency_fund = float(profile.get('emergency_fund_goal', 0))

        # Fetch total expenses from ft_transactions
        trans_res = supabase.table('ft_transactions')\
            .select('amount, transaction_type')\
            .eq('user_id', user_id)\
            .execute()

        total_expenses = sum(
            float(t['amount']) for t in trans_res.data 
            if t['transaction_type'] == 'expense'
        )
        total_debts = sum(
            float(t['amount']) for t in trans_res.data 
            if t.get('category') == 'Debt'
        )

        # Compute using analytics engine
        health_result = calculate_financial_health(
            monthly_income=monthly_income,
            total_expenses=total_expenses,
            total_debts=total_debts,
            emergency_fund=emergency_fund
        )

        return jsonify(health_result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/process-transaction', methods=['POST'])
def process_transaction():
    """
    Calculates spare change round-up for a new transaction before saving.
    Expects JSON: { "amount": 82 }
    """
    data = request.get_json()
    amount = float(data.get('amount', 0))
    round_up = calculate_round_up(amount)

    return jsonify({
        "original_amount": amount,
        "round_up_amount": round_up,
        "total_deducted": amount + round_up
    }), 200
