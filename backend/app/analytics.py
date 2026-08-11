def calculate_financial_health(monthly_income, total_expenses, total_debts, emergency_fund):
    """
    Computes a Financial Health Score from 0 to 100 based on standard financial metrics.
    """
    if monthly_income <= 0:
        return {
            "score": 0,
            "status": "Needs Baseline",
            "message": "Pakilagay ang iyong monthly income para ma-compute ang Health Score."
        }

    # 1. Savings Rate Metric (Ideal: >= 20% of income) - Max 35 points
    savings = monthly_income - total_expenses
    savings_rate = (savings / monthly_income) * 100 if savings > 0 else 0
    savings_score = min((savings_rate / 20) * 35, 35)

    # 2. Debt-to-Income (DTI) Ratio Metric (Ideal: <= 30% of income) - Max 35 points
    dti_ratio = (total_debts / monthly_income) * 100
    if dti_ratio <= 30:
        debt_score = 35
    else:
        debt_score = max(0, 35 - ((dti_ratio - 30) * 0.7))

    # 3. Emergency Fund Runway Metric (Ideal: 3 to 6 months of expenses) - Max 30 points
    monthly_expense_avg = total_expenses if total_expenses > 0 else 1
    runway_months = emergency_fund / monthly_expense_avg
    runway_score = min((runway_months / 6) * 30, 30)

    # Total Combined Health Score
    total_score = round(savings_score + debt_score + runway_score)

    # Status classification
    if total_score >= 80:
        status = "Excellent"
    elif total_score >= 60:
        status = "Good"
    elif total_score >= 40:
        status = "Fair"
    else:
        status = "Critical"

    return {
        "score": total_score,
        "status": status,
        "metrics": {
            "savings_rate": f"{round(savings_rate, 1)}%",
            "debt_to_income": f"{round(dti_ratio, 1)}%",
            "emergency_runway": f"{round(runway_months, 1)} buwan"
        }
    }


def calculate_round_up(amount, round_to=100):
    """
    Calculates spare change round-up for micro-investments.
    Example: ₱82 expense rounded up to ₱100 gives ₱18 spare change.
    """
    if amount <= 0:
        return 0
    remainder = amount % round_to
    if remainder == 0:
        return 0
    return round_to - remainder